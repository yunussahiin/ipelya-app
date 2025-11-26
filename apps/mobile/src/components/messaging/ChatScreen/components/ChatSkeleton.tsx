/**
 * ChatSkeleton
 *
 * Amaç: Mesaj listesi loading state
 * Tarih: 2025-11-26
 */

import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface ChatSkeletonProps {
  count?: number;
}

export function ChatSkeleton({ count = 6 }: ChatSkeletonProps) {
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

  // Alternatif sağ/sol mesajlar
  const items = Array.from({ length: count }).map((_, i) => ({
    isRight: i % 2 === 0,
    width: 100 + Math.random() * 100
  }));

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={[styles.item, item.isRight ? styles.itemRight : styles.itemLeft]}>
          <Animated.View
            style={[styles.bubble, { backgroundColor: colors.surface, opacity, width: item.width }]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12
  },
  item: {
    marginVertical: 4
  },
  itemLeft: {
    alignItems: "flex-start"
  },
  itemRight: {
    alignItems: "flex-end"
  },
  bubble: {
    height: 40,
    borderRadius: 18
  }
});
