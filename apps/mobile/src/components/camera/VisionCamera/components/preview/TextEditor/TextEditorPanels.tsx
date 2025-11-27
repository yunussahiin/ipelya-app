/**
 * TextEditorPanels
 *
 * Font, renk ve stil seçim panelleri
 */

import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Droplet } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { FONT_STYLES, TEXT_STYLES, COLOR_PALETTE } from "./constants";
import type { PanelType } from "./types";

interface FontPanelProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

interface ColorPanelProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

interface StylePanelProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Font Stilleri Paneli
 */
export const FontStylePanel = memo(function FontStylePanel({
  selectedId,
  onSelect
}: FontPanelProps) {
  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    onSelect(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.panelScroll}
      contentContainerStyle={styles.panelContent}
      keyboardShouldPersistTaps="handled"
    >
      {FONT_STYLES.map((font) => (
        <Pressable
          key={font.id}
          style={[styles.fontStyleButton, selectedId === font.id && styles.fontStyleButtonActive]}
          onPress={() => handleSelect(font.id)}
        >
          <Text
            style={[
              styles.fontStyleText,
              { fontWeight: font.fontWeight },
              selectedId === font.id && styles.fontStyleTextActive
            ]}
          >
            {font.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
});

/**
 * Renk Paleti Paneli
 */
export const ColorPanel = memo(function ColorPanel({ selectedColor, onSelect }: ColorPanelProps) {
  const handleSelect = (color: string) => {
    Haptics.selectionAsync();
    onSelect(color);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.panelScroll}
      contentContainerStyle={styles.panelContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Damlalık (ileride color picker) */}
      <Pressable style={styles.colorPickerButton}>
        <Droplet size={20} color="#FFF" />
      </Pressable>
      {COLOR_PALETTE.map((color) => (
        <Pressable
          key={color}
          style={[
            styles.colorButton,
            { backgroundColor: color },
            selectedColor === color && styles.colorButtonActive
          ]}
          onPress={() => handleSelect(color)}
        />
      ))}
    </ScrollView>
  );
});

/**
 * Text Stilleri Paneli
 */
export const TextStylePanel = memo(function TextStylePanel({
  selectedId,
  onSelect
}: StylePanelProps) {
  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    onSelect(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.panelScroll}
      contentContainerStyle={styles.panelContent}
      keyboardShouldPersistTaps="handled"
    >
      {TEXT_STYLES.map((style) => (
        <Pressable
          key={style.id}
          style={[styles.styleButton, selectedId === style.id && styles.styleButtonActive]}
          onPress={() => handleSelect(style.id)}
        >
          <Text
            style={[
              styles.styleButtonText,
              selectedId === style.id && styles.styleButtonTextActive
            ]}
          >
            {style.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
});

/**
 * Panel Container - Aktif paneli render eder
 */
interface PanelContainerProps {
  activePanel: PanelType;
  fontStyleId: string;
  selectedColor: string;
  textStyleId: string;
  onFontStyleSelect: (id: string) => void;
  onColorSelect: (color: string) => void;
  onTextStyleSelect: (id: string) => void;
}

export const PanelContainer = memo(function PanelContainer({
  activePanel,
  fontStyleId,
  selectedColor,
  textStyleId,
  onFontStyleSelect,
  onColorSelect,
  onTextStyleSelect
}: PanelContainerProps) {
  return (
    <View style={styles.panelContainer}>
      {/* Font stilleri her zaman görünür */}
      <FontStylePanel selectedId={fontStyleId} onSelect={onFontStyleSelect} />

      {/* Aktif panel */}
      {activePanel === "color" && (
        <ColorPanel selectedColor={selectedColor} onSelect={onColorSelect} />
      )}

      {activePanel === "style" && (
        <TextStylePanel selectedId={textStyleId} onSelect={onTextStyleSelect} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  panelContainer: {
    gap: 8
  },
  panelScroll: {
    maxHeight: 44
  },
  panelContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center"
  },
  fontStyleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)"
  },
  fontStyleButtonActive: {
    backgroundColor: "#FFF"
  },
  fontStyleText: {
    color: "#FFF",
    fontSize: 15
  },
  fontStyleTextActive: {
    color: "#000"
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent"
  },
  colorButtonActive: {
    borderColor: "#FFF",
    transform: [{ scale: 1.15 }]
  },
  colorPickerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  styleButtonActive: {
    backgroundColor: "#FFF"
  },
  styleButtonText: {
    color: "#FFF",
    fontSize: 14
  },
  styleButtonTextActive: {
    color: "#000"
  }
});
