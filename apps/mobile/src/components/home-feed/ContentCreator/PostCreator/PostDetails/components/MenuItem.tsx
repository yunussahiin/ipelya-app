/**
 * MenuItem Component
 * Ayarlar menü öğesi
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { MenuItemProps } from "../types";
import { menuItemStyles as styles } from "../styles";

export function MenuItem({ icon, label, value, onPress, showChevron }: MenuItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable style={[styles.container, { borderBottomColor: colors.border }]} onPress={onPress}>
      {icon}
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      {value && (
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text>
          {showChevron && <ChevronRight size={18} color={colors.textMuted} />}
        </View>
      )}
    </Pressable>
  );
}
