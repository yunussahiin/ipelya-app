/**
 * TierEditorSkeleton Component
 * TierEditor yüklenirken gösterilen skeleton
 */

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { ThemeColors } from "@/theme/ThemeProvider";

interface TierEditorSkeletonProps {
  colors: ThemeColors;
}

export function TierEditorSkeleton({ colors }: TierEditorSkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

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

  const SkeletonBox = ({
    width,
    height,
    style
  }: {
    width: number | string;
    height: number;
    style?: any;
  }) => (
    <Animated.View
      style={[{ width, height, backgroundColor: colors.surface, borderRadius: 8, opacity }, style]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <SkeletonBox width={120} height={20} style={{ marginBottom: 16 }} />

      {/* Template Cards */}
      <View style={styles.templateRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBox key={i} width={110} height={140} style={{ borderRadius: 16 }} />
        ))}
      </View>

      {/* Price Inputs */}
      <View style={styles.section}>
        <SkeletonBox width={100} height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="100%" height={50} style={{ borderRadius: 12 }} />
      </View>

      <View style={styles.section}>
        <SkeletonBox width={140} height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="100%" height={50} style={{ borderRadius: 12 }} />
      </View>

      {/* Benefits */}
      <View style={styles.section}>
        <SkeletonBox width={80} height={16} style={{ marginBottom: 12 }} />
        <View style={styles.benefitRow}>
          <SkeletonBox width={100} height={36} style={{ borderRadius: 20 }} />
          <SkeletonBox width={120} height={36} style={{ borderRadius: 20 }} />
          <SkeletonBox width={90} height={36} style={{ borderRadius: 20 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  templateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24
  },
  section: {
    marginBottom: 24
  },
  benefitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
