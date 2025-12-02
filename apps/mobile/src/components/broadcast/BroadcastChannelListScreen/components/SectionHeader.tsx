/**
 * SectionHeader
 *
 * Amaç: Section başlığı
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function SectionHeader({ title, count, icon }: SectionHeaderProps) {
  const { colors } = useTheme();

  const getIcon = () => {
    if (icon) return icon;
    if (title === "Kanallarım") return "megaphone";
    if (title === "Takip Ettiklerim") return "heart";
    if (title === "Popüler Kanallar") return "trending-up";
    return "list";
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}15` }]}>
        <Ionicons name={getIcon()} size={14} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.countText, { color: colors.textMuted }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 20,
    gap: 8
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  countText: {
    fontSize: 12,
    fontWeight: "600"
  }
});
