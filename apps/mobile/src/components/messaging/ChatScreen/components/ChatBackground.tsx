/**
 * ChatBackground
 *
 * Amaç: Animasyonlu sohbet arka planı
 * Tarih: 2025-12-02
 */

import { memo, useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import type { ChatTheme } from "@/theme/chatThemes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ChatBackgroundProps {
  theme: ChatTheme;
}

// Tek bir partikül
interface ParticleProps {
  emoji: string;
  index: number;
  speed: "slow" | "medium" | "fast";
}

function Particle({ emoji, index, speed }: ParticleProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  // Rastgele başlangıç pozisyonu
  const startX = useMemo(() => Math.random() * SCREEN_WIDTH, []);
  const startY = useMemo(() => Math.random() * SCREEN_HEIGHT, []);
  const size = useMemo(() => 16 + Math.random() * 16, []);

  // Hız ayarları
  const duration = useMemo(() => {
    const base = speed === "slow" ? 15000 : speed === "medium" ? 10000 : 6000;
    return base + Math.random() * 5000;
  }, [speed]);

  useEffect(() => {
    // Yukarı hareket
    translateY.value = withDelay(
      index * 500,
      withRepeat(
        withTiming(-SCREEN_HEIGHT - 100, {
          duration,
          easing: Easing.linear
        }),
        -1,
        false
      )
    );

    // Hafif yatay salınım
    translateX.value = withDelay(
      index * 500,
      withRepeat(
        withTiming(30, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin)
        }),
        -1,
        true
      )
    );

    // Opacity fade in/out
    opacity.value = withDelay(
      index * 500,
      withRepeat(
        withTiming(0.6, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      )
    );

    // Hafif dönüş
    rotate.value = withRepeat(
      withTiming(360, {
        duration: 10000,
        easing: Easing.linear
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY + SCREEN_HEIGHT,
          width: size,
          height: size
        },
        animatedStyle
      ]}
    >
      <Text style={{ fontSize: size * 0.8 }}>{emoji}</Text>
    </Animated.View>
  );
}

// Pattern overlay
function PatternOverlay({ type, opacity }: { type: string; opacity: number }) {
  // Pattern'ler için basit emoji grid
  const patternEmoji = useMemo(() => {
    switch (type) {
      case "hearts":
        return "♡";
      case "stars":
        return "✦";
      case "leaves":
        return "❧";
      case "waves":
        return "〰";
      case "dots":
        return "•";
      default:
        return "";
    }
  }, [type]);

  if (type === "none" || !patternEmoji) return null;

  // 8x16 grid oluştur
  const rows = 16;
  const cols = 8;

  return (
    <View style={[styles.patternContainer, { opacity }]} pointerEvents="none">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.patternRow}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Text
              key={colIndex}
              style={[styles.patternEmoji, { marginLeft: rowIndex % 2 === 0 ? 20 : 0 }]}
            >
              {patternEmoji}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function ChatBackgroundComponent({ theme }: ChatBackgroundProps) {
  const { colors, particles, pattern } = theme;

  // Gradient veya düz renk
  const hasGradient = colors.backgroundGradient && colors.backgroundGradient.length > 0;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Arka plan */}
      {hasGradient ? (
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      ) : (
        <View style={[styles.solidBackground, { backgroundColor: colors.background }]} />
      )}

      {/* Pattern overlay */}
      {pattern && pattern.type !== "none" && (
        <PatternOverlay type={pattern.type} opacity={pattern.opacity} />
      )}

      {/* Animasyonlu partiküller */}
      {particles && (
        <View style={styles.particlesContainer} pointerEvents="none">
          {Array.from({ length: particles.count }).map((_, index) => (
            <Particle key={index} emoji={particles.emoji} index={index} speed={particles.speed} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden"
  },
  particle: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden"
  },
  patternRow: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  patternEmoji: {
    fontSize: 20,
    color: "rgba(255,255,255,0.3)",
    marginVertical: 30
  }
});

export const ChatBackground = memo(ChatBackgroundComponent);
