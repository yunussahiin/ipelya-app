/**
 * BroadcastReactionBar
 *
 * Amaç: Yayın mesajı tepki çubuğu
 * Tarih: 2025-11-26
 */

import { memo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useAddBroadcastReaction, useRemoveBroadcastReaction } from "@/hooks/messaging";
import { useAuth } from "@/hooks/useAuth";
import type { BroadcastReaction } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface BroadcastReactionBarProps {
  messageId: string;
  channelId: string;
  allowedReactions: string[];
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

  // Emoji'lere göre grupla
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          hasMyReaction: false
        };
      }
      acc[reaction.emoji].count++;
      if (reaction.user_id === user?.id) {
        acc[reaction.emoji].hasMyReaction = true;
      }
      return acc;
    },
    {} as Record<string, { emoji: string; count: number; hasMyReaction: boolean }>
  );

  // Tepki ekle/kaldır
  const handleReaction = useCallback(
    (emoji: string) => {
      const existing = groupedReactions[emoji];
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

  return (
    <View style={styles.container}>
      {allowedReactions.map((emoji) => {
        const reaction = groupedReactions[emoji];
        const isActive = reaction?.hasMyReaction;

        return (
          <Pressable
            key={emoji}
            style={[
              styles.reactionButton,
              { backgroundColor: colors.backgroundRaised },
              isActive && [styles.reactionActive, { borderColor: colors.accent }]
            ]}
            onPress={() => handleReaction(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            {reaction && reaction.count > 0 && (
              <Text style={[styles.count, { color: colors.textSecondary }]}>{reaction.count}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent"
  },
  reactionActive: {
    borderWidth: 1
  },
  emoji: {
    fontSize: 18
  },
  count: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "500"
  }
});

export default BroadcastReactionBar;
