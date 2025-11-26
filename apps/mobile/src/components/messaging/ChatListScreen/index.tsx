/**
 * ChatListScreen
 *
 * Amaç: DM sohbet listesi ana ekranı
 * Tarih: 2025-11-26
 *
 * Bu component, kullanıcının tüm sohbetlerini listeler.
 * FlashList ile performanslı scroll, pull-to-refresh ve
 * infinite scroll desteği sağlar.
 */

import { useCallback, useState } from "react";
import { View, StyleSheet, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useConversations } from "@/hooks/messaging";
import { useConversationStore } from "@/store/messaging";
import { ChatListItem } from "./components/ChatListItem";
import { ChatListSkeleton } from "./components/ChatListSkeleton";
import { EmptyChatList } from "./components/EmptyChatList";
import { ChatListHeader } from "./components/ChatListHeader";
import type { ConversationListItem } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface ChatListScreenProps {
  /** Arşivlenmiş sohbetleri göster */
  showArchived?: boolean;
}

// =============================================
// COMPONENT
// =============================================

export function ChatListScreen({ showArchived = false }: ChatListScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Sohbet listesi
  const {
    data: conversations,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching
  } = useConversations(showArchived);

  // Aktif sohbeti set et
  const setActiveConversation = useConversationStore((s) => s.setActiveConversation);

  // Sohbete tıklama
  const handleConversationPress = useCallback(
    (conversation: ConversationListItem) => {
      setActiveConversation(conversation.id);
      router.push(`/messages/${conversation.id}`);
    },
    [router, setActiveConversation]
  );

  // Daha fazla yükle
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Arama filtresi
  const filteredConversations = conversations?.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name =
      conv.name?.toLowerCase() || conv.other_participant?.display_name?.toLowerCase() || "";
    return name.includes(query);
  });

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) => (
      <ChatListItem conversation={item} onPress={() => handleConversationPress(item)} />
    ),
    [handleConversationPress]
  );

  // Key extractor
  const keyExtractor = useCallback((item: ConversationListItem) => item.id, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ChatListSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <FlashList
        data={filteredConversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={76}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<EmptyChatList />}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ChatListSkeleton count={2} />
            </View>
          ) : null
        }
      />
    </View>
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
    paddingBottom: 100
  },
  footer: {
    paddingVertical: 16
  }
});

export default ChatListScreen;
