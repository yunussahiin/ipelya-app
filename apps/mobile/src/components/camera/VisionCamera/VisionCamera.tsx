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
import { View, StyleSheet, StatusBar, Alert, useWindowDimensions, Text } from "react-native";
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
  runOnJS,
  interpolate,
  Extrapolation
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

// Types
import type {
  VisionCameraProps,
  CameraMode,
  FlashMode,
  CameraSettings,
  CapturedMedia
} from "./types";
import { DEFAULT_CAMERA_SETTINGS } from "./types";

// Components
import {
  TopControls,
  BottomControls,
  RecordingIndicator,
  ZoomIndicator,
  PermissionView,
  LoadingView,
  FocusIndicator,
  ExposureIndicator,
  CameraSettingsSheet,
  MediaPreview
} from "./components";

// Hooks
import { useCameraSettings, useFaceCamera } from "./hooks";

// Face Effects
import { FaceEffectOverlay } from "./components/face-effects/FaceEffectOverlay";
import { EffectCarousel } from "./components/face-effects/EffectCarousel";

// Animated Camera component
const ReanimatedCamera = Animated.createAnimatedComponent(Camera);
Animated.addWhitelistedNativeProps({ zoom: true, exposure: true });

// Debug logging
const LOG_PREFIX = "[VisionCamera]";

export function VisionCamera({
  mode = "photo",
  initialPosition = "front", // Selfie için default front
  enableAudio = true,
  showControls = true,
  onCapture,
  onClose,
  onError,
  maxVideoDuration = 60,
  style,
  bottomInset = 0, // TabBar için alt boşluk - Kamera modu
  previewBottomInset, // Preview modu için ayrı offset (undefined ise bottomInset kullanılır)
  // Face Effects Props - Default aktif
  enableFaceEffects = true,
  showFaceEffectSelector = true,
  faceDetectionPerformance = "fast"
}: VisionCameraProps) {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cameraRef = useRef<Camera>(null);

  // Component mount log
  useEffect(() => {
    console.log(`${LOG_PREFIX} Component mounted`, {
      mode,
      initialPosition,
      enableAudio,
      showControls,
      maxVideoDuration
    });
    return () => {
      console.log(`${LOG_PREFIX} Component unmounted`);
    };
  }, []);

  // =============================================
  // PERMISSIONS
  // =============================================
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermission();

  // =============================================
  // PERSISTENT SETTINGS (AsyncStorage)
  // =============================================
  const {
    settings: persistedSettings,
    isLoading: isLoadingSettings,
    updateSetting: updatePersistedSetting
  } = useCameraSettings();

  // =============================================
  // STATE
  // =============================================
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>(initialPosition);
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentMode, setCurrentMode] = useState<CameraMode>(mode);
  const [hdrEnabled, setHdrEnabled] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(2); // neutral zoom default
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);

  // =============================================
  // FACE EFFECTS
  // =============================================
  const {
    faces,
    frameProcessor,
    activeEffects,
    selectedEffectId,
    carouselEffects,
    selectEffect,
    faceDetectionError,
    frameSize
  } = useFaceCamera({
    enabled: enableFaceEffects,
    performanceMode: faceDetectionPerformance,
    maxFaces: 1
  });

  // Face effects debug log
  useEffect(() => {
    console.log(`${LOG_PREFIX} Face Effects State:`, {
      enableFaceEffects,
      facesCount: faces.length,
      activeEffectsCount: activeEffects.length,
      selectedEffectId,
      carouselEffectsCount: carouselEffects.length,
      activeEffects: activeEffects.map((e) => e.id)
    });
  }, [enableFaceEffects, faces.length, activeEffects, selectedEffectId, carouselEffects.length]);

  // =============================================
  // SYNC PERSISTED SETTINGS ON LOAD
  // =============================================
  useEffect(() => {
    if (!isLoadingSettings) {
      // Apply persisted settings
      setFlash(persistedSettings.flashMode);
      setHdrEnabled(persistedSettings.hdrEnabled);
      setCameraPosition(persistedSettings.cameraPosition);
      console.log(`${LOG_PREFIX} Applied persisted settings:`, persistedSettings);
    }
  }, [isLoadingSettings, persistedSettings]);

  // =============================================
  // CAMERA DEVICE & FORMAT
  // =============================================
  const device = useCameraDevice(cameraPosition, {
    physicalDevices: ["ultra-wide-angle-camera", "wide-angle-camera", "telephoto-camera"]
  });

  // Optimize edilmiş format: 1080p video, 2K foto (sosyal medya için ideal)
  // 4K çok büyük dosya boyutu üretir ve yükleme sorunlarına neden olur
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } }, // Full HD video
    { photoResolution: { width: 1920, height: 1080 } }, // Full HD foto (max ~2MP)
    { fps: 30 } // 30 FPS yeterli, 60 FPS gereksiz dosya boyutu
  ]);

  // Device ve format log
  useEffect(() => {
    if (device) {
      console.log(`${LOG_PREFIX} Device info:`, {
        id: device.id,
        name: device.name,
        position: device.position,
        hasFlash: device.hasFlash,
        hasTorch: device.hasTorch,
        supportsFocus: device.supportsFocus,
        supportsLowLightBoost: device.supportsLowLightBoost,
        minZoom: device.minZoom,
        maxZoom: device.maxZoom,
        neutralZoom: device.neutralZoom
      });
    } else {
      console.log(`${LOG_PREFIX} No device available for position:`, cameraPosition);
    }
  }, [device, cameraPosition]);

  useEffect(() => {
    if (format) {
      console.log(`${LOG_PREFIX} Format info:`, {
        photoWidth: format.photoWidth,
        photoHeight: format.photoHeight,
        videoWidth: format.videoWidth,
        videoHeight: format.videoHeight,
        supportsPhotoHdr: format.supportsPhotoHdr,
        supportsVideoHdr: format.supportsVideoHdr,
        minFps: format.minFps,
        maxFps: format.maxFps
      });
    }
  }, [format]);

  // =============================================
  // ZOOM & EXPOSURE ANIMATION
  // =============================================
  // neutralZoom = cihazın 1x lens'i. Back Triple Camera'da bu 2 (wide-angle)
  // minZoom = ultra-wide (0.5x), maxZoom = telephoto
  const neutralZoom = device?.neutralZoom ?? 1;
  const zoom = useSharedValue(neutralZoom);
  const zoomOffset = useSharedValue(0);

  // Exposure: -1 to 1 arası slider değeri, device.minExposure/maxExposure'a map edilir
  const exposureSlider = useSharedValue(0);
  const [exposureDisplay, setExposureDisplay] = useState(0);

  // Device değiştiğinde zoom'u sıfırla
  useEffect(() => {
    if (device) {
      console.log(`${LOG_PREFIX} Setting zoom to neutralZoom:`, device.neutralZoom);
      zoom.value = device.neutralZoom;
      setCurrentZoom(device.neutralZoom);
      // Exposure'ı da sıfırla
      exposureSlider.value = 0;
      setExposureDisplay(0);
    }
  }, [device]);

  const animatedProps = useAnimatedProps(() => {
    // Exposure'ı device aralığına map et
    const minExp = device?.minExposure ?? -8;
    const maxExp = device?.maxExposure ?? 8;
    const exposureValue = interpolate(
      exposureSlider.value,
      [-1, 0, 1],
      [minExp, 0, maxExp],
      Extrapolation.CLAMP
    );

    return {
      zoom: zoom.value,
      exposure: exposureValue
    };
  });

  // =============================================
  // FOCUS FUNCTION (gesture'dan önce tanımlanmalı)
  // =============================================
  const focus = useCallback((point: { x: number; y: number }) => {
    const c = cameraRef.current;
    if (c == null) return;

    console.log(`${LOG_PREFIX} Focus at:`, point.x, point.y);

    // Focus indicator'ı göster
    setFocusPoint(point);

    // Focus çağrısı
    c.focus(point);

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 1.5 saniye sonra focus indicator'ı gizle
    setTimeout(() => {
      setFocusPoint(null);
    }, 1500);
  }, []);

  // =============================================
  // GESTURES
  // =============================================

  // Pinch-to-zoom gesture
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      "worklet";
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      "worklet";
      const minZ = device?.minZoom ?? 1;
      const maxZ = Math.min(device?.maxZoom ?? 10, 16);

      // Scale'i zoom'a çevir
      const newZoom = zoomOffset.value * event.scale;
      const clampedZoom = Math.max(minZ, Math.min(maxZ, newZoom));

      zoom.value = clampedZoom;
      runOnJS(setCurrentZoom)(clampedZoom);
    })
    .onEnd(() => {
      "worklet";
      // Zoom değişikliğini logla
      runOnJS(console.log)("[VisionCamera] Pinch zoom ended:", zoom.value);
    });

  // Tap-to-focus gesture
  const tapGesture = Gesture.Tap().onEnd(({ x, y }) => {
    "worklet";
    runOnJS(focus)({ x, y });
  });

  // Composed gesture: pinch + tap
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
    if (!cameraRef.current || isCapturing) {
      console.log(`${LOG_PREFIX} takePhoto skipped - camera not ready or already capturing`);
      return;
    }

    try {
      console.log(`${LOG_PREFIX} Taking photo...`);
      setIsCapturing(true);

      // Haptics'i try-catch içine al
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        console.log(`${LOG_PREFIX} Haptics error (ignored):`, e);
      }

      console.log(`${LOG_PREFIX} Calling takePhoto on camera ref...`);

      // Fotoğraf çek - optimize edilmiş ayarlarla
      const photo = await cameraRef.current.takePhoto({
        flash: flash === "auto" ? "auto" : flash === "on" ? "on" : "off",
        enableShutterSound: true
      });

      // Dosya boyutunu tahmin et (yaklaşık)
      const estimatedSizeKB = Math.round((photo.width * photo.height * 0.5) / 1024);
      console.log(`${LOG_PREFIX} Photo taken successfully:`, {
        path: photo.path,
        width: photo.width,
        height: photo.height,
        estimatedSizeKB
      });

      // Preview ekranına yönlendir
      const capturedMedia: CapturedMedia = {
        type: "photo",
        path: photo.path,
        width: photo.width,
        height: photo.height
      };
      setPreviewMedia(capturedMedia);
      console.log(`${LOG_PREFIX} Preview media set`);
    } catch (error: unknown) {
      console.error(`${LOG_PREFIX} Photo capture error:`, error);
      console.error(`${LOG_PREFIX} Error details:`, JSON.stringify(error, null, 2));
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      console.log(`${LOG_PREFIX} Setting isCapturing to false`);
      setIsCapturing(false);
    }
  }, [flash, onCapture, onError, isCapturing]);

  /**
   * Snapshot çek (video kaydı sırasında hızlı fotoğraf)
   */
  const takeSnapshot = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      console.log(`${LOG_PREFIX} Taking snapshot`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const snapshot = await cameraRef.current.takeSnapshot({
        quality: 85
      });

      console.log(`${LOG_PREFIX} Snapshot taken:`, snapshot.path);

      // Snapshot'ı da capture olarak bildir (opsiyonel)
      onCapture?.({
        type: "photo",
        path: snapshot.path,
        width: snapshot.width,
        height: snapshot.height
      });
    } catch (error) {
      console.error("[VisionCamera] Snapshot error:", error);
    }
  }, [onCapture]);

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
          // Preview ekranına yönlendir
          const capturedMedia: CapturedMedia = {
            type: "video",
            path: video.path,
            width: video.width,
            height: video.height,
            duration: video.duration
          };
          setPreviewMedia(capturedMedia);
          console.log(`${LOG_PREFIX} Video preview media set`);
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
      setIsPaused(false);
    } catch (error) {
      console.error("[VisionCamera] Stop recording error:", error);
      onError?.(error as Error);
    }
  }, [isRecording, onError]);

  /**
   * Video kaydı duraklat
   */
  const pauseRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording || isPaused) return;

    try {
      console.log(`${LOG_PREFIX} Pausing recording`);
      await cameraRef.current.pauseRecording();
      setIsPaused(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[VisionCamera] Pause recording error:", error);
      onError?.(error as Error);
    }
  }, [isRecording, isPaused, onError]);

  /**
   * Video kaydı devam ettir
   */
  const resumeRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording || !isPaused) return;

    try {
      console.log(`${LOG_PREFIX} Resuming recording`);
      await cameraRef.current.resumeRecording();
      setIsPaused(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[VisionCamera] Resume recording error:", error);
      onError?.(error as Error);
    }
  }, [isRecording, isPaused, onError]);

  /**
   * Video kaydı iptal et
   */
  const cancelRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      console.log(`${LOG_PREFIX} Cancelling recording`);
      await cameraRef.current.cancelRecording();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("[VisionCamera] Cancel recording error:", error);
      onError?.(error as Error);
    }
  }, [isRecording, onError]);

  // =============================================
  // CONTROL HANDLERS
  // =============================================

  /**
   * Kamera pozisyonunu değiştir ve kaydet
   */
  const toggleCameraPosition = useCallback(() => {
    console.log(`${LOG_PREFIX} Toggle camera position`);
    Haptics.selectionAsync();
    setCameraPosition((prev) => {
      const next = prev === "back" ? "front" : "back";
      console.log(`${LOG_PREFIX} Camera position: ${prev} -> ${next}`);
      // Persist to AsyncStorage
      updatePersistedSetting("cameraPosition", next);
      return next;
    });
    // Zoom sıfırlanacak, device useEffect'te handle edilecek
  }, [updatePersistedSetting]);

  /**
   * Flash modunu değiştir ve kaydet
   */
  const toggleFlash = useCallback(() => {
    try {
      console.log(`${LOG_PREFIX} Toggle flash - current:`, flash, "hasFlash:", device?.hasFlash);
      setFlash((prev) => {
        const next = prev === "off" ? "on" : prev === "on" ? "auto" : "off";
        console.log(`${LOG_PREFIX} Flash changed: ${prev} -> ${next}`);
        // Persist to AsyncStorage
        updatePersistedSetting("flashMode", next);
        return next;
      });
    } catch (error) {
      console.error(`${LOG_PREFIX} Flash toggle error:`, error);
    }
  }, [flash, device?.hasFlash, updatePersistedSetting]);

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

  /**
   * HDR toggle ve kaydet
   */
  const toggleHdr = useCallback(() => {
    console.log(`${LOG_PREFIX} Toggle HDR - current:`, hdrEnabled);
    setHdrEnabled((prev) => {
      const next = !prev;
      // Persist to AsyncStorage
      updatePersistedSetting("hdrEnabled", next);
      return next;
    });
    Haptics.selectionAsync();
  }, [hdrEnabled, updatePersistedSetting]);

  /**
   * Zoom değiştir (preset butonlarından)
   */
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      console.log(`${LOG_PREFIX} Zoom change requested:`, newZoom);
      zoom.value = newZoom;
      setCurrentZoom(newZoom);
    },
    [zoom]
  );

  /**
   * Camera error handler - Türkçe hata mesajları
   */
  const handleCameraError = useCallback(
    (error: { code: string; message: string }) => {
      let turkishMessage = "Bilinmeyen hata oluştu";

      switch (error.code) {
        case "session/camera-not-ready":
        case "device/camera-not-available":
          turkishMessage = "Kamera kullanılamıyor";
          break;
        case "session/camera-already-in-use":
          turkishMessage = "Kamera başka uygulama tarafından kullanılıyor";
          break;
        case "permission/camera-permission-denied":
          turkishMessage = "Kamera izni reddedildi";
          break;
        case "session/audio-session-failed-to-activate":
          turkishMessage = "Ses kaydı başlatılamadı";
          break;
        case "capture/insufficient-storage":
          turkishMessage = "Yetersiz depolama alanı";
          break;
        case "capture/recording-in-progress":
          turkishMessage = "Kayıt zaten devam ediyor";
          break;
        case "capture/file-io-error":
          turkishMessage = "Dosya yazma hatası";
          break;
        default:
          turkishMessage = error.message || "Bilinmeyen hata oluştu";
      }

      Alert.alert("Kamera Hatası", turkishMessage, [{ text: "Tamam", style: "default" }]);

      onError?.(error as unknown as Error);
    },
    [onError]
  );

  // HDR desteği kontrolü
  const supportsHdr =
    (currentMode === "photo" && format?.supportsPhotoHdr) ||
    (currentMode === "video" && format?.supportsVideoHdr);

  // Aktif HDR değerleri
  const activePhotoHdr = hdrEnabled && format?.supportsPhotoHdr && currentMode === "photo";
  const activeVideoHdr = hdrEnabled && format?.supportsVideoHdr && currentMode === "video";

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
  // PREVIEW HANDLERS
  // =============================================
  const handlePreviewConfirm = useCallback(
    (media: CapturedMedia) => {
      console.log(`${LOG_PREFIX} Preview confirmed:`, media.type);
      setPreviewMedia(null);
      onCapture?.(media);
    },
    [onCapture]
  );

  const handlePreviewRetake = useCallback(() => {
    console.log(`${LOG_PREFIX} Retake requested`);
    setPreviewMedia(null);
  }, []);

  // =============================================
  // MAIN RENDER
  // =============================================

  // Preview ekranı göster
  if (previewMedia) {
    return (
      <MediaPreview
        media={previewMedia}
        onConfirm={handlePreviewConfirm}
        onRetake={handlePreviewRetake}
        bottomInset={previewBottomInset ?? bottomInset}
      />
    );
  }

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
          torch={device?.hasTorch && flash === "on" ? "on" : "off"}
          enableZoomGesture={false}
          animatedProps={animatedProps}
          photoHdr={activePhotoHdr ?? false}
          videoHdr={activeVideoHdr ?? false}
          videoStabilizationMode={
            format?.videoStabilizationModes?.includes("cinematic") ? "cinematic" : "off"
          }
          lowLightBoost={device?.supportsLowLightBoost ?? false}
          photoQualityBalance="quality"
          outputOrientation="device"
          frameProcessor={enableFaceEffects ? frameProcessor : undefined}
          onInitialized={() => {
            console.log(`${LOG_PREFIX} Camera initialized`);
          }}
          onError={(error) => {
            console.error(`${LOG_PREFIX} Camera error:`, error.code, error.message);
            handleCameraError(error);
          }}
          onUIRotationChanged={(rotation) => {
            console.log(`${LOG_PREFIX} UI rotation changed:`, rotation);
          }}
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
            hdrEnabled={hdrEnabled}
            onHdrToggle={toggleHdr}
            supportsHdr={supportsHdr ?? false}
            onSettings={() => setShowSettings(true)}
          />

          {/* Kayıt Göstergesi */}
          {isRecording && (
            <RecordingIndicator
              duration={recordingDuration}
              isPaused={isPaused}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onCancel={cancelRecording}
              onSnapshot={takeSnapshot}
            />
          )}

          {/* Alt Kontroller - Face effects kapalıyken göster */}
          {!enableFaceEffects && (
            <BottomControls
              currentMode={currentMode}
              onModeChange={handleModeChange}
              isRecording={isRecording}
              isCapturing={isCapturing}
              onCapture={handleCapture}
              onFlipCamera={toggleCameraPosition}
              accentColor={colors.accent}
            />
          )}

          {/* Zoom Göstergesi - Face effects kapalıyken göster */}
          {!enableFaceEffects && (
            <ZoomIndicator
              zoom={currentZoom}
              onZoomChange={handleZoomChange}
              minZoom={device.minZoom}
              maxZoom={device.maxZoom}
              neutralZoom={device.neutralZoom}
            />
          )}

          {/* Focus Göstergesi */}
          {focusPoint && <FocusIndicator point={focusPoint} />}

          {/* Exposure Göstergesi */}
          <ExposureIndicator value={exposureDisplay} />
        </>
      )}

      {/* Face Effects Overlay */}
      {enableFaceEffects && faces.length > 0 && (
        <FaceEffectOverlay
          faces={faces}
          effects={activeEffects}
          width={screenWidth}
          height={screenHeight}
          cameraPosition={cameraPosition === "external" ? "back" : cameraPosition}
          frameSize={frameSize}
        />
      )}

      {/* Debug Overlay - Development Only */}
      {enableFaceEffects && __DEV__ && (
        <View style={styles.debugOverlay}>
          <View
            style={[
              styles.debugBadge,
              { backgroundColor: faces.length > 0 ? "#4CAF50" : "#FF5722" }
            ]}
          >
            <Text style={styles.debugText}>
              {faces.length > 0 ? `👤 ${faces.length} yüz` : "⚠️ Yüz yok"}
            </Text>
          </View>
          {activeEffects.length > 0 && (
            <View style={[styles.debugBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.debugText}>✨ {activeEffects.map((e) => e.name).join(", ")}</Text>
            </View>
          )}
          {faceDetectionError && (
            <View style={[styles.debugBadge, { backgroundColor: "#F44336" }]}>
              <Text style={styles.debugText}>❌ {faceDetectionError}</Text>
            </View>
          )}
        </View>
      )}

      {/* Face Effect Carousel (Instagram tarzı) */}
      {enableFaceEffects && showFaceEffectSelector && !isRecording && (
        <EffectCarousel
          effects={carouselEffects}
          selectedEffectId={selectedEffectId}
          onSelectEffect={selectEffect}
          onCapture={handleCapture}
          isRecording={isRecording}
          isCapturing={isCapturing}
          currentMode={currentMode}
          onModeChange={handleModeChange}
          onFlipCamera={toggleCameraPosition}
          bottomInset={bottomInset}
        />
      )}

      {/* Settings Sheet */}
      <CameraSettingsSheet
        visible={showSettings}
        settings={cameraSettings}
        onSettingsChange={setCameraSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  debugOverlay: {
    position: "absolute",
    top: 120,
    left: 16,
    gap: 8,
    zIndex: 200
  },
  debugBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: 250
  },
  debugText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600"
  }
});

export default VisionCamera;
