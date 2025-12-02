1️⃣ Premium Aurora – Daha derin, designer vibe

components/backgrounds/AuroraBackground.tsx

/**
 * AuroraBackground (Premium)
 * Amaç: Designer seviyesinde akışkan aurora + depth
 * Tarih: 2025-12-02
 */

import React, { memo, useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type AuroraIntensity = "low" | "medium" | "high";

interface AuroraBackgroundProps {
  intensity?: AuroraIntensity;
}

function createDuration(intensity: AuroraIntensity) {
  switch (intensity) {
    case "high":
      return 6000;
    case "low":
      return 12000;
    default:
      return 9000;
  }
}

function AuroraBlob({
  size,
  x,
  y,
  colors,
  intensity = "medium",
  delay = 0
}: {
  size: number;
  x: number;
  y: number;
  colors: string[];
  intensity?: AuroraIntensity;
  delay?: number;
}) {
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(y);
  const scale = useSharedValue(1);
  const duration = createDuration(intensity);

  useEffect(() => {
    const offset = intensity === "high" ? 70 : intensity === "low" ? 25 : 45;

    translateX.value = withSequence(
      withTiming(x, { duration: 0 }),
      withRepeat(
        withSequence(
          withDelay(
            delay,
            withTiming(x + offset, {
              duration,
              easing: Easing.inOut(Easing.sin)
            })
          ),
          withTiming(x - offset * 0.7, {
            duration,
            easing: Easing.inOut(Easing.sin)
          })
        ),
        -1,
        true
      )
    );

    translateY.value = withSequence(
      withTiming(y, { duration: 0 }),
      withRepeat(
        withSequence(
          withDelay(
            delay,
            withTiming(y - offset * 0.8, {
              duration,
              easing: Easing.inOut(Easing.sin)
            })
          ),
          withTiming(y + offset * 0.5, {
            duration,
            easing: Easing.inOut(Easing.sin)
          })
        ),
        -1,
        true
      )
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(intensity === "high" ? 1.35 : 1.18, {
          duration: duration * 1.1,
          easing: Easing.inOut(Easing.ease)
        }),
        withTiming(intensity === "low" ? 0.95 : 1.02, {
          duration: duration * 1.1,
          easing: Easing.inOut(Easing.ease)
        })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size,
          opacity: 0.9
        },
        animatedStyle
      ]}
    >
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

function AuroraBackgroundComponent({ intensity = "medium" }: AuroraBackgroundProps) {
  const vignetteOpacity = useSharedValue(0.55);

  useEffect(() => {
    vignetteOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.65, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const vignetteStyle = useAnimatedStyle(() => ({
    opacity: vignetteOpacity.value
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base gradient – koyu ve derin */}
      <AnimatedGradient
        colors={["#030014", "#060318", "#080320", "#050215"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Aurora katmanları – farklı renk paletleri */}
      <AuroraBlob
        intensity={intensity}
        size={SCREEN_WIDTH * 1.5}
        x={-SCREEN_WIDTH * 0.3}
        y={SCREEN_HEIGHT * 0.02}
        colors={["rgba(135, 99, 255, 0.9)", "rgba(58, 214, 255, 0.35)"]}
      />
      <AuroraBlob
        intensity={intensity}
        size={SCREEN_WIDTH * 1.2}
        x={SCREEN_WIDTH * 0.1}
        y={SCREEN_HEIGHT * 0.45}
        colors={["rgba(255, 149, 214, 0.9)", "rgba(255, 207, 139, 0.3)"]}
        delay={600}
      />
      <AuroraBlob
        intensity={intensity}
        size={SCREEN_WIDTH * 1.1}
        x={SCREEN_WIDTH * 0.4}
        y={SCREEN_HEIGHT * 0.75}
        colors={["rgba(68, 244, 196, 0.85)", "rgba(60, 165, 255, 0.28)"]}
        delay={1200}
      />
      {/* Hafif accent blob – üst sağ */}
      <AuroraBlob
        intensity={intensity}
        size={SCREEN_WIDTH * 0.8}
        x={SCREEN_WIDTH * 0.45}
        y={-SCREEN_HEIGHT * 0.1}
        colors={["rgba(255, 255, 255, 0.16)", "rgba(142, 196, 255, 0.12)"]}
        delay={900}
      />

      {/* Vignette – odaklı bir görünüm verir */}
      <Animated.View
        pointerEvents="none"
        style={[styles.vignetteOverlay, vignetteStyle]}
      />

      {/* Top highlight bar – DM üst bar arkasına glow hissi */}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.14)",
          "rgba(255, 255, 255, 0.04)",
          "rgba(255, 255, 255, 0)"
        ]}
        style={styles.topHighlight}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  blob: {
    position: "absolute",
    overflow: "hidden"
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    marginHorizontal: -24,
    backgroundColor: "rgba(0,0,0,0.55)"
  },
  topHighlight: {
    position: "absolute",
    left: -10,
    right: -10,
    top: 0,
    height: 120
  }
});

export const AuroraBackground = memo(AuroraBackgroundComponent);

2️⃣ Premium Neon – Daha sinematik, daha az “flat grid”

components/backgrounds/NeonGridBackground.tsx

/**
 * NeonGridBackground (Premium)
 * Amaç: Designer seviyesinde cyber neon + perspective
 * Tarih: 2025-12-02
 */

import React, { memo, useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function NeonGridBackgroundComponent() {
  const scanY = useSharedValue(-SCREEN_HEIGHT * 0.4);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(SCREEN_HEIGHT * 0.9, {
        duration: 6500,
        easing: Easing.inOut(Easing.quad)
      }),
      -1,
      false
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }]
  }));

  const verticalLines = Array.from({ length: 9 });
  const horizontalLines = Array.from({ length: 6 });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background gradient */}
      <LinearGradient
        colors={["#010008", "#050013", "#05000E"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Uzak neon aura */}
      <Animated.View style={[styles.glowCircle, glowStyle]}>
        <LinearGradient
          colors={[
            "rgba(0, 255, 255, 0.2)",
            "rgba(255, 0, 255, 0.18)",
            "rgba(0,0,0,0.0)"
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Üstte hafif gradient haze */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.1)",
          "rgba(0,0,0,0.9)",
          "rgba(0,0,0,1)"
        ]}
        style={styles.topFade}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Perspective grid tabanı */}
      <View style={styles.gridContainer}>
        {verticalLines.map((_, index) => {
          const progress = index / (verticalLines.length - 1 || 1);
          const left = SCREEN_WIDTH * (progress - 0.5);

          return (
            <View
              key={`v-${index}`}
              style={[
                styles.gridLine,
                {
                  transform: [
                    { translateX: left },
                    { rotateZ: `${(progress - 0.5) * 18}deg` }
                  ],
                  opacity: index === Math.floor(verticalLines.length / 2) ? 0.3 : 0.16
                }
              ]}
            />
          );
        })}

        {horizontalLines.map((_, index) => {
          const progress = index / (horizontalLines.length - 1 || 1);
          const top = progress * SCREEN_HEIGHT * 0.6;

          return (
            <View
              key={`h-${index}`}
              style={[
                styles.gridHorizontal,
                {
                  top,
                  opacity: progress > 0.2 ? 0.18 : 0.05
                }
              ]}
            />
          );
        })}
      </View>

      {/* Animated scan bar */}
      <Animated.View style={[styles.scanWrapper, scanStyle]}>
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0, 255, 255, 0.45)",
            "rgba(255, 0, 255, 0.35)",
            "rgba(0,0,0,0)"
          ]}
          style={styles.scanGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Hafif noise overlay, kontrast için */}
      <View style={styles.noiseOverlay} />
    </View>
  );
}

const NEON_COLOR = "rgba(0, 255, 255, 0.7)";

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    backgroundColor: "black"
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  topFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT * 0.35
  },
  gridContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -SCREEN_HEIGHT * 0.05,
    height: SCREEN_HEIGHT * 0.7,
    overflow: "hidden"
  },
  gridLine: {
    position: "absolute",
    bottom: 0,
    width: 1,
    height: "110%",
    backgroundColor: NEON_COLOR
  },
  gridHorizontal: {
    position: "absolute",
    left: -SCREEN_WIDTH * 0.1,
    right: -SCREEN_WIDTH * 0.1,
    height: 1,
    backgroundColor: NEON_COLOR
  },
  scanWrapper: {
    position: "absolute",
    left: -20,
    right: -20,
    height: 120
  },
  scanGradient: {
    flex: 1
  },
  glowCircle: {
    position: "absolute",
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_WIDTH * 1.4,
    borderRadius: SCREEN_WIDTH * 1.4,
    bottom: -SCREEN_WIDTH * 0.6,
    alignSelf: "center",
    opacity: 0.9
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)"
  }
});

export const NeonGridBackground = memo(NeonGridBackgroundComponent);

3️⃣ Premium Bokeh – Daha rafine, renkli ve sakin

components/backgrounds/BokehBackground.tsx

/**
 * BokehBackground (Premium)
 * Amaç: Designer seviyesinde multi-color bokeh + depth
 * Tarih: 2025-12-02
 */

import React, { memo, useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PALETTE = [
  "rgba(255, 210, 150, 0.55)",
  "rgba(172, 211, 255, 0.55)",
  "rgba(255, 167, 196, 0.55)",
  "rgba(190, 255, 210, 0.55)"
];

interface BokehDotProps {
  index: number;
  total: number;
}

function BokehDot({ index, total }: BokehDotProps) {
  const baseX = useMemo(
    () => (Math.random() * SCREEN_WIDTH * 1.2) - SCREEN_WIDTH * 0.1,
    []
  );
  const baseY = useMemo(
    () => (Math.random() * SCREEN_HEIGHT * 1.2) - SCREEN_HEIGHT * 0.1,
    []
  );
  const size = useMemo(
    () => (index % 3 === 0 ? 120 : 50 + Math.random() * 60),
    []
  );
  const color = useMemo(
    () => PALETTE[index % PALETTE.length],
    []
  );

  const translateX = useSharedValue(baseX);
  const translateY = useSharedValue(baseY);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const delay = (index / total) * 1200;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 5000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(baseX + 18, {
            duration: 7000,
            easing: Easing.inOut(Easing.sin)
          }),
          withTiming(baseX - 14, {
            duration: 7000,
            easing: Easing.inOut(Easing.sin)
          })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(baseY - 22, {
            duration: 7500,
            easing: Easing.inOut(Easing.sin)
          }),
          withTiming(baseY + 12, {
            duration: 7500,
            easing: Easing.inOut(Easing.sin)
          })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color
        },
        animatedStyle
      ]}
    />
  );
}

function BokehBackgroundComponent() {
  const dots = useMemo(() => Array.from({ length: 18 }), []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base background – sıcak mor/indigo */}
      <LinearGradient
        colors={["#0C0616", "#140B24", "#190C2B"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Bokeh dots */}
      {dots.map((_, index) => (
        <BokehDot key={index} index={index} total={dots.length} />
      ))}

      {/* Hafif üst overlay, metin okunabilirliğini artırır */}
      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.25)",
          "rgba(0, 0, 0, 0.35)",
          "rgba(0, 0, 0, 0.55)"
        ]}
        style={styles.readabilityOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  dot: {
    position: "absolute"
  },
  readabilityOverlay: {
    ...StyleSheet.absoluteFillObject
  }
});

export const BokehBackground = memo(BokehBackgroundComponent);

4️⃣ Playground’a küçük UX dokunuşu

Sadece ufak değişiklik: başlık ve kartlara biraz daha “productized” hissi verelim.

screens/ChatBackgroundPlayground.tsx (sadece önemli yerleri güncelledim, istersen komple kopyalayıp eskisinin üstüne yazabilirsin)

// ... imports aynı, sadece title / card tasarımı ufakça güncellendi

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black"
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16
  },
  header: {
    marginTop: 12,
    marginBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.2
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.64)"
  },
  selectorScroll: {
    paddingVertical: 10
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    marginRight: 8,
    backgroundColor: "rgba(5,5,10,0.8)"
  },
  selectorChipActive: {
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "rgba(255,255,255,0.14)"
  },
  selectorLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "500"
  },
  selectorLabelActive: {
    color: "white"
  },
  chatPreviewCard: {
    marginTop: 12,
    flex: 1,
    borderRadius: 24,
    padding: 14,
    backgroundColor: "rgba(4,4,8,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    overflow: "hidden"
  },
  // diğerleri aynı kalabilir
});