/**
 * BenefitItem Component
 * Avantaj seçim listesindeki tek bir avantaj satırı
 *
 * Seçili durumda checkmark gösterir.
 */

import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { TierBenefit } from "@/hooks/useTierTemplates";
import { ThemeColors } from "@/theme/ThemeProvider";

interface BenefitItemProps {
  benefit: TierBenefit;
  isSelected: boolean;
  onToggle: () => void;
  colors: ThemeColors;
}

export function BenefitItem({ benefit, isSelected, onToggle, colors }: BenefitItemProps) {
  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: isSelected ? colors.accent + "15" : colors.surface }]}
      onPress={onToggle}
    >
      <Text style={styles.emoji}>{benefit.emoji}</Text>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{benefit.name}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {benefit.description}
        </Text>
      </View>
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: colors.accent }]}>
          <Check size={14} color="#fff" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12
  },
  emoji: {
    fontSize: 24
  },
  content: {
    flex: 1
  },
  name: {
    fontSize: 15,
    fontWeight: "600"
  },
  description: {
    fontSize: 12,
    marginTop: 2
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  }
});
