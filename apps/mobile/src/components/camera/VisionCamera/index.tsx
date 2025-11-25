/**
 * VisionCamera Component
 *
 * Reusable kamera component'ı - react-native-vision-camera kullanır
 *
 * Özellikler:
 * - Fotoğraf çekme
 * - Video kayıt
 * - Ön/arka kamera geçişi
 * - Flash/Torch kontrolü
 * - Zoom (pinch gesture)
 * - Focus (tap to focus)
 * - HDR desteği
 * - Çeşitli modlar (photo, video, portrait)
 *
 * Kullanım:
 * <VisionCamera
 *   mode="photo"
 *   onCapture={(media) => console.log(media)}
 *   onClose={() => navigation.goBack()}
 * />
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Text, ActivityIndicator, StatusBar } from "react-native";
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
import {
  X,
  RotateCcw,
  Zap,
  ZapOff,
  Circle,
  Square,
  Camera as CameraIcon,
  Video
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

// Animated Camera component
const ReanimatedCamera = Animated.createAnimatedComponent(Camera);
Animated.addWhitelistedNativeProps({ zoom: true });

export type CameraMode = "photo" | "video";

export interface CapturedMedia {
  type: "photo" | "video";
  path: string;
  width: number;
  height: number;
  duration?: number; // Video için
}

interface VisionCameraProps {
  mode?: CameraMode;
  initialPosition?: CameraPosition;
  enableAudio?: boolean;
  showControls?: boolean;
  onCapture?: (media: CapturedMedia) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  maxVideoDuration?: number; // Saniye
  style?: object;
}

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

  // Permissions
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermission();

  // State
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>(initialPosition);
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [torch, setTorch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentMode, setCurrentMode] = useState<CameraMode>(mode);

  // Camera device & format
  const device = useCameraDevice(cameraPosition, {
    physicalDevices: ["ultra-wide-angle-camera", "wide-angle-camera", "telephoto-camera"]
  });

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
    { photoResolution: "max" },
    { fps: 60 }
  ]);

  // Zoom animation
  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const zoomOffset = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    zoom: zoom.value
  }));

  // Pinch-to-zoom gesture
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      const z = zoomOffset.value * event.scale;
      zoom.value = interpolate(
        z,
        [1, 10],
        [device?.minZoom ?? 1, Math.min(device?.maxZoom ?? 10, 10)],
        Extrapolation.CLAMP
      );
    });

  // Tap-to-focus gesture
  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (cameraRef.current && device?.supportsFocus) {
      cameraRef.current.focus({ x: event.x, y: event.y });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  });

  const composedGesture = Gesture.Simultaneous(pinchGesture, tapGesture);

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
  }, []);

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

  // Take photo
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
      console.error("Photo capture error:", error);
      onError?.(error as Error);
    } finally {
      setIsCapturing(false);
    }
  }, [flash, onCapture, onError, isCapturing]);

  // Start video recording
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
          console.error("Recording error:", error);
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
      console.error("Start recording error:", error);
      setIsRecording(false);
      onError?.(error as Error);
    }
  }, [flash, onCapture, onError, isRecording]);

  // Stop video recording
  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Stop recording error:", error);
      onError?.(error as Error);
    }
  }, [isRecording, onError]);

  // Toggle camera position
  const toggleCameraPosition = useCallback(() => {
    Haptics.selectionAsync();
    setCameraPosition((prev) => (prev === "back" ? "front" : "back"));
    zoom.value = withSpring(device?.neutralZoom ?? 1);
  }, [device?.neutralZoom]);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    Haptics.selectionAsync();
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  }, []);

  // Toggle torch
  const toggleTorch = useCallback(() => {
    Haptics.selectionAsync();
    setTorch((prev) => !prev);
  }, []);

  // Handle capture button press
  const handleCapturePress = useCallback(() => {
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

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Permission denied view
  if (!hasCameraPermission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <CameraIcon size={64} color={colors.textMuted} />
        <Text style={[styles.permissionText, { color: colors.textPrimary }]}>
          Kamera izni gerekli
        </Text>
        <Pressable
          style={[styles.permissionButton, { backgroundColor: colors.accent }]}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
        </Pressable>
      </View>
    );
  }

  // No device view
  if (!device) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Kamera yükleniyor...</Text>
      </View>
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
          torch={torch ? "on" : "off"}
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
          {/* Top Controls */}
          <View style={styles.topControls}>
            {/* Close Button */}
            <Pressable style={styles.controlButton} onPress={onClose}>
              <X size={28} color="#FFF" />
            </Pressable>

            {/* Flash/Torch Toggle */}
            <Pressable style={styles.controlButton} onPress={toggleFlash}>
              {flash === "off" ? (
                <ZapOff size={24} color="#FFF" />
              ) : flash === "on" ? (
                <Zap size={24} color="#FFD700" />
              ) : (
                <Text style={styles.flashAutoText}>A</Text>
              )}
            </Pressable>

            {/* Settings placeholder */}
            <View style={styles.controlButton} />
          </View>

          {/* Recording Duration */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>{formatDuration(recordingDuration)}</Text>
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Mode Selector */}
            <View style={styles.modeSelector}>
              <Pressable
                style={[styles.modeButton, currentMode === "photo" && styles.modeButtonActive]}
                onPress={() => setCurrentMode("photo")}
              >
                <CameraIcon size={20} color={currentMode === "photo" ? colors.accent : "#FFF"} />
              </Pressable>
              <Pressable
                style={[styles.modeButton, currentMode === "video" && styles.modeButtonActive]}
                onPress={() => setCurrentMode("video")}
              >
                <Video size={20} color={currentMode === "video" ? colors.accent : "#FFF"} />
              </Pressable>
            </View>

            {/* Capture Button */}
            <Pressable
              style={[
                styles.captureButton,
                currentMode === "video" && styles.captureButtonVideo,
                isRecording && styles.captureButtonRecording
              ]}
              onPress={handleCapturePress}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : isRecording ? (
                <Square size={32} color="#FFF" fill="#FFF" />
              ) : (
                <Circle
                  size={currentMode === "video" ? 32 : 64}
                  color="#FFF"
                  fill={currentMode === "video" ? "#FF3B30" : "#FFF"}
                />
              )}
            </Pressable>

            {/* Flip Camera */}
            <Pressable style={styles.flipButton} onPress={toggleCameraPosition}>
              <RotateCcw size={28} color="#FFF" />
            </Pressable>
          </View>

          {/* Zoom Indicator */}
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{zoom.value.toFixed(1)}x</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16
  },
  permissionText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600"
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12
  },
  topControls: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  flashAutoText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold"
  },
  recordingIndicator: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF3B30"
  },
  recordingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"]
  },
  bottomControls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 30
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 4,
    gap: 4
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16
  },
  modeButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "transparent",
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center"
  },
  captureButtonVideo: {
    borderColor: "#FF3B30"
  },
  captureButtonRecording: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30"
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  zoomIndicator: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  zoomText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  }
});

export default VisionCamera;
