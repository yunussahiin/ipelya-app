/**
 * Like Button Component with Animation
 *
 * Amaç: Animated like button - Heart pop animation
 *
 * Özellikler:
 * - Heart icon
 * - Scale animation on press
 * - Color transition
 * - Like count
 */

import React, { useEffect } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence
} from "react-native-reanimated";

interface LikeButtonProps {
  isLiked: boolean;
  count: number;
  onPress: () => void;
}

export function LikeButton({ isLiked, count, onPress }: LikeButtonProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isLiked) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 2, stiffness: 100 }),
        withSpring(1, { damping: 2, stiffness: 100 })
      );
    }
  }, [isLiked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 100 }),
      withSpring(1, { damping: 2, stiffness: 100 })
    );
    onPress();
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Heart
          size={24}
          color={isLiked ? "#FF6B9D" : "#6B7280"}
          fill={isLiked ? "#FF6B9D" : "none"}
        />
      </Animated.View>
      {count > 0 && <Text style={styles.count}>{count}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  count: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500"
  }
});
