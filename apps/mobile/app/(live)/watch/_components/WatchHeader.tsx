/**
 * Watch Header Component
 * TikTok/Instagram Live tarzı modern header
 */

import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme/ThemeProvider";

interface WatchHeaderProps {
  sessionTitle?: string;
  hostName: string;
  hostAvatar?: string;
  viewerCount: number;
  duration: string;
  isLive: boolean;
  /** Yayıncının mikrofonu kapalı mı? */
  isHostMuted?: boolean;
  onLeave: () => void;
  topInset: number;
}

export function WatchHeader({
  sessionTitle,
  hostName,
  hostAvatar,
  viewerCount,
  duration,
  isLive,
  isHostMuted,
  onLeave,
  topInset
}: WatchHeaderProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.3)", "transparent"]}
      style={[styles.header, { paddingTop: topInset + 12 }]}
    >
      {/* Sol: Geri butonu */}
      <Pressable onPress={onLeave} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#fff" />
      </Pressable>

      {/* Orta: Host bilgisi pill */}
      <View style={styles.hostPill}>
        {/* Avatar with live ring */}
        <View style={styles.avatarContainer}>
          {hostAvatar ? (
            <Image source={{ uri: hostAvatar }} style={styles.hostAvatar} />
          ) : (
            <View style={[styles.hostAvatarPlaceholder, { backgroundColor: colors.accent }]}>
              <Text style={styles.hostInitial}>{hostName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {isLive && <View style={styles.liveRing} />}
        </View>

        {/* Host name */}
        <Text style={styles.hostName} numberOfLines={1}>
          {hostName}
        </Text>

        {/* Muted indicator */}
        {isHostMuted && (
          <View style={styles.mutedIcon}>
            <Ionicons name="mic-off" size={12} color="#EF4444" />
          </View>
        )}
      </View>

      {/* Sağ: Stats */}
      <View style={styles.rightSection}>
        {/* Live badge */}
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        )}

        {/* Viewers & Duration pill */}
        <View style={styles.statsPill}>
          <Ionicons name="eye" size={12} color="#fff" />
          <Text style={styles.statsText}>{viewerCount}</Text>
          <View style={styles.statsDivider} />
          <Text style={styles.statsText}>{duration}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 20,
    zIndex: 10
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  },
  hostPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 4,
    paddingRight: 12,
    marginHorizontal: 10,
    gap: 8
  },
  avatarContainer: {
    position: "relative"
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#EF4444"
  },
  hostAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EF4444"
  },
  hostInitial: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  liveRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#EF4444"
  },
  hostName: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  mutedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  statsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4
  },
  statsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500"
  },
  statsDivider: {
    width: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4
  }
});

export default WatchHeader;
