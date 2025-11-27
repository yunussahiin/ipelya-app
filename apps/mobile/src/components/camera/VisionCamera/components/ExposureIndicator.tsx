/**
 * ExposureIndicator
 *
 * Exposure (pozlama) göstergesi
 * - Sun ikonu
 * - Vertical slider
 * - -1 ile +1 arası değer
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Sun } from "lucide-react-native";

interface ExposureIndicatorProps {
  /** Exposure değeri (-1 ile 1 arası) */
  value: number;
}

function ExposureIndicatorComponent({ value }: ExposureIndicatorProps) {
  // Sadece 0'dan farklıysa göster
  if (Math.abs(value) < 0.05) {
    return null;
  }

  // Değeri yüzdeye çevir
  const percentage = Math.round(value * 100);
  const displayValue = percentage > 0 ? `+${percentage}%` : `${percentage}%`;

  return (
    <View style={styles.container}>
      <Sun size={20} color="#FFD700" />
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              {
                height: `${Math.abs(value) * 50}%`,
                bottom: value > 0 ? "50%" : undefined,
                top: value < 0 ? "50%" : undefined,
                backgroundColor: value > 0 ? "#FFD700" : "#666"
              }
            ]}
          />
          <View style={styles.sliderCenter} />
        </View>
      </View>
      <Text style={styles.valueText}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    top: "40%",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 10,
    gap: 8
  },
  sliderContainer: {
    height: 100,
    width: 4,
    justifyContent: "center"
  },
  sliderTrack: {
    flex: 1,
    width: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden"
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 2
  },
  sliderCenter: {
    position: "absolute",
    top: "50%",
    left: -2,
    right: -2,
    height: 2,
    backgroundColor: "#FFF",
    marginTop: -1
  },
  valueText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"]
  }
});

export const ExposureIndicator = memo(ExposureIndicatorComponent);
