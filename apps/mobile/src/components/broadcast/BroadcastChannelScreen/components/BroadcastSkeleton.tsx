/**
 * BroadcastSkeleton
 *
 * Amaç: Broadcast mesaj listesi loading state
 * Tarih: 2025-11-26
 */

import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface BroadcastSkeletonProps {
  count?: number;
}

export function BroadcastSkeleton({ count = 3 }: BroadcastSkeletonProps) {
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
        <View key={index} style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.View
              style={[styles.avatar, { backgroundColor: colors.backgroundRaised, opacity }]}
            />
            <View style={styles.headerText}>
              <Animated.View
                style={[styles.nameLine, { backgroundColor: colors.backgroundRaised, opacity }]}
              />
              <Animated.View
                style={[styles.timeLine, { backgroundColor: colors.backgroundRaised, opacity }]}
              />
            </View>
          </View>

          {/* Content */}
          <Animated.View
            style={[styles.contentLine1, { backgroundColor: colors.backgroundRaised, opacity }]}
          />
          <Animated.View
            style={[styles.contentLine2, { backgroundColor: colors.backgroundRaised, opacity }]}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Animated.View
              style={[styles.reactionBar, { backgroundColor: colors.backgroundRaised, opacity }]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16
  },
  card: {
    borderRadius: 16,
    padding: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  headerText: {
    flex: 1
  },
  nameLine: {
    width: "40%",
    height: 14,
    borderRadius: 4,
    marginBottom: 6
  },
  timeLine: {
    width: "25%",
    height: 10,
    borderRadius: 4
  },
  contentLine1: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    marginBottom: 8
  },
  contentLine2: {
    width: "70%",
    height: 14,
    borderRadius: 4,
    marginBottom: 12
  },
  footer: {
    marginTop: 8
  },
  reactionBar: {
    width: "50%",
    height: 32,
    borderRadius: 16
  }
});
