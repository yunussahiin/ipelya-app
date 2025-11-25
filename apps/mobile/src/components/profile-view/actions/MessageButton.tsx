/**
 * MessageButton Component
 * DM button for profile
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { MessageCircle } from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

interface MessageButtonProps {
  onPress: () => void;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MessageButton({ onPress, size = "medium", showLabel = true }: MessageButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const iconSize = size === "small" ? 16 : size === "medium" ? 18 : 20;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <MessageCircle size={iconSize} color={colors.textPrimary} />
      {showLabel && <Text style={styles.text}>Mesaj</Text>}
    </AnimatedPressable>
  );
}

const createStyles = (colors: ThemeColors, size: "small" | "medium" | "large") => {
  const padding = size === "small" ? 8 : size === "medium" ? 12 : 14;
  const fontSize = size === "small" ? 12 : size === "medium" ? 14 : 16;

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: padding,
      paddingHorizontal: padding + 8,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    text: {
      fontSize,
      fontWeight: "600",
      color: colors.textPrimary
    }
  });
};
