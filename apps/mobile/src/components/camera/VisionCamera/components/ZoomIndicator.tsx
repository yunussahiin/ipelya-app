/**
 * ZoomIndicator
 *
 * Zoom seviyesi göstergesi
 * - 1.0x, 2.0x, vb. formatında gösterir
 * - Yarı saydam arka plan
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ZoomIndicatorProps } from "../types";

function ZoomIndicatorComponent({ zoom }: ZoomIndicatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.zoomText}>{zoom.toFixed(1)}x</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  zoomText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"]
  }
});

export const ZoomIndicator = memo(ZoomIndicatorComponent);
