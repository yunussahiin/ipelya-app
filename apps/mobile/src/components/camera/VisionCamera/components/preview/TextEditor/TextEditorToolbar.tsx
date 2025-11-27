/**
 * TextEditorToolbar
 *
 * Alt toolbar - font, renk, stil, hizalama butonları
 */

import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { AlignLeft, AlignCenter, AlignRight, Sparkles } from "lucide-react-native";

import type { PanelType, Alignment } from "./types";
import { TEXT_STYLES } from "./constants";

interface TextEditorToolbarProps {
  activePanel: PanelType;
  selectedColor: string;
  textStyleId: string;
  alignment: Alignment;
  onTogglePanel: (panel: "font" | "color" | "style") => void;
  onAlignmentToggle: () => void;
  onBackgroundToggle: () => void;
}

/**
 * TextEditorToolbar Component
 */
export const TextEditorToolbar = memo(function TextEditorToolbar({
  activePanel,
  selectedColor,
  textStyleId,
  alignment,
  onTogglePanel,
  onAlignmentToggle,
  onBackgroundToggle
}: TextEditorToolbarProps) {
  const currentTextStyle = TEXT_STYLES.find((t) => t.id === textStyleId) || TEXT_STYLES[0];

  // Alignment icon
  const AlignmentIcon =
    alignment === "left" ? AlignLeft : alignment === "right" ? AlignRight : AlignCenter;

  return (
    <View style={styles.toolbar}>
      {/* Font Style - Aa */}
      <Pressable
        style={[styles.toolButton, activePanel === "font" && styles.toolButtonActive]}
        onPress={() => onTogglePanel("font")}
      >
        <Text style={styles.toolButtonText}>Aa</Text>
      </Pressable>

      {/* Color */}
      <Pressable
        style={[styles.toolButton, activePanel === "color" && styles.toolButtonActive]}
        onPress={() => onTogglePanel("color")}
      >
        <View style={[styles.colorIndicator, { backgroundColor: selectedColor }]} />
      </Pressable>

      {/* Text Style */}
      <Pressable
        style={[styles.toolButton, activePanel === "style" && styles.toolButtonActive]}
        onPress={() => onTogglePanel("style")}
      >
        <Sparkles size={22} color={activePanel === "style" ? "#FFF" : "rgba(255,255,255,0.7)"} />
      </Pressable>

      {/* Alignment */}
      <Pressable style={styles.toolButton} onPress={onAlignmentToggle}>
        <AlignmentIcon size={22} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {/* Background Toggle */}
      <Pressable
        style={[styles.toolButton, currentTextStyle.hasBackground && styles.toolButtonActive]}
        onPress={onBackgroundToggle}
      >
        <View style={styles.backgroundToggle}>
          <Text style={styles.backgroundToggleText}>A</Text>
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  toolButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  toolButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "600"
  },
  colorIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFF"
  },
  backgroundToggle: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center"
  },
  backgroundToggleText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700"
  }
});
