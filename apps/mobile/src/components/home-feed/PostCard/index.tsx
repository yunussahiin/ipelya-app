/**
 * PostCard Component
 *
 * Amaç: Instagram-style post kartı - Kullanıcı gönderilerini görüntüler
 *
 * Özellikler:
 * - Post header (user info, location)
 * - Media carousel (images/videos)
 * - Post actions (like, comment, share)
 * - Caption with mentions
 * - Comment preview
 *
 * Props:
 * - post: Post objesi
 * - onLike: Like callback
 * - onComment: Comment callback
 * - onShare: Share callback
 * - onUserPress: User profile callback
 *
 * Kullanım:
 * <PostCard post={post} onLike={handleLike} />
 */

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import type { Post } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";
import { PostHeader } from "../PostHeader";
import { PostMedia } from "../PostMedia";
import { PostActions } from "../PostActions";
import { PostCaption } from "../PostCaption";
import { CommentSheet } from "../CommentSheet";
import { ShareMenu } from "../ShareMenu";

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onUserPress?: () => void;
}

export const PostCard = React.memo(function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onUserPress
}: PostCardProps) {
  const { colors } = useTheme();
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleComment = () => {
    console.log("💬 Comment button pressed, opening sheet...");
    setShowCommentSheet(true);
    onComment?.();
  };

  const handleShare = () => {
    console.log("📤 Share button pressed, opening menu...");
    setShowShareMenu(true);
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface }]}
      accessible={true}
      accessibilityLabel={`Post by ${post.user?.display_name || post.user?.username || "Unknown"}`}
      accessibilityHint="Double tap to view post details"
    >
      {/* Header: Avatar, name, location */}
      <PostHeader
        user={post.user}
        location={post.location}
        timestamp={post.created_at}
        onUserPress={onUserPress}
      />

      {/* Media: Images/videos carousel */}
      {post.media && post.media.length > 0 && <PostMedia media={post.media} onDoubleTap={onLike} />}

      {/* Actions: Like, comment, share buttons */}
      <PostActions
        stats={{
          likes: post.likes_count,
          comments: post.comments_count,
          shares: post.shares_count,
          views: post.views_count
        }}
        isLiked={post.is_liked || false}
        onLike={onLike}
        onComment={handleComment}
        onShare={handleShare}
      />

      {/* Comment Sheet */}
      <CommentSheet
        postId={post.id}
        visible={showCommentSheet}
        onClose={() => setShowCommentSheet(false)}
        postOwnerUsername={post.user?.username || post.user?.display_name}
      />

      {/* Share Menu */}
      <ShareMenu
        visible={showShareMenu}
        postId={post.id}
        onDismiss={() => setShowShareMenu(false)}
        onSuccess={() => onShare?.()}
      />

      {/* Caption: Text with mentions */}
      {post.caption && <PostCaption caption={post.caption} />}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  }
});
