/**
 * Messages Index - Birleşik Mesaj Listesi
 *
 * Amaç: DM sohbetleri + Takip edilen yayın kanalları
 * Tarih: 2025-11-26
 *
 * Segmented control ile filtreleme:
 * - Tümü: Hem DM hem Broadcast
 * - Mesajlar: Sadece DM
 * - Kanallar: Sadece Broadcast
 */

import { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useConversations, useBroadcastChannels } from "@/hooks/messaging";
import { useConversationStore } from "@/store/messaging";
import { Ionicons } from "@expo/vector-icons";

// Components
import {
  ChatListItem,
  ChatListHeader,
  ChatListSkeleton,
  EmptyChatList
} from "@/components/messaging/ChatListScreen/components";
import { BroadcastChannelItem } from "@/components/broadcast/BroadcastChannelListScreen/components";

// =============================================
// TYPES
// =============================================

type FilterType = "all" | "messages" | "channels";

interface UnifiedItem {
  id: string;
  type: "conversation" | "broadcast";
  data: any;
  lastActivityAt: string;
}

// =============================================
// COMPONENT
// =============================================

export default function MessagesIndexPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // DM Conversations - React Query ile fetch et
  const { isLoading: conversationsLoading, refetch: refetchConversations } = useConversations();

  // Store'dan conversations al (realtime güncellemeler için)
  const conversations = useConversationStore((state) => state.conversations);

  // Broadcast Channels (sadece üye olunanlar)
  const {
    data: broadcastData,
    isLoading: broadcastLoading,
    refetch: refetchBroadcast
  } = useBroadcastChannels();

  const joinedChannels = broadcastData?.joinedChannels || [];

  // Birleşik liste oluştur
  const unifiedList = useMemo(() => {
    const items: UnifiedItem[] = [];

    // DM'leri ekle
    if (filter === "all" || filter === "messages") {
      conversations?.forEach((conv) => {
        items.push({
          id: `conv_${conv.id}`,
          type: "conversation",
          data: conv,
          lastActivityAt: conv.last_message_at || conv.created_at
        });
      });
    }

    // Broadcast kanallarını ekle
    if (filter === "all" || filter === "channels") {
      joinedChannels.forEach((channel) => {
        items.push({
          id: `broadcast_${channel.id}`,
          type: "broadcast",
          data: channel,
          lastActivityAt: channel.last_message_at || channel.created_at
        });
      });
    }

    // Tarihe göre sırala (en yeni en üstte)
    items.sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );

    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return items.filter((item) => {
        if (item.type === "conversation") {
          const name = item.data.name || item.data.other_participant?.display_name || "";
          return name.toLowerCase().includes(query);
        } else {
          return item.data.name?.toLowerCase().includes(query);
        }
      });
    }

    return items;
  }, [conversations, joinedChannels, filter, searchQuery]);

  const isLoading = conversationsLoading || broadcastLoading;

  // Refresh
  const handleRefresh = useCallback(() => {
    refetchConversations();
    refetchBroadcast();
  }, [refetchConversations, refetchBroadcast]);

  // Item tıklama
  const handleItemPress = useCallback(
    (item: UnifiedItem) => {
      if (item.type === "conversation") {
        router.push(`/(messages)/${item.data.id}`);
      } else {
        router.push(`/(broadcast)/${item.data.id}`);
      }
    },
    [router]
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: UnifiedItem }) => {
      if (item.type === "conversation") {
        return <ChatListItem conversation={item.data} onPress={() => handleItemPress(item)} />;
      } else {
        return <BroadcastChannelItem channel={item.data} onPress={() => handleItemPress(item)} />;
      }
    },
    [handleItemPress]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <ChatListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewChat={() => router.push("/(messages)/new")}
      />

      {/* Segmented Control */}
      <View style={[styles.segmentedControl, { backgroundColor: colors.surface }]}>
        {(["all", "messages", "channels"] as FilterType[]).map((type) => (
          <Pressable
            key={type}
            style={[
              styles.segment,
              filter === type && [styles.segmentActive, { backgroundColor: colors.accent }]
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: filter === type ? "#fff" : colors.textSecondary }
              ]}
            >
              {type === "all" ? "Tümü" : type === "messages" ? "Mesajlar" : "Kanallar"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Liste */}
      {isLoading ? (
        <ChatListSkeleton />
      ) : unifiedList.length === 0 ? (
        <EmptyChatList
          message={
            filter === "channels" ? "Henüz takip ettiğiniz kanal yok" : "Henüz mesajınız yok"
          }
        />
      ) : (
        <FlashList
          data={unifiedList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={72}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={false}
        />
      )}
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
  segmentedControl: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8
  },
  segmentActive: {},
  segmentText: {
    fontSize: 14,
    fontWeight: "600"
  },
  listContent: {
    paddingBottom: 100
  }
});
