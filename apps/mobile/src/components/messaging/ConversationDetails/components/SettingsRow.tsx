/**
 * SettingsRow
 * Amaç: Ayar satırı komponenti
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { ChevronRight, LucideIcon } from "lucide-react-native";

interface SettingsRowProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
}

export function SettingsRow({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  onPress,
  showChevron = true
}: SettingsRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.surface : "transparent" }
      ]}
      onPress={onPress}
    >
      <Icon size={22} color={iconColor || colors.textPrimary} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {showChevron && <ChevronRight size={20} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: "400"
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2
  }
});
