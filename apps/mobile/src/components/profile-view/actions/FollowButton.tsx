/**
 * FollowButton Component
 * Animated follow/unfollow button
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, ActivityIndicator } from "react-native";
import { UserPlus, UserCheck } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

interface FollowButtonProps {
  isFollowing: boolean;
  isLoading?: boolean;
  onPress: () => void;
  size?: "small" | "medium" | "large";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FollowButton({
  isFollowing,
  isLoading = false,
  onPress,
  size = "medium"
}: FollowButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, size, isFollowing),
    [colors, size, isFollowing]
  );
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    // Bounce animation
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    Haptics.impactAsync(
      isFollowing ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const iconSize = size === "small" ? 14 : size === "medium" ? 16 : 18;
  const Icon = isFollowing ? UserCheck : UserPlus;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isFollowing ? colors.textPrimary : "#FFFFFF"} />
      ) : (
        <>
          <Icon size={iconSize} color={isFollowing ? colors.textPrimary : "#FFFFFF"} />
          <Text style={styles.text}>{isFollowing ? "Takip Ediliyor" : "Takip Et"}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const createStyles = (
  colors: ThemeColors,
  size: "small" | "medium" | "large",
  isFollowing: boolean
) => {
  const padding = size === "small" ? 8 : size === "medium" ? 12 : 14;
  const fontSize = size === "small" ? 12 : size === "medium" ? 14 : 16;
  const minWidth = size === "small" ? 100 : size === "medium" ? 130 : 150;

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: padding,
      paddingHorizontal: padding + 8,
      borderRadius: 22,
      minWidth,
      backgroundColor: isFollowing ? "transparent" : colors.accent,
      borderWidth: isFollowing ? 1 : 0,
      borderColor: colors.border
    },
    text: {
      fontSize,
      fontWeight: "600",
      color: isFollowing ? colors.textPrimary : "#FFFFFF"
    }
  });
};
