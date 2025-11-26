/**
 * MessageBubble
 *
 * Amaç: Mesaj balonu component'i
 * Tarih: 2025-11-26
 *
 * Gönderen/alıcı stilleri, media preview, reply preview,
 * status indicator ve long press menu desteği.
 */

import { memo, useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatMessageTime } from "@/utils/date";
import { MessageReactions } from "./MessageReactions";
import { MessageStatus } from "./MessageStatus";
import { ReplyPreview } from "./ReplyPreview";
import { MessageMenu } from "./MessageMenu";
import type { Message } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface MessageBubbleProps {
  message: Message;
  conversationId: string;
}

// =============================================
// COMPONENT
// =============================================

export const MessageBubble = memo(function MessageBubble({
  message,
  conversationId
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const isMine = message.sender_id === user?.id;
  const isPending = "tempId" in message;

  // Long press menu
  const handleLongPress = useCallback(() => {
    setMenuVisible(true);
  }, []);

  // Silinmiş mesaj
  if (message.is_deleted) {
    return (
      <View style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}>
        <View style={[styles.bubble, styles.deletedBubble, { backgroundColor: colors.surface }]}>
          <Text style={[styles.deletedText, { color: colors.textMuted }]}>Bu mesaj silindi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}>
      {/* Reply preview */}
      {message.reply_to && <ReplyPreview replyTo={message.reply_to} isMine={isMine} />}

      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={({ pressed }) => [
          styles.bubble,
          isMine
            ? [styles.bubbleRight, { backgroundColor: colors.accent }]
            : [styles.bubbleLeft, { backgroundColor: colors.surface }],
          pressed && styles.bubblePressed,
          isPending && styles.bubblePending
        ]}
      >
        {/* Media content */}
        {message.media_url && (
          <View style={styles.mediaContainer}>
            {message.content_type === "image" && (
              <Image
                source={{ uri: message.media_thumbnail_url || message.media_url }}
                style={styles.mediaImage}
                contentFit="cover"
              />
            )}
            {message.content_type === "video" && (
              <View style={styles.videoContainer}>
                <Image
                  source={{ uri: message.media_thumbnail_url }}
                  style={styles.mediaImage}
                  contentFit="cover"
                />
                <View style={styles.playButton}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Text content */}
        {message.content && (
          <Text style={[styles.text, { color: isMine ? "#fff" : colors.textPrimary }]}>
            {message.content}
          </Text>
        )}

        {/* Shadow badge */}
        {message.is_shadow && (
          <View style={styles.shadowBadge}>
            <Text style={styles.shadowIcon}>👻</Text>
          </View>
        )}

        {/* Time and status */}
        <View style={styles.footer}>
          <Text
            style={[styles.time, { color: isMine ? "rgba(255,255,255,0.7)" : colors.textMuted }]}
          >
            {formatMessageTime(message.created_at)}
          </Text>
          {isMine && <MessageStatus status={message.status} />}
          {message.is_edited && (
            <Text
              style={[
                styles.edited,
                { color: isMine ? "rgba(255,255,255,0.7)" : colors.textMuted }
              ]}
            >
              düzenlendi
            </Text>
          )}
        </View>
      </Pressable>

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <MessageReactions
          reactions={message.reactions}
          messageId={message.id}
          conversationId={conversationId}
          isMine={isMine}
        />
      )}

      {/* Context menu */}
      <MessageMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        message={message}
        conversationId={conversationId}
        isMine={isMine}
      />
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    maxWidth: "80%"
  },
  containerLeft: {
    alignSelf: "flex-start"
  },
  containerRight: {
    alignSelf: "flex-end"
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4
  },
  bubbleRight: {
    borderBottomRightRadius: 4
  },
  bubblePressed: {
    opacity: 0.8
  },
  bubblePending: {
    opacity: 0.6
  },
  deletedBubble: {
    paddingVertical: 10
  },
  deletedText: {
    fontSize: 14,
    fontStyle: "italic"
  },
  text: {
    fontSize: 16,
    lineHeight: 22
  },
  mediaContainer: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: "hidden"
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 12
  },
  videoContainer: {
    position: "relative"
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  playIcon: {
    color: "#fff",
    fontSize: 16
  },
  shadowBadge: {
    position: "absolute",
    top: -8,
    right: -8
  },
  shadowIcon: {
    fontSize: 16
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4
  },
  time: {
    fontSize: 11
  },
  edited: {
    fontSize: 11,
    marginLeft: 4
  }
});

export default MessageBubble;
