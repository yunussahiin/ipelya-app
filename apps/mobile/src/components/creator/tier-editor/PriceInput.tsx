/**
 * PriceInput Component
 * Coin fiyat girişi için input bileşeni
 */

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { ThemeColors } from "@/theme/ThemeProvider";

interface PriceInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  hint?: string;
  period: "/ay" | "/yıl";
  colors: ThemeColors;
}

export function PriceInput({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  period,
  colors
}: PriceInputProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.inputRow}>
        <Text style={styles.coinIcon}>🪙</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />
        <Text style={[styles.period, { color: colors.textSecondary }]}>{period}</Text>
      </View>
      {hint && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  coinIcon: {
    fontSize: 24
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: "600"
  },
  period: {
    fontSize: 16
  },
  hint: {
    fontSize: 12,
    marginTop: 6
  }
});
