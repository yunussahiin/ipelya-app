/**
 * CommentItem Component
 *
 * Amaç: Tek bir yorum item'ı - Instagram tarzı tasarım
 *
 * Özellikler:
 * - Double tap to like
 * - Long press to delete
 * - Compact time format (7dk, 2s, 5h)
 * - Like button on right
 * - Hide like count if 0
 * - Clickable @mentions
 * - Yanıtları göster/gizle (animasyonlu)
 * - "X diğer yanıtı gör" butonu
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager
} from "react-native";
import { Image } from "expo-image";
import { Heart, Trash2, Gift } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";

// Android için LayoutAnimation'ı etkinleştir
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_creator?: boolean;
  };
  content: string;
  created_at: string;
  likes_count: number;
  replies_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  showDeleteMenu: boolean;
  onShowDeleteMenu: (commentId: string) => void;
  onHideDeleteMenu: () => void;
  isReply?: boolean;
  onLoadReplies?: (commentId: string) => void;
  onShowLikers?: (commentId: string) => void;
}

export function CommentItem({
  comment,
  onLike,
  onReply,
  onDelete,
  showDeleteMenu,
  onShowDeleteMenu,
  onHideDeleteMenu,
  isReply = false,
  onLoadReplies,
  onShowLikers
}: CommentItemProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [lastTap, setLastTap] = React.useState(0);
  const [showReplies, setShowReplies] = useState(false);

  // Yanıtları göster/gizle toggle
  const toggleReplies = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowReplies(!showReplies);
    if (!showReplies && onLoadReplies) {
      onLoadReplies(comment.id);
    }
  };

  const repliesCount = comment.replies_count || comment.replies?.length || 0;

  // Parse mentions and make them clickable
  const renderTextWithMentions = (text: string) => {
    // Regex to match @username (alphanumeric and underscore)
    const mentionRegex = /@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={[styles.text, { color: colors.textPrimary }]}>
            {text.slice(lastIndex, match.index)}
          </Text>
        );
      }

      // Add clickable mention
      const username = match[1];
      parts.push(
        <Text
          key={`mention-${match.index}`}
          style={[styles.mention, { color: colors.accent }]}
          onPress={() => {
            // Navigate to user profile
            router.push(`/(profile)/${username}`);
          }}
        >
          @{username}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={[styles.text, { color: colors.textPrimary }]}>
          {text.slice(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? (
      parts
    ) : (
      <Text style={[styles.text, { color: colors.textPrimary }]}>{text}</Text>
    );
  };

  // Format time ago - compact
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}dk`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}s`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}g`;
    const weeks = Math.floor(days / 7);
    return `${weeks}h`;
  };

  // Double tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      onLike(comment.id);
    } else {
      setLastTap(now);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.container}
        onPress={handleDoubleTap}
        onLongPress={() => onShowDeleteMenu(comment.id)}
        delayLongPress={500}
      >
        {/* Avatar */}
        <Image
          source={{ uri: comment.user.avatar_url || "https://via.placeholder.com/32" }}
          style={styles.avatar}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Header: Username + Time */}
          <View style={styles.header}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>
              {comment.user.display_name || comment.user.username}
            </Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {formatTimeAgo(comment.created_at)}
            </Text>
          </View>

          {/* Comment Text with clickable mentions */}
          <Text style={styles.textContainer}>{renderTextWithMentions(comment.content)}</Text>

          {/* Reply Button */}
          <Pressable onPress={() => onReply(comment.id)}>
            <Text style={[styles.replyButton, { color: colors.textMuted }]}>Yanıtla</Text>
          </Pressable>

          {/* Show Replies Button - Instagram style */}
          {!isReply && repliesCount > 0 && (
            <Pressable onPress={toggleReplies} style={styles.showRepliesButton}>
              <View style={[styles.repliesLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.showRepliesText, { color: colors.textMuted }]}>
                {showReplies ? "Yanıtları gizle" : `${repliesCount} yanıtı gör`}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          {/* Gift Button - Only for creators */}
          {comment.user.is_creator && (
            <Pressable
              style={styles.giftButton}
              onPress={() => console.log("Send gift to:", comment.user.username)}
            >
              <Gift size={14} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Like Button */}
          <Pressable style={styles.likeButton} onPress={() => onLike(comment.id)}>
            <Heart
              size={12}
              color={comment.is_liked ? colors.accent : colors.textMuted}
              fill={comment.is_liked ? colors.accent : "none"}
            />
            {comment.likes_count > 0 && (
              <Pressable onPress={() => onShowLikers?.(comment.id)}>
                <Text style={[styles.likeCount, { color: colors.textMuted }]}>
                  {comment.likes_count}
                </Text>
              </Pressable>
            )}
          </Pressable>
        </View>
      </Pressable>

      {/* Replies List - Animated with vertical line */}
      {!isReply && showReplies && comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesWrapper}>
          {/* Vertical connecting line */}
          <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <View key={reply.id} style={styles.replyItemWrapper}>
                {/* Horizontal connector line */}
                <View style={[styles.horizontalLine, { backgroundColor: colors.border }]} />
                <View style={styles.replyContent}>
                  <CommentItem
                    comment={reply}
                    onLike={onLike}
                    onReply={onReply}
                    onDelete={onDelete}
                    showDeleteMenu={showDeleteMenu}
                    onShowDeleteMenu={onShowDeleteMenu}
                    onHideDeleteMenu={onHideDeleteMenu}
                    onShowLikers={onShowLikers}
                    isReply={true}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Delete Menu Popover */}
      {showDeleteMenu && (
        <View
          style={[
            styles.deleteMenu,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
        >
          <Pressable style={styles.deleteMenuItem} onPress={() => onDelete(comment.id)}>
            <Trash2 size={16} color={colors.warning} />
            <Text style={[styles.deleteMenuText, { color: colors.warning }]}>Sil</Text>
          </Pressable>
          <Pressable style={styles.deleteMenuItem} onPress={onHideDeleteMenu}>
            <Text style={[styles.deleteMenuText, { color: colors.textSecondary }]}>İptal</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: 16
  },
  container: {
    flexDirection: "row",
    gap: 12
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  content: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  username: {
    fontSize: 13,
    fontWeight: "600"
  },
  time: {
    fontSize: 12
  },
  text: {
    fontSize: 14,
    lineHeight: 18
  },
  textContainer: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
    flexWrap: "wrap"
  },
  mention: {
    fontSize: 14,
    fontWeight: "600"
  },
  replyButton: {
    fontSize: 12,
    fontWeight: "500"
  },
  showRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8
  },
  repliesLine: {
    width: 24,
    height: 1
  },
  showRepliesText: {
    fontSize: 12,
    fontWeight: "500"
  },
  repliesWrapper: {
    flexDirection: "row",
    marginLeft: 16,
    marginTop: 8
  },
  verticalLine: {
    width: 1,
    marginRight: 12
  },
  repliesContainer: {
    flex: 1
  },
  replyItemWrapper: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  horizontalLine: {
    width: 12,
    height: 1,
    marginTop: 16,
    marginRight: 4
  },
  replyContent: {
    flex: 1
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  giftButton: {
    padding: 4,
    marginTop: 2
  },
  likeButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24
  },
  likeCount: {
    fontSize: 11,
    fontWeight: "500"
  },
  deleteMenu: {
    position: "absolute",
    right: 16,
    top: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000
  },
  deleteMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  deleteMenuText: {
    fontSize: 14,
    fontWeight: "600"
  }
});
