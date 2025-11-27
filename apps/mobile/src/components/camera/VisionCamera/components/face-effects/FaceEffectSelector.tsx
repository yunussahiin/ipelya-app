/**
 * FaceEffectSelector Component
 *
 * Efekt seçici UI
 * Kategorilere göre efektleri listeler ve seçim yapılmasını sağlar
 *
 * @module face-effects/FaceEffectSelector
 */

import React, { memo, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { FaceEffectConfig, FaceEffectCategory, FaceEffectPreset } from "./types";
import { EFFECT_PRESETS, getEffectsByCategory } from "./presets";

// =============================================
// TYPES
// =============================================

export interface FaceEffectSelectorProps {
  /** Aktif efektler */
  activeEffects: FaceEffectConfig[];
  /** Efekt seçildiğinde */
  onSelectEffect: (effect: FaceEffectConfig) => void;
  /** Efekt kaldırıldığında */
  onRemoveEffect: (effectId: string) => void;
  /** Preset seçildiğinde */
  onSelectPreset?: (preset: FaceEffectPreset) => void;
  /** Tüm efektler temizlendiğinde */
  onClearAll?: () => void;
}

// =============================================
// CONSTANTS
// =============================================

const CATEGORIES: { key: FaceEffectCategory; label: string; icon: string }[] = [
  { key: "accessories", label: "Aksesuarlar", icon: "👓" },
  { key: "makeup", label: "Makyaj", icon: "💄" },
  { key: "beauty", label: "Güzellik", icon: "✨" },
  { key: "particles", label: "Efektler", icon: "🌟" }
];

// =============================================
// COMPONENT
// =============================================

export const FaceEffectSelector = memo(function FaceEffectSelector({
  activeEffects,
  onSelectEffect,
  onRemoveEffect,
  onSelectPreset,
  onClearAll
}: FaceEffectSelectorProps) {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<FaceEffectCategory>("makeup");

  // Seçili kategorideki efektler
  const categoryEffects = getEffectsByCategory(selectedCategory);

  // Efekt aktif mi kontrol et
  const isEffectActive = useCallback(
    (effectId: string) => {
      return activeEffects.some((e) => e.id === effectId);
    },
    [activeEffects]
  );

  // Efekt toggle
  const handleEffectToggle = useCallback(
    (effect: FaceEffectConfig) => {
      if (isEffectActive(effect.id)) {
        onRemoveEffect(effect.id);
      } else {
        onSelectEffect(effect);
      }
    },
    [isEffectActive, onSelectEffect, onRemoveEffect]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Kategori Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryTab,
              {
                backgroundColor: selectedCategory === category.key ? colors.accent : colors.surface
              }
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                {
                  color: selectedCategory === category.key ? "#FFFFFF" : colors.textSecondary
                }
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Efekt Listesi */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.effectsContainer}
        contentContainerStyle={styles.effectsContent}
      >
        {categoryEffects.map((effect) => (
          <TouchableOpacity
            key={effect.id}
            style={[
              styles.effectItem,
              {
                backgroundColor: colors.surface,
                borderColor: isEffectActive(effect.id) ? colors.accent : colors.border,
                borderWidth: isEffectActive(effect.id) ? 2 : 1
              }
            ]}
            onPress={() => handleEffectToggle(effect)}
          >
            <View style={[styles.effectPreview, { backgroundColor: colors.surfaceAlt }]}>
              {/* TODO: Efekt önizleme thumbnail */}
              <Text style={styles.effectEmoji}>{getEffectEmoji(effect.type)}</Text>
            </View>
            <Text style={[styles.effectName, { color: colors.textPrimary }]} numberOfLines={1}>
              {effect.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Preset'ler */}
      <View style={styles.presetsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Hazır Kombinasyonlar
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsContent}
        >
          {EFFECT_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetItem,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}
              onPress={() => onSelectPreset?.(preset)}
            >
              <Text style={[styles.presetName, { color: colors.textPrimary }]}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Temizle Butonu */}
      {activeEffects.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.surface }]}
          onPress={onClearAll}
        >
          <Text style={[styles.clearButtonText, { color: colors.textMuted }]}>Tümünü Temizle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// =============================================
// HELPERS
// =============================================

function getEffectEmoji(type: FaceEffectConfig["type"]): string {
  const emojiMap: Record<string, string> = {
    glasses: "👓",
    sunglasses: "🕶️",
    crown: "👑",
    hat: "🎩",
    ears: "🐱",
    lipstick: "💋",
    eyeliner: "👁️",
    eyeshadow: "💜",
    blush: "🌸",
    contour: "✨",
    skin_smooth: "✨",
    skin_tone: "🌟",
    glow: "💫",
    brighten: "☀️",
    cat_face: "🐱",
    dog_face: "🐶",
    bunny_face: "🐰",
    anime_eyes: "👀",
    sparkle: "✨",
    hearts: "❤️",
    snow: "❄️",
    glitter: "🌟"
  };

  return emojiMap[type] || "✨";
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12
  },
  categoryContainer: {
    marginBottom: 12
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500"
  },
  effectsContainer: {
    marginBottom: 16
  },
  effectsContent: {
    paddingHorizontal: 16,
    gap: 12
  },
  effectItem: {
    width: 80,
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    marginRight: 12
  },
  effectPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  effectEmoji: {
    fontSize: 28
  },
  effectName: {
    fontSize: 12,
    textAlign: "center"
  },
  presetsSection: {
    paddingHorizontal: 16,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase"
  },
  presetsContent: {
    gap: 8
  },
  presetItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8
  },
  presetName: {
    fontSize: 14,
    fontWeight: "500"
  },
  clearButton: {
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500"
  }
});

export default FaceEffectSelector;
