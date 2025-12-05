/**
 * Broadcast Preview Component
 * Kamera önizleme ve kontroller
 */

import React, { useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onFlipCamera: () => void;
  onToggleTorch?: () => void;
  onEndBroadcast?: () => void;
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
  onToggleCamera,
  onToggleMic,
  onFlipCamera,
  onToggleTorch,
  onEndBroadcast
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
          <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
        </View>
      )}

      {/* Camera Off Badge - Center */}
      {!camActive && (
        <View style={styles.cameraOffBadge}>
          <Ionicons name="videocam-off" size={16} color="#fff" />
          <Text style={styles.cameraOffText}>Kamera Kapalı</Text>
        </View>
      )}

      {/* Controls - Right Side Vertical */}
      <View style={[styles.controlsOverlay, { top: insets.top + 80 }]}>
        {/* Mic toggle */}
        <Pressable
          style={[
            styles.controlButton,
            { backgroundColor: micActive ? "rgba(255,255,255,0.3)" : "#EF4444" }
          ]}
          onPress={() => {
            console.log("[BroadcastPreview] Mic toggle pressed, current:", micActive);
            onToggleMic();
          }}
        >
          <Ionicons name={micActive ? "mic" : "mic-off"} size={24} color="#fff" />
        </Pressable>

        {/* Camera toggle */}
        <Pressable
          style={[
            styles.controlButton,
            { backgroundColor: camActive ? "rgba(255,255,255,0.3)" : "#EF4444" }
          ]}
          onPress={() => {
            console.log("[BroadcastPreview] Camera toggle pressed, current:", camActive);
            onToggleCamera();
          }}
        >
          <Ionicons name={camActive ? "videocam" : "videocam-off"} size={24} color="#fff" />
        </Pressable>

        {/* Flip camera */}
        <Pressable
          style={[styles.controlButton, { backgroundColor: "rgba(255,255,255,0.3)" }]}
          onPress={() => {
            console.log("[BroadcastPreview] Flip camera pressed");
            onFlipCamera();
          }}
        >
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </Pressable>

        {/* Torch/Flash - Sadece arka kamera ve preview modunda */}
        {!isLive && device?.hasTorch && onToggleTorch && (
          <Pressable
            style={[
              styles.controlButton,
              { backgroundColor: isTorchOn ? "#FBBF24" : "rgba(255,255,255,0.3)" }
            ]}
            onPress={() => {
              console.log("[BroadcastPreview] Torch toggle pressed, current:", isTorchOn);
              onToggleTorch();
            }}
          >
            <Ionicons name={isTorchOn ? "flash" : "flash-off"} size={24} color="#fff" />
          </Pressable>
        )}

        {/* End broadcast (only when live) */}
        {isLive && onEndBroadcast && (
          <Pressable
            style={[styles.controlButton, { backgroundColor: "#EF4444" }]}
            onPress={() => {
              console.log("[BroadcastPreview] End broadcast pressed");
              onEndBroadcast();
            }}
          >
            <Ionicons name="stop" size={24} color="#fff" />
          </Pressable>
        )}
      </View>
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
    alignItems: "center"
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center"
  },
  cameraOffBadge: {
    position: "absolute",
    alignSelf: "center",
    top: "40%",
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
    fontSize: 12,
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
