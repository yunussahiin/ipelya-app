import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export function ThemeToggle() {
  const { scheme, toggleScheme, colors } = useTheme();

  return (
    <Pressable
      onPress={toggleScheme}
      style={[styles.base, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {scheme === "dark" ? "Dark" : "Light"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1
  },
  text: {
    fontWeight: "600",
    fontSize: 12
  }
});
