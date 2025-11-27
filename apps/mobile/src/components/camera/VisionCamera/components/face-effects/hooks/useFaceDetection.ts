/**
 * useFaceDetection Hook
 *
 * MLKit Face Detector ile gerçek zamanlı yüz algılama
 * Frame processor üzerinden çalışır
 *
 * @module face-effects/hooks/useFaceDetection
 *
 * Kullanım:
 * ```tsx
 * const { faces, frameProcessor, hasFace } = useFaceDetection({
 *   enabled: true,
 *   performanceMode: 'fast',
 *   maxFaces: 1
 * });
 *
 * <Camera frameProcessor={frameProcessor} />
 * ```
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { useFrameProcessor, runAsync } from "react-native-vision-camera";
import {
  useFaceDetector,
  type Face,
  type FaceDetectionOptions as MLKitFaceDetectionOptions,
} from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";

const LOG_PREFIX = "[useFaceDetection]";

import type {
  FaceData,
  FaceLandmarks,
  HeadRotation,
} from "../types";

// =============================================
// TYPES
// =============================================

export interface UseFaceDetectionOptions {
  /** Yüz algılama aktif mi */
  enabled?: boolean;
  /** Performans modu */
  performanceMode?: "fast" | "accurate";
  /** Maksimum yüz sayısı */
  maxFaces?: number;
  /** Kontür algılama (performans etkisi yüksek) */
  enableContours?: boolean;
  /** Sınıflandırma (gülümseme, göz açık) */
  enableClassification?: boolean;
  /** Kamera yönü (front/back) */
  cameraFacing?: "front" | "back";
  /** Pencere boyutları (autoMode için) */
  windowWidth?: number;
  windowHeight?: number;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * MLKit Face objesini FaceData'ya dönüştürür
 */
function convertToFaceData(face: Face, index: number): FaceData {
  // Face.landmarks objesi içinden landmark'ları al
  const faceLandmarks = face.landmarks;
  

  // Fallback: bounds merkezi
  const fallbackPoint = {
    x: face.bounds.x + face.bounds.width / 2,
    y: face.bounds.y + face.bounds.height / 2,
  };

  // Landmark'ları FaceLandmarks formatına dönüştür
  const landmarks: FaceLandmarks = {
    leftEye: faceLandmarks?.LEFT_EYE ?? fallbackPoint,
    rightEye: faceLandmarks?.RIGHT_EYE ?? fallbackPoint,
    noseTip: faceLandmarks?.NOSE_BASE ?? fallbackPoint,
    noseBase: faceLandmarks?.NOSE_BASE ?? fallbackPoint,
    leftEar: faceLandmarks?.LEFT_EAR ?? fallbackPoint,
    rightEar: faceLandmarks?.RIGHT_EAR ?? fallbackPoint,
    leftMouth: faceLandmarks?.MOUTH_LEFT ?? fallbackPoint,
    rightMouth: faceLandmarks?.MOUTH_RIGHT ?? fallbackPoint,
    bottomMouth: faceLandmarks?.MOUTH_BOTTOM ?? fallbackPoint,
    leftCheek: faceLandmarks?.LEFT_CHEEK ?? fallbackPoint,
    rightCheek: faceLandmarks?.RIGHT_CHEEK ?? fallbackPoint,
  };

  // Baş rotasyonu
  const rotation: HeadRotation = {
    yaw: face.yawAngle ?? 0,
    pitch: face.pitchAngle ?? 0,
    roll: face.rollAngle ?? 0,
  };

  return {
    id: face.trackingId ?? index,
    bounds: {
      x: face.bounds.x,
      y: face.bounds.y,
      width: face.bounds.width,
      height: face.bounds.height,
    },
    landmarks,
    rotation,
    smilingProbability: face.smilingProbability,
    leftEyeOpenProbability: face.leftEyeOpenProbability,
    rightEyeOpenProbability: face.rightEyeOpenProbability,
  };
}

// =============================================
// HOOK
// =============================================

export function useFaceDetection(options: UseFaceDetectionOptions = {}) {
  const {
    enabled = true,
    performanceMode = "fast",
    maxFaces = 1,
    enableContours = false,
    enableClassification = true,
    cameraFacing = "front",
  } = options;

  // State
  const [faces, setFaces] = useState<FaceData[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  // Check if Worklets is available
  useEffect(() => {
    try {
      if (!Worklets || typeof Worklets.createRunOnJS !== "function") {
        const errorMsg = "Worklets native module not available";
        console.error(LOG_PREFIX, errorMsg);
        setError(errorMsg);
      } else {
        console.log(LOG_PREFIX, "Worklets module available ✓");
      }
    } catch (e) {
      const errorMsg = `Worklets check failed: ${e}`;
      console.error(LOG_PREFIX, errorMsg);
      setError(errorMsg);
    }
  }, []);

  // MLKit face detection options
  // autoMode: false - Skia Frame Processor ile uyumsuz, manuel dönüşüm yapacağız
  const faceDetectionOptions = useRef<MLKitFaceDetectionOptions>({
    performanceMode,
    landmarkMode: "all",
    contourMode: enableContours ? "all" : "none",
    classificationMode: enableClassification ? "all" : "none",
    minFaceSize: 0.15,
    trackingEnabled: true,
    autoMode: false,
    cameraFacing,
  }).current;

  // Face detector hook
  const { detectFaces, stopListeners } = useFaceDetector(faceDetectionOptions);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListeners();
    };
  }, [stopListeners]);

  // Hook mount log
  useEffect(() => {
    console.log(LOG_PREFIX, "Hook initialized:", { enabled, performanceMode, maxFaces, cameraFacing });
  }, [enabled, performanceMode, maxFaces, cameraFacing]);

  // JS thread'de face data işleme
  const handleDetectedFaces = Worklets.createRunOnJS(
    (detectedFaces: Face[], frameWidth: number, frameHeight: number) => {
      if (!enabled) {
        setFaces([]);
        return;
      }

      // Frame boyutlarını kaydet
      if (frameWidth > 0 && frameHeight > 0) {
        setFrameSize({ width: frameWidth, height: frameHeight });
      }

      // Face'leri FaceData'ya dönüştür ve limitle
      const faceDataArray = detectedFaces
        .slice(0, maxFaces)
        .map((face, index) => convertToFaceData(face, index));

      setFaces(faceDataArray);
      setIsDetecting(faceDataArray.length > 0);
    }
  );

  // Frame processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";

      if (!enabled) return;

      // Async olarak face detection çalıştır
      const frameWidth = frame.width;
      const frameHeight = frame.height;
      
      runAsync(frame, () => {
        "worklet";
        try {
          const detectedFaces = detectFaces(frame);
          handleDetectedFaces(detectedFaces, frameWidth, frameHeight);
        } catch (error) {
          // Hata durumunda sessizce devam et
          console.log("[useFaceDetection] Detection error:", error);
        }
      });
    },
    [enabled, detectFaces, handleDetectedFaces]
  );

  // Algılamayı durdur
  const stopDetection = useCallback(() => {
    setFaces([]);
    setIsDetecting(false);
    stopListeners();
  }, [stopListeners]);

  return {
    /** Algılanan yüzler */
    faces,
    /** Frame processor (Camera'ya bağlanacak) */
    frameProcessor,
    /** Algılama aktif mi */
    isDetecting,
    /** En az bir yüz algılandı mı */
    hasFace: faces.length > 0,
    /** Algılamayı durdur */
    stopDetection,
    /** Hata mesajı */
    error,
    /** Frame boyutları (koordinat dönüşümü için) */
    frameSize,
  };
}

export default useFaceDetection;
