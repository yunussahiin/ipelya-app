/**
 * FeedCard Skeleton Component
 *
 * Amaç: Post kartı için skeleton loader - Loading state gösterir
 *
 * Özellikler:
 * - Shimmer animation
 * - Post card layout
 * - Avatar, content, media placeholders
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export function FeedCardSkeleton() {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header: Avatar + Name */}
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity, backgroundColor: colors.border }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.name, { opacity, backgroundColor: colors.border }]} />
          <Animated.View style={[styles.time, { opacity, backgroundColor: colors.border }]} />
        </View>
      </View>

      {/* Media placeholder */}
      <Animated.View style={[styles.media, { opacity, backgroundColor: colors.border }]} />

      {/* Actions */}
      <View style={styles.actions}>
        <Animated.View style={[styles.actionButton, { opacity, backgroundColor: colors.border }]} />
        <Animated.View style={[styles.actionButton, { opacity, backgroundColor: colors.border }]} />
        <Animated.View style={[styles.actionButton, { opacity, backgroundColor: colors.border }]} />
      </View>

      {/* Caption */}
      <View style={styles.caption}>
        <Animated.View style={[styles.captionLine, { opacity, backgroundColor: colors.border }]} />
        <Animated.View
          style={[styles.captionLine, { opacity, width: "60%", backgroundColor: colors.border }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  headerText: {
    flex: 1,
    gap: 6
  },
  name: {
    height: 16,
    width: 120,
    borderRadius: 4
  },
  time: {
    height: 12,
    width: 80,
    borderRadius: 4
  },
  media: {
    width: "100%",
    aspectRatio: 4 / 5
  },
  actions: {
    flexDirection: "row",
    padding: 12,
    gap: 16
  },
  actionButton: {
    width: 60,
    height: 24,
    borderRadius: 12
  },
  caption: {
    padding: 12,
    paddingTop: 0,
    gap: 6
  },
  captionLine: {
    height: 14,
    width: "100%",
    borderRadius: 4
  }
});
