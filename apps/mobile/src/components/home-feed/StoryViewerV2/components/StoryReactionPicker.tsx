/**
 * StoryReactionPicker Component
 * Story'ye tepki vermek için emoji seçici
 *
 * ⚠️ SADECE BAŞKASININ STORY'SİNDE GÖSTERİLİR
 * - 6 emoji: ❤️ 🔥 😂 😮 😢 😡
 * - Haptic feedback
 * - Animasyonlu seçim
 *
 * Kendi story'mizde bu component KULLANILMAZ!
 * Kendi story'mizde sadece StoryInsightsSheet açılır.
 */

import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { StoryReactionType } from "@/hooks/stories/useReactToStory";

interface StoryReactionPickerProps {
  currentReaction?: StoryReactionType | null;
  onReact: (reactionType: StoryReactionType) => void;
  disabled?: boolean;
}

const REACTIONS: { type: StoryReactionType; emoji: string }[] = [
  { type: "heart", emoji: "❤️" },
  { type: "fire", emoji: "🔥" },
  { type: "laugh", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" }
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ReactionButton({
  reaction,
  isSelected,
  onPress,
  disabled
}: {
  reaction: { type: StoryReactionType; emoji: string };
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Bounce animation
    scale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    onPress();
  }, [disabled, onPress, scale]);

  return (
    <AnimatedPressable
      style={[styles.reactionButton, isSelected && styles.reactionButtonSelected, animatedStyle]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
    </AnimatedPressable>
  );
}

function StoryReactionPickerComponent({
  currentReaction,
  onReact,
  disabled
}: StoryReactionPickerProps) {
  return (
    <View style={styles.container}>
      {REACTIONS.map((reaction) => (
        <ReactionButton
          key={reaction.type}
          reaction={reaction}
          isSelected={currentReaction === reaction.type}
          onPress={() => onReact(reaction.type)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 32
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)"
  },
  reactionButtonSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)"
  },
  reactionEmoji: {
    fontSize: 24
  }
});

export const StoryReactionPicker = memo(StoryReactionPickerComponent);
