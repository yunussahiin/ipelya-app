import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#6b7280" style={styles.input} {...inputProps} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4
  },
  label: {
    color: "#f4f4f5",
    fontWeight: "500"
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    color: "#fafafa",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  error: {
    color: "#ef4444",
    fontSize: 12
  }
});
