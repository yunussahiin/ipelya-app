/**
 * StoryHeader Component
 * Story üst kısmı - Avatar, kullanıcı adı, zaman, kapat butonu
 */

import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { STORY_AVATAR_SIZE } from "../constants";

interface StoryHeaderProps {
  avatarUrl?: string | null;
  username: string;
  timeAgo: string;
  paddingTop?: number;
  onClose: () => void;
  onAvatarPress?: () => void;
}

function StoryHeaderComponent({
  avatarUrl,
  username,
  timeAgo,
  paddingTop = 0,
  onClose,
  onAvatarPress
}: StoryHeaderProps) {
  return (
    <View style={[styles.container, { paddingTop }]}>
      <Pressable style={styles.userInfo} onPress={onAvatarPress}>
        <Image source={{ uri: avatarUrl || undefined }} style={styles.avatar} contentFit="cover" />
        <View style={styles.textContainer}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.closeButton} onPress={onClose} hitSlop={20}>
        <X size={24} color="#FFF" />
      </Pressable>
    </View>
  );
}

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
    paddingBottom: 8,
    zIndex: 100
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  avatar: {
    width: STORY_AVATAR_SIZE,
    height: STORY_AVATAR_SIZE,
    borderRadius: STORY_AVATAR_SIZE / 2,
    backgroundColor: "#333"
  },
  textContainer: {
    marginLeft: 10,
    flex: 1
  },
  username: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  timeAgo: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 1
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  }
});

export const StoryHeader = memo(StoryHeaderComponent);
