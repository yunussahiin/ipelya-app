/**
 * FeedItem Component
 *
 * Amaç: Feed item conditional renderer - Content type'a göre doğru component'i render eder
 *
 * Özellikler:
 * - Content type detection
 * - Conditional rendering (PostCard, MiniPostCard, PollCard, vb.)
 * - Enter animation
 *
 * Props:
 * - item: FeedItem (content_type, content, scores)
 * - index: number (animation delay için)
 *
 * Kullanım:
 * <FeedItem item={feedItem} index={0} />
 */

import React, { memo } from "react";
import { View } from "react-native";
import type { FeedItem as FeedItemType } from "@ipelya/types";
import { PostCard } from "../PostCard";
import { MiniPostCard } from "../MiniPostCard";
import { PollCard } from "../PollCard";
import { SuggestionsRow } from "../SuggestionsRow";
import { usePostActions } from "../../../hooks/home-feed/usePostActions";
import { useAuthStore } from "@/store/auth.store";

interface FeedItemProps {
  item: FeedItemType;
}

export function FeedItem({ item }: FeedItemProps) {
  // Current user ID for ownership checks
  const { sessionToken } = useAuthStore();
  const currentUserId = sessionToken
    ? JSON.parse(atob(sessionToken.split(".")[1]))?.sub
    : undefined;

  // Post actions hook - post ve mini_post için çalışır
  // Vibe'lar da posts tablosunda olduğu için aynı API'yi kullanır
  const postId =
    item.content_type === "post" || item.content_type === "mini_post" ? item.content?.id || "" : "";
  const { handleLike, handleComment, handleShare } = usePostActions({
    postId
  });

  // Content type'a göre component seç
  switch (item.content_type) {
    case "post":
      return (
        <View>
          <PostCard
            post={item.content}
            onLike={() => handleLike(item.content?.is_liked || false)}
            onComment={handleComment}
            onShare={handleShare}
          />
        </View>
      );

    case "mini_post":
      return (
        <View>
          <MiniPostCard
            miniPost={item.content}
            onLike={() => handleLike(item.content?.is_liked || false)}
            onComment={handleComment}
            onShare={handleShare}
          />
        </View>
      );

    case "poll":
      return (
        <View>
          <PollCard poll={item.content} currentUserId={currentUserId} />
        </View>
      );

    case "suggestion":
      return (
        <View>
          <SuggestionsRow profiles={item.content.profiles} />
        </View>
      );

    // Diğer content type'lar Phase 6'da eklenecek
    case "voice_moment":
    case "vibe_block":
    case "irl_event":
    case "micro_group":
      return null; // Placeholder

    default:
      return null;
  }
}

// Memoize for FlashList performance
export const MemoizedFeedItem = memo(FeedItem);
