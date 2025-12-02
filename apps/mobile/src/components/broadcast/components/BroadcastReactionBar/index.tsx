/**
 * BroadcastReactionBar
 *
 * Amaç: Instagram tarzı tepki çubuğu
 * - Emojiler solda (sayılarıyla)
 * - [+] butonu sağda
 * - Maksimum 4 emoji göster, fazlası "+X" olarak
 *
 * Tarih: 2025-12-02 (V2)
 */

import { memo, useCallback, useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useAddBroadcastReaction, useRemoveBroadcastReaction } from "@/hooks/messaging";
import { useAuth } from "@/hooks/useAuth";
import { EmojiPickerSheet } from "../EmojiPickerSheet";
import type { BroadcastReaction } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface BroadcastReactionBarProps {
  messageId: string;
  channelId: string;
  allowedReactions?: string[];
  reactions: BroadcastReaction[];
}

// =============================================
// COMPONENT
// =============================================

export const BroadcastReactionBar = memo(function BroadcastReactionBar({
  messageId,
  channelId,
  allowedReactions,
  reactions
}: BroadcastReactionBarProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { mutate: addReaction } = useAddBroadcastReaction();
  const { mutate: removeReaction } = useRemoveBroadcastReaction();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Emoji'lere göre grupla ve sırala (en çok tepki alan önce)
  const groupedReactions = useMemo(() => {
    const groups: Record<string, { emoji: string; count: number; hasMyReaction: boolean }> = {};

    reactions.forEach((reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          hasMyReaction: false
        };
      }
      groups[reaction.emoji].count++;
      if (reaction.user_id === user?.id) {
        groups[reaction.emoji].hasMyReaction = true;
      }
    });

    // Sayıya göre sırala
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [reactions, user?.id]);

  // Görünür tepkiler (maksimum 4)
  const visibleReactions = groupedReactions.slice(0, 4);
  const remainingCount = groupedReactions.length - 4;

  // Tepki ekle/kaldır
  const handleReaction = useCallback(
    (emoji: string) => {
      const existing = groupedReactions.find((r) => r.emoji === emoji);
      const action = existing?.hasMyReaction ? "remove" : "add";

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (action === "add") {
        addReaction({ messageId, emoji, channelId });
      } else {
        removeReaction({ messageId, emoji, channelId });
      }
    },
    [messageId, channelId, groupedReactions, addReaction, removeReaction]
  );

  // Emoji picker'dan seçim
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      addReaction({ messageId, emoji, channelId });
    },
    [messageId, channelId, addReaction]
  );

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Tepkiler - solda */}
      <View style={styles.reactionsRow}>
        {visibleReactions.map((reaction) => (
          <Pressable
            key={reaction.emoji}
            style={[styles.reactionPill, reaction.hasMyReaction && styles.reactionPillActive]}
            onPress={() => handleReaction(reaction.emoji)}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
            <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>
              {reaction.count}
            </Text>
          </Pressable>
        ))}

        {/* Fazla tepki varsa +X göster */}
        {remainingCount > 0 && (
          <Pressable style={styles.morePill} onPress={() => setShowEmojiPicker(true)}>
            <Text style={[styles.moreText, { color: colors.textMuted }]}>+{remainingCount}</Text>
          </Pressable>
        )}
      </View>

      {/* [+] Butonu - sağda */}
      <Pressable
        style={[styles.addButton, { borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowEmojiPicker(true);
        }}
      >
        <Plus size={16} color={colors.textMuted} strokeWidth={2} />
      </Pressable>

      {/* Emoji Picker Sheet */}
      <EmojiPickerSheet
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
        allowedEmojis={allowedReactions}
      />
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8
    },
    reactionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1
    },
    reactionPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundRaised,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4
    },
    reactionPillActive: {
      backgroundColor: colors.accent + "20",
      borderWidth: 1,
      borderColor: colors.accent
    },
    reactionEmoji: {
      fontSize: 16
    },
    reactionCount: {
      fontSize: 13,
      fontWeight: "500"
    },
    morePill: {
      paddingHorizontal: 8,
      paddingVertical: 6
    },
    moreText: {
      fontSize: 13,
      fontWeight: "500"
    },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center"
    }
  });

export default BroadcastReactionBar;
