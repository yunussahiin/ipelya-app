/**
 * BroadcastListSkeleton
 *
 * Amaç: Yayın kanalları listesi loading state
 * Tarih: 2025-11-26
 */

import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export function BroadcastListSkeleton() {
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
      {/* Section header skeleton */}
      <Animated.View style={[styles.sectionHeader, { backgroundColor: colors.surface, opacity }]} />

      {/* Items */}
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.item}>
          <Animated.View style={[styles.avatar, { backgroundColor: colors.surface, opacity }]} />
          <View style={styles.content}>
            <Animated.View
              style={[styles.nameLine, { backgroundColor: colors.surface, opacity }]}
            />
            <Animated.View
              style={[styles.descLine, { backgroundColor: colors.surface, opacity }]}
            />
            <Animated.View
              style={[styles.statsLine, { backgroundColor: colors.surface, opacity }]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16
  },
  sectionHeader: {
    width: 100,
    height: 16,
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 12
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  nameLine: {
    width: "60%",
    height: 16,
    borderRadius: 4,
    marginBottom: 6
  },
  descLine: {
    width: "80%",
    height: 12,
    borderRadius: 4,
    marginBottom: 6
  },
  statsLine: {
    width: "40%",
    height: 10,
    borderRadius: 4
  }
});
