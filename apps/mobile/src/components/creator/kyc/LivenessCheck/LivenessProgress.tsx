/**
 * LivenessProgress Component
 * 4 adımlı ilerleme göstergesi
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, withSpring, interpolateColor } from "react-native-reanimated";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

interface LivenessProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function LivenessProgress({ currentStep, totalSteps }: LivenessProgressProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <ProgressSegment
          key={index}
          isCompleted={index < currentStep}
          isActive={index === currentStep}
          colors={colors}
        />
      ))}
    </View>
  );
}

interface ProgressSegmentProps {
  isCompleted: boolean;
  isActive: boolean;
  colors: ThemeColors;
}

function ProgressSegment({ isCompleted, isActive, colors }: ProgressSegmentProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = isCompleted
      ? "#10B981" // Yeşil
      : isActive
        ? "#3B82F6" // Mavi
        : colors.border;

    return {
      backgroundColor,
      transform: [{ scaleX: withSpring(isActive ? 1.05 : 1) }]
    };
  }, [isCompleted, isActive]);

  return <Animated.View style={[styles.segment, animatedStyle]} />;
}

const styles = StyleSheet.create({
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2
  }
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 4
    }
  });
}
