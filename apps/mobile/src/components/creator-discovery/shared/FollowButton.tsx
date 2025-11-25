import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => void;
  size?: "small" | "medium" | "large";
  variant?: "filled" | "outline";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FollowButton({
  isFollowing,
  onPress,
  size = "medium",
  variant = "filled"
}: FollowButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, size, variant, isFollowing),
    [colors, size, variant, isFollowing]
  );

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={styles.text}>{isFollowing ? "Takip Ediliyor" : "Takip Et"}</Text>
    </AnimatedPressable>
  );
}

const createStyles = (
  colors: ThemeColors,
  size: "small" | "medium" | "large",
  variant: "filled" | "outline",
  isFollowing: boolean
) => {
  const sizeStyles = {
    small: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
    medium: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    large: { paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 }
  };

  const currentSize = sizeStyles[size];
  const isFilled = variant === "filled" && !isFollowing;

  return StyleSheet.create({
    button: {
      paddingHorizontal: currentSize.paddingHorizontal,
      paddingVertical: currentSize.paddingVertical,
      borderRadius: 20,
      backgroundColor: isFilled ? colors.accent : "transparent",
      borderWidth: isFilled ? 0 : 1.5,
      borderColor: isFollowing ? colors.border : colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    text: {
      fontSize: currentSize.fontSize,
      fontWeight: "600",
      color: isFilled
        ? colors.buttonPrimaryText
        : isFollowing
          ? colors.textSecondary
          : colors.accent
    }
  });
};
