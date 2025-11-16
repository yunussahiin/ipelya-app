import { useMemo } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = "primary", style }: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const labelColor = variant === "primary" ? colors.buttonPrimaryText : colors.textPrimary;

  return (
    <Pressable onPress={onPress} style={[styles.base, styles[variant], style]}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center"
    },
    primary: {
      backgroundColor: colors.accent
    },
    ghost: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt
    },
    label: {
      fontWeight: "600"
    }
  });
