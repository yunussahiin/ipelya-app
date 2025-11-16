import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      marginBottom: 8
    },
    value: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700"
    }
  });
