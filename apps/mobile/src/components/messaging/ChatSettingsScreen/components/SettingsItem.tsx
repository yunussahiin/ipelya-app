/**
 * SettingsItem
 *
 * Amaç: Ayar öğesi
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  value?: string;
}

export const SettingsItem = memo(function SettingsItem({
  icon,
  label,
  onPress,
  destructive,
  value
}: SettingsItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && { backgroundColor: colors.backgroundRaised }
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={destructive ? colors.warning : colors.textPrimary} />
      <Text style={[styles.label, { color: destructive ? colors.warning : colors.textPrimary }]}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  label: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12
  },
  value: {
    fontSize: 14
  }
});
