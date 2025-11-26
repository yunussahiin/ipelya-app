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
import { View, TextInput, StyleSheet, Pressable, Keyboard } from "react-native";
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
    if (!text.trim() || isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    sendMessage({
      conversation_id: conversationId,
      content: text.trim(),
      content_type: "text",
      reply_to_id: replyTo?.id
    });

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
        {/* Left actions */}
        {!hasText && (
          <View style={styles.leftActions}>
            <Pressable style={styles.actionButton} onPress={handleCameraPress}>
              <Ionicons name="camera" size={24} color={colors.accent} />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleMediaPress}>
              <Ionicons name="image" size={24} color={colors.accent} />
            </Pressable>
          </View>
        )}

        {/* Input */}
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

          {/* Emoji button */}
          <Pressable style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Send button */}
        <Pressable
          style={[styles.sendButton, { backgroundColor: hasText ? colors.accent : colors.surface }]}
          onPress={hasText ? handleSend : undefined}
          disabled={!hasText || isPending}
        >
          <Ionicons
            name={hasText ? "send" : "mic"}
            size={20}
            color={hasText ? "#fff" : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
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
    alignItems: "flex-end"
  },
  leftActions: {
    flexDirection: "row",
    marginRight: 4
  },
  actionButton: {
    padding: 8
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8
  }
});

// Missing Text import
import { Text } from "react-native";

export default MessageInput;
