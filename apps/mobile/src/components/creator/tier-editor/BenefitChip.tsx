/**
 * BenefitChip Component
 * Seçili avantajı gösteren chip bileşeni
 *
 * Tıklandığında avantajı kaldırır.
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TierBenefit } from "@/hooks/useTierTemplates";
import { ThemeColors } from "@/theme/ThemeProvider";

interface BenefitChipProps {
  benefit: TierBenefit;
  onRemove: () => void;
  colors: ThemeColors;
}

export function BenefitChip({ benefit, onRemove, colors }: BenefitChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: colors.accent + "20", borderColor: colors.accent }]}
      onPress={onRemove}
    >
      <Text style={styles.emoji}>{benefit.emoji}</Text>
      <Text style={[styles.text, { color: colors.accent }]}>{benefit.name}</Text>
      <Ionicons name="close" size={16} color={colors.accent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  emoji: {
    fontSize: 14
  },
  text: {
    fontSize: 13,
    fontWeight: "500"
  }
});
