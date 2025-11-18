import { forwardRef } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField(
  { label, error, icon, ...props },
  ref
) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error && styles.errorShell]}>
        {icon ? <Ionicons name={icon} size={18} color="#a78bfa" /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.input}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 6
  },
  label: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: 14
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,7,20,0.6)"
  },
  errorShell: {
    borderColor: "#f87171"
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16
  },
  errorText: {
    color: "#f87171",
    fontSize: 12
  }
});
