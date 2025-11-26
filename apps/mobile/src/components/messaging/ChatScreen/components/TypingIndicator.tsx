/**
 * TypingIndicator
 *
 * Amaç: "Yazıyor..." göstergesi
 * Tarih: 2025-11-26
 */

import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useTypingIndicator } from "@/hooks/messaging";

interface TypingIndicatorProps {
  conversationId: string;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { colors } = useTheme();
  const typingUserIds = useTypingIndicator(conversationId);

  // Dot animations
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typingUserIds.length === 0) return;

    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ])
      );
    };

    const animation = Animated.parallel([animate(dot1, 0), animate(dot2, 150), animate(dot3, 300)]);

    animation.start();

    return () => animation.stop();
  }, [typingUserIds.length]);

  if (typingUserIds.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: colors.surface }]}>
        <View style={styles.dotsContainer}>
          {[dot1, dot2, dot3].map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: colors.textMuted },
                {
                  transform: [
                    {
                      translateY: dot.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4]
                      })
                    }
                  ]
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  bubble: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2
  }
});
