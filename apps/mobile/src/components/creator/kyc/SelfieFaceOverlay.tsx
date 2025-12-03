/**
 * SelfieFaceOverlay Component
 * KYC Selfie ekranı için modern yüz çerçevesi
 *
 * Özellikler:
 * - Yuvarlak yüz çerçevesi (daha modern)
 * - Gradient efekt
 * - Animasyonlu border
 * - Minimal mesaj gösterimi
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import Svg, { Circle, Defs, Mask, Rect, LinearGradient, Stop } from "react-native-svg";
import { SelfieValidationResult, getValidationColor } from "@/hooks/creator/useKYCSelfieDetection";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Daire boyutları - daha büyük ve merkezi
const CIRCLE_SIZE = SCREEN_WIDTH * 0.85;
const CIRCLE_CENTER_X = SCREEN_WIDTH / 2;
const CIRCLE_CENTER_Y = SCREEN_HEIGHT * 0.4;

interface SelfieFaceOverlayProps {
  validation: SelfieValidationResult;
  showMessage?: boolean;
  autoCountdown?: number | null; // 3, 2, 1 sayacı
}

export function SelfieFaceOverlay({
  validation,
  showMessage = true,
  autoCountdown
}: SelfieFaceOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderColor = getValidationColor(validation.status);
  const isReady = validation.status === "ready";

  // Ready durumunda pulse animasyonu - sayaç varken daha hızlı
  useEffect(() => {
    if (isReady) {
      const duration = autoCountdown ? 300 : 500; // Sayaç varken daha hızlı
      const scale = autoCountdown ? 1.08 : 1.05; // Sayaç varken daha belirgin

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: scale,
            duration: duration,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isReady, autoCountdown, pulseAnim]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Karartılmış arka plan + daire kesim */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          <Mask id="circleMask">
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
            <Circle cx={CIRCLE_CENTER_X} cy={CIRCLE_CENTER_Y} r={CIRCLE_SIZE / 2} fill="black" />
          </Mask>
          <LinearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={borderColor} stopOpacity="1" />
            <Stop offset="50%" stopColor={borderColor} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={borderColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Karartılmış alan - daha hafif */}
        <Rect
          x="0"
          y="0"
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="rgba(0,0,0,0.7)"
          mask="url(#circleMask)"
        />

        {/* Dış glow efekti */}
        <Circle
          cx={CIRCLE_CENTER_X}
          cy={CIRCLE_CENTER_Y}
          r={CIRCLE_SIZE / 2 + 6}
          stroke={borderColor}
          strokeWidth={12}
          fill="none"
          opacity={0.15}
        />

        {/* Ana çerçeve */}
        <Circle
          cx={CIRCLE_CENTER_X}
          cy={CIRCLE_CENTER_Y}
          r={CIRCLE_SIZE / 2}
          stroke="url(#borderGradient)"
          strokeWidth={4}
          fill="none"
        />

        {/* İç çizgi - ince */}
        <Circle
          cx={CIRCLE_CENTER_X}
          cy={CIRCLE_CENTER_Y}
          r={CIRCLE_SIZE / 2 - 8}
          stroke={borderColor}
          strokeWidth={1}
          fill="none"
          opacity={0.3}
          strokeDasharray="8,8"
        />
      </Svg>

      {/* Üst bilgi - minimal */}
      <View style={styles.topHint}>
        <Text style={styles.topHintText}>Yüzünüzü çerçeveye yerleştirin</Text>
      </View>

      {/* Alt mesaj - modern pill tasarım */}
      {showMessage && (
        <View style={styles.messageContainer}>
          <Animated.View
            style={[
              styles.messageBox,
              {
                backgroundColor: isReady ? `${borderColor}40` : "rgba(0,0,0,0.6)",
                borderColor: borderColor,
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            {/* Sayaç varsa büyük sayı göster, yoksa dot */}
            {isReady && autoCountdown ? (
              <Animated.Text
                style={[
                  styles.countdownNumber,
                  {
                    color: borderColor,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                {autoCountdown}
              </Animated.Text>
            ) : (
              <View style={[styles.statusDot, { backgroundColor: borderColor }]} />
            )}
            <Text style={styles.messageText}>
              {isReady && autoCountdown ? "Sabit kalın..." : validation.message}
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topHint: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  topHintText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center"
  },
  messageContainer: {
    position: "absolute",
    bottom: 220,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1.5,
    gap: 10
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500"
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: "800",
    marginRight: 4
  }
});

export default SelfieFaceOverlay;
