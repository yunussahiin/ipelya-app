/**
 * AdjustmentSlider
 *
 * Brightness, Contrast, Saturation ayarları için slider
 * Basit buton bazlı kontrol (slider hook sorunu nedeniyle)
 */

import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Sun, Contrast, Palette, RotateCcw, Minus, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const LOG_PREFIX = "[AdjustmentSlider]";

export type AdjustmentType = "brightness" | "contrast" | "saturation";

interface AdjustmentSliderProps {
  type: AdjustmentType;
  value: number; // -1 to 1
  onChange: (value: number) => void;
  onReset?: () => void;
}

const ADJUSTMENT_CONFIG: Record<AdjustmentType, { label: string; icon: typeof Sun }> = {
  brightness: { label: "Parlaklık", icon: Sun },
  contrast: { label: "Kontrast", icon: Contrast },
  saturation: { label: "Doygunluk", icon: Palette }
};

export const AdjustmentSlider = memo(function AdjustmentSlider({
  type,
  value,
  onChange,
  onReset
}: AdjustmentSliderProps) {
  console.log(`${LOG_PREFIX} Rendering ${type} with value:`, value);

  const config = ADJUSTMENT_CONFIG[type];
  const Icon = config.icon;

  const handleDecrease = useCallback(() => {
    const newValue = Math.max(-1, value - 0.1);
    onChange(Math.round(newValue * 10) / 10);
    Haptics.selectionAsync();
  }, [value, onChange]);

  const handleIncrease = useCallback(() => {
    const newValue = Math.min(1, value + 0.1);
    onChange(Math.round(newValue * 10) / 10);
    Haptics.selectionAsync();
  }, [value, onChange]);

  const handleReset = useCallback(() => {
    console.log(`${LOG_PREFIX} Reset ${type}`);
    onChange(0);
    onReset?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [type, onChange, onReset]);

  // Display value as percentage
  const displayValue = Math.round(value * 100);

  // Calculate fill width (0-100%)
  const fillPercent = ((value + 1) / 2) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Icon size={16} color="#FFF" />
          <Text style={styles.label}>{config.label}</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{displayValue > 0 ? `+${displayValue}` : displayValue}</Text>
          {value !== 0 && (
            <Pressable onPress={handleReset} hitSlop={10}>
              <RotateCcw size={14} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        {/* Decrease Button */}
        <Pressable
          style={[styles.controlButton, value <= -1 && styles.controlButtonDisabled]}
          onPress={handleDecrease}
          disabled={value <= -1}
        >
          <Minus size={20} color={value <= -1 ? "rgba(255,255,255,0.3)" : "#FFF"} />
        </Pressable>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressCenter} />
            <View style={[styles.progressFill, { width: `${fillPercent}%` }]} />
            <View style={[styles.progressThumb, { left: `${fillPercent}%` }]} />
          </View>
        </View>

        {/* Increase Button */}
        <Pressable
          style={[styles.controlButton, value >= 1 && styles.controlButtonDisabled]}
          onPress={handleIncrease}
          disabled={value >= 1}
        >
          <Plus size={20} color={value >= 1 ? "rgba(255,255,255,0.3)" : "#FFF"} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  label: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500"
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  value: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right"
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  controlButtonDisabled: {
    opacity: 0.5
  },
  progressContainer: {
    flex: 1,
    height: 24,
    justifyContent: "center"
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    position: "relative"
  },
  progressCenter: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: "rgba(255,255,255,0.4)"
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#FFF",
    borderRadius: 2
  },
  progressThumb: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginLeft: -8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3
  }
});

export default AdjustmentSlider;
