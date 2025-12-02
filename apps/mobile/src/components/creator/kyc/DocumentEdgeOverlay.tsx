/**
 * DocumentEdgeOverlay Component
 * KYC Kimlik çekimi için belge kenar overlay'i
 *
 * Özellikler:
 * - 4 köşe gösterimi
 * - Dinamik renk (algılandı/algılanmadı)
 * - Animasyonlu kenar çizgisi
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import Svg, { Polygon, Circle, G } from "react-native-svg";
import type { DocumentDetectionResult, Point } from "@/hooks/creator/useDocumentNormalizer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DocumentEdgeOverlayProps {
  detection: DocumentDetectionResult;
  showGuide?: boolean;
}

export function DocumentEdgeOverlay({ detection, showGuide = true }: DocumentEdgeOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const borderColor = detection.detected
    ? detection.isCardShaped
      ? "#10B981"
      : "#F59E0B"
    : "#fff";

  // Algılandığında pulse animasyonu
  useEffect(() => {
    if (detection.detected && detection.isCardShaped) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [detection.detected, detection.isCardShaped, pulseAnim]);

  // Köşe noktaları
  const corners = detection.corners || [];

  if (corners.length !== 4) {
    return null;
  }

  // Polygon noktaları
  const polygonPoints = corners.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {/* Belge alanı */}
        <Polygon
          points={polygonPoints}
          fill={detection.detected ? "rgba(16, 185, 129, 0.1)" : "transparent"}
          stroke={borderColor}
          strokeWidth={detection.detected ? 3 : 2}
          strokeDasharray={detection.detected ? undefined : "10,5"}
        />

        {/* Köşe noktaları */}
        <G>
          {corners.map((corner, index) => (
            <G key={index}>
              {/* Dış halka */}
              <Circle
                cx={corner.x}
                cy={corner.y}
                r={12}
                fill={detection.detected ? borderColor : "transparent"}
                stroke={borderColor}
                strokeWidth={2}
              />
              {/* İç nokta */}
              <Circle cx={corner.x} cy={corner.y} r={4} fill="#fff" />
            </G>
          ))}
        </G>
      </Svg>

      {/* Rehber mesajı */}
      {showGuide && (
        <View style={styles.guideContainer}>
          <View style={[styles.guideBox, { borderColor }]}>
            <Text style={[styles.guideText, { color: borderColor }]}>
              {detection.detected
                ? detection.isCardShaped
                  ? "✓ Kimlik kartı algılandı"
                  : "△ Belge algılandı, kimlik kartı şeklinde değil"
                : "Kimlik kartınızı çerçeveye yerleştirin"}
            </Text>
          </View>
        </View>
      )}

      {/* Güven skoru */}
      {detection.detected && (
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${detection.confidence * 100}%`,
                  backgroundColor: detection.confidence > 0.7 ? "#10B981" : "#F59E0B"
                }
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>{Math.round(detection.confidence * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  guideContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  guideBox: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  guideText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center"
  },
  confidenceContainer: {
    position: "absolute",
    bottom: 200,
    left: 40,
    right: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden"
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 2
  },
  confidenceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  }
});

export default DocumentEdgeOverlay;
