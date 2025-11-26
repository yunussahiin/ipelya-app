/**
 * BroadcastComposer
 *
 * Amaç: Creator mesaj gönderme alanı
 * Tarih: 2025-11-26
 */

import { useState, useCallback } from "react";
import { View, TextInput, StyleSheet, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useSendBroadcastMessage } from "@/hooks/messaging";
import { Ionicons } from "@expo/vector-icons";

// =============================================
// TYPES
// =============================================

interface BroadcastComposerProps {
  channelId: string;
}

// =============================================
// COMPONENT
// =============================================

export function BroadcastComposer({ channelId }: BroadcastComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [showPollCreator, setShowPollCreator] = useState(false);

  const { mutate: sendMessage, isPending } = useSendBroadcastMessage();

  // Mesaj gönder
  const handleSend = useCallback(() => {
    if (!text.trim() || isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    sendMessage({
      channel_id: channelId,
      content: text.trim(),
      content_type: "text"
    });

    setText("");
  }, [text, channelId, sendMessage, isPending]);

  // Anket oluştur
  const handleCreatePoll = useCallback(() => {
    setShowPollCreator(true);
    // TODO: Poll creator modal
  }, []);

  const hasText = text.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inputRow}>
        {/* Media button */}
        <Pressable style={styles.actionButton}>
          <Ionicons name="image-outline" size={24} color={colors.accent} />
        </Pressable>

        {/* Poll button */}
        <Pressable style={styles.actionButton} onPress={handleCreatePoll}>
          <Ionicons name="stats-chart-outline" size={22} color={colors.accent} />
        </Pressable>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Duyuru yaz..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
        </View>

        {/* Send button */}
        <Pressable
          style={[styles.sendButton, { backgroundColor: hasText ? colors.accent : colors.surface }]}
          onPress={hasText ? handleSend : undefined}
          disabled={!hasText || isPending}
        >
          <Ionicons name="send" size={20} color={hasText ? "#fff" : colors.textMuted} />
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
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  actionButton: {
    padding: 8
  },
  inputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    minHeight: 44,
    maxHeight: 120
  },
  input: {
    fontSize: 16,
    maxHeight: 100
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default BroadcastComposer;
