/**
 * Watch Header Component
 */

import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface WatchHeaderProps {
  sessionTitle?: string;
  hostName: string;
  hostAvatar?: string;
  viewerCount: number;
  duration: string;
  isLive: boolean;
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
  onLeave,
  topInset
}: WatchHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { paddingTop: topInset + 8 }]}>
      <Pressable onPress={onLeave} style={styles.backButton}>
        <Ionicons name="chevron-down" size={28} color="#fff" />
      </Pressable>

      <View style={styles.hostInfo}>
        {hostAvatar ? (
          <Image source={{ uri: hostAvatar }} style={styles.hostAvatar} />
        ) : (
          <View style={[styles.hostAvatarPlaceholder, { backgroundColor: colors.accent }]}>
            <Text style={styles.hostInitial}>{hostName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.hostDetails}>
          <Text style={styles.hostName} numberOfLines={1}>
            {hostName}
          </Text>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {sessionTitle}
          </Text>
        </View>
      </View>

      <View style={styles.rightInfo}>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        )}
        <View style={styles.stats}>
          <Ionicons name="eye" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.statText}>{viewerCount}</Text>
        </View>
        <Text style={styles.duration}>{duration}</Text>
      </View>
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10
  },
  backButton: {
    padding: 4
  },
  hostInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    gap: 10
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  hostAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  hostInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  hostDetails: {
    flex: 1
  },
  hostName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  sessionTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12
  },
  rightInfo: {
    alignItems: "flex-end",
    gap: 4
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    fontWeight: "700"
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  statText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12
  },
  duration: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11
  }
});

export default WatchHeader;
