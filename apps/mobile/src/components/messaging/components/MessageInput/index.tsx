/**
 * MessageInput
 *
 * Amaç: Mesaj gönderme input alanı
 * Tarih: 2025-11-26
 *
 * Text input, media picker, voice recorder ve send button.
 * Typing indicator desteği.
 */

import { useState, useCallback, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Keyboard } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useSendMessage } from "@/hooks/messaging";
import { Ionicons } from "@expo/vector-icons";

// =============================================
// TYPES
// =============================================

interface MessageInputProps {
  conversationId: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  replyTo?: { id: string; content: string; senderName: string } | null;
  onCancelReply?: () => void;
}

// =============================================
// COMPONENT
// =============================================

export function MessageInput({
  conversationId,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply
}: MessageInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate: sendMessage, isPending } = useSendMessage();

  // Text değişikliği
  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);

      // Typing indicator
      if (value.length > 0) {
        onTypingStart?.();

        // Debounce stop
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          onTypingStop?.();
        }, 2000);
      } else {
        onTypingStop?.();
      }
    },
    [onTypingStart, onTypingStop]
  );

  // Mesaj gönder
  const handleSend = useCallback(() => {
    console.log("[MessageInput] handleSend called, text:", text.trim(), "isPending:", isPending);
    if (!text.trim() || isPending) {
      console.log("[MessageInput] Skipping send - empty text or pending");
      return;
    }

    console.log("[MessageInput] Sending message to:", conversationId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    sendMessage(
      {
        conversation_id: conversationId,
        content: text.trim(),
        content_type: "text",
        reply_to_id: replyTo?.id
      },
      {
        onSuccess: (data) => {
          console.log("[MessageInput] Message sent successfully:", data?.id);
        },
        onError: (error) => {
          console.error("[MessageInput] Message send error:", error);
        }
      }
    );

    setText("");
    onTypingStop?.();
    onCancelReply?.();
    Keyboard.dismiss();
  }, [text, conversationId, replyTo, sendMessage, isPending, onTypingStop, onCancelReply]);

  // Media picker
  const handleMediaPress = useCallback(() => {
    // TODO: Open media picker
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Camera
  const handleCameraPress = useCallback(() => {
    // TODO: Open camera
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const hasText = text.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Reply preview */}
      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: colors.surface }]}>
          <View style={[styles.replyBar, { backgroundColor: colors.accent }]} />
          <View style={styles.replyContent}>
            <Pressable style={styles.replyText}>
              <Ionicons name="arrow-undo" size={14} color={colors.accent} />
              <View style={styles.replyTextContent}>
                <Text style={[styles.replyName, { color: colors.accent }]}>
                  {replyTo.senderName}
                </Text>
                <Text
                  style={[styles.replyMessage, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {replyTo.content}
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={onCancelReply} style={styles.replyClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.inputRow}>
        {/* Plus button (media/attachment) */}
        <Pressable
          style={[styles.plusButton, { backgroundColor: colors.surface }]}
          onPress={handleMediaPress}
        >
          <Ionicons name="add" size={24} color={colors.textSecondary} />
        </Pressable>

        {/* Input container */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Mesaj yaz..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={4000}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setIsExpanded(false)}
          />
        </View>

        {/* Right actions */}
        <View style={styles.rightActions}>
          {/* Sticker/Emoji button */}
          <Pressable style={styles.actionButton}>
            <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Send or Camera/Mic */}
          {hasText ? (
            <Pressable
              style={[styles.sendButton, { backgroundColor: colors.accent }]}
              onPress={handleSend}
              disabled={isPending}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.actionButton} onPress={handleCameraPress}>
                <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
              </Pressable>
              <Pressable style={styles.actionButton}>
                <Ionicons name="mic-outline" size={24} color={colors.textSecondary} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.1)"
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden"
  },
  replyBar: {
    width: 3,
    height: "100%"
  },
  replyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  replyText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
  },
  replyTextContent: {
    marginLeft: 8,
    flex: 1
  },
  replyName: {
    fontSize: 12,
    fontWeight: "600"
  },
  replyMessage: {
    fontSize: 13,
    marginTop: 2
  },
  replyClose: {
    padding: 4
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8
  },
  actionButton: {
    padding: 6
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4
  }
});

export default MessageInput;
