/**
 * ProfileCover Component
 * Cover image with parallax effect on scroll
 */

import { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue
} from "react-native-reanimated";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COVER_HEIGHT = 200;

interface ProfileCoverProps {
  coverUrl?: string | null;
  scrollY?: SharedValue<number>;
}

export function ProfileCover({ coverUrl, scrollY }: ProfileCoverProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const scale = interpolate(scrollY.value, [-100, 0], [1.5, 1], Extrapolation.CLAMP);

    const translateY = interpolate(scrollY.value, [0, 100], [0, -30], Extrapolation.CLAMP);

    return {
      transform: [{ scale }, { translateY }]
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} contentFit="cover" />
        ) : (
          <View style={[styles.coverImage, styles.placeholder]} />
        )}
      </Animated.View>

      {/* Gradient overlay for text readability */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
        style={styles.gradient}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: SCREEN_WIDTH,
      height: COVER_HEIGHT,
      overflow: "hidden"
    },
    imageContainer: {
      width: SCREEN_WIDTH,
      height: COVER_HEIGHT
    },
    coverImage: {
      width: "100%",
      height: "100%"
    },
    placeholder: {
      backgroundColor: colors.surface
    },
    gradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: COVER_HEIGHT / 2
    }
  });

export const PROFILE_COVER_HEIGHT = COVER_HEIGHT;
