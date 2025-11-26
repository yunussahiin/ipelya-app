/**
 * TopControls
 *
 * Kamera üst kontrolleri
 * - Kapatma butonu
 * - Flash toggle (Kapalı/Açık/Otomatik)
 * - Ayarlar placeholder
 */

import { memo } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { X, Zap, ZapOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { TopControlsProps } from "../types";

function TopControlsComponent({
  flash,
  onFlashToggle,
  onClose,
  hasFlash = true
}: TopControlsProps) {
  /**
   * Flash toggle handler
   * Haptic feedback ile flash modunu değiştirir
   */
  const handleFlashToggle = () => {
    Haptics.selectionAsync();
    onFlashToggle();
  };

  /**
   * Kapatma handler
   */
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  return (
    <View style={styles.container}>
      {/* Kapatma Butonu */}
      <Pressable
        style={styles.controlButton}
        onPress={handleClose}
        accessibilityLabel="Kamerayı kapat"
        accessibilityRole="button"
      >
        <X size={28} color="#FFF" />
      </Pressable>

      {/* Flash Toggle */}
      {hasFlash && (
        <Pressable
          style={styles.controlButton}
          onPress={handleFlashToggle}
          accessibilityLabel={`Flash: ${flash === "off" ? "Kapalı" : flash === "on" ? "Açık" : "Otomatik"}`}
          accessibilityRole="button"
        >
          {flash === "off" ? (
            <ZapOff size={24} color="#FFF" />
          ) : flash === "on" ? (
            <Zap size={24} color="#FFD700" />
          ) : (
            // Auto mode - "A" harfi ile göster
            <View style={styles.flashAutoContainer}>
              <Zap size={18} color="#FFD700" />
              <Text style={styles.flashAutoText}>A</Text>
            </View>
          )}
        </Pressable>
      )}

      {/* Ayarlar Placeholder - İleride kullanılacak */}
      <View style={styles.controlButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  flashAutoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  flashAutoText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold"
  }
});

export const TopControls = memo(TopControlsComponent);
