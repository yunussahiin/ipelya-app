/**
 * Audio Room Header Component
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface AudioRoomHeaderProps {
  duration: string;
  isChatVisible: boolean;
  onToggleChat: () => void;
  onLeave: () => void;
  topInset: number;
}

export function AudioRoomHeader({
  duration,
  isChatVisible,
  onToggleChat,
  onLeave,
  topInset
}: AudioRoomHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { paddingTop: topInset + 8 }]}>
      <Pressable onPress={onLeave} style={styles.backButton}>
        <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.headerCenter}>
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>CANLI</Text>
        </View>
        <Text style={[styles.duration, { color: colors.textMuted }]}>{duration}</Text>
      </View>

      <Pressable style={styles.chatButton} onPress={onToggleChat}>
        <Ionicons
          name={isChatVisible ? "chatbubble" : "chatbubble-outline"}
          size={24}
          color={colors.textPrimary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  backButton: {
    padding: 4
  },
  headerCenter: {
    flex: 1,
    alignItems: "center"
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
    fontWeight: "700"
  },
  duration: {
    fontSize: 12,
    marginTop: 4
  },
  chatButton: {
    padding: 4
  }
});

export default AudioRoomHeader;
