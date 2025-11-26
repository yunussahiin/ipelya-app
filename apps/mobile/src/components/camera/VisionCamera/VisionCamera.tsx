/**
 * VisionCamera Component
 *
 * Reusable kamera component'ı - react-native-vision-camera kullanır
 *
 * Özellikler:
 * - Fotoğraf çekme
 * - Video kayıt (başlat/durdur)
 * - Ön/arka kamera geçişi
 * - Flash/Torch kontrolü
 * - Zoom (pinch gesture)
 * - Focus (tap to focus)
 * - HDR desteği
 * - Türkçe UI
 *
 * Kullanım:
 * <VisionCamera
 *   mode="photo"
 *   onCapture={(media) => console.log(media)}
 *   onClose={() => navigation.goBack()}
 * />
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  useCameraFormat,
  CameraPosition
} from "react-native-vision-camera";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

// Types
import type { VisionCameraProps, CameraMode, FlashMode } from "./types";

// Components
import {
  TopControls,
  BottomControls,
  RecordingIndicator,
  ZoomIndicator,
  PermissionView,
  LoadingView
} from "./components";

// Animated Camera component
const ReanimatedCamera = Animated.createAnimatedComponent(Camera);
Animated.addWhitelistedNativeProps({ zoom: true });

export function VisionCamera({
  mode = "photo",
  initialPosition = "back",
  enableAudio = true,
  showControls = true,
  onCapture,
  onClose,
  onError,
  maxVideoDuration = 60,
  style
}: VisionCameraProps) {
  const { colors } = useTheme();
  const cameraRef = useRef<Camera>(null);

  // =============================================
  // PERMISSIONS
  // =============================================
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermission();

  // =============================================
  // STATE
  // =============================================
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>(initialPosition);
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentMode, setCurrentMode] = useState<CameraMode>(mode);
  const [zoomDisplay, setZoomDisplay] = useState(1);

  // =============================================
  // CAMERA DEVICE & FORMAT
  // =============================================
  const device = useCameraDevice(cameraPosition, {
    physicalDevices: ["ultra-wide-angle-camera", "wide-angle-camera", "telephoto-camera"]
  });

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
    { photoResolution: "max" },
    { fps: 60 }
  ]);

  // =============================================
  // ZOOM ANIMATION
  // =============================================
  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const zoomOffset = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    zoom: zoom.value
  }));

  const updateZoomDisplay = useCallback((value: number) => {
    setZoomDisplay(value);
  }, []);

  // =============================================
  // GESTURES
  // =============================================

  // Pinch-to-zoom gesture
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      const z = zoomOffset.value * event.scale;
      const newZoom = interpolate(
        z,
        [1, 10],
        [device?.minZoom ?? 1, Math.min(device?.maxZoom ?? 10, 10)],
        Extrapolation.CLAMP
      );
      zoom.value = newZoom;
      runOnJS(updateZoomDisplay)(newZoom);
    });

  // Tap-to-focus gesture
  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (cameraRef.current && device?.supportsFocus) {
      cameraRef.current.focus({ x: event.x, y: event.y });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  });

  const composedGesture = Gesture.Simultaneous(pinchGesture, tapGesture);

  // =============================================
  // EFFECTS
  // =============================================

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      if (!hasCameraPermission) {
        await requestCameraPermission();
      }
      if (!hasMicPermission && enableAudio) {
        await requestMicPermission();
      }
    })();
  }, [
    hasCameraPermission,
    hasMicPermission,
    enableAudio,
    requestCameraPermission,
    requestMicPermission
  ]);

  // Recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= maxVideoDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxVideoDuration]);

  // =============================================
  // CAPTURE FUNCTIONS
  // =============================================

  /**
   * Fotoğraf çek
   */
  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePhoto({
        flash: flash,
        enableAutoRedEyeReduction: true,
        enableAutoDistortionCorrection: true,
        enableShutterSound: true
      });

      onCapture?.({
        type: "photo",
        path: photo.path,
        width: photo.width,
        height: photo.height
      });
    } catch (error) {
      console.error("[VisionCamera] Photo capture error:", error);
      onError?.(error as Error);
    } finally {
      setIsCapturing(false);
    }
  }, [flash, onCapture, onError, isCapturing]);

  /**
   * Video kaydı başlat
   */
  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      cameraRef.current.startRecording({
        flash: flash === "on" ? "on" : "off",
        fileType: "mp4",
        videoCodec: "h265",
        onRecordingError: (error) => {
          console.error("[VisionCamera] Recording error:", error);
          setIsRecording(false);
          onError?.(error);
        },
        onRecordingFinished: (video) => {
          setIsRecording(false);
          onCapture?.({
            type: "video",
            path: video.path,
            width: video.width,
            height: video.height,
            duration: video.duration
          });
        }
      });
    } catch (error) {
      console.error("[VisionCamera] Start recording error:", error);
      setIsRecording(false);
      onError?.(error as Error);
    }
  }, [flash, onCapture, onError, isRecording]);

  /**
   * Video kaydı durdur
   */
  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("[VisionCamera] Stop recording error:", error);
      onError?.(error as Error);
    }
  }, [isRecording, onError]);

  // =============================================
  // CONTROL HANDLERS
  // =============================================

  /**
   * Kamera pozisyonunu değiştir
   */
  const toggleCameraPosition = useCallback(() => {
    Haptics.selectionAsync();
    setCameraPosition((prev) => (prev === "back" ? "front" : "back"));
    zoom.value = withSpring(device?.neutralZoom ?? 1);
  }, [device?.neutralZoom, zoom]);

  /**
   * Flash modunu değiştir
   */
  const toggleFlash = useCallback(() => {
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  }, []);

  /**
   * Yakalama butonuna basıldığında
   */
  const handleCapture = useCallback(() => {
    if (currentMode === "photo") {
      takePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [currentMode, isRecording, takePhoto, startRecording, stopRecording]);

  /**
   * Mod değiştir
   */
  const handleModeChange = useCallback((newMode: CameraMode) => {
    setCurrentMode(newMode);
  }, []);

  // =============================================
  // RENDER CONDITIONS
  // =============================================

  // İzin yok
  if (!hasCameraPermission) {
    return (
      <PermissionView
        onRequestPermission={requestCameraPermission}
        colors={{
          background: colors.background,
          textPrimary: colors.textPrimary,
          textMuted: colors.textMuted,
          accent: colors.accent
        }}
      />
    );
  }

  // Cihaz yok
  if (!device) {
    return (
      <LoadingView
        colors={{
          background: colors.background,
          textMuted: colors.textMuted,
          surface: colors.surface
        }}
      />
    );
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle="light-content" />

      {/* Camera View */}
      <GestureDetector gesture={composedGesture}>
        <ReanimatedCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          format={format}
          isActive={true}
          photo={currentMode === "photo"}
          video={currentMode === "video"}
          audio={enableAudio && hasMicPermission}
          torch={flash === "on" ? "on" : "off"}
          enableZoomGesture={false}
          animatedProps={animatedProps}
          photoHdr={format?.supportsPhotoHdr}
          videoHdr={format?.supportsVideoHdr}
          videoStabilizationMode="cinematic"
          lowLightBoost={device.supportsLowLightBoost}
        />
      </GestureDetector>

      {/* Controls Overlay */}
      {showControls && (
        <>
          {/* Üst Kontroller */}
          <TopControls
            flash={flash}
            onFlashToggle={toggleFlash}
            onClose={onClose}
            hasFlash={device.hasFlash}
          />

          {/* Kayıt Göstergesi */}
          {isRecording && <RecordingIndicator duration={recordingDuration} />}

          {/* Alt Kontroller */}
          <BottomControls
            currentMode={currentMode}
            onModeChange={handleModeChange}
            isRecording={isRecording}
            isCapturing={isCapturing}
            onCapture={handleCapture}
            onFlipCamera={toggleCameraPosition}
            accentColor={colors.accent}
          />

          {/* Zoom Göstergesi */}
          <ZoomIndicator zoom={zoomDisplay} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  }
});

export default VisionCamera;
