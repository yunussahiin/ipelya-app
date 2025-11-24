/**
 * Swipeable Feed Card
 *
 * Amaç: Swipe to like/delete functionality
 *
 * Özellikler:
 * - Swipe right to like
 * - Swipe left to delete
 * - Visual feedback
 * - Haptic feedback
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from "react-native-reanimated";
import { Heart, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface SwipeableFeedCardProps {
  children: React.ReactNode;
  onLike?: () => void;
  onDelete?: () => void;
}

export function SwipeableFeedCard({ children, onLike, onDelete }: SwipeableFeedCardProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = 100;

      if (event.translationX > threshold && onLike) {
        // Swipe right - Like
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onLike)();
        translateX.value = withSpring(0);
      } else if (event.translationX < -threshold && onDelete) {
        // Swipe left - Delete
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
        opacity.value = withSpring(0);
        runOnJS(onDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value
  }));

  const likeIconStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 50 ? (translateX.value - 50) / 50 : 0
  }));

  const deleteIconStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -50 ? (-translateX.value - 50) / 50 : 0
  }));

  return (
    <View style={styles.container}>
      {/* Like icon (right) */}
      <Animated.View style={[styles.likeIcon, likeIconStyle]}>
        <Heart size={32} color="#FF6B9D" fill="#FF6B9D" />
      </Animated.View>

      {/* Delete icon (left) */}
      <Animated.View style={[styles.deleteIcon, deleteIconStyle]}>
        <Trash2 size={32} color="#EF4444" />
      </Animated.View>

      {/* Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative"
  },
  likeIcon: {
    position: "absolute",
    left: 32,
    top: "50%",
    marginTop: -16,
    zIndex: -1
  },
  deleteIcon: {
    position: "absolute",
    right: 32,
    top: "50%",
    marginTop: -16,
    zIndex: -1
  }
});
