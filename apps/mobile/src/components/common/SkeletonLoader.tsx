/**
 * Skeleton Loader Component
 * Shows animated skeleton placeholders while loading
 */

import { useMemo, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export interface SkeletonLoaderProps {
  count?: number;
  height?: number;
  borderRadius?: number;
}

export function SkeletonLoader({ count = 3, height = 60, borderRadius = 12 }: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeleton,
            {
              height,
              borderRadius,
              opacity
            }
          ]}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 12,
      paddingHorizontal: 16
    },
    skeleton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    }
  });
