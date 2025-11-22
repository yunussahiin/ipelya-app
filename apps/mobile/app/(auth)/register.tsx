import { ActivityIndicator, Pressable, Text, StyleSheet, View, Platform } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { AuthScreen } from "@/components/layout/AuthScreen";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { useAuthActions } from "@/hooks/useAuthActions";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

const schema = z
  .object({
    email: z.string().email("Geçerli bir e-posta gir"),
    password: z.string().min(6, "En az 6 karakter"),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp, isLoading, error, setError } = useAuthActions();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" }
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await signUp(email, password);
  });

  const styles = createStyles(colors);

  return (
    <AuthScreen
      title="Yeni bir gerçeklik başlat"
      subtitle="Shadow profilini ve gerçek kimliğini aynı anda yönet."
      footer={
        <Text style={styles.footerText}>
          Hesabın var mı?{" "}
          <Link href="/(auth)/login" style={styles.loginLink}>
            Giriş yap
          </Link>
        </Text>
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <AuthTextField
            label="E-posta"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={(text) => {
              setError(null);
              onChange(text);
            }}
            onBlur={onBlur}
            icon="mail-outline"
            error={fieldState.error?.message}
            placeholder="ornek@ipelya.com"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <AuthTextField
            label="Şifre"
            secureTextEntry
            value={value}
            onChangeText={(text) => {
              setError(null);
              onChange(text);
            }}
            onBlur={onBlur}
            icon="lock-closed-outline"
            error={fieldState.error?.message}
            placeholder="••••••••"
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <AuthTextField
            label="Şifreyi doğrula"
            secureTextEntry
            value={value}
            onChangeText={(text) => {
              setError(null);
              onChange(text);
            }}
            onBlur={onBlur}
            icon="shield-checkmark-outline"
            error={fieldState.error?.message}
            placeholder="••••••••"
          />
        )}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable
        onPress={onSubmit}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.registerButton,
          {
            opacity: isLoading || pressed ? 0.7 : 1
          }
        ]}
        accessible={true}
        accessibilityLabel="Kayıt ol"
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
        ) : (
          <Text style={styles.registerButtonText}>Kayıt ol</Text>
        )}
      </Pressable>
    </AuthScreen>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    errorContainer: {
      backgroundColor: `${colors.warning}15`,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      marginBottom: 16
    },
    errorText: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20
    },
    registerButton: {
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 14 : 16,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight,
      marginTop: 8,
      ...(Platform.OS === "android" && {
        elevation: 3
      })
    },
    registerButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      fontSize: 16,
      lineHeight: 24
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20
    },
    loginLink: {
      color: colors.accentSoft,
      fontWeight: "600"
    }
  });
}
