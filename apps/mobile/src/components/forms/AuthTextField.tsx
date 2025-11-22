import { forwardRef } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField(
  { label, error, icon, ...props },
  ref
) {
  const { colors } = useTheme();
  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.wrapper}>
      <Text style={dynamicStyles.label}>{label}</Text>
      <View style={[dynamicStyles.inputShell, error && dynamicStyles.errorShell]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.accentSoft} style={dynamicStyles.icon} />
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={dynamicStyles.input}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.3}
          {...props}
        />
      </View>
      {error ? <Text style={dynamicStyles.errorText}>{error}</Text> : null}
    </View>
  );
});

function createStyles(colors: any) {
  return StyleSheet.create({
    wrapper: {
      gap: 6
    },
    label: {
      color: colors.textSecondary,
      fontWeight: "600",
      fontSize: 14,
      lineHeight: 20
    },
    inputShell: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "android" ? 12 : 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      backgroundColor: colors.surfaceAlt,
      minHeight: 48,
      // Android specific fixes
      ...(Platform.OS === "android" && {
        paddingVertical: 10
      })
    },
    errorShell: {
      borderColor: "#ef4444",
      borderWidth: 1.5
    },
    icon: {
      marginRight: 4
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
      padding: 0,
      textAlignVertical: "center",
      // Android specific
      ...(Platform.OS === "android" && {
        paddingVertical: 0
      })
    },
    errorText: {
      color: "#fca5a5",
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16
    }
  });
}
