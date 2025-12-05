/**
 * Connection Quality Indicator
 * Bağlantı kalitesini gösteren sinyal çubukları
 * LiveKit ConnectionQuality enum'unu kullanır
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export type ConnectionQualityLevel = "excellent" | "good" | "poor" | "lost" | "unknown";

interface ConnectionQualityIndicatorProps {
  quality: ConnectionQualityLevel;
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
}

export function ConnectionQualityIndicator({
  quality,
  showLabel = false,
  size = "medium"
}: ConnectionQualityIndicatorProps) {
  const { colors } = useTheme();

  // Size config
  const sizeConfig = {
    small: { barWidth: 3, barGap: 2, heights: [4, 6, 8, 10] },
    medium: { barWidth: 4, barGap: 2, heights: [6, 9, 12, 15] },
    large: { barWidth: 5, barGap: 3, heights: [8, 12, 16, 20] }
  }[size];

  // Quality config
  const getQualityConfig = () => {
    switch (quality) {
      case "excellent":
        return { activeBars: 4, color: "#10B981", label: "Mükemmel" };
      case "good":
        return { activeBars: 3, color: "#F59E0B", label: "İyi" };
      case "poor":
        return { activeBars: 2, color: "#EF4444", label: "Zayıf" };
      case "lost":
        return { activeBars: 0, color: "#6B7280", label: "Bağlantı Yok" };
      default:
        return { activeBars: 1, color: colors.textMuted, label: "Bilinmiyor" };
    }
  };

  const { activeBars, color, label } = getQualityConfig();

  return (
    <View style={styles.container}>
      <View style={[styles.barsContainer, { gap: sizeConfig.barGap }]}>
        {sizeConfig.heights.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                width: sizeConfig.barWidth,
                height,
                backgroundColor: index < activeBars ? color : `${colors.textMuted}40`,
                borderRadius: sizeConfig.barWidth / 2
              }
            ]}
          />
        ))}
      </View>
      {showLabel && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  bar: {
    // Dynamic styles applied inline
  },
  label: {
    fontSize: 12,
    fontWeight: "500"
  }
});

export default ConnectionQualityIndicator;
