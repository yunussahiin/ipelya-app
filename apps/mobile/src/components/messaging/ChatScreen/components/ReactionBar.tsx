/**
 * ReactionBar
 *
 * Mesaj altında gösterilen tepki çubuğu
 * - Mevcut tepkileri gösterir
 * - Tıklayınca tepki ekler/kaldırır
 * - Uzun basınca emoji picker açar
 */

import { memo, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { ThemeColors } from "@/theme/ThemeProvider";

// WhatsApp tarzı default emojiler
const DEFAULT_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ReactionBarProps {
  reactions: Reaction[];
  colors: ThemeColors;
  isOwnMessage?: boolean;
  onReact: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}

function ReactionBarComponent({
  reactions,
  colors,
  isOwnMessage = false,
  onReact,
  onRemoveReaction
}: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReactionPress = useCallback(
    (reaction: Reaction) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (reaction.hasReacted) {
        onRemoveReaction(reaction.emoji);
      } else {
        onReact(reaction.emoji);
      }
    },
    [onReact, onRemoveReaction]
  );

  const handleAddReaction = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPicker(true);
  }, []);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPicker(false);
      onReact(emoji);
    },
    [onReact]
  );

  const hasReactions = reactions.length > 0;

  return (
    <>
      <View style={[styles.container, isOwnMessage && styles.containerRight]}>
        {/* Mevcut tepkiler */}
        {reactions.map((reaction) => (
          <TouchableOpacity
            key={reaction.emoji}
            style={[
              styles.reactionBubble,
              {
                backgroundColor: reaction.hasReacted ? colors.accent + "30" : colors.surface,
                borderColor: reaction.hasReacted ? colors.accent : colors.border
              }
            ]}
            onPress={() => handleReactionPress(reaction)}
          >
            <Text style={styles.emoji}>{reaction.emoji}</Text>
            <Text
              style={[
                styles.count,
                { color: reaction.hasReacted ? colors.accent : colors.textSecondary }
              ]}
            >
              {reaction.count}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Tepki ekle butonu */}
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
          onPress={handleAddReaction}
        >
          <Text style={styles.addEmoji}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.pickerRow}>
              {DEFAULT_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.pickerEmoji}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.pickerEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
    marginHorizontal: 8,
    gap: 4
  },
  containerRight: {
    justifyContent: "flex-end"
  },
  reactionBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1
  },
  emoji: {
    fontSize: 14
  },
  count: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500"
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1
  },
  addEmoji: {
    fontSize: 16,
    color: "#888"
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  pickerContainer: {
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8
  },
  pickerEmoji: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  pickerEmojiText: {
    fontSize: 28
  }
});

export const ReactionBar = memo(ReactionBarComponent);
