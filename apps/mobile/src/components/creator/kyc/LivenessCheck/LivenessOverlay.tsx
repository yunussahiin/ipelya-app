/**
 * LivenessOverlay Component
 * Yüz çerçevesi ve talimat göstergesi
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing
} from "react-native-reanimated";
import { Eye, EyeOff, Smile, ArrowRight, ArrowLeft, Check } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import type { LivenessStep, LivenessStepConfig } from "@/hooks/creator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVAL_WIDTH = SCREEN_WIDTH * 0.72;
const OVAL_HEIGHT = OVAL_WIDTH * 1.35;

interface LivenessOverlayProps {
  stepConfig: LivenessStepConfig | null;
  isProcessing: boolean;
  isComplete: boolean;
  faceValid: boolean;
  message?: string;
}

export function LivenessOverlay({
  stepConfig,
  isProcessing,
  isComplete,
  faceValid,
  message
}: LivenessOverlayProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Border color based on state
  const borderColor = isComplete
    ? "#10B981" // Yeşil - tamamlandı
    : faceValid
      ? "#3B82F6" // Mavi - yüz algılandı
      : "#EF4444"; // Kırmızı - yüz yok

  return (
    <View style={styles.container}>
      {/* Oval Frame with glow effect */}
      <View style={styles.frameContainer}>
        {/* Outer glow */}
        <View
          style={[
            styles.ovalGlow,
            {
              borderColor: isComplete
                ? "rgba(16, 185, 129, 0.3)"
                : faceValid
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(239, 68, 68, 0.3)",
              shadowColor: borderColor
            }
          ]}
        />

        {/* Main frame */}
        <View style={[styles.ovalFrame, { borderColor }]}>
          {isComplete && (
            <Animated.View style={styles.successIcon}>
              <Check size={56} color="#10B981" strokeWidth={3} />
            </Animated.View>
          )}
        </View>

        {/* Face position hint */}
        {!isComplete && !faceValid && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Yüzünüzü çerçeveye yerleştirin</Text>
          </View>
        )}
      </View>

      {/* Instruction Area - Bottom */}
      <View style={styles.instructionContainer}>
        {isComplete ? (
          <SuccessMessage colors={colors} />
        ) : stepConfig ? (
          <StepInstruction stepConfig={stepConfig} colors={colors} faceValid={faceValid} />
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>{message || "Hazırlanıyor..."}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface StepInstructionProps {
  stepConfig: LivenessStepConfig;
  colors: ThemeColors;
  faceValid: boolean;
}

function StepInstruction({ stepConfig, colors, faceValid }: StepInstructionProps) {
  const styles = createStyles(colors);

  return (
    <View style={[styles.instructionBox, faceValid && styles.instructionBoxActive]}>
      <AnimatedIcon step={stepConfig.id} colors={colors} />
      <Text style={styles.instructionText}>{stepConfig.instruction}</Text>
      {faceValid && <Text style={styles.instructionHint}>Hareketi yapın</Text>}
    </View>
  );
}

interface AnimatedIconProps {
  step: LivenessStep;
  colors: ThemeColors;
}

function AnimatedIcon({ step, colors }: AnimatedIconProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Reset animations
    scale.value = 1;
    opacity.value = 1;
    rotation.value = 0;

    switch (step) {
      case "blink":
        // Blink animation - opacity pulse
        opacity.value = withRepeat(
          withSequence(withTiming(0.3, { duration: 300 }), withTiming(1, { duration: 300 })),
          -1,
          false
        );
        break;

      case "smile":
        // Smile animation - scale bounce
        scale.value = withRepeat(
          withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 8 })),
          -1,
          false
        );
        break;

      case "turn_right":
        // Turn right animation - translate right
        rotation.value = withRepeat(
          withSequence(
            withTiming(10, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        break;

      case "turn_left":
        // Turn left animation - translate left
        rotation.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        break;
    }
  }, [step]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: rotation.value }],
    opacity: opacity.value
  }));

  const iconSize = 48;
  const iconColor = "#3B82F6";

  const IconComponent = () => {
    switch (step) {
      case "blink":
        return <Eye size={iconSize} color={iconColor} />;
      case "smile":
        return <Smile size={iconSize} color={iconColor} />;
      case "turn_right":
        return <ArrowRight size={iconSize} color={iconColor} />;
      case "turn_left":
        return <ArrowLeft size={iconSize} color={iconColor} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <IconComponent />
    </Animated.View>
  );
}

interface SuccessMessageProps {
  colors: ThemeColors;
}

function SuccessMessage({ colors }: SuccessMessageProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[styles.successContainer, animatedStyle]}>
      <View style={styles.successIconLarge}>
        <Check size={32} color="#fff" strokeWidth={3} />
      </View>
      <Text style={styles.successText}>Canlılık Doğrulandı!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.4)"
  },
  successContainer: {
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)"
  },
  successIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  successText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10B981"
  }
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center"
    },
    frameContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginTop: -40
    },
    ovalGlow: {
      position: "absolute",
      width: OVAL_WIDTH + 20,
      height: OVAL_HEIGHT + 20,
      borderRadius: (OVAL_WIDTH + 20) / 2,
      borderWidth: 8,
      opacity: 0.5
    },
    ovalFrame: {
      width: OVAL_WIDTH,
      height: OVAL_HEIGHT,
      borderRadius: OVAL_WIDTH / 2,
      borderWidth: 4,
      justifyContent: "center",
      alignItems: "center"
    },
    successIcon: {
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      borderRadius: 50,
      padding: 16
    },
    hintContainer: {
      position: "absolute",
      bottom: -60,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20
    },
    hintText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "500"
    },
    instructionContainer: {
      position: "absolute",
      bottom: 15,
      left: 20,
      right: 20,
      alignItems: "center"
    },
    instructionBox: {
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 32,
      paddingVertical: 24,
      borderRadius: 20,
      minWidth: 240,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)"
    },
    instructionBoxActive: {
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      borderColor: "rgba(59, 130, 246, 0.5)"
    },
    instructionText: {
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      color: "#fff"
    },
    instructionHint: {
      fontSize: 14,
      fontWeight: "500",
      color: "rgba(255,255,255,0.6)",
      marginTop: 8
    },
    loadingBox: {
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 16
    },
    loadingText: {
      fontSize: 16,
      color: "rgba(255,255,255,0.8)",
      textAlign: "center"
    }
  });
}
