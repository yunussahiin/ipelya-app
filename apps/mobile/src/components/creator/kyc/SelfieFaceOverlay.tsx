/**
 * SelfieFaceOverlay Component
 * KYC Selfie ekranı için yüz pozisyon overlay'i
 *
 * Özellikler:
 * - Oval yüz çerçevesi
 * - Dinamik renk (valid/invalid/warning)
 * - Pozisyon rehberi
 * - Mesaj gösterimi
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import Svg, { Ellipse, Defs, Mask, Rect, G } from "react-native-svg";
import {
  SelfieValidationStatus,
  SelfieValidationResult,
  getValidationColor
} from "@/hooks/creator/useKYCSelfieDetection";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Oval boyutları
const OVAL_WIDTH = SCREEN_WIDTH * 0.7;
const OVAL_HEIGHT = OVAL_WIDTH * 1.3; // Yüz oranı
const OVAL_CENTER_X = SCREEN_WIDTH / 2;
const OVAL_CENTER_Y = SCREEN_HEIGHT * 0.38;

interface SelfieFaceOverlayProps {
  validation: SelfieValidationResult;
  showMessage?: boolean;
}

export function SelfieFaceOverlay({ validation, showMessage = true }: SelfieFaceOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderColor = getValidationColor(validation.status);
  const isReady = validation.status === "ready";

  // Ready durumunda pulse animasyonu
  useEffect(() => {
    if (isReady) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isReady, pulseAnim]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Karartılmış arka plan + oval kesim */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          <Mask id="ovalMask">
            <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
            <Ellipse
              cx={OVAL_CENTER_X}
              cy={OVAL_CENTER_Y}
              rx={OVAL_WIDTH / 2}
              ry={OVAL_HEIGHT / 2}
              fill="black"
            />
          </Mask>
        </Defs>

        {/* Karartılmış alan */}
        <Rect
          x="0"
          y="0"
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="rgba(0,0,0,0.6)"
          mask="url(#ovalMask)"
        />

        {/* Oval çerçeve */}
        <Ellipse
          cx={OVAL_CENTER_X}
          cy={OVAL_CENTER_Y}
          rx={OVAL_WIDTH / 2}
          ry={OVAL_HEIGHT / 2}
          stroke={borderColor}
          strokeWidth={4}
          fill="none"
        />

        {/* Köşe işaretleri (ready durumunda) */}
        {isReady && (
          <G>
            {/* Üst sol */}
            <Ellipse
              cx={OVAL_CENTER_X}
              cy={OVAL_CENTER_Y}
              rx={OVAL_WIDTH / 2 + 8}
              ry={OVAL_HEIGHT / 2 + 8}
              stroke={borderColor}
              strokeWidth={2}
              strokeDasharray="20,500"
              strokeDashoffset={-20}
              fill="none"
              opacity={0.5}
            />
          </G>
        )}
      </Svg>

      {/* Mesaj kutusu */}
      {showMessage && (
        <View style={styles.messageContainer}>
          <Animated.View
            style={[
              styles.messageBox,
              {
                backgroundColor: `${borderColor}20`,
                borderColor: borderColor,
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            {/* Status icon */}
            <View style={[styles.statusIcon, { backgroundColor: borderColor }]}>
              <Text style={styles.statusIconText}>
                {validation.status === "ready"
                  ? "✓"
                  : validation.status === "no_face" || validation.status === "multiple_faces"
                    ? "!"
                    : "↺"}
              </Text>
            </View>

            <Text style={[styles.messageText, { color: borderColor }]}>{validation.message}</Text>
          </Animated.View>
        </View>
      )}

      {/* Yön göstergeleri */}
      {validation.guidance && !isReady && (
        <View style={styles.guidanceContainer}>
          {/* Yaklaş/Uzaklaş */}
          {validation.guidance.distance === "closer" && (
            <View style={styles.distanceIndicator}>
              <Text style={styles.distanceArrow}>↓</Text>
              <Text style={styles.distanceText}>Yaklaşın</Text>
            </View>
          )}
          {validation.guidance.distance === "further" && (
            <View style={styles.distanceIndicator}>
              <Text style={styles.distanceArrow}>↑</Text>
              <Text style={styles.distanceText}>Uzaklaşın</Text>
            </View>
          )}

          {/* Yatay yönlendirme */}
          {validation.guidance.horizontal === "left" && (
            <View style={[styles.horizontalIndicator, styles.leftIndicator]}>
              <Text style={styles.arrowText}>←</Text>
            </View>
          )}
          {validation.guidance.horizontal === "right" && (
            <View style={[styles.horizontalIndicator, styles.rightIndicator]}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          )}
        </View>
      )}

      {/* Ready durumunda countdown göstergesi (opsiyonel) */}
      {isReady && (
        <View style={styles.readyIndicator}>
          <View style={[styles.readyDot, { backgroundColor: borderColor }]} />
          <View style={[styles.readyDot, { backgroundColor: borderColor }]} />
          <View style={[styles.readyDot, { backgroundColor: borderColor }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    position: "absolute",
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    gap: 10
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  statusIconText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold"
  },
  messageText: {
    fontSize: 16,
    fontWeight: "600"
  },
  guidanceContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  distanceIndicator: {
    position: "absolute",
    top: OVAL_CENTER_Y + OVAL_HEIGHT / 2 + 30,
    alignItems: "center"
  },
  distanceArrow: {
    fontSize: 32,
    color: "#F59E0B"
  },
  distanceText: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4
  },
  horizontalIndicator: {
    position: "absolute",
    top: OVAL_CENTER_Y,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245, 158, 11, 0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  leftIndicator: {
    left: 20
  },
  rightIndicator: {
    right: 20
  },
  arrowText: {
    fontSize: 24,
    color: "#F59E0B",
    fontWeight: "bold"
  },
  readyIndicator: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  readyDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  }
});

export default SelfieFaceOverlay;
