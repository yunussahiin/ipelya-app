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

import React from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { FeedItem as FeedItemType } from "@ipelya/types";
import { PostCard } from "../PostCard";
import { MiniPostCard } from "../MiniPostCard";
import { PollCard } from "../PollCard";
import { SuggestionsRow } from "../SuggestionsRow";
import { usePostActions } from "../../../hooks/home-feed/usePostActions";

interface FeedItemProps {
  item: FeedItemType;
  index: number;
}

export function FeedItem({ item, index }: FeedItemProps) {
  // Post actions hook
  const postId = item.content_type === "post" ? item.content?.id : null;
  const { handleLike, handleComment, handleShare } = usePostActions({
    postId: postId || ""
  });

  // Content type'a göre component seç
  const renderContent = () => {
    switch (item.content_type) {
      case "post":
        return (
          <PostCard
            post={item.content}
            onLike={() => handleLike(item.content?.is_liked || false)}
            onComment={handleComment}
            onShare={handleShare}
          />
        );

      case "mini_post":
        return <MiniPostCard miniPost={item.content} />;

      case "poll":
        return <PollCard poll={item.content} />;

      case "suggestion":
        return <SuggestionsRow profiles={item.content.profiles} />;

      // Diğer content type'lar Phase 6'da eklenecek
      case "voice_moment":
      case "vibe_block":
      case "irl_event":
      case "micro_group":
        return null; // Placeholder

      default:
        return null;
    }
  };

  return <Animated.View entering={FadeInDown.delay(index * 100)}>{renderContent()}</Animated.View>;
}
