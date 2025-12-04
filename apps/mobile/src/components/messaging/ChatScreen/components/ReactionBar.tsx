/**
 * ReactionBar
 *
 * Mesaj altında gösterilen tepki çubuğu
 * - Mevcut tepkileri gösterir
 * - Tıklayınca detay sheet açar (kimin hangi reaksiyonu verdiğini gösterir)
 */

import { memo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import type { ThemeColors } from "@/theme/ThemeProvider";

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ReactionBarProps {
  reactions: Reaction[];
  colors: ThemeColors;
  isOwnMessage?: boolean;
  onShowDetails: () => void;
}

function ReactionBarComponent({
  reactions,
  colors,
  isOwnMessage = false,
  onShowDetails
}: ReactionBarProps) {
  const handleReactionPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowDetails();
  }, [onShowDetails]);

  const hasReactions = reactions.length > 0;

  // Reaksiyon yoksa hiçbir şey gösterme
  if (!hasReactions) return null;

  return (
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
          onPress={handleReactionPress}
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
    </View>
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
  }
});

export const ReactionBar = memo(ReactionBarComponent);
