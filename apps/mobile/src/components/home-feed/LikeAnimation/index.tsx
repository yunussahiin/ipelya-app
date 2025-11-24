/**
 * Like Animation Component
 *
 * Amaç: Double-tap like animation - Instagram-style heart animation
 *
 * Özellikler:
 * - Heart scale animation
 * - Fade in/out
 * - Auto-hide after animation
 */

import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS
} from "react-native-reanimated";
import { Heart } from "lucide-react-native";

interface LikeAnimationProps {
  visible: boolean;
  onAnimationEnd?: () => void;
}

export function LikeAnimation({ visible, onAnimationEnd }: LikeAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Scale and fade in
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 8, stiffness: 100 }),
        withTiming(0.8, { duration: 200 })
      );

      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 200 }, (finished) => {
          if (finished && onAnimationEnd) {
            runOnJS(onAnimationEnd)();
          }
        })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Heart size={80} color="#FF6B9D" fill="#FF6B9D" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -40,
    zIndex: 999,
    pointerEvents: "none"
  }
});
