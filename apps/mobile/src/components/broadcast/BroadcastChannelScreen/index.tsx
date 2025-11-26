/**
 * BroadcastChannelScreen
 *
 * Amaç: Yayın kanalı içi ekranı
 * Tarih: 2025-11-26
 *
 * Mesaj listesi, creator için mesaj gönderme, üye için tepki.
 */

import { useCallback, useEffect } from "react";
import { View, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useBroadcastMessages, useBroadcastRealtime } from "@/hooks/messaging";
import { useBroadcastStore } from "@/store/messaging";
import { BroadcastChannelHeader } from "./components/BroadcastChannelHeader";
import { BroadcastMessageCard } from "../components/BroadcastMessageCard";
import { BroadcastComposer } from "../components/BroadcastComposer";
import { BroadcastSkeleton } from "./components/BroadcastSkeleton";
import type { BroadcastMessage } from "@ipelya/types";

// =============================================
// COMPONENT
// =============================================

export function BroadcastChannelScreen() {
  const { colors } = useTheme();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();

  // Kanal bilgisi
  const channel = useBroadcastStore((s) =>
    [...s.myChannels, ...s.joinedChannels].find((c) => c.id === channelId)
  );
  const setActiveChannel = useBroadcastStore((s) => s.setActiveChannel);

  // Mesajlar
  const {
    data: messages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching
  } = useBroadcastMessages(channelId || "");

  // Realtime
  useBroadcastRealtime(channelId || "");

  // Aktif kanal
  useEffect(() => {
    if (channelId) {
      setActiveChannel(channelId);
    }
    return () => setActiveChannel(null);
  }, [channelId, setActiveChannel]);

  // Daha fazla yükle
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render message
  const renderItem = useCallback(
    ({ item }: { item: BroadcastMessage }) => (
      <BroadcastMessageCard
        message={item}
        channelId={channelId || ""}
        allowedReactions={channel?.allowed_reactions || []}
      />
    ),
    [channelId, channel?.allowed_reactions]
  );

  // Key extractor
  const keyExtractor = useCallback((item: BroadcastMessage) => item.id, []);

  // Owner kontrolü
  const isOwner = channel?.creator_id === channel?.id; // TODO: Fix this

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <BroadcastChannelHeader channel={channel} />
        <BroadcastSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <BroadcastChannelHeader channel={channel} />

      <FlashList
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={200}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isFetchingNextPage ? <BroadcastSkeleton count={2} /> : null}
      />

      {isOwner && <BroadcastComposer channelId={channelId || ""} />}
    </SafeAreaView>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100
  }
});

export default BroadcastChannelScreen;
