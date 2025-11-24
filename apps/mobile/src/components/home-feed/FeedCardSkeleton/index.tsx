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

export function FeedCardSkeleton() {
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
    <View style={styles.card}>
      {/* Header: Avatar + Name */}
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.name, { opacity }]} />
          <Animated.View style={[styles.time, { opacity }]} />
        </View>
      </View>

      {/* Media placeholder */}
      <Animated.View style={[styles.media, { opacity }]} />

      {/* Actions */}
      <View style={styles.actions}>
        <Animated.View style={[styles.actionButton, { opacity }]} />
        <Animated.View style={[styles.actionButton, { opacity }]} />
        <Animated.View style={[styles.actionButton, { opacity }]} />
      </View>

      {/* Caption */}
      <View style={styles.caption}>
        <Animated.View style={[styles.captionLine, { opacity }]} />
        <Animated.View style={[styles.captionLine, { opacity, width: "60%" }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
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
    borderRadius: 20,
    backgroundColor: "#E5E7EB"
  },
  headerText: {
    flex: 1,
    gap: 6
  },
  name: {
    height: 16,
    width: 120,
    borderRadius: 4,
    backgroundColor: "#E5E7EB"
  },
  time: {
    height: 12,
    width: 80,
    borderRadius: 4,
    backgroundColor: "#E5E7EB"
  },
  media: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#E5E7EB"
  },
  actions: {
    flexDirection: "row",
    padding: 12,
    gap: 16
  },
  actionButton: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB"
  },
  caption: {
    padding: 12,
    paddingTop: 0,
    gap: 6
  },
  captionLine: {
    height: 14,
    width: "100%",
    borderRadius: 4,
    backgroundColor: "#E5E7EB"
  }
});
