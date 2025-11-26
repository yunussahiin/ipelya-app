/**
 * BroadcastMessageCard
 *
 * Amaç: Yayın mesaj kartı
 * Tarih: 2025-11-26
 *
 * Büyük, dikkat çekici tasarım. Creator avatar, content, reaction bar.
 */

import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { formatRelativeTime } from "@/utils/date";
import { BroadcastReactionBar } from "../BroadcastReactionBar";
import { BroadcastPollCard } from "../BroadcastPollCard";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastMessage } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface BroadcastMessageCardProps {
  message: BroadcastMessage;
  channelId: string;
  allowedReactions: string[];
}

// =============================================
// COMPONENT
// =============================================

export const BroadcastMessageCard = memo(function BroadcastMessageCard({
  message,
  channelId,
  allowedReactions
}: BroadcastMessageCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: message.sender_profile?.avatar_url || undefined }}
          style={[styles.avatar, { backgroundColor: colors.backgroundRaised }]}
          contentFit="cover"
          placeholderContentFit="cover"
        />
        <View style={styles.headerText}>
          <Text style={[styles.senderName, { color: colors.textPrimary }]}>
            {message.sender_profile?.display_name || "Creator"}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatRelativeTime(message.created_at)}
          </Text>
        </View>
        {message.is_pinned && (
          <View style={[styles.pinnedBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="pin" size={12} color="#fff" />
          </View>
        )}
      </View>

      {/* Content */}
      {message.content && (
        <Text style={[styles.content, { color: colors.textPrimary }]}>{message.content}</Text>
      )}

      {/* Media */}
      {message.media_url && message.content_type !== "poll" && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: message.media_thumbnail_url || message.media_url }}
            style={styles.media}
            contentFit="cover"
          />
          {message.content_type === "video" && (
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={48} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Poll */}
      {message.content_type === "poll" && message.poll && (
        <BroadcastPollCard poll={message.poll} channelId={channelId} />
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.statText, { color: colors.textMuted }]}>
            {message.view_count || 0}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.statText, { color: colors.textMuted }]}>
            {message.reaction_count || 0}
          </Text>
        </View>
      </View>

      {/* Reaction bar */}
      <BroadcastReactionBar
        messageId={message.id}
        channelId={channelId}
        allowedReactions={allowedReactions}
        reactions={message.reactions || []}
      />
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  headerText: {
    flex: 1,
    marginLeft: 10
  },
  senderName: {
    fontSize: 15,
    fontWeight: "600"
  },
  time: {
    fontSize: 12,
    marginTop: 2
  },
  pinnedBadge: {
    padding: 4,
    borderRadius: 4
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12
  },
  media: {
    width: "100%",
    height: 200
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
  stats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  statText: {
    fontSize: 12
  }
});

export default BroadcastMessageCard;
