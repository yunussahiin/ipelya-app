/**
 * MessageReactions
 *
 * Amaç: Mesaj tepkileri gösterimi
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useAddReaction, useRemoveReaction } from "@/hooks/messaging";
import { useAuth } from "@/hooks/useAuth";
import type { MessageReaction } from "@ipelya/types";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  messageId: string;
  conversationId: string;
  isMine: boolean;
}

export const MessageReactions = memo(function MessageReactions({
  reactions,
  messageId,
  conversationId,
  isMine
}: MessageReactionsProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { mutate: addReaction } = useAddReaction();
  const { mutate: removeReaction } = useRemoveReaction();

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

  const handleReactionPress = (emoji: string, hasMyReaction: boolean) => {
    if (hasMyReaction) {
      removeReaction({ messageId, emoji, conversationId });
    } else {
      addReaction({ messageId, emoji, conversationId });
    }
  };

  return (
    <View style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}>
      {Object.values(groupedReactions).map((reaction) => (
        <Pressable
          key={reaction.emoji}
          style={[
            styles.reaction,
            { backgroundColor: colors.surface },
            reaction.hasMyReaction && [styles.reactionActive, { borderColor: colors.accent }]
          ]}
          onPress={() => handleReactionPress(reaction.emoji, reaction.hasMyReaction)}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          {reaction.count > 1 && (
            <Text style={[styles.count, { color: colors.textSecondary }]}>{reaction.count}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 4
  },
  containerLeft: {
    justifyContent: "flex-start"
  },
  containerRight: {
    justifyContent: "flex-end"
  },
  reaction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent"
  },
  reactionActive: {
    borderWidth: 1
  },
  emoji: {
    fontSize: 14
  },
  count: {
    fontSize: 12,
    marginLeft: 4
  }
});
