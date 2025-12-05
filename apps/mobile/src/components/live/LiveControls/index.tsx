/**
 * Live Controls
 * Canlı yayın kontrol butonları
 * Mikrofon, kamera, sonlandır, ekran döndürme vb.
 */

import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface LiveControlsProps {
  // Durum
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenShareEnabled?: boolean;
  isChatVisible?: boolean;

  // Callbacks
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare?: () => void;
  onToggleChat?: () => void;
  onFlipCamera?: () => void;
  onEndSession: () => void;

  // Özelleştirme
  isHost?: boolean;
  showEndButton?: boolean;
  showChatButton?: boolean;
  showScreenShareButton?: boolean;
  showFlipCameraButton?: boolean;
  compact?: boolean;
}

export function LiveControls({
  isMicrophoneEnabled,
  isCameraEnabled,
  isScreenShareEnabled = false,
  isChatVisible = false,
  onToggleMicrophone,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onFlipCamera,
  onEndSession,
  isHost = false,
  showEndButton = true,
  showChatButton = false,
  showScreenShareButton = false,
  showFlipCameraButton = true,
  compact = false
}: LiveControlsProps) {
  const { colors } = useTheme();

  const buttonSize = compact ? 44 : 56;
  const iconSize = compact ? 22 : 26;

  // Control button component
  const ControlButton = ({
    icon,
    isActive,
    isDestructive = false,
    onPress,
    badge
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    isActive: boolean;
    isDestructive?: boolean;
    onPress: () => void;
    badge?: number;
  }) => {
    const bgColor = isDestructive ? "#EF4444" : isActive ? colors.surface : "rgba(255,255,255,0.2)";

    const iconColor = isDestructive ? "#fff" : isActive ? colors.textPrimary : "#fff";

    return (
      <Pressable
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: bgColor
          }
        ]}
        onPress={onPress}
      >
        <Ionicons name={icon} size={iconSize} color={iconColor} />
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Mikrofon */}
      <ControlButton
        icon={isMicrophoneEnabled ? "mic" : "mic-off"}
        isActive={isMicrophoneEnabled}
        onPress={onToggleMicrophone}
      />

      {/* Kamera */}
      <ControlButton
        icon={isCameraEnabled ? "videocam" : "videocam-off"}
        isActive={isCameraEnabled}
        onPress={onToggleCamera}
      />

      {/* Kamera döndür */}
      {showFlipCameraButton && isCameraEnabled && onFlipCamera && (
        <ControlButton icon="camera-reverse" isActive={true} onPress={onFlipCamera} />
      )}

      {/* Ekran paylaşımı (sadece host için) */}
      {showScreenShareButton && isHost && onToggleScreenShare && (
        <ControlButton
          icon={isScreenShareEnabled ? "stop-circle" : "share"}
          isActive={isScreenShareEnabled}
          onPress={onToggleScreenShare}
        />
      )}

      {/* Chat */}
      {showChatButton && onToggleChat && (
        <ControlButton
          icon={isChatVisible ? "chatbubble" : "chatbubble-outline"}
          isActive={isChatVisible}
          onPress={onToggleChat}
        />
      )}

      {/* Sonlandır */}
      {showEndButton && (
        <ControlButton icon="close" isActive={false} isDestructive onPress={onEndSession} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  containerCompact: {
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700"
  }
});

export default LiveControls;
