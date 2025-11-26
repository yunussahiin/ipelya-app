/**
 * ChatBubble
 *
 * Custom bubble component for Gifted Chat
 * Modern WhatsApp/Telegram style
 */

import { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Bubble, type BubbleProps, type IMessage } from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from "@/theme/ThemeProvider";

interface ChatBubbleProps {
  props: BubbleProps<IMessage>;
  colors: ThemeColors;
  currentUserId?: string;
}

function ChatBubbleComponent({ props, colors, currentUserId }: ChatBubbleProps) {
  return (
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
  );
}

const styles = StyleSheet.create({
  tickContainer: {
    marginLeft: 4,
    marginBottom: 2
  }
});

export const ChatBubble = memo(ChatBubbleComponent);
