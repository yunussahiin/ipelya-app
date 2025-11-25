/**
 * ProfileAvatar Component
 * Large avatar with gradient ring and online indicator
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const AVATAR_SIZE = 100;
const RING_WIDTH = 3;

interface ProfileAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  isOnline?: boolean;
  isCreator?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProfileAvatar({
  avatarUrl,
  displayName,
  isOnline = false,
  isCreator = false,
  onPress
}: ProfileAvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  // Ring colors based on creator status
  const ringColors: [string, string, ...string[]] = isCreator
    ? [colors.accent, colors.highlight, colors.accentSoft]
    : [colors.accent, colors.accentSoft];

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!onPress}
    >
      {/* Gradient Ring */}
      <LinearGradient
        colors={ringColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ring}
      >
        {/* Inner white border */}
        <View style={styles.innerBorder}>
          {/* Avatar Image */}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
              <Animated.Text style={styles.placeholderText}>
                {displayName?.charAt(0).toUpperCase() || "?"}
              </Animated.Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Online Indicator */}
      {isOnline && (
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
        </View>
      )}
    </AnimatedPressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: AVATAR_SIZE + RING_WIDTH * 2 + 4,
      height: AVATAR_SIZE + RING_WIDTH * 2 + 4,
      alignItems: "center",
      justifyContent: "center"
    },
    ring: {
      width: AVATAR_SIZE + RING_WIDTH * 2 + 4,
      height: AVATAR_SIZE + RING_WIDTH * 2 + 4,
      borderRadius: (AVATAR_SIZE + RING_WIDTH * 2 + 4) / 2,
      alignItems: "center",
      justifyContent: "center",
      padding: RING_WIDTH
    },
    innerBorder: {
      width: AVATAR_SIZE + 4,
      height: AVATAR_SIZE + 4,
      borderRadius: (AVATAR_SIZE + 4) / 2,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: 2
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2
    },
    placeholder: {
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    placeholderText: {
      fontSize: 40,
      fontWeight: "700",
      color: colors.background
    },
    onlineIndicator: {
      position: "absolute",
      bottom: 6,
      right: 6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center"
    },
    onlineDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.success
    }
  });

export const PROFILE_AVATAR_SIZE = AVATAR_SIZE + RING_WIDTH * 2 + 4;
