/**
 * MiniPostCard Component (Vibe Kartı)
 *
 * Amaç: Renkli arka planlı kısa metin kartı - PostCard ile aynı yapı
 *
 * ⚠️ ÖNEMLİ: Vibe'lar artık `posts` tablosunda saklanıyor (post_type='vibe')
 * Bu sayede like, comment, share gibi tüm özellikler standart post API'leri ile çalışıyor.
 * Eski `mini_posts` tablosu silindi (25.11.2025).
 *
 * Özellikler:
 * - PostCard ile aynı component'ler (PostHeader, PostActions)
 * - Renkli vibe kartı (medya yerine)
 * - CommentSheet, ShareMenu entegrasyonu
 * - is_anon: Anonim paylaşım desteği (Shadow profil sistemi)
 *
 * Veri Yapısı:
 * - Feed'den `content_type: 'mini_post'` olarak gelir
 * - Aslında `posts` tablosundan `post_type='vibe'` olan kayıtlar
 * - `content` veya `caption` alanında metin bulunur
 * - `background_style`: gradient_pink, gradient_blue, vb.
 *
 * Props:
 * - miniPost: MiniPost | Post objesi (background_style içerir)
 *
 * Kullanım:
 * <MiniPostCard miniPost={miniPost} onLike={handleLike} />
 */

import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { MiniPost } from "@ipelya/types";
import { PostHeader } from "../PostHeader";
import { PostActions } from "../PostActions";
import { CommentSheet } from "../CommentSheet";
import { ShareMenu } from "../ShareMenu";
import { LikeAnimation } from "../LikeAnimation";

interface MiniPostCardProps {
  miniPost: MiniPost;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onUserPress?: () => void;
}

// Arka plan renkleri - MiniPostCreator ile aynı
const BACKGROUND_COLORS: Record<string, string> = {
  gradient_pink: "#FF6B9D",
  gradient_blue: "#4ECDC4",
  gradient_purple: "#A78BFA",
  gradient_orange: "#F59E0B",
  gradient_green: "#10B981",
  solid_dark: "#1F2937"
};

export const MiniPostCard = React.memo(function MiniPostCard({
  miniPost,
  onLike,
  onComment,
  onShare,
  onUserPress
}: MiniPostCardProps) {
  const { colors } = useTheme();
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const lastTap = useRef<number>(0);

  const backgroundColor =
    BACKGROUND_COLORS[miniPost.background_style || "gradient_pink"] || "#FF6B9D";

  // Double tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - like!
      setShowLikeAnimation(true);
      onLike?.();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const handleComment = () => {
    console.log("💬 MiniPost Comment button pressed");
    setShowCommentSheet(true);
    onComment?.();
  };

  const handleShare = () => {
    console.log("📤 MiniPost Share button pressed");
    setShowShareMenu(true);
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface }]}
      accessible={true}
      accessibilityLabel={`Vibe by ${miniPost.user?.display_name || miniPost.user?.username || "Unknown"}`}
    >
      {/* Header: PostCard ile aynı */}
      <PostHeader user={miniPost.user} timestamp={miniPost.created_at} onUserPress={onUserPress} />

      {/* Vibe Kartı (Medya yerine) - Double tap to like */}
      <Pressable onPress={handleDoubleTap} style={[styles.vibeCard, { backgroundColor }]}>
        {/* Like Animation */}
        <LikeAnimation
          visible={showLikeAnimation}
          onAnimationEnd={() => setShowLikeAnimation(false)}
        />
        <Text style={styles.vibeContent}>{miniPost.content || (miniPost as any).caption}</Text>
      </Pressable>

      {/* Actions: PostCard ile aynı */}
      <PostActions
        stats={{
          likes: miniPost.likes_count || (miniPost as any).likes_count || 0,
          comments: miniPost.replies_count || (miniPost as any).comments_count || 0,
          shares: (miniPost as any).shares_count || 0,
          views: (miniPost as any).views_count || 0
        }}
        isLiked={miniPost.is_liked || false}
        onLike={onLike}
        onComment={handleComment}
        onShare={handleShare}
      />

      {/* Comment Sheet */}
      <CommentSheet
        postId={miniPost.id}
        visible={showCommentSheet}
        onClose={() => setShowCommentSheet(false)}
        postOwnerUsername={miniPost.user?.username || miniPost.user?.display_name}
      />

      {/* Share Menu */}
      <ShareMenu
        visible={showShareMenu}
        postId={miniPost.id}
        onDismiss={() => setShowShareMenu(false)}
        onSuccess={() => onShare?.()}
      />
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
  },
  vibeCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 24,
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative"
  },
  vibeContent: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 26
  }
});
