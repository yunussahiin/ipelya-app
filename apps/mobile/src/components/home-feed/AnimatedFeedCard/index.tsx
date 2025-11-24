/**
 * Animated Feed Card Wrapper
 *
 * Amaç: Card enter animation wrapper
 *
 * Özellikler:
 * - Fade in animation
 * - Slide up animation
 * - Staggered animation for list
 */

import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay
} from "react-native-reanimated";

interface AnimatedFeedCardProps {
  children: React.ReactNode;
  index: number;
}

export function AnimatedFeedCard({ children, index }: AnimatedFeedCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * 100; // Stagger animation

    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
