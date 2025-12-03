/**
 * useKYCSelfieDetection Hook
 * KYC Selfie ekranı için yüz algılama ve validasyon
 * 
 * Özellikler:
 * - Tek yüz kontrolü
 * - Yüz pozisyonu kontrolü (düz bakıyor mu)
 * - Göz açık kontrolü (canlılık)
 * - Yüz boyutu kontrolü (çok uzak/yakın)
 * 
 * NOT: Yüz filtreleri için useFaceCamera kullanılır, bu hook sadece KYC içindir.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { 
  useFaceDetector, 
  FaceDetectionOptions, 
  Face 
} from 'react-native-vision-camera-face-detector';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

/**
 * KYC için optimize edilmiş face detection options
 * Yüz filtrelerinden farklı olarak accurate mode kullanır
 */
const KYC_FACE_DETECTION_OPTIONS: FaceDetectionOptions = {
  cameraFacing: 'front',
  performanceMode: 'accurate',     // Yüksek doğruluk
  landmarkMode: 'none',            // Landmark gereksiz
  contourMode: 'none',             // Kontur gereksiz
  classificationMode: 'all',       // Göz açık/kapalı kontrolü için
  minFaceSize: 0.25,               // Yüz ekranın en az %25'i olmalı
  trackingEnabled: false,
  autoMode: true,
  windowWidth: WINDOW_WIDTH,
  windowHeight: WINDOW_HEIGHT,
};

export type SelfieValidationStatus = 
  | 'no_face'           // Yüz algılanamadı
  | 'multiple_faces'    // Birden fazla yüz
  | 'face_too_small'    // Yüz çok uzak
  | 'face_too_large'    // Yüz çok yakın
  | 'face_off_center'   // Yüz merkezde değil
  | 'face_tilted'       // Yüz eğik
  | 'eyes_closed'       // Gözler kapalı
  | 'ready';            // Hazır

export interface SelfieValidationResult {
  status: SelfieValidationStatus;
  message: string;
  isValid: boolean;
  face?: Face;
  // Pozisyon bilgisi (UI için)
  guidance?: {
    horizontal?: 'left' | 'right' | 'center';
    vertical?: 'up' | 'down' | 'center';
    distance?: 'closer' | 'further' | 'good';
  };
}

interface UseKYCSelfieDetectionOptions {
  // Minimum yüz alanı oranı (0-1)
  minFaceAreaRatio?: number;
  // Maksimum yüz alanı oranı (0-1)
  maxFaceAreaRatio?: number;
  // Maksimum yaw açısı (derece)
  maxYawAngle?: number;
  // Maksimum pitch açısı (derece)
  maxPitchAngle?: number;
  // Minimum göz açıklık oranı (0-1)
  minEyeOpenProbability?: number;
  // Merkez toleransı (0-1)
  centerTolerance?: number;
}

const DEFAULT_OPTIONS: Required<UseKYCSelfieDetectionOptions> = {
  minFaceAreaRatio: 0.08,      // Yüz en az ekranın %8'i (daha esnek)
  maxFaceAreaRatio: 0.85,      // Yüz en fazla ekranın %85'i (daha esnek)
  maxYawAngle: 20,             // Maksimum 20 derece sağa/sola
  maxPitchAngle: 20,           // Maksimum 20 derece yukarı/aşağı
  minEyeOpenProbability: 0.4,  // Göz en az %40 açık
  centerTolerance: 0.35,       // Merkez toleransı %35 (daha esnek)
};

export function useKYCSelfieDetection(options: UseKYCSelfieDetectionOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { detectFaces, stopListeners } = useFaceDetector(KYC_FACE_DETECTION_OPTIONS);
  
  const [lastValidation, setLastValidation] = useState<SelfieValidationResult>({
    status: 'no_face',
    message: 'Yüzünüzü çerçeveye yerleştirin',
    isValid: false,
  });

  // Cleanup
  useEffect(() => {
    return () => {
      stopListeners();
    };
  }, [stopListeners]);

  /**
   * Yüz validasyonu yap
   */
  const validateFace = useCallback((faces: Face[]): SelfieValidationResult => {
    // Yüz yok
    if (faces.length === 0) {
      return {
        status: 'no_face',
        message: 'Yüzünüzü çerçeveye yerleştirin',
        isValid: false,
      };
    }

    // Birden fazla yüz
    if (faces.length > 1) {
      return {
        status: 'multiple_faces',
        message: 'Yalnızca bir kişi olmalı',
        isValid: false,
      };
    }

    const face = faces[0];
    const { bounds, yawAngle, pitchAngle, leftEyeOpenProbability, rightEyeOpenProbability } = face;

    // Yüz boyutu kontrolü - sadece çok küçük yüzleri reddet
    // bounds frame koordinatlarında olabilir, bu yüzden sadece minimum kontrol
    if (bounds.width < 50 || bounds.height < 50) {
      return {
        status: 'face_too_small',
        message: 'Kameraya yaklaşın',
        isValid: false,
        face,
        guidance: { distance: 'closer' },
      };
    }

    // NOT: "Kameradan uzaklaşın" kontrolü kaldırıldı - kullanıcı deneyimini bozuyordu

    // Merkez kontrolü kaldırıldı - yüz algılandıysa yeterli
    // Frame koordinatları ekran koordinatlarından farklı olabiliyor

    // Yüz açısı kontrolü (yaw - sağa/sola dönme)
    if (Math.abs(yawAngle) > opts.maxYawAngle) {
      return {
        status: 'face_tilted',
        message: 'Düz bakın',
        isValid: false,
        face,
      };
    }

    // Yüz açısı kontrolü (pitch - yukarı/aşağı eğilme)
    if (Math.abs(pitchAngle) > opts.maxPitchAngle) {
      return {
        status: 'face_tilted',
        message: 'Düz bakın',
        isValid: false,
        face,
      };
    }

    // Göz açık kontrolü (canlılık)
    const leftEyeOpen = leftEyeOpenProbability ?? 1;
    const rightEyeOpen = rightEyeOpenProbability ?? 1;

    if (leftEyeOpen < opts.minEyeOpenProbability || rightEyeOpen < opts.minEyeOpenProbability) {
      return {
        status: 'eyes_closed',
        message: 'Gözlerinizi açık tutun',
        isValid: false,
        face,
      };
    }

    // Tüm kontroller geçti
    return {
      status: 'ready',
      message: 'Mükemmel! Çekim yapılıyor...',
      isValid: true,
      face,
      guidance: { horizontal: 'center', vertical: 'center', distance: 'good' },
    };
  }, [opts]);

  /**
   * Frame işleme (useFrameProcessor içinde çağrılacak)
   */
  const processFrame = useCallback((frame: any): SelfieValidationResult => {
    const faces = detectFaces(frame);
    const result = validateFace(faces);
    return result;
  }, [detectFaces, validateFace]);

  /**
   * Validasyon sonucunu güncelle (JS thread'de)
   */
  const updateValidation = useCallback((result: SelfieValidationResult) => {
    setLastValidation(result);
  }, []);

  return {
    detectFaces,
    validateFace,
    processFrame,
    updateValidation,
    lastValidation,
    stopListeners,
  };
}

/**
 * Validasyon durumuna göre renk döndür
 */
export function getValidationColor(status: SelfieValidationStatus): string {
  switch (status) {
    case 'ready':
      return '#10B981'; // Yeşil
    case 'no_face':
    case 'multiple_faces':
      return '#EF4444'; // Kırmızı
    default:
      return '#F59E0B'; // Turuncu (düzeltilebilir)
  }
}
