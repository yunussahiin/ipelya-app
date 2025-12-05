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

import { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  useConversations,
  useBroadcastChannels,
  useMuteConversation,
  useArchiveConversation
} from "@/hooks/messaging";
import { useConversationStore, useBroadcastStore } from "@/store/messaging";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";

// Components
import {
  ChatListItem,
  ChatListHeader,
  ChatListSkeleton,
  EmptyChatList
} from "@/components/messaging/ChatListScreen/components";

// =============================================
// TYPES
// =============================================

type FilterType = "all" | "messages" | "channels";

interface UnifiedItem {
  id: string;
  type: "conversation" | "broadcast";
  data: any;
  lastActivityAt: string;
  isMine?: boolean;
}

// =============================================
// COMPONENT
// =============================================

export default function MessagesIndexPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || "";

  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  // Mutations
  const muteConversation = useMuteConversation();
  const archiveConversation = useArchiveConversation();

  // Creator kontrolü
  useEffect(() => {
    const checkCreator = async () => {
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_creator, type")
        .eq("user_id", userId)
        .eq("type", "real")
        .single();

      setIsCreator(profile?.is_creator === true || profile?.type === "creator");
    };
    checkCreator();
  }, [userId]);

  // DM Conversations - React Query ile fetch et
  const { isLoading: conversationsLoading, refetch: refetchConversations } = useConversations();

  // Store'dan conversations al (realtime güncellemeler için)
  const conversations = useConversationStore((state) => state.conversations);

  // Pinned conversations'ları yükle
  useEffect(() => {
    const pinned = new Set<string>();
    conversations.forEach((conv: any) => {
      if (conv.is_pinned) pinned.add(conv.id);
    });
    setPinnedIds(pinned);
  }, [conversations]);

  // Broadcast Channels (kendi kanalları + üye olunanlar)
  const {
    data: broadcastData,
    isLoading: broadcastLoading,
    refetch: refetchBroadcast
  } = useBroadcastChannels();

  const myChannels = broadcastData?.myChannels || [];
  const joinedChannels = broadcastData?.joinedChannels || [];

  // Pin/Unpin handler
  const handlePin = useCallback(
    async (conversationId: string, shouldPin: boolean) => {
      if (shouldPin && pinnedIds.size >= 3) {
        showToast({
          type: "warning",
          message: "Maksimum 3 sohbet sabitlenebilir",
          description: "Önce bir sohbetin sabitini kaldırın"
        });
        return;
      }

      try {
        const { error } = await supabase
          .from("conversation_participants")
          .update({ is_pinned: shouldPin })
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);

        if (error) throw error;

        setPinnedIds((prev) => {
          const next = new Set(prev);
          if (shouldPin) next.add(conversationId);
          else next.delete(conversationId);
          return next;
        });

        showToast({
          type: "success",
          message: shouldPin ? "Sohbet sabitlendi" : "Sabitleme kaldırıldı"
        });

        refetchConversations();
      } catch (error) {
        showToast({
          type: "error",
          message: "İşlem başarısız oldu"
        });
      }
    },
    [pinnedIds, userId, showToast, refetchConversations]
  );

  // Mute/Unmute handler
  const handleMute = useCallback(
    async (conversationId: string, shouldMute: boolean) => {
      try {
        await muteConversation.mutateAsync({ conversationId, mute: shouldMute });
        showToast({
          type: "success",
          message: shouldMute ? "Bildirimler kapatıldı" : "Bildirimler açıldı"
        });
      } catch (error) {
        showToast({
          type: "error",
          message: "İşlem başarısız oldu"
        });
      }
    },
    [muteConversation, showToast]
  );

  // Delete handler
  const handleDelete = useCallback(
    (conversationId: string) => {
      Alert.alert(
        "Sohbeti Sil",
        "Bu sohbeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Sil",
            style: "destructive",
            onPress: async () => {
              try {
                await archiveConversation.mutateAsync({ conversationId, archive: true });
                showToast({
                  type: "success",
                  message: "Sohbet silindi"
                });
              } catch (error) {
                showToast({
                  type: "error",
                  message: "Silme işlemi başarısız oldu"
                });
              }
            }
          }
        ]
      );
    },
    [archiveConversation, showToast]
  );

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
      // Önce kendi kanalları (isMine: true)
      myChannels.forEach((channel) => {
        items.push({
          id: `broadcast_${channel.id}`,
          type: "broadcast",
          data: channel,
          lastActivityAt: channel.last_message_at || channel.created_at,
          isMine: true
        });
      });

      // Sonra takip edilen kanallar
      joinedChannels.forEach((channel) => {
        items.push({
          id: `broadcast_${channel.id}`,
          type: "broadcast",
          data: channel,
          lastActivityAt: channel.last_message_at || channel.created_at,
          isMine: false
        });
      });
    }

    // Sıralama: 1) Pinned, 2) Kendi kanalları, 3) Tarihe göre
    items.sort((a, b) => {
      // Pinned olanlar en üstte
      const aPinned = a.type === "conversation" && pinnedIds.has(a.data.id);
      const bPinned = b.type === "conversation" && pinnedIds.has(b.data.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Kendi kanalları
      if (a.isMine && !b.isMine) return -1;
      if (!a.isMine && b.isMine) return 1;

      // Tarihe göre sırala
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });

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
  }, [conversations, myChannels, joinedChannels, filter, searchQuery, pinnedIds]);

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
        useBroadcastStore.getState().setActiveChannel(item.data.id);
        router.push(`/(broadcast)/${item.data.id}`);
      }
    },
    [router]
  );

  // Render broadcast channel item
  const renderChannelItem = useCallback(
    (channel: any, isMine: boolean) => {
      const accessIcon =
        channel.access_type === "public"
          ? "globe-outline"
          : channel.access_type === "subscribers_only"
            ? "star"
            : "lock-closed";

      return (
        <Pressable
          style={[styles.channelItem, { backgroundColor: colors.surface }]}
          onPress={() => {
            useBroadcastStore.getState().setActiveChannel(channel.id);
            router.push(`/(broadcast)/${channel.id}`);
          }}
        >
          {/* Channel Avatar */}
          <View style={styles.channelAvatar}>
            {channel.avatar_url ? (
              <Image
                source={{ uri: channel.avatar_url }}
                style={styles.channelAvatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.channelAvatarPlaceholder, { backgroundColor: colors.accent }]}>
                <Ionicons name="megaphone" size={20} color="#fff" />
              </View>
            )}
            {isMine && (
              <View style={[styles.ownerBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="star" size={10} color="#fff" />
              </View>
            )}
          </View>

          {/* Channel Info */}
          <View style={styles.channelInfo}>
            <View style={styles.channelNameRow}>
              <Text style={[styles.channelName, { color: colors.textPrimary }]} numberOfLines={1}>
                {channel.name}
              </Text>
              {isMine && (
                <View style={[styles.mineBadge, { backgroundColor: `${colors.accent}20` }]}>
                  <Text style={[styles.mineBadgeText, { color: colors.accent }]}>Kanalım</Text>
                </View>
              )}
            </View>
            <Text style={[styles.channelDesc, { color: colors.textMuted }]} numberOfLines={1}>
              {channel.description || "Yayın kanalı"}
            </Text>
            <View style={styles.channelMeta}>
              <View style={styles.channelMetaItem}>
                <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.channelMetaText, { color: colors.textMuted }]}>
                  {channel.member_count || 0}
                </Text>
              </View>
              <View style={styles.channelMetaItem}>
                <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.channelMetaText, { color: colors.textMuted }]}>
                  {channel.message_count || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Access Type Icon */}
          <View style={[styles.accessBadge, { backgroundColor: `${colors.textMuted}15` }]}>
            <Ionicons name={accessIcon} size={14} color={colors.textMuted} />
          </View>
        </Pressable>
      );
    },
    [colors, router]
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: UnifiedItem }) => {
      if (item.type === "conversation") {
        return (
          <ChatListItem
            conversation={item.data}
            onPress={() => handleItemPress(item)}
            onPin={handlePin}
            onMute={handleMute}
            onDelete={handleDelete}
            isPinned={pinnedIds.has(item.data.id)}
            maxPinnedReached={pinnedIds.size >= 3}
          />
        );
      } else {
        return renderChannelItem(item.data, item.isMine || false);
      }
    },
    [handleItemPress, renderChannelItem, handlePin, handleMute, handleDelete, pinnedIds]
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
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Empty State - Sadece creator için kanal oluştur */}
          {filter === "channels" && unifiedList.length === 0 && isCreator && (
            <Pressable
              style={[styles.createChannelCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/broadcast/create")}
            >
              <View style={[styles.createChannelIcon, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name="add-circle" size={32} color={colors.accent} />
              </View>
              <View style={styles.createChannelContent}>
                <Text style={[styles.createChannelTitle, { color: colors.textPrimary }]}>
                  Kanal Oluştur
                </Text>
                <Text style={[styles.createChannelDesc, { color: colors.textMuted }]}>
                  Kendi yayın kanalınızı başlatın ve takipçilerinize ulaşın
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Empty State - User için */}
          {filter === "channels" && unifiedList.length === 0 && !isCreator && (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Henüz kanal yok
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                Popüler kanalları keşfedin ve takip edin
              </Text>
            </View>
          )}

          {/* Kanallar Listesi */}
          {unifiedList.length > 0 && (
            <View style={styles.listSection}>
              {unifiedList.map((item) => (
                <View key={item.id}>{renderItem({ item })}</View>
              ))}
            </View>
          )}

          {/* Popüler Kanallar Section - Sadece Kanallar tab'ında ve kanal varsa */}
          {filter === "channels" && (myChannels.length > 0 || joinedChannels.length > 0) && (
            <View style={styles.popularSection}>
              <View style={styles.sectionHeader}>
                <View
                  style={[styles.sectionIconContainer, { backgroundColor: `${colors.accent}15` }]}
                >
                  <Ionicons name="trending-up" size={14} color={colors.accent} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Popüler Kanallar
                </Text>
                <Pressable onPress={() => router.push("/(broadcast)")}>
                  <Text style={[styles.sectionLink, { color: colors.accent }]}>Tümünü Gör</Text>
                </Pressable>
              </View>
              {[...myChannels, ...joinedChannels].slice(0, 3).map((channel) => (
                <View key={`popular_${channel.id}`}>
                  {renderChannelItem(
                    channel,
                    myChannels.some((c) => c.id === channel.id)
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Mesajlar Empty State */}
          {filter === "messages" && unifiedList.length === 0 && (
            <EmptyChatList
              message="Henüz mesajınız yok"
              subtitle="Yeni bir sohbet başlatmak için sağ üstteki butona tıkla"
            />
          )}

          {/* Tümü Empty State */}
          {filter === "all" && unifiedList.length === 0 && (
            <EmptyChatList
              message="Henüz içerik yok"
              subtitle="Mesaj gönderin veya kanal takip edin"
            />
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 100
  },
  listSection: {
    paddingHorizontal: 12
  },
  // Channel Item Styles
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 16,
    gap: 12
  },
  channelAvatar: {
    position: "relative"
  },
  channelAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 12
  },
  channelAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  ownerBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000"
  },
  channelInfo: {
    flex: 1
  },
  channelNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2
  },
  channelName: {
    fontSize: 16,
    fontWeight: "600"
  },
  mineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  mineBadgeText: {
    fontSize: 10,
    fontWeight: "700"
  },
  channelDesc: {
    fontSize: 13,
    marginBottom: 4
  },
  channelMeta: {
    flexDirection: "row",
    gap: 12
  },
  channelMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  channelMetaText: {
    fontSize: 11
  },
  accessBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  // Create Channel Card
  createChannelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    gap: 12
  },
  createChannelIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  createChannelContent: {
    flex: 1
  },
  createChannelTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4
  },
  createChannelDesc: {
    fontSize: 13,
    lineHeight: 18
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20
  },
  // Popular Section
  popularSection: {
    marginTop: 24,
    paddingHorizontal: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 12,
    gap: 8
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center"
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "600"
  }
});
