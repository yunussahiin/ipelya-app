/**
 * MiniPostCard Component
 *
 * Amaç: Twitter/X-style kısa post kartı
 *
 * Özellikler:
 * - Compact design
 * - Avatar + text
 * - Like & reply buttons
 * - Anon mode support
 *
 * Props:
 * - miniPost: MiniPost objesi
 * - onLike: Like callback
 * - onReply: Reply callback
 *
 * Kullanım:
 * <MiniPostCard miniPost={miniPost} onLike={handleLike} />
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Heart, MessageCircle } from "lucide-react-native";
import type { MiniPost } from "@ipelya/types";

interface MiniPostCardProps {
  miniPost: MiniPost;
  onLike?: () => void;
  onReply?: () => void;
  onUserPress?: () => void;
}

export function MiniPostCard({ miniPost, onLike, onReply, onUserPress }: MiniPostCardProps) {
  return (
    <View style={styles.card}>
      {/* Header: Avatar + name */}
      <View style={styles.header}>
        <Pressable onPress={onUserPress} style={styles.userInfo}>
          {miniPost.user?.avatar_url && (
            <Image source={{ uri: miniPost.user.avatar_url }} style={styles.avatar} />
          )}
          <View>
            <Text style={styles.name}>
              {miniPost.is_anon ? "Anon" : miniPost.user?.display_name}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(miniPost.created_at).toLocaleDateString("tr-TR")}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Content: Text */}
      <Text style={styles.content}>{miniPost.content}</Text>

      {/* Actions: Like & reply */}
      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.actionButton}>
          <Heart
            size={18}
            color={miniPost.is_liked ? "#FF6B9D" : "#6C757D"}
            fill={miniPost.is_liked ? "#FF6B9D" : "none"}
          />
          <Text style={styles.actionText}>{miniPost.likes_count}</Text>
        </Pressable>

        <Pressable onPress={onReply} style={styles.actionButton}>
          <MessageCircle size={18} color="#6C757D" />
          <Text style={styles.actionText}>{miniPost.replies_count}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529"
  },
  timestamp: {
    fontSize: 12,
    color: "#6C757D"
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: "#212529",
    marginBottom: 8
  },
  actions: {
    flexDirection: "row",
    gap: 16
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  actionText: {
    fontSize: 12,
    color: "#6C757D"
  }
});
