/**
 * HeartBurst Animation
 * Kalp hediyesi için patlama animasyonu
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEART_COUNT = 12;

interface HeartBurstProps {
  onComplete?: () => void;
  color?: string;
}

export function HeartBurst({ onComplete, color = "#FF6B6B" }: HeartBurstProps) {
  const hearts = useRef(
    Array.from({ length: HEART_COUNT }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0)
    }))
  ).current;

  useEffect(() => {
    const animations = hearts.map((heart, index) => {
      const angle = (index / HEART_COUNT) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - 50;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(heart.scale, {
            toValue: 1 + Math.random() * 0.5,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(heart.scale, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true
          })
        ]),
        Animated.timing(heart.translateX, {
          toValue: targetX,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(heart.translateY, {
          toValue: targetY,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(heart.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(heart.rotation, {
          toValue: Math.random() * 2 - 1,
          duration: 800,
          useNativeDriver: true
        })
      ]);
    });

    Animated.stagger(50, animations).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {hearts.map((heart, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.heart,
            {
              transform: [
                { translateX: heart.translateX },
                { translateY: heart.translateY },
                { scale: heart.scale },
                {
                  rotate: heart.rotation.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ["-30deg", "30deg"]
                  })
                }
              ],
              opacity: heart.opacity
            }
          ]}
        >
          ❤️
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  heart: {
    position: "absolute",
    fontSize: 32
  }
});
