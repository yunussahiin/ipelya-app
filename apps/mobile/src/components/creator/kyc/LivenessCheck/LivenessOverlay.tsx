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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const OVAL_WIDTH = SCREEN_WIDTH * 0.7;
const OVAL_HEIGHT = OVAL_WIDTH * 1.3;

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
      {/* Oval Frame */}
      <View style={styles.frameContainer}>
        <View style={[styles.ovalFrame, { borderColor }]}>
          {isComplete && (
            <View style={styles.successIcon}>
              <Check size={48} color="#10B981" strokeWidth={3} />
            </View>
          )}
        </View>
      </View>

      {/* Instruction Area */}
      <View style={styles.instructionContainer}>
        {isComplete ? (
          <SuccessMessage colors={colors} />
        ) : stepConfig ? (
          <StepInstruction stepConfig={stepConfig} colors={colors} />
        ) : (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message || "Hazırlanıyor..."}
          </Text>
        )}
      </View>
    </View>
  );
}

interface StepInstructionProps {
  stepConfig: LivenessStepConfig;
  colors: ThemeColors;
}

function StepInstruction({ stepConfig, colors }: StepInstructionProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.instructionBox}>
      <AnimatedIcon step={stepConfig.id} colors={colors} />
      <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
        {stepConfig.instruction}
      </Text>
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
      <Text style={[styles.successText, { color: "#10B981" }]}>Canlılık Doğrulandı!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  successContainer: {
    alignItems: "center"
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
    fontWeight: "700"
  }
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "space-between",
      paddingVertical: 40
    },
    frameContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
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
      borderRadius: 40,
      padding: 12
    },
    instructionContainer: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 20
    },
    instructionBox: {
      alignItems: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderRadius: 16,
      minWidth: 200
    },
    instructionText: {
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center"
    },
    message: {
      fontSize: 16,
      textAlign: "center"
    }
  });
}
