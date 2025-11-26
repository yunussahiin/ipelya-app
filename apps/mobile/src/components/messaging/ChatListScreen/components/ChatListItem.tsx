/**
 * ChatListItem
 *
 * Amaç: Sohbet listesindeki tek bir sohbet öğesi
 * Tarih: 2025-11-26
 *
 * Avatar, isim, son mesaj önizleme ve okunmamış sayısı gösterir.
 */

import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { useIsUserOnline } from "@/hooks/messaging";
import { formatRelativeTime } from "@/utils/date";
import type { ConversationListItem } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface ChatListItemProps {
  conversation: ConversationListItem;
  onPress: () => void;
}

// =============================================
// COMPONENT
// =============================================

export const ChatListItem = memo(function ChatListItem({
  conversation,
  onPress
}: ChatListItemProps) {
  const { colors } = useTheme();

  // Direct sohbet için diğer kullanıcının online durumu
  const otherUserId = conversation.other_participant?.user_id || "";
  const isOnline = useIsUserOnline(otherUserId);

  // Avatar ve isim
  const avatarUrl = conversation.avatar_url || conversation.other_participant?.avatar_url;
  const displayName =
    conversation.name || conversation.other_participant?.display_name || "Bilinmeyen";

  // Son mesaj önizleme
  const lastMessage = conversation.last_message_preview;
  const lastMessageText = lastMessage
    ? lastMessage.content_type === "text"
      ? lastMessage.content
      : getContentTypeLabel(lastMessage.content_type)
    : "Henüz mesaj yok";

  const hasUnread = conversation.unread_count > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.surface : "transparent" }
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
          <Text
            style={[styles.name, { color: colors.textPrimary }, hasUnread && styles.nameBold]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
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
            {lastMessage?.is_mine && "Sen: "}
            {lastMessageText}
          </Text>

          {/* Unread badge */}
          {hasUnread && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </Text>
            </View>
          )}

          {/* Muted icon */}
          {conversation.is_muted && (
            <View style={styles.mutedIcon}>
              <Text style={{ color: colors.textMuted }}>🔇</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
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
  name: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginRight: 8
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
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center"
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },
  mutedIcon: {
    marginLeft: 4
  }
});
