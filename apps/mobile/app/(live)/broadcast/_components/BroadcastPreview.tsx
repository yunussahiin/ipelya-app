/**
 * Broadcast Preview Component
 * Kamera önizleme ve kontroller
 */

import React, { useRef } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraDevice } from "react-native-vision-camera";
import {
  VideoTrack,
  isTrackReference,
  type TrackReferenceOrPlaceholder
} from "@livekit/react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface BroadcastPreviewProps {
  device: CameraDevice | undefined;
  hasCameraPermission: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isLive: boolean;
  isMicrophoneEnabled?: boolean;
  isCameraEnabled?: boolean;
  localVideoTrack?: TrackReferenceOrPlaceholder | null;
  isTorchOn?: boolean;
  avatarUrl?: string;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onFlipCamera: () => void;
  onToggleTorch?: () => void;
}

export function BroadcastPreview({
  device,
  hasCameraPermission,
  isCameraOn,
  isMicOn,
  isLive,
  isMicrophoneEnabled = true,
  isCameraEnabled = true,
  localVideoTrack,
  isTorchOn = false,
  avatarUrl,
  onToggleCamera,
  onToggleMic,
  onFlipCamera,
  onToggleTorch
}: BroadcastPreviewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);

  // Active states based on live status
  // isLive iken LiveKit state'i kullan, değilken local state kullan
  const micActive = isLive ? isMicrophoneEnabled : isMicOn;
  const camActive = isLive ? isCameraEnabled : isCameraOn;

  // Vision Camera sadece preview'da (isLive=false) kullanılır
  // isLive olduğunda LiveKit kendi kamerasını yönetir
  const showVisionCamera = !isLive && device && hasCameraPermission && camActive;
  const showLiveKitVideo =
    isLive && localVideoTrack && isTrackReference(localVideoTrack) && camActive;

  return (
    <View style={styles.container}>
      {/* LiveKit Video - Canlı yayın sırasında */}
      {showLiveKitVideo && (
        <VideoTrack
          trackRef={localVideoTrack}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          objectFit="cover"
          mirror={true}
        />
      )}

      {/* Vision Camera Preview - Sadece preview modunda */}
      {showVisionCamera && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!isLive}
          torch={isTorchOn ? "on" : "off"}
          photo={false}
          video={false}
          audio={false}
        />
      )}

      {/* Placeholder - Kamera kapalıysa veya yükleniyor */}
      {!showVisionCamera && !showLiveKitVideo && (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt }]}>
          {/* Avatar */}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}

          {/* Camera Off Badge - Avatar altında */}
          {!camActive && (
            <View style={styles.cameraOffBadge}>
              <Ionicons name="videocam-off" size={14} color="#fff" />
              <Text style={styles.cameraOffText}>Kamera Kapalı</Text>
            </View>
          )}
        </View>
      )}

      {/* Controls - Sadece preview modunda (canlıda FAB kullanılıyor) */}
      {!isLive && (
        <View style={[styles.controlsOverlay, { top: insets.top + 80 }]}>
          {/* Mic toggle */}
          <Pressable
            style={[
              styles.controlButton,
              { backgroundColor: micActive ? "rgba(255,255,255,0.3)" : "#EF4444" }
            ]}
            onPress={onToggleMic}
          >
            <Ionicons name={micActive ? "mic" : "mic-off"} size={24} color="#fff" />
          </Pressable>

          {/* Camera toggle */}
          <Pressable
            style={[
              styles.controlButton,
              { backgroundColor: camActive ? "rgba(255,255,255,0.3)" : "#EF4444" }
            ]}
            onPress={onToggleCamera}
          >
            <Ionicons name={camActive ? "videocam" : "videocam-off"} size={24} color="#fff" />
          </Pressable>

          {/* Flip camera */}
          <Pressable
            style={[styles.controlButton, { backgroundColor: "rgba(255,255,255,0.3)" }]}
            onPress={onFlipCamera}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </Pressable>

          {/* Torch/Flash - Sadece arka kamera */}
          {device?.hasTorch && onToggleTorch && (
            <Pressable
              style={[
                styles.controlButton,
                { backgroundColor: isTorchOn ? "#FBBF24" : "rgba(255,255,255,0.3)" }
              ]}
              onPress={onToggleTorch}
            >
              <Ionicons name={isTorchOn ? "flash" : "flash-off"} size={24} color="#fff" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center"
  },
  cameraOffBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  cameraOffText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500"
  },
  // Right side vertical controls
  controlsOverlay: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    justifyContent: "center",
    gap: 12
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default BroadcastPreview;
