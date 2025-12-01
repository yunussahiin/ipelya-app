/**
 * StoryAnimation Component
 * Instagram tarzı 3D Cube efekti
 *
 * Kaynak: @birdwingo/react-native-instagram-stories
 */

import React, { memo, ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue
} from "react-native-reanimated";
import { WIDTH, HEIGHT, CUBE_ANGLE, CUBE_RATIO } from "../constants";

interface StoryAnimationProps {
  children: ReactNode;
  x: SharedValue<number>;
  index: number;
}

function StoryAnimationComponent({ children, x, index }: StoryAnimationProps) {
  const offset = WIDTH * index;
  const inputRange = [offset - WIDTH, offset + WIDTH];
  const maskInputRange = [offset - WIDTH, offset, offset + WIDTH];

  const animatedStyle = useAnimatedStyle(() => {
    // X pozisyonuna göre translateX hesapla
    const translateX = interpolate(
      x.value,
      inputRange,
      [WIDTH / CUBE_RATIO, -WIDTH / CUBE_RATIO],
      Extrapolation.CLAMP
    );

    // 3D rotasyon açısı
    const rotateY = interpolate(
      x.value,
      inputRange,
      [CUBE_ANGLE, -CUBE_ANGLE],
      Extrapolation.CLAMP
    );

    // Ek offset hesaplaması (3D efekt için)
    const alpha = Math.abs(rotateY);
    const gamma = CUBE_ANGLE - alpha;
    const beta = Math.PI - alpha - gamma;
    const w = WIDTH / 2 - (WIDTH / 2) * (Math.sin(gamma) / Math.sin(beta));
    const translateX1 = rotateY > 0 ? w : -w;

    // Android için ek düzeltme
    const left =
      Platform.OS === "android"
        ? interpolate(
            rotateY,
            [-CUBE_ANGLE, -CUBE_ANGLE + 0.1, 0, CUBE_ANGLE - 0.1, CUBE_ANGLE],
            [0, 20, 0, -20, 0],
            Extrapolation.CLAMP
          )
        : 0;

    return {
      transform: [
        { perspective: WIDTH },
        { translateX },
        { rotateY: `${rotateY}rad` },
        { translateX: translateX1 }
      ],
      left
    };
  });

  // Karartma efekti (kenarlar karanlık)
  const maskAnimatedStyles = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, maskInputRange, [0.5, 0, 0.5], Extrapolation.CLAMP)
  }));

  return (
    <Animated.View style={[animatedStyle, styles.container, styles.cube]}>
      {children}
      {/* Karartma overlay */}
      <Animated.View style={[maskAnimatedStyles, styles.mask]} pointerEvents="none" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: WIDTH,
    height: HEIGHT
  },
  cube: {
    backfaceVisibility: "hidden"
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000"
  }
});

export const StoryAnimation = memo(StoryAnimationComponent);
