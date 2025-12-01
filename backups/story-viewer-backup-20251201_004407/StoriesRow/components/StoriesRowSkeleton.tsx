/**
 * StoriesRowSkeleton Component
 *
 * Stories yüklenirken gösterilen skeleton loader.
 * - Animated pulse effect
 * - Tema renklerine uyumlu
 */

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

const SKELETON_COUNT = 6;
const CIRCLE_SIZE = 68;

export function StoriesRowSkeleton() {
  const { colors } = useTheme();
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

  return (
    <View style={styles.container}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <View key={index} style={styles.item}>
          {/* Circle skeleton */}
          <Animated.View
            style={[
              styles.circle,
              {
                backgroundColor: colors.surface,
                opacity
              }
            ]}
          />
          {/* Text skeleton */}
          <Animated.View
            style={[
              styles.text,
              {
                backgroundColor: colors.surface,
                opacity
              }
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 12
  },
  item: {
    alignItems: "center",
    width: 76,
    marginHorizontal: 4
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2
  },
  text: {
    width: 48,
    height: 10,
    borderRadius: 5,
    marginTop: 6
  }
});
