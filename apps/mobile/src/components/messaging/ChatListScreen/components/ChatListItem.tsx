/**
 * ChatListItem
 *
 * Amaç: Sohbet listesindeki tek bir sohbet öğesi
 * Tarih: 2025-11-26
 *
 * Avatar, isim, son mesaj önizleme ve okunmamış sayısı gösterir.
 * Swipe actions: Sabitle, Bildirim, Sil
 */

import { memo, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Image } from "expo-image";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@/theme/ThemeProvider";
import { useIsUserOnline } from "@/hooks/messaging";
import { formatRelativeTime } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { Pin, PinOff } from "lucide-react-native";
import type { ConversationListItem } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface ChatListItemProps {
  conversation: ConversationListItem;
  onPress: () => void;
  onPin?: (id: string, isPinned: boolean) => void;
  onMute?: (id: string, isMuted: boolean) => void;
  onDelete?: (id: string) => void;
  isPinned?: boolean;
  maxPinnedReached?: boolean;
}

// =============================================
// COMPONENT
// =============================================

export const ChatListItem = memo(function ChatListItem({
  conversation,
  onPress,
  onPin,
  onMute,
  onDelete,
  isPinned = false,
  maxPinnedReached = false
}: ChatListItemProps) {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  // Swipe action handlers
  const handlePin = () => {
    swipeableRef.current?.close();
    onPin?.(conversation.id, !isPinned);
  };

  const handleMute = () => {
    swipeableRef.current?.close();
    onMute?.(conversation.id, !conversation.is_muted);
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete?.(conversation.id);
  };

  // Right swipe actions (Sabitle, Bildirim, Sil)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-180, 0],
      outputRange: [0, 180],
      extrapolate: "clamp"
    });

    return (
      <Animated.View style={[styles.swipeActions, { transform: [{ translateX }] }]}>
        {/* Pin/Unpin */}
        <Pressable
          style={[styles.swipeAction, styles.pinAction]}
          onPress={handlePin}
          disabled={!isPinned && maxPinnedReached}
        >
          {isPinned ? (
            <PinOff
              size={20}
              color={!isPinned && maxPinnedReached ? "#666" : "#fff"}
              strokeWidth={2}
            />
          ) : (
            <Pin
              size={20}
              color={!isPinned && maxPinnedReached ? "#666" : "#fff"}
              strokeWidth={2}
            />
          )}
        </Pressable>

        {/* Mute/Unmute */}
        <Pressable style={[styles.swipeAction, styles.muteAction]} onPress={handleMute}>
          <Ionicons
            name={conversation.is_muted ? "notifications" : "notifications-off"}
            size={20}
            color="#fff"
          />
        </Pressable>

        {/* Delete */}
        <Pressable style={[styles.swipeAction, styles.deleteAction]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    );
  };

  // Direct sohbet için diğer kullanıcının online durumu
  const otherUserId = conversation.other_participant?.user_id || "";
  const isOnline = useIsUserOnline(otherUserId);

  // Avatar ve isim
  const avatarUrl = conversation.avatar_url || conversation.other_participant?.avatar_url;
  const displayName =
    conversation.name || conversation.other_participant?.display_name || "Bilinmeyen";

  // Son mesaj önizleme
  const lastMessage = conversation.last_message_preview;
  const unreadCount = conversation.unread_count || 0;
  const hasUnread = unreadCount > 0;

  // Instagram tarzı: Okunmamış mesaj varsa "X yeni mesaj" göster
  const getPreviewText = () => {
    if (hasUnread && unreadCount > 1) {
      // Birden fazla okunmamış mesaj varsa
      return unreadCount > 4 ? "4+ yeni mesaj" : `${unreadCount} yeni mesaj`;
    }

    // Tek mesaj veya okunmuş - normal göster
    if (!lastMessage) return "Henüz mesaj yok";

    const isMyMessage =
      lastMessage?.sender_id === conversation.current_user_id || lastMessage?.is_mine;
    const messageContent =
      lastMessage.content_type === "text"
        ? lastMessage.content
        : getContentTypeLabel(lastMessage.content_type);

    return isMyMessage ? `Sen: ${messageContent}` : messageContent;
  };

  const previewText = getPreviewText();

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Pressable
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: pressed ? colors.surface : colors.background }
        ]}
        onPress={onPress}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatarUrl || undefined }}
            style={[styles.avatar, { backgroundColor: colors.surface }]}
            contentFit="cover"
            placeholderContentFit="cover"
          />
          {/* Online indicator */}
          {conversation.type === "direct" && isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              <Text
                style={[styles.name, { color: colors.textPrimary }, hasUnread && styles.nameBold]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {isPinned && (
                <Pin size={12} color={colors.accent} strokeWidth={2.5} style={styles.pinIcon} />
              )}
            </View>
            {conversation.last_message_at && (
              <Text style={[styles.time, { color: colors.textMuted }]}>
                {formatRelativeTime(conversation.last_message_at)}
              </Text>
            )}
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.preview,
                { color: hasUnread ? colors.textPrimary : colors.textSecondary },
                hasUnread && styles.previewBold
              ]}
              numberOfLines={1}
            >
              {previewText}
            </Text>

            {/* Unread indicator - Instagram style dot */}
            {hasUnread && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}

            {/* Muted icon */}
            {conversation.is_muted && (
              <Ionicons
                name="notifications-off"
                size={14}
                color={colors.textMuted}
                style={styles.mutedIcon}
              />
            )}
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
});

// =============================================
// HELPERS
// =============================================

function getContentTypeLabel(contentType: string): string {
  const labels: Record<string, string> = {
    image: "📷 Fotoğraf",
    video: "🎥 Video",
    audio: "🎵 Ses",
    file: "📎 Dosya",
    gif: "GIF",
    sticker: "Çıkartma",
    location: "📍 Konum"
  };
  return labels[contentType] || "Medya";
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#050505"
  },
  content: {
    flex: 1
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1
  },
  pinIcon: {
    marginLeft: 4
  },
  nameBold: {
    fontWeight: "700"
  },
  time: {
    fontSize: 12
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  preview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8
  },
  previewBold: {
    fontWeight: "600"
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8
  },
  mutedIcon: {
    marginLeft: 4
  },
  // Swipe Actions
  swipeActions: {
    flexDirection: "row",
    alignItems: "center"
  },
  swipeAction: {
    width: 60,
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  pinAction: {
    backgroundColor: "#3B82F6"
  },
  muteAction: {
    backgroundColor: "#6B7280"
  },
  deleteAction: {
    backgroundColor: "#EF4444"
  }
});
