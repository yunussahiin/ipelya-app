/**
 * ChatBubble
 *
 * Custom bubble component for Gifted Chat
 * Modern WhatsApp/Telegram style with Context Menu
 */

import { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Bubble, type BubbleProps, type IMessage } from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";
import * as ContextMenu from "zeego/context-menu";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import type { ThemeColors } from "@/theme/ThemeProvider";

interface ChatBubbleProps {
  props: BubbleProps<IMessage>;
  colors: ThemeColors;
  currentUserId?: string;
  onReply?: (message: IMessage) => void;
  onEdit?: (message: IMessage) => void;
  onDelete?: (message: IMessage) => void;
}

function ChatBubbleComponent({
  props,
  colors,
  currentUserId,
  onReply,
  onEdit,
  onDelete
}: ChatBubbleProps) {
  const message = props.currentMessage;
  const isOwnMessage = message?.user._id === currentUserId;

  const handleCopy = async () => {
    if (message?.text) {
      await Clipboard.setStringAsync(message.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleReply = () => {
    if (message && onReply) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onReply(message);
    }
  };

  const handleEdit = () => {
    if (message && onEdit) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onEdit(message);
    }
  };

  const handleDelete = () => {
    if (message && onDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDelete(message);
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: colors.surface,
              borderRadius: 18,
              borderBottomLeftRadius: 4,
              marginRight: 60,
              marginVertical: 2,
              paddingHorizontal: 2,
              paddingVertical: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1
            },
            right: {
              backgroundColor: colors.accent,
              borderRadius: 18,
              borderBottomRightRadius: 4,
              marginLeft: 60,
              marginVertical: 2,
              paddingHorizontal: 2,
              paddingVertical: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 2
            }
          }}
          textStyle={{
            left: {
              color: colors.textPrimary,
              fontSize: 15,
              lineHeight: 20
            },
            right: {
              color: "#fff",
              fontSize: 15,
              lineHeight: 20
            }
          }}
          timeTextStyle={{
            left: {
              color: colors.textMuted,
              fontSize: 11
            },
            right: {
              color: "rgba(255,255,255,0.7)",
              fontSize: 11
            }
          }}
          tickStyle={{
            color: "rgba(255,255,255,0.7)"
          }}
          renderTicks={(message) => {
            if (message.user._id !== currentUserId) return null;
            return (
              <View style={styles.tickContainer}>
                {message.pending ? (
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />
                ) : message.received ? (
                  <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.8)" />
                ) : message.sent ? (
                  <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />
                ) : null}
              </View>
            );
          }}
        />
      </ContextMenu.Trigger>

      <ContextMenu.Content>
        {/* Yanıtla */}
        <ContextMenu.Item key="reply" onSelect={handleReply}>
          <ContextMenu.ItemTitle>Yanıtla</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon ios={{ name: "arrowshape.turn.up.left" }} />
        </ContextMenu.Item>

        {/* Kopyala */}
        <ContextMenu.Item key="copy" onSelect={handleCopy}>
          <ContextMenu.ItemTitle>Kopyala</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon ios={{ name: "doc.on.doc" }} />
        </ContextMenu.Item>

        {/* Düzenle - sadece kendi mesajları */}
        {isOwnMessage && (
          <ContextMenu.Item key="edit" onSelect={handleEdit}>
            <ContextMenu.ItemTitle>Düzenle</ContextMenu.ItemTitle>
            <ContextMenu.ItemIcon ios={{ name: "pencil" }} />
          </ContextMenu.Item>
        )}

        {/* Sil - sadece kendi mesajları */}
        {isOwnMessage && (
          <ContextMenu.Item key="delete" onSelect={handleDelete} destructive>
            <ContextMenu.ItemTitle>Sil</ContextMenu.ItemTitle>
            <ContextMenu.ItemIcon ios={{ name: "trash" }} />
          </ContextMenu.Item>
        )}
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}

const styles = StyleSheet.create({
  tickContainer: {
    marginLeft: 4,
    marginBottom: 2
  }
});

export const ChatBubble = memo(ChatBubbleComponent);
