/**
 * ChatListSkeleton
 *
 * Amaç: Sohbet listesi loading state
 * Tarih: 2025-11-26
 *
 * Animated skeleton ile loading gösterimi.
 * ActivityIndicator YASAK - Skeleton kullanıyoruz.
 */

import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

// =============================================
// TYPES
// =============================================

interface ChatListSkeletonProps {
  /** Gösterilecek skeleton sayısı */
  count?: number;
}

// =============================================
// COMPONENT
// =============================================

export function ChatListSkeleton({ count = 8 }: ChatListSkeletonProps) {
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
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          {/* Avatar skeleton */}
          <Animated.View style={[styles.avatar, { backgroundColor: colors.surface, opacity }]} />

          {/* Content skeleton */}
          <View style={styles.content}>
            <Animated.View
              style={[styles.nameLine, { backgroundColor: colors.surface, opacity }]}
            />
            <Animated.View
              style={[styles.previewLine, { backgroundColor: colors.surface, opacity }]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    paddingTop: 8
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  nameLine: {
    width: "60%",
    height: 16,
    borderRadius: 4,
    marginBottom: 8
  },
  previewLine: {
    width: "80%",
    height: 14,
    borderRadius: 4
  }
});
