/**
 * FeedList Component
 *
 * Amaç: Infinite scroll feed list - İçerikleri listeler
 *
 * Özellikler:
 * - FlashList ile ultra-fast infinite scroll (5-10x faster)
 * - Instagram-style "Yeni gönderiler" button
 * - Auto-polling for new content (30s)
 * - Pull to refresh
 * - Skeleton loading
 * - Empty state
 * - Error handling
 * - Pagination (cursor-based)
 * - Component recycling for performance
 *
 * Props:
 * - tab: 'feed' | 'trending' | 'following'
 *
 * Kullanım:
 * <FeedList tab="feed" />
 *
 * Performance:
 * - estimatedItemSize: 600px (average post height)
 * - Limit: 20 posts per page
 * - Polling: 30 seconds
 */

import React, { useCallback, useState, useEffect } from "react";
import {
  RefreshControl,
  StyleSheet,
  View,
  Pressable,
  Text,
  Animated,
  ActivityIndicator
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ChevronUp } from "lucide-react-native";
import { MemoizedFeedItem } from "../FeedItem";
import { FeedCardSkeleton } from "../FeedCardSkeleton";
import { EmptyFeedState } from "../EmptyFeedState";
import { ErrorFeedState } from "../ErrorFeedState";
import { StoriesRow } from "../StoriesRow";
import { useFeed } from "../../../hooks/home-feed/useFeed";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfileStore } from "@/store/profile.store";

interface FeedListProps {
  tab: "feed" | "trending" | "following";
  onAddStoryPress?: () => void;
  onStoryPress?: (user: { user_id: string; username: string }, storyIndex?: number) => void;
}

export function FeedList({ tab, onAddStoryPress, onStoryPress }: FeedListProps) {
  const { colors } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const [showNewPostsButton, setShowNewPostsButton] = useState(false);
  const [buttonAnim] = useState(new Animated.Value(0));

  // Feed data hook (React Query)
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useFeed({ tab });

  // Debug logging
  console.log("📊 FeedList State:", {
    tab,
    isLoading,
    isError,
    error: error?.message,
    dataLength: data?.length,
    hasNextPage,
    isFetchingNextPage
  });

  // Check for new posts (polling every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new posts check - TODO: Implement actual API call
      const hasNewPosts = Math.random() > 0.7; // 30% chance for demo
      if (hasNewPosts && !showNewPostsButton) {
        setShowNewPostsButton(true);
        // Animate button in
        Animated.spring(buttonAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7
        }).start();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [showNewPostsButton, buttonAnim]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    setShowNewPostsButton(false);
    buttonAnim.setValue(0);
    refetch();
  }, [refetch, buttonAnim]);

  // Load new posts handler
  const handleLoadNewPosts = useCallback(() => {
    Animated.timing(buttonAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setShowNewPostsButton(false);
      refetch();
    });
  }, [refetch, buttonAnim]);

  // Load more handler (infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <FeedCardSkeleton />
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </View>
    );
  }

  // Error state
  if (isError) {
    console.error("❌ Feed Error:", error);
    return <ErrorFeedState error={error?.message} onRetry={refetch} />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyFeedState />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* New Posts Button - Instagram Style */}
      {showNewPostsButton && (
        <Animated.View
          style={[
            styles.newPostsButton,
            {
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 16]
                  })
                },
                {
                  scale: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }
              ],
              opacity: buttonAnim
            }
          ]}
        >
          <Pressable
            style={[styles.newPostsButtonInner, { backgroundColor: colors.accent }]}
            onPress={handleLoadNewPosts}
          >
            <ChevronUp size={16} color={colors.buttonPrimaryText} />
            <Text style={[styles.newPostsButtonText, { color: colors.buttonPrimaryText }]}>
              Yeni gönderiler
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* FlashList - Ultra-fast infinite scroll */}
      <FlashList
        data={data}
        renderItem={({ item }) => <MemoizedFeedItem item={item} />}
        ListHeaderComponent={
          tab === "feed" ? (
            <View>
              <StoriesRow onStoryPress={onStoryPress} onAddStoryPress={onAddStoryPress} />
              {/* Debug: Aktif hesap bilgisi */}
              <View
                style={{
                  backgroundColor: colors.accent,
                  padding: 8,
                  marginHorizontal: 16,
                  marginTop: 8,
                  borderRadius: 8
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 12, textAlign: "center", fontWeight: "600" }}
                >
                  🔑 Aktif Hesap: {profile?.displayName || "?"} ({profile?.id?.slice(0, 8)}...)
                </Text>
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16
  },
  list: {
    paddingBottom: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  newPostsButton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center"
  },
  newPostsButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  newPostsButtonText: {
    fontSize: 14,
    fontWeight: "600"
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center"
  }
});
