/**
 * DiamondRain Animation
 * Elmas hediyesi için yağmur animasyonu
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DIAMOND_COUNT = 15;

interface DiamondRainProps {
  onComplete?: () => void;
}

export function DiamondRain({ onComplete }: DiamondRainProps) {
  const diamonds = useRef(
    Array.from({ length: DIAMOND_COUNT }, () => ({
      translateX: new Animated.Value(Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2),
      translateY: new Animated.Value(-100),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0)
    }))
  ).current;

  useEffect(() => {
    const animations = diamonds.map((diamond, index) => {
      const delay = index * 100;
      const fallDistance = SCREEN_HEIGHT + 200;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(diamond.translateY, {
            toValue: fallDistance,
            duration: 2000,
            useNativeDriver: true
          }),
          Animated.timing(diamond.rotation, {
            toValue: 4,
            duration: 2000,
            useNativeDriver: true
          }),
          Animated.sequence([
            Animated.delay(1500),
            Animated.timing(diamond.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true
            })
          ])
        ])
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {diamonds.map((diamond, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.diamond,
            {
              transform: [
                { translateX: diamond.translateX },
                { translateY: diamond.translateY },
                { scale: diamond.scale },
                {
                  rotate: diamond.rotation.interpolate({
                    inputRange: [0, 4],
                    outputRange: ["0deg", "720deg"]
                  })
                }
              ],
              opacity: diamond.opacity
            }
          ]}
        >
          💎
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    overflow: "hidden"
  },
  diamond: {
    position: "absolute",
    fontSize: 28
  }
});
