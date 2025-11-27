/**
 * ZoomIndicator
 *
 * Zoom kontrol butonları
 * - 0.5x (ultra-wide)
 * - 1x (wide-angle - neutral)
 * - 2x (telephoto)
 * - Aktif zoom göstergesi
 */

import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { ZoomIndicatorProps } from "../types";

const LOG_PREFIX = "[ZoomIndicator]";

// Zoom preset'leri (display value -> actual zoom multiplier from neutral)
const ZOOM_PRESETS = [
  { label: "0.5", multiplier: 0.5 },
  { label: "1", multiplier: 1 },
  { label: "2", multiplier: 2 }
];

function ZoomIndicatorComponent({
  zoom,
  onZoomChange,
  minZoom = 1,
  maxZoom = 10,
  neutralZoom = 2
}: ZoomIndicatorProps) {
  // Display zoom hesapla (neutral = 1x)
  const displayZoom = zoom / neutralZoom;

  // Aktif preset'i bul
  const getActivePreset = () => {
    for (const preset of ZOOM_PRESETS) {
      if (Math.abs(displayZoom - preset.multiplier) < 0.1) {
        return preset.label;
      }
    }
    return null;
  };

  const activePreset = getActivePreset();

  // Preset'e tıklandığında
  const handlePresetPress = (multiplier: number) => {
    const actualZoom = neutralZoom * multiplier;
    // Zoom sınırlarını kontrol et
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, actualZoom));
    console.log(`${LOG_PREFIX} Preset pressed: ${multiplier}x -> actualZoom: ${clampedZoom}`);
    Haptics.selectionAsync();
    onZoomChange?.(clampedZoom);
  };

  // Ultra-wide (0.5x) destekleniyor mu?
  const supportsUltraWide = minZoom < neutralZoom;

  return (
    <View style={styles.container}>
      {/* Zoom Presets */}
      {ZOOM_PRESETS.map((preset) => {
        // 0.5x sadece ultra-wide destekleniyorsa göster
        if (preset.multiplier === 0.5 && !supportsUltraWide) {
          return null;
        }

        const isActive = activePreset === preset.label;

        return (
          <Pressable
            key={preset.label}
            style={[styles.presetButton, isActive && styles.presetButtonActive]}
            onPress={() => handlePresetPress(preset.multiplier)}
          >
            <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
              {preset.label}x
            </Text>
          </Pressable>
        );
      })}

      {/* Custom zoom göstergesi (preset dışındaysa) */}
      {!activePreset && (
        <View style={[styles.presetButton, styles.presetButtonActive]}>
          <Text style={[styles.presetText, styles.presetTextActive]}>
            {displayZoom.toFixed(1)}x
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 4,
    gap: 4
  },
  presetButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 44,
    alignItems: "center"
  },
  presetButtonActive: {
    backgroundColor: "rgba(255,255,255,0.25)"
  },
  presetText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600"
  },
  presetTextActive: {
    color: "#FFD700",
    fontWeight: "700"
  }
});

export const ZoomIndicator = memo(ZoomIndicatorComponent);
