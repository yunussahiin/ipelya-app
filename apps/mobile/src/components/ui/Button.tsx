import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = "primary", style }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.base, styles[variant], style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  primary: {
    backgroundColor: "#FF3B81"
  },
  ghost: {
    borderWidth: 1,
    borderColor: "#3f3f46"
  },
  label: {
    color: "#ffffff",
    fontWeight: "600"
  }
});
