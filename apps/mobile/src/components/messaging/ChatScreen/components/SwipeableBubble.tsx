/**
 * SwipeableBubble
 *
 * Swipe gesture wrapper for chat bubbles
 * - Swipe right: Reply (alıntılama)
 * - Swipe left: Message info (mesaj bilgisi)
 */

import { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { ThemeColors } from "@/theme/ThemeProvider";

// Swipe thresholds
const REPLY_THRESHOLD = 60;
const INFO_THRESHOLD = 60;
const MAX_SWIPE = 90;

interface SwipeableBubbleProps {
  children: React.ReactNode;
  colors: ThemeColors;
  isOwnMessage: boolean;
  onSwipeReply: () => void;
  onSwipeInfo: () => void;
  onLongPress: () => void;
}

function SwipeableBubbleComponent({
  children,
  colors,
  isOwnMessage,
  onSwipeReply,
  onSwipeInfo,
  onLongPress
}: SwipeableBubbleProps) {
  const translateX = useSharedValue(0);

  const triggerReply = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeReply();
  }, [onSwipeReply]);

  const triggerInfo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeInfo();
  }, [onSwipeInfo]);

  const triggerLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress();
  }, [onLongPress]);

  // Pan gesture for swipe
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Sağa swipe (reply) - pozitif değer
      // Sola swipe (info) - negatif değer (sadece kendi mesajlarında)
      if (event.translationX > 0) {
        // Sağa swipe - reply
        translateX.value = Math.min(event.translationX, MAX_SWIPE);
      } else if (isOwnMessage && event.translationX < 0) {
        // Sola swipe - info (sadece kendi mesajları)
        translateX.value = Math.max(event.translationX, -MAX_SWIPE);
      }
    })
    .onEnd((event) => {
      if (event.translationX >= REPLY_THRESHOLD) {
        // Reply triggered
        runOnJS(triggerReply)();
      } else if (isOwnMessage && event.translationX <= -INFO_THRESHOLD) {
        // Info triggered
        runOnJS(triggerInfo)();
      }

      // Spring back
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200
      });
    });

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(triggerLongPress)();
    });

  // Combine gestures - pan has priority
  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  // Animated style for bubble
  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  // Reply icon opacity (sağda görünür)
  const replyIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, REPLY_THRESHOLD / 2, REPLY_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(translateX.value, [0, REPLY_THRESHOLD], [0.5, 1], Extrapolation.CLAMP)
      }
    ]
  }));

  // Info icon opacity (solda görünür - sadece kendi mesajları)
  const infoIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -INFO_THRESHOLD / 2, -INFO_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(translateX.value, [0, -INFO_THRESHOLD], [0.5, 1], Extrapolation.CLAMP)
      }
    ]
  }));

  return (
    <View style={styles.container}>
      {/* Reply icon (sol tarafta, sağa swipe'da görünür) */}
      <Animated.View style={[styles.iconContainer, styles.leftIcon, replyIconStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-undo" size={18} color={colors.textMuted} />
        </View>
      </Animated.View>

      {/* Info icon (sağ tarafta, sola swipe'da görünür) */}
      {isOwnMessage && (
        <Animated.View style={[styles.iconContainer, styles.rightIcon, infoIconStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="information" size={18} color={colors.textMuted} />
          </View>
        </Animated.View>
      )}

      {/* Swipeable bubble */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedBubbleStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative"
  },
  iconContainer: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    zIndex: -1
  },
  leftIcon: {
    left: -35
  },
  rightIcon: {
    right: -35
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  }
});

export const SwipeableBubble = memo(SwipeableBubbleComponent);
