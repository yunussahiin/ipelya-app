/**
 * Skeleton Component
 * Tarih: 2025-12-06
 *
 * Loading state için animated placeholder
 * ActivityIndicator yerine kullanılacak
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface,
          opacity
        },
        style
      ]}
    />
  );
}

// ============================================
// SKELETON VARIANTS
// ============================================

/** Avatar skeleton - Yuvarlak */
export function AvatarSkeleton({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

/** Text line skeleton */
export function TextSkeleton({
  width = "100%",
  height = 16
}: {
  width?: number | `${number}%`;
  height?: number;
}) {
  return <Skeleton width={width} height={height} borderRadius={4} />;
}

/** Card skeleton - Feed post için */
export function CardSkeleton() {
  const { colors } = useTheme();
  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Animated.View style={styles.cardHeader}>
        <AvatarSkeleton size={40} />
        <Animated.View style={styles.cardHeaderText}>
          <TextSkeleton width={120} height={14} />
          <TextSkeleton width={80} height={12} />
        </Animated.View>
      </Animated.View>
      <Skeleton width="100%" height={200} borderRadius={12} />
      <Animated.View style={styles.cardFooter}>
        <TextSkeleton width="80%" height={14} />
        <TextSkeleton width="60%" height={12} />
      </Animated.View>
    </Animated.View>
  );
}

/** List item skeleton - Chat, notification için */
export function ListItemSkeleton() {
  return (
    <Animated.View style={styles.listItem}>
      <AvatarSkeleton size={50} />
      <Animated.View style={styles.listItemContent}>
        <TextSkeleton width="70%" height={16} />
        <TextSkeleton width="40%" height={12} />
      </Animated.View>
    </Animated.View>
  );
}

/** Button skeleton */
export function ButtonSkeleton({ width = 120 }: { width?: number }) {
  return <Skeleton width={width} height={48} borderRadius={12} />;
}

/** Full screen loading skeleton */
export function ScreenSkeleton() {
  return (
    <Animated.View style={styles.screen}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden"
  },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  cardHeaderText: {
    gap: 6,
    flex: 1
  },
  cardFooter: {
    gap: 8
  },
  listItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 12
  },
  listItemContent: {
    flex: 1,
    gap: 6
  },
  screen: {
    flex: 1,
    padding: 16,
    gap: 16
  }
});
