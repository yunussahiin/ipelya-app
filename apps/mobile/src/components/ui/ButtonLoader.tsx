/**
 * ButtonLoader Component
 * Tarih: 2025-12-06
 *
 * Button içinde loading state için küçük animated dots
 * ActivityIndicator yerine kullanılacak
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface ButtonLoaderProps {
  color?: string;
  size?: "small" | "medium";
}

export function ButtonLoader({ color = "#fff", size = "small" }: ButtonLoaderProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const dotSize = size === "small" ? 6 : 8;

  useEffect(() => {
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

    const animation1 = animate(dot1, 0);
    const animation2 = animate(dot2, 150);
    const animation3 = animate(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  const createDotStyle = (animValue: Animated.Value) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1]
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2]
        })
      }
    ]
  });

  return (
    <View style={styles.container}>
      <Animated.View style={createDotStyle(dot1)} />
      <Animated.View style={createDotStyle(dot2)} />
      <Animated.View style={createDotStyle(dot3)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  }
});
