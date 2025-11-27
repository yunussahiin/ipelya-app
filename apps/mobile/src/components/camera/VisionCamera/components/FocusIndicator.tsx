/**
 * FocusIndicator
 *
 * Tap-to-focus göstergesi
 * - Sarı kare animasyonu
 * - Scale animasyonu (büyük → küçük)
 * - 1.5 saniye sonra kaybolur
 */

import { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

interface FocusIndicatorProps {
  /** Focus noktası koordinatları */
  point: { x: number; y: number };
}

function FocusIndicatorComponent({ point }: FocusIndicatorProps) {
  const scaleAnim = useRef(new Animated.Value(1.5)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scale animasyonu: büyükten küçüğe
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ])
    ]).start();

    return () => {
      scaleAnim.setValue(1.5);
      opacityAnim.setValue(1);
    };
  }, [point.x, point.y, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: point.x - 40,
          top: point.y - 40,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim
        }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 4,
    backgroundColor: "transparent"
  }
});

export const FocusIndicator = memo(FocusIndicatorComponent);
