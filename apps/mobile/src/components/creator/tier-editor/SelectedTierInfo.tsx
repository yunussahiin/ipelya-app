/**
 * SelectedTierInfo Component
 * Seçili tier şablonunun bilgilerini gösteren kart
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TierTemplate } from "@/hooks/useTierTemplates";
import { ThemeColors } from "@/theme/ThemeProvider";

interface SelectedTierInfoProps {
  template: TierTemplate;
  colors: ThemeColors;
}

export function SelectedTierInfo({ template, colors }: SelectedTierInfoProps) {
  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={styles.emoji}>{template.emoji}</Text>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{template.name} Tier</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {template.description || `${template.name} seviyesi abonelik`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12
  },
  emoji: {
    fontSize: 32
  },
  content: {
    flex: 1
  },
  name: {
    fontSize: 18,
    fontWeight: "700"
  },
  description: {
    fontSize: 13,
    marginTop: 2
  }
});
