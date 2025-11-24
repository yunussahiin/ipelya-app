/**
 * PostActions Component
 *
 * Amaç: Post action buttons - Like, comment, share
 *
 * Özellikler:
 * - Like button (animated)
 * - Comment button
 * - Share button
 * - Bookmark button (optional)
 * - Stats display
 *
 * Props:
 * - stats: PostStats objesi
 * - isLiked: boolean
 * - isBookmarked: boolean (optional)
 * - onLike, onComment, onShare, onBookmark callbacks
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react-native";
import type { PostStats } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";

interface PostActionsProps {
  stats: PostStats;
  isLiked: boolean;
  isBookmarked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

export function PostActions({
  stats,
  isLiked,
  isBookmarked,
  onLike,
  onComment,
  onShare,
  onBookmark
}: PostActionsProps) {
  const { colors } = useTheme();

  // Format number (1000 -> 1K)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        {/* Like button */}
        <Pressable onPress={onLike} style={styles.actionButton}>
          <Heart
            size={24}
            color={isLiked ? colors.accent : colors.textPrimary}
            fill={isLiked ? colors.accent : "none"}
          />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>
            {formatNumber(stats.likes)}
          </Text>
        </Pressable>

        {/* Comment button */}
        <Pressable onPress={onComment} style={styles.actionButton}>
          <MessageCircle size={24} color={colors.textPrimary} />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>
            {formatNumber(stats.comments)}
          </Text>
        </Pressable>

        {/* Share button */}
        <Pressable onPress={onShare} style={styles.actionButton}>
          <Share2 size={24} color={colors.textPrimary} />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>
            {formatNumber(stats.shares)}
          </Text>
        </Pressable>
      </View>

      {/* Bookmark button (optional) */}
      {onBookmark && (
        <Pressable onPress={onBookmark}>
          <Bookmark
            size={24}
            color={isBookmarked ? colors.accent : colors.textPrimary}
            fill={isBookmarked ? colors.accent : "none"}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  leftActions: {
    flexDirection: "row",
    gap: 16
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500"
  }
});
