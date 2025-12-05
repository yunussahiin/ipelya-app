/**
 * Viewer Overlay
 * Canlı yayın izleyici arayüzü
 * State-based UI: viewer count, live badge, gift button, chat toggle
 */

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ViewerOverlayProps {
  // Session info
  sessionTitle?: string;
  hostName: string;
  hostAvatar?: string;
  viewerCount: number;
  isLive: boolean;
  duration?: string;

  // Connection state
  connectionQuality?: "excellent" | "good" | "poor" | "disconnected";
  isReconnecting?: boolean;

  // Toggles
  isChatVisible?: boolean;
  onToggleChat?: () => void;
  onSendGift?: () => void;
  onLeave?: () => void;
  onRequestToJoin?: () => void;

  // Guest state
  isGuestEnabled?: boolean;
  canRequestToJoin?: boolean;
  requestPending?: boolean;
}

export function ViewerOverlay({
  sessionTitle,
  hostName,
  hostAvatar,
  viewerCount,
  isLive,
  duration,
  connectionQuality = "good",
  isReconnecting = false,
  isChatVisible = true,
  onToggleChat,
  onSendGift,
  onLeave,
  onRequestToJoin,
  isGuestEnabled = false,
  canRequestToJoin = true,
  requestPending = false
}: ViewerOverlayProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showControls, setShowControls] = useState(true);

  // Bağlantı kalitesi rengi
  const getConnectionColor = () => {
    switch (connectionQuality) {
      case "excellent":
        return "#10B981";
      case "good":
        return "#F59E0B";
      case "poor":
        return "#EF4444";
      case "disconnected":
        return "#6B7280";
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* Left - Host Info */}
        <View style={styles.hostInfo}>
          {/* Live badge */}
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>CANLI</Text>
            </View>
          )}

          {/* Duration */}
          {duration && (
            <View style={[styles.durationBadge, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          )}
        </View>

        {/* Right - Viewer Count & Leave */}
        <View style={styles.topRight}>
          {/* Viewer count */}
          <View style={[styles.viewerBadge, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <Ionicons name="eye" size={14} color="#fff" />
            <Text style={styles.viewerText}>{formatViewerCount(viewerCount)}</Text>
          </View>

          {/* Leave button */}
          <Pressable
            style={[styles.leaveButton, { backgroundColor: "rgba(239,68,68,0.9)" }]}
            onPress={onLeave}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Reconnecting banner */}
      {isReconnecting && (
        <View style={[styles.reconnectBanner, { backgroundColor: "#F59E0B" }]}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.reconnectText}>Yeniden bağlanılıyor...</Text>
        </View>
      )}

      {/* Connection quality indicator */}
      {connectionQuality === "poor" && (
        <View style={[styles.qualityBanner, { backgroundColor: "rgba(239,68,68,0.9)" }]}>
          <Ionicons name="warning" size={14} color="#fff" />
          <Text style={styles.qualityText}>Bağlantı kalitesi düşük</Text>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {/* Host name & title */}
        <View style={styles.sessionInfo}>
          <Text style={styles.hostName} numberOfLines={1}>
            {hostName}
          </Text>
          {sessionTitle && (
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {sessionTitle}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          {/* Request to join (if guest enabled) */}
          {isGuestEnabled && canRequestToJoin && (
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: requestPending ? "rgba(0,0,0,0.5)" : colors.accent }
              ]}
              onPress={onRequestToJoin}
              disabled={requestPending}
            >
              <Ionicons name={requestPending ? "hourglass" : "hand-left"} size={20} color="#fff" />
              {requestPending && <Text style={styles.actionButtonText}>Bekliyor</Text>}
            </Pressable>
          )}

          {/* Gift button */}
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
            onPress={onSendGift}
          >
            <Ionicons name="gift" size={20} color="#fff" />
          </Pressable>

          {/* Chat toggle */}
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: isChatVisible ? colors.accent : "rgba(0,0,0,0.5)" }
            ]}
            onPress={onToggleChat}
          >
            <Ionicons
              name={isChatVisible ? "chatbubble" : "chatbubble-outline"}
              size={20}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Viewer count formatter
function formatViewerCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between"
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff"
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  viewerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  leaveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  reconnectBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6
  },
  reconnectText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  qualityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 6
  },
  qualityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500"
  },
  bottomBar: {
    paddingHorizontal: 16
  },
  sessionInfo: {
    marginBottom: 12
  },
  hostName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  sessionTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  }
});

export default ViewerOverlay;
