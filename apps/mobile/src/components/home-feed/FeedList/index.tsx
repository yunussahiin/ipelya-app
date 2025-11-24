/**
 * FeedList Component
 *
 * Amaç: Infinite scroll feed list - İçerikleri listeler
 *
 * Özellikler:
 * - FlatList ile infinite scroll
 * - Pull to refresh
 * - Skeleton loading
 * - Empty state
 * - Error handling
 * - Pagination (cursor-based)
 *
 * Props:
 * - tab: 'feed' | 'trending' | 'following'
 *
 * Kullanım:
 * <FeedList tab="feed" />
 */

import React, { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { FeedItem } from "../FeedItem";
import { FeedCardSkeleton } from "../FeedCardSkeleton";
import { EmptyFeedState } from "../EmptyFeedState";
import { ErrorFeedState } from "../ErrorFeedState";
import { useFeed } from "../../../hooks/home-feed/useFeed";

interface FeedListProps {
  tab: "feed" | "trending" | "following";
}

export function FeedList({ tab }: FeedListProps) {
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

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
    <FlatList
      data={data}
      renderItem={({ item, index }) => <FeedItem item={item} index={index} />}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  }
});
