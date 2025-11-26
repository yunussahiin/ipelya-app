/**
 * ReplyPreview
 *
 * Amaç: Yanıtlanan mesajın önizlemesi
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { Message } from "@ipelya/types";

interface ReplyPreviewProps {
  replyTo: Message;
  isMine: boolean;
}

export const ReplyPreview = memo(function ReplyPreview({ replyTo, isMine }: ReplyPreviewProps) {
  const { colors } = useTheme();

  const senderName = replyTo.sender_profile?.display_name || "Bilinmeyen";
  const previewText =
    replyTo.content ||
    (replyTo.content_type === "image"
      ? "📷 Fotoğraf"
      : replyTo.content_type === "video"
        ? "🎥 Video"
        : "Medya");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isMine ? "rgba(255,255,255,0.1)" : colors.backgroundRaised,
          borderLeftColor: colors.accent
        }
      ]}
    >
      <Text style={[styles.senderName, { color: colors.accent }]} numberOfLines={1}>
        {senderName}
      </Text>
      <Text
        style={[styles.preview, { color: isMine ? "rgba(255,255,255,0.8)" : colors.textSecondary }]}
        numberOfLines={1}
      >
        {previewText}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderRadius: 4,
    marginBottom: 4
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2
  },
  preview: {
    fontSize: 13
  }
});
