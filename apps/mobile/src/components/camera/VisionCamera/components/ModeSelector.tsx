/**
 * ModeSelector
 *
 * Fotoğraf/Video mod seçici
 * - Türkçe etiketler
 * - Aktif mod vurgusu
 * - Haptic feedback
 */

import { memo } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Camera as CameraIcon, Video } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { ModeSelectorProps } from "../types";
import { UI_TEXTS } from "../types";

function ModeSelectorComponent({
  currentMode,
  onModeChange,
  accentColor,
  disabled = false
}: ModeSelectorProps) {
  /**
   * Mod değiştirme handler
   */
  const handleModeChange = (mode: "photo" | "video") => {
    if (disabled || mode === currentMode) return;
    Haptics.selectionAsync();
    onModeChange(mode);
  };

  return (
    <View style={styles.container}>
      {/* Fotoğraf Modu */}
      <Pressable
        style={[styles.modeButton, currentMode === "photo" && styles.modeButtonActive]}
        onPress={() => handleModeChange("photo")}
        disabled={disabled}
        accessibilityLabel={UI_TEXTS.modePhoto}
        accessibilityRole="button"
        accessibilityState={{ selected: currentMode === "photo" }}
      >
        <CameraIcon size={18} color={currentMode === "photo" ? accentColor : "#FFF"} />
        <Text style={[styles.modeText, { color: currentMode === "photo" ? accentColor : "#FFF" }]}>
          {UI_TEXTS.modePhoto}
        </Text>
      </Pressable>

      {/* Video Modu */}
      <Pressable
        style={[styles.modeButton, currentMode === "video" && styles.modeButtonActive]}
        onPress={() => handleModeChange("video")}
        disabled={disabled}
        accessibilityLabel={UI_TEXTS.modeVideo}
        accessibilityRole="button"
        accessibilityState={{ selected: currentMode === "video" }}
      >
        <Video size={18} color={currentMode === "video" ? accentColor : "#FFF"} />
        <Text style={[styles.modeText, { color: currentMode === "video" ? accentColor : "#FFF" }]}>
          {UI_TEXTS.modeVideo}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 4,
    gap: 4
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6
  },
  modeButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  modeText: {
    fontSize: 13,
    fontWeight: "600"
  }
});

export const ModeSelector = memo(ModeSelectorComponent);
