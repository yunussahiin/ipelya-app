/**
 * TopControls
 *
 * Kamera üst kontrolleri
 * - Kapatma butonu (sol)
 * - Flash toggle (orta)
 * - HDR toggle (sağ)
 */

import { memo, useEffect } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { X, Zap, ZapOff, Sun, Settings } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { TopControlsProps } from "../types";

const LOG_PREFIX = "[TopControls]";

function TopControlsComponent({
  flash,
  onFlashToggle,
  onClose,
  hasFlash = true,
  hdrEnabled = false,
  onHdrToggle,
  supportsHdr = false,
  onSettings
}: TopControlsProps) {
  // Mount log
  useEffect(() => {
    console.log(`${LOG_PREFIX} Mounted`, { flash, hasFlash, hdrEnabled, supportsHdr });
  }, []);

  // Flash değişiklik log
  useEffect(() => {
    console.log(`${LOG_PREFIX} Flash state:`, flash);
  }, [flash]);

  // HDR değişiklik log
  useEffect(() => {
    console.log(`${LOG_PREFIX} HDR state:`, hdrEnabled);
  }, [hdrEnabled]);

  /**
   * Flash toggle handler
   * Haptic feedback ile flash modunu değiştirir
   */
  const handleFlashToggle = () => {
    try {
      console.log(`${LOG_PREFIX} Flash toggle pressed`);
      Haptics.selectionAsync();
      onFlashToggle();
    } catch (error) {
      console.error(`${LOG_PREFIX} Flash toggle error:`, error);
    }
  };

  /**
   * Kapatma handler
   */
  const handleClose = () => {
    try {
      console.log(`${LOG_PREFIX} Close pressed`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose?.();
    } catch (error) {
      console.error(`${LOG_PREFIX} Close error:`, error);
    }
  };

  /**
   * HDR toggle handler
   */
  const handleHdrToggle = () => {
    try {
      console.log(`${LOG_PREFIX} HDR toggle pressed`);
      Haptics.selectionAsync();
      onHdrToggle?.();
    } catch (error) {
      console.error(`${LOG_PREFIX} HDR toggle error:`, error);
    }
  };

  /**
   * Settings handler
   */
  const handleSettings = () => {
    try {
      console.log(`${LOG_PREFIX} Settings pressed`);
      Haptics.selectionAsync();
      onSettings?.();
    } catch (error) {
      console.error(`${LOG_PREFIX} Settings error:`, error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sol: Kapatma + Settings */}
      <View style={styles.leftGroup}>
        <Pressable
          style={styles.controlButton}
          onPress={handleClose}
          accessibilityLabel="Kamerayı kapat"
          accessibilityRole="button"
        >
          <X size={28} color="#FFF" />
        </Pressable>

        {/* Settings Butonu */}
        <Pressable
          style={styles.controlButton}
          onPress={handleSettings}
          accessibilityLabel="Kamera ayarları"
          accessibilityRole="button"
        >
          <Settings size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Orta: Flash Toggle */}
      {hasFlash ? (
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
      ) : (
        // Flash yoksa boş placeholder (layout için)
        <View style={styles.placeholder} />
      )}

      {/* Sağ: HDR Toggle */}
      {supportsHdr ? (
        <Pressable
          style={[styles.controlButton, hdrEnabled && styles.activeButton]}
          onPress={handleHdrToggle}
          accessibilityLabel={hdrEnabled ? "HDR Kapalı" : "HDR Açık"}
          accessibilityRole="button"
        >
          <Sun size={24} color={hdrEnabled ? "#FFD700" : "#FFF"} />
          {hdrEnabled && <Text style={styles.hdrText}>HDR</Text>}
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
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
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  placeholder: {
    width: 44,
    height: 44
  },
  activeButton: {
    backgroundColor: "rgba(255,215,0,0.3)"
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
  },
  hdrText: {
    color: "#FFD700",
    fontSize: 8,
    fontWeight: "bold",
    position: "absolute",
    bottom: 4
  }
});

export const TopControls = memo(TopControlsComponent);
