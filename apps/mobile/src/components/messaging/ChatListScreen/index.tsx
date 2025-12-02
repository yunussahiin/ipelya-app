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

import { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, RefreshControl, Text, SectionList, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useConversations } from "@/hooks/messaging";
import { useMyBroadcastChannels } from "@/hooks/messaging";
import { useConversationStore, useBroadcastStore } from "@/store/messaging";
import { ChatListItem } from "./components/ChatListItem";
import { ChatListSkeleton } from "./components/ChatListSkeleton";
import { EmptyChatList } from "./components/EmptyChatList";
import { ChatListHeader } from "./components/ChatListHeader";
import { Ionicons } from "@expo/vector-icons";
import type { ConversationListItem, BroadcastChannel } from "@ipelya/types";

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

  // Kendi broadcast kanalları
  const { data: myChannels, isLoading: isLoadingChannels } = useMyBroadcastChannels();

  // Sohbete tıklama
  const handleConversationPress = useCallback(
    (conversation: ConversationListItem) => {
      useConversationStore.getState().setActiveConversation(conversation.id);
      router.push(`/messages/${conversation.id}`);
    },
    [router]
  );

  // Kanala tıklama
  const handleChannelPress = useCallback(
    (channel: BroadcastChannel) => {
      useBroadcastStore.getState().setActiveChannel(channel.id);
      router.push(`/broadcast/${channel.id}`);
    },
    [router]
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

  // Combined data with sections
  const sections = useMemo(() => {
    const secs: any[] = [];

    // Kanallarım section - her zaman göster (boş olsa bile placeholder)
    secs.push({
      title: "Kanallarım",
      data:
        myChannels && myChannels.length > 0 ? myChannels : [{ id: "empty-channel", isEmpty: true }],
      type: "channel"
    });

    // Sohbetler section
    if (filteredConversations && filteredConversations.length > 0) {
      secs.push({
        title: "Sohbetler",
        data: filteredConversations,
        type: "conversation"
      });
    }

    return secs;
  }, [myChannels, filteredConversations]);

  // Render item
  const renderItem = useCallback(
    ({ item, section }: { item: any; section: any }) => {
      if (section.type === "channel") {
        // Empty placeholder
        if (item.isEmpty) {
          return (
            <Pressable
              style={[styles.emptyChannelItem, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/broadcast/create")}
            >
              <View style={[styles.channelIcon, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name="add" size={20} color={colors.accent} />
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelName, { color: colors.textPrimary }]}>
                  Kanal Oluştur
                </Text>
                <Text style={[styles.channelDesc, { color: colors.textMuted }]}>
                  Kendi yayın kanalınızı başlatın
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          );
        }

        return (
          <Pressable
            style={[styles.channelItem, { backgroundColor: colors.surface }]}
            onPress={() => handleChannelPress(item)}
          >
            <View style={styles.channelIcon}>
              <Ionicons name="megaphone" size={18} color={colors.accent} />
            </View>
            <View style={styles.channelContent}>
              <Text style={[styles.channelName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.channelDesc, { color: colors.textMuted }]} numberOfLines={1}>
                {item.member_count || 0} üye
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        );
      }
      return <ChatListItem conversation={item} onPress={() => handleConversationPress(item)} />;
    },
    [handleConversationPress, handleChannelPress, colors, router]
  );

  // Key extractor
  const keyExtractor = useCallback((item: any) => item.id, []);

  // Section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: any }) => (
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{section.title}</Text>
    ),
    [colors]
  );

  // Loading state
  if (isLoading || isLoadingChannels) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ChatListSkeleton />
      </View>
    );
  }

  // Empty state - sadece kanal da yoksa göster
  const hasNoContent =
    (!myChannels || myChannels.length === 0) &&
    (!filteredConversations || filteredConversations.length === 0);

  if (hasNoContent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <EmptyChatList />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        stickySectionHeadersEnabled={false}
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
    paddingBottom: 100,
    paddingHorizontal: 12
  },
  footer: {
    paddingVertical: 16
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 12,
    gap: 10
  },
  emptyChannelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)"
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  channelContent: {
    flex: 1
  },
  channelName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2
  },
  channelDesc: {
    fontSize: 12
  }
});

export default ChatListScreen;
