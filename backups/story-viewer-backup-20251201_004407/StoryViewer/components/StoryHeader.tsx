/**
 * StoryHeader Component
 * Kullanıcı bilgisi ve action butonları
 */

import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { X, MoreHorizontal } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface StoryHeaderProps {
  avatarUrl: string | null;
  username: string;
  timeAgo: string;
  paddingTop: number;
  onClose: () => void;
  onMore?: () => void;
}

function StoryHeaderComponent({
  avatarUrl,
  username,
  timeAgo,
  paddingTop,
  onClose,
  onMore
}: StoryHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { paddingTop }]}>
      <Pressable style={styles.userInfo}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.surface }]} />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={onMore}>
          <MoreHorizontal size={24} color="#FFF" />
        </Pressable>
        <Pressable style={styles.button} onPress={onClose}>
          <X size={28} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

export const StoryHeader = memo(StoryHeaderComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 10
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  username: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  time: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  }
});
