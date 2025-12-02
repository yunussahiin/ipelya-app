/**
 * SelfieCaptureOverlay Component
 * Selfie fotoğraf çekme overlay'i (oval yüz çerçevesi)
 */

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Ellipse, Defs, Mask, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVAL_WIDTH = SCREEN_WIDTH * 0.65;
const OVAL_HEIGHT = OVAL_WIDTH * 1.3;

interface SelfieCaptureOverlayProps {
  isDetected?: boolean;
}

export function SelfieCaptureOverlay({ isDetected = false }: SelfieCaptureOverlayProps) {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2 - 50;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* SVG mask for oval cutout */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="mask">
            <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
            <Ellipse
              cx={centerX}
              cy={centerY}
              rx={OVAL_WIDTH / 2}
              ry={OVAL_HEIGHT / 2}
              fill="black"
            />
          </Mask>
        </Defs>

        {/* Dark overlay with oval cutout */}
        <Rect
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="rgba(0,0,0,0.7)"
          mask="url(#mask)"
        />

        {/* Oval border */}
        <Ellipse
          cx={centerX}
          cy={centerY}
          rx={OVAL_WIDTH / 2}
          ry={OVAL_HEIGHT / 2}
          fill="none"
          stroke={isDetected ? "#10B981" : "#fff"}
          strokeWidth={3}
        />
      </Svg>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <View
          style={[styles.statusBadge, { backgroundColor: isDetected ? "#10B98120" : "#F59E0B20" }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: isDetected ? "#10B981" : "#F59E0B" }]}
          />
          <Text style={[styles.statusText, { color: isDetected ? "#10B981" : "#F59E0B" }]}>
            {isDetected ? "Yüz algılandı" : "Yüzünüzü çerçeveye yerleştirin"}
          </Text>
        </View>
      </View>

      {/* Tips at bottom */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipTitle}>📸 İpuçları</Text>
        <Text style={styles.tipText}>• Yüzünüzü kameraya doğru tutun</Text>
        <Text style={styles.tipText}>• Gözlük veya şapka takmayın</Text>
        <Text style={styles.tipText}>• İyi aydınlatılmış bir ortamda çekin</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  instructionContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500"
  },
  tipsContainer: {
    position: "absolute",
    bottom: 120,
    left: 24,
    right: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  tipTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  tipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginBottom: 4
  }
});
