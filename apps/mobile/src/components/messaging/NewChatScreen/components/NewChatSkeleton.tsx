/**
 * NewChatSkeleton
 *
 * Amaç: Yeni sohbet ekranı loading state
 * Tarih: 2025-11-26
 */

import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export function NewChatSkeleton() {
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
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.item}>
          <Animated.View style={[styles.avatar, { backgroundColor: colors.surface, opacity }]} />
          <View style={styles.content}>
            <Animated.View
              style={[styles.nameLine, { backgroundColor: colors.surface, opacity }]}
            />
            <Animated.View
              style={[styles.usernameLine, { backgroundColor: colors.surface, opacity }]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  nameLine: {
    width: "50%",
    height: 16,
    borderRadius: 4,
    marginBottom: 6
  },
  usernameLine: {
    width: "30%",
    height: 12,
    borderRadius: 4
  }
});
