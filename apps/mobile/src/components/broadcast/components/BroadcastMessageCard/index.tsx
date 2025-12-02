/**
 * BroadcastMessageCard
 *
 * Instagram Broadcast Channel tarzı mesaj kartı
 * - Avatar solda
 * - Mesaj balonu ortada (dar)
 * - Üyeler için [+] butonu, Creator için detay butonu
 * - Tepkiler balonun altında
 *
 * Tarih: 2025-12-02 (V3)
 */

import { memo, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, Modal } from "react-native";
import { Image } from "expo-image";
import { Plus, BarChart3, X, Eye, Pin, Trash2, MoreVertical } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/ThemeProvider";
import { formatRelativeTime } from "@/utils/date";
import {
  useAddBroadcastReaction,
  useRemoveBroadcastReaction,
  usePinBroadcastMessage,
  useDeleteBroadcastMessage
} from "@/hooks/messaging";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui";
import { BroadcastPollCard } from "../BroadcastPollCard";
import { EmojiPickerSheet } from "../EmojiPickerSheet";
import { BroadcastMediaMessage } from "../BroadcastMediaMessage";
import { BroadcastLinkPreview, extractUrls } from "../BroadcastLinkPreview";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastMessage, BroadcastReaction } from "@ipelya/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUBBLE_MAX_WIDTH = SCREEN_WIDTH * 0.7;

// Varsayılan popüler emojiler (hiç tepki yoksa gösterilir)
const DEFAULT_QUICK_EMOJIS = ["❤️", "🔥", "👏", "😍", "😂"];

interface BroadcastMessageCardProps {
  message: BroadcastMessage;
  channelId: string;
  isCreator?: boolean;
}

export const BroadcastMessageCard = memo(function BroadcastMessageCard({
  message,
  channelId,
  isCreator = false
}: BroadcastMessageCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { mutate: addReaction } = useAddBroadcastReaction();
  const { mutate: removeReaction } = useRemoveBroadcastReaction();
  const { mutate: pinMessage } = usePinBroadcastMessage();
  const { mutate: deleteMessage } = useDeleteBroadcastMessage();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "users">("stats");

  const styles = useMemo(() => createStyles(colors), [colors]);
  const reactions = message.reactions || [];

  // Emoji'lere göre grupla
  const groupedReactions = useMemo(() => {
    const groups: Record<string, { emoji: string; count: number; hasMyReaction: boolean }> = {};
    reactions.forEach((reaction: BroadcastReaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = { emoji: reaction.emoji, count: 0, hasMyReaction: false };
      }
      groups[reaction.emoji].count++;
      if (reaction.user_id === user?.id) {
        groups[reaction.emoji].hasMyReaction = true;
      }
    });
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [reactions, user?.id]);

  const totalReactions = reactions.length;

  // Birleşik emoji listesi: Mevcut tepkiler + varsayılan emojiler (max 5)
  const displayEmojis = useMemo(() => {
    if (isCreator) return groupedReactions.slice(0, 5);

    // Mevcut tepkileri al
    const existing = [...groupedReactions];

    // Varsayılan emojilerden olmayanları ekle (max 5'e tamamla)
    for (const emoji of DEFAULT_QUICK_EMOJIS) {
      if (existing.length >= 5) break;
      if (!existing.find((r) => r.emoji === emoji)) {
        existing.push({ emoji, count: 0, hasMyReaction: false });
      }
    }

    return existing.slice(0, 5);
  }, [groupedReactions, isCreator]);

  const remainingCount = Math.max(0, groupedReactions.length - 5);

  // Tepki toggle - sadece kendi tepkisini kaldırabilir
  const handleReaction = useCallback(
    (emoji: string) => {
      const existing = displayEmojis.find((r) => r.emoji === emoji);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (existing?.hasMyReaction) {
        removeReaction({ messageId: message.id, emoji, channelId });
      } else {
        addReaction({ messageId: message.id, emoji, channelId });
      }
    },
    [message.id, channelId, displayEmojis, addReaction, removeReaction]
  );

  // Emoji picker'dan seçim
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      addReaction({ messageId: message.id, emoji, channelId });
      setShowEmojiPicker(false);
    },
    [message.id, channelId, addReaction]
  );

  // Mesajı sabitle/kaldır
  const handlePin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pinMessage(
      { messageId: message.id, channelId },
      {
        onSuccess: (data) => {
          showToast({
            type: "success",
            message: data.is_pinned ? "Mesaj sabitlendi" : "Sabitleme kaldırıldı"
          });
        },
        onError: (error) => {
          showToast({ type: "error", message: error.message });
        }
      }
    );
    setShowActionMenu(false);
  }, [message.id, channelId, pinMessage, showToast]);

  // Mesajı sil
  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    deleteMessage(
      { messageId: message.id, channelId },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Mesaj silindi" });
        },
        onError: (error) => {
          showToast({ type: "error", message: error.message });
        }
      }
    );
    setShowActionMenu(false);
  }, [message.id, channelId, deleteMessage, showToast]);

  const sender = (message as any).sender;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image
        source={{ uri: sender?.avatar_url || undefined }}
        style={styles.avatar}
        contentFit="cover"
      />

      {/* Mesaj Balonu + Buton */}
      <View style={styles.bubbleRow}>
        {/* Balon */}
        <View style={styles.bubble}>
          <Text style={styles.senderName}>
            {sender?.display_name || sender?.username || "Creator"}
          </Text>

          {message.content && <Text style={styles.content}>{message.content}</Text>}

          {/* Media - Resim/Video/Ses */}
          {message.media_url && message.content_type !== "poll" && (
            <BroadcastMediaMessage
              type={message.content_type as "image" | "video" | "voice"}
              uri={message.media_url}
              thumbnailUri={message.media_thumbnail_url}
              duration={(message.media_metadata as any)?.duration}
              width={(message.media_metadata as any)?.width}
              height={(message.media_metadata as any)?.height}
            />
          )}

          {/* Poll */}
          {message.content_type === "poll" && message.poll && (
            <BroadcastPollCard poll={message.poll} channelId={channelId} />
          )}

          {/* Link Preview - sadece text mesajlarında ve URL varsa */}
          {message.content_type === "text" &&
            message.content &&
            extractUrls(message.content).length > 0 && (
              <BroadcastLinkPreview content={message.content} />
            )}
        </View>

        {/* Butonlar */}
        {isCreator ? (
          <View style={styles.creatorButtons}>
            {/* İstatistik butonu */}
            <Pressable
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDetailModal(true);
              }}
            >
              <BarChart3 size={16} color={colors.textMuted} strokeWidth={1.5} />
            </Pressable>
            {/* Aksiyon menü butonu */}
            <Pressable
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowActionMenu(true);
              }}
            >
              <MoreVertical size={16} color={colors.textMuted} strokeWidth={1.5} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEmojiPicker(true);
            }}
          >
            <Plus size={18} color={colors.textMuted} strokeWidth={1.5} />
          </Pressable>
        )}
      </View>

      {/* Tepkiler - Her zaman 5 emoji göster */}
      {displayEmojis.length > 0 && (
        <View style={styles.reactionsRow}>
          {displayEmojis.map((item) => (
            <Pressable
              key={item.emoji}
              style={[
                item.count > 0 ? styles.reactionPill : styles.quickEmojiPill,
                item.hasMyReaction && styles.reactionPillActive
              ]}
              onPress={() => handleReaction(item.emoji)}
            >
              <Text style={item.count > 0 ? styles.reactionEmoji : styles.quickEmoji}>
                {item.emoji}
              </Text>
              {item.count > 0 && <Text style={styles.reactionCount}>{item.count}</Text>}
            </Pressable>
          ))}
          {remainingCount > 0 && <Text style={styles.moreText}>+{remainingCount}</Text>}
        </View>
      )}

      {/* Emoji Picker */}
      <EmojiPickerSheet
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
      />

      {/* Creator Detay Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDetailModal(false)}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Mesaj Detayları</Text>
            <Pressable onPress={() => setShowDetailModal(false)}>
              <X size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tab, activeTab === "stats" && { borderBottomColor: colors.accent }]}
              onPress={() => setActiveTab("stats")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "stats" ? colors.accent : colors.textMuted }
                ]}
              >
                İstatistikler
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "users" && { borderBottomColor: colors.accent }]}
              onPress={() => setActiveTab("users")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "users" ? colors.accent : colors.textMuted }
                ]}
              >
                Kullanıcılar ({totalReactions})
              </Text>
            </Pressable>
          </View>

          {activeTab === "stats" ? (
            <>
              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Eye size={20} color={colors.accent} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {message.view_count || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Görüntülenme</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>❤️</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {totalReactions}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tepki</Text>
                </View>
              </View>

              {/* Reactions breakdown */}
              {groupedReactions.length > 0 && (
                <View style={styles.reactionsBreakdown}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tepkiler</Text>
                  {groupedReactions.map((reaction) => (
                    <View key={reaction.emoji} style={styles.reactionRow}>
                      <Text style={styles.reactionRowEmoji}>{reaction.emoji}</Text>
                      <View
                        style={[styles.reactionBar, { backgroundColor: colors.backgroundRaised }]}
                      >
                        <View
                          style={[
                            styles.reactionBarFill,
                            {
                              backgroundColor: colors.accent,
                              width: `${(reaction.count / totalReactions) * 100}%`
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.reactionRowCount, { color: colors.textSecondary }]}>
                        {reaction.count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            /* Users Tab */
            <View style={styles.usersTab}>
              {reactions.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz tepki yok</Text>
              ) : (
                reactions.map((reaction: any, index: number) => (
                  <View key={`${reaction.user_id}-${index}`} style={styles.userRow}>
                    {reaction.user?.avatar_url ? (
                      <Image
                        source={{ uri: reaction.user.avatar_url }}
                        style={styles.userAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[styles.userAvatar, { backgroundColor: colors.backgroundRaised }]}
                      >
                        <Text style={styles.userAvatarText}>👤</Text>
                      </View>
                    )}
                    <Text style={[styles.userId, { color: colors.textPrimary }]} numberOfLines={1}>
                      {reaction.user?.display_name || reaction.user?.username || "Kullanıcı"}
                    </Text>
                    <Text style={styles.userEmoji}>{reaction.emoji}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Creator Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowActionMenu(false)} />
        <View style={[styles.actionMenuContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />

          {/* Pin/Unpin */}
          <Pressable style={styles.actionMenuItem} onPress={handlePin}>
            <Pin size={22} color={message.is_pinned ? colors.accent : colors.textPrimary} />
            <Text style={[styles.actionMenuText, { color: colors.textPrimary }]}>
              {message.is_pinned ? "Sabitlemeyi Kaldır" : "Mesajı Sabitle"}
            </Text>
          </Pressable>

          {/* Delete */}
          <Pressable style={styles.actionMenuItem} onPress={handleDelete}>
            <Trash2 size={22} color="#EF4444" />
            <Text style={[styles.actionMenuText, { color: "#EF4444" }]}>Mesajı Sil</Text>
          </Pressable>

          {/* Cancel */}
          <Pressable
            style={[styles.actionMenuItem, styles.actionMenuCancel]}
            onPress={() => setShowActionMenu(false)}
          >
            <Text
              style={[
                styles.actionMenuText,
                { color: colors.textMuted, textAlign: "center", flex: 1 }
              ]}
            >
              İptal
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
});

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: "flex-start"
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.backgroundRaised,
      marginRight: 8,
      marginTop: 2
    },
    bubbleRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      flex: 1
    },
    bubble: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderTopLeftRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
      maxWidth: BUBBLE_MAX_WIDTH
    },
    senderName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2
    },
    content: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.textPrimary
    },
    mediaContainer: {
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 8,
      maxWidth: BUBBLE_MAX_WIDTH - 24
    },
    media: {
      width: "100%",
      height: 160,
      borderRadius: 8
    },
    playOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)"
    },
    addButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8
    },
    reactionsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 36,
      marginTop: 6,
      gap: 6,
      width: "100%"
    },
    reactionPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundRaised,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4
    },
    reactionPillActive: {
      backgroundColor: colors.accent + "20"
    },
    reactionEmoji: {
      fontSize: 14
    },
    reactionCount: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary
    },
    moreText: {
      fontSize: 12,
      color: colors.textMuted
    },
    quickEmojiPill: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.backgroundRaised,
      opacity: 0.7
    },
    quickEmoji: {
      fontSize: 16
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)"
    },
    modalContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 40
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginTop: 12
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600"
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginHorizontal: 20
    },
    statItem: {
      alignItems: "center",
      gap: 4
    },
    statEmoji: {
      fontSize: 20
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700"
    },
    statLabel: {
      fontSize: 12
    },
    reactionsBreakdown: {
      padding: 20
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12
    },
    reactionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 8
    },
    reactionRowEmoji: {
      fontSize: 20,
      width: 30
    },
    reactionBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: "hidden"
    },
    reactionBarFill: {
      height: "100%",
      borderRadius: 4
    },
    reactionRowCount: {
      fontSize: 14,
      fontWeight: "500",
      width: 30,
      textAlign: "right"
    },
    tabsRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent"
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600"
    },
    usersTab: {
      padding: 20,
      maxHeight: 300
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      gap: 12
    },
    userAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center"
    },
    userAvatarText: {
      fontSize: 16
    },
    userId: {
      flex: 1,
      fontSize: 14
    },
    userEmoji: {
      fontSize: 20
    },
    emptyText: {
      textAlign: "center",
      fontSize: 14,
      paddingVertical: 20
    },
    // Creator Buttons
    creatorButtons: {
      flexDirection: "row",
      gap: 4
    },
    // Action Menu
    actionMenuContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 40,
      paddingTop: 8
    },
    actionMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12
    },
    actionMenuText: {
      fontSize: 16,
      fontWeight: "500"
    },
    actionMenuCancel: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
      justifyContent: "center"
    }
  });

export default BroadcastMessageCard;
