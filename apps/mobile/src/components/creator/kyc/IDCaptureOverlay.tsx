/**
 * IDCaptureOverlay Component
 * Kimlik kartı fotoğraf çekme overlay'i
 */

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_ASPECT_RATIO = 1.586; // Standard ID card ratio
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

interface IDCaptureOverlayProps {
  side: "front" | "back";
}

export function IDCaptureOverlay({ side }: IDCaptureOverlayProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top overlay */}
      <View style={styles.topOverlay} />

      {/* Middle row with card cutout */}
      <View style={styles.middleRow}>
        <View style={styles.sideOverlay} />

        {/* Card frame */}
        <View style={styles.cardFrame}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Instructions */}
          <Text style={styles.instruction}>
            {side === "front"
              ? "Kimliğinizin ön yüzünü çerçeve içine yerleştirin"
              : "Kimliğinizin arka yüzünü çerçeve içine yerleştirin"}
          </Text>
        </View>

        <View style={styles.sideOverlay} />
      </View>

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        <View style={styles.tips}>
          <Text style={styles.tipTitle}>📸 İpuçları</Text>
          <Text style={styles.tipText}>• İyi aydınlatılmış bir ortamda çekin</Text>
          <Text style={styles.tipText}>• Parlamadan kaçının</Text>
          <Text style={styles.tipText}>• Tüm bilgilerin okunabilir olduğundan emin olun</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    minHeight: 80
  },
  middleRow: {
    flexDirection: "row",
    height: CARD_HEIGHT
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)"
  },
  cardFrame: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#10B981",
    borderWidth: 3
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12
  },
  instruction: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 24,
    paddingTop: 24,
    minHeight: 120
  },
  tips: {
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
