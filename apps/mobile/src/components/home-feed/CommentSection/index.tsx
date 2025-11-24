/**
 * CommentSection Component
 *
 * Amaç: Yorumları listeler (nested replies support)
 *
 * Özellikler:
 * - Comment list
 * - Nested replies
 * - Like comments
 * - Reply to comments
 * - Load more
 *
 * Props:
 * - comments: PostComment[] array
 * - onLike: Like callback
 * - onReply: Reply callback
 * - onLoadMore: Load more callback
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, Image, FlatList } from "react-native";
import { Heart, MessageCircle } from "lucide-react-native";
import type { PostComment } from "@ipelya/types";

interface CommentSectionProps {
  comments: PostComment[];
  onLike?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  onLoadMore?: () => void;
}

export function CommentSection({ comments, onLike, onReply, onLoadMore }: CommentSectionProps) {
  // Comment item renderer
  const renderComment = (comment: PostComment, isNested = false) => (
    <View key={comment.id} style={[styles.commentItem, isNested && styles.nestedComment]}>
      {/* Avatar */}
      {comment.user?.avatar_url && (
        <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
      )}

      <View style={styles.commentContent}>
        {/* Name + content */}
        <View style={styles.commentHeader}>
          <Text style={styles.name}>{comment.user?.display_name}</Text>
          <Text style={styles.content}>{comment.content}</Text>
        </View>

        {/* Actions */}
        <View style={styles.commentActions}>
          <Pressable onPress={() => onLike?.(comment.id)} style={styles.actionButton}>
            <Heart
              size={14}
              color={comment.is_liked ? "#FF6B9D" : "#6C757D"}
              fill={comment.is_liked ? "#FF6B9D" : "none"}
            />
            <Text style={styles.actionText}>{comment.likes_count}</Text>
          </Pressable>

          <Pressable onPress={() => onReply?.(comment.id)} style={styles.actionButton}>
            <MessageCircle size={14} color="#6C757D" />
            <Text style={styles.actionText}>Yanıtla</Text>
          </Pressable>
        </View>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.replies}>
            {comment.replies.map((reply) => renderComment(reply, true))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yorumlar</Text>

      {comments.map((comment) => renderComment(comment))}

      {/* Load more button */}
      {onLoadMore && (
        <Pressable onPress={onLoadMore} style={styles.loadMore}>
          <Text style={styles.loadMoreText}>Daha fazla yorum</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12
  },
  commentItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  nestedComment: {
    marginLeft: 40
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  commentContent: {
    flex: 1
  },
  commentHeader: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 8
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 2
  },
  content: {
    fontSize: 13,
    color: "#212529",
    lineHeight: 18
  },
  commentActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  actionText: {
    fontSize: 12,
    color: "#6C757D"
  },
  replies: {
    marginTop: 8
  },
  loadMore: {
    paddingVertical: 8,
    alignItems: "center"
  },
  loadMoreText: {
    fontSize: 14,
    color: "#FF6B9D",
    fontWeight: "500"
  }
});
