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

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(6, "En az 6 karakter")
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, isLoading, error, setError } = useAuthActions();
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur"
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await signIn(email, password);
  });

  const styles = createStyles(colors);

  return (
    <AuthScreen
      title="Tekrar hoş geldin"
      subtitle="Shadow mode ve token ekonomisine kaldığın yerden devam et."
      footer={
        <Text style={styles.footerText}>
          Hesabın yok mu?{" "}
          <Link href="/(auth)/register" style={styles.signupLink}>
            Kayıt ol
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
            autoCorrect={false}
            value={value}
            onChangeText={(text) => {
              setError(null);
              onChange(text);
            }}
            onBlur={onBlur}
            icon="mail-outline"
            error={fieldState.error?.message}
            placeholder="ornek@ipelya.com"
            editable={!isLoading}
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
            editable={!isLoading}
          />
        )}
      />

      <Pressable
        disabled={isLoading}
        accessible={true}
        accessibilityLabel="Şifremi unuttum"
        accessibilityRole="link"
      >
        <Text style={styles.forgotPassword}>Şifremi unuttum</Text>
      </Pressable>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable
        onPress={onSubmit}
        disabled={isLoading || !formState.isValid}
        style={({ pressed }) => [
          styles.loginButton,
          {
            opacity: isLoading || !formState.isValid || pressed ? 0.7 : 1
          }
        ]}
        accessible={true}
        accessibilityLabel="Giriş yap"
        accessibilityHint="E-posta ve şifreyi girdikten sonra tıkla"
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading || !formState.isValid }}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
        ) : (
          <Text style={styles.loginButtonText}>Giriş yap</Text>
        )}
      </Pressable>
    </AuthScreen>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    forgotPassword: {
      color: colors.accentSoft,
      textAlign: "right",
      fontSize: 14,
      fontWeight: "500",
      paddingVertical: 8,
      lineHeight: 20
    },
    errorContainer: {
      backgroundColor: `${colors.warning}15`,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning
    },
    errorText: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20
    },
    loginButton: {
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 14 : 16,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight,
      marginTop: 8,
      // Android specific
      ...(Platform.OS === "android" && {
        elevation: 3
      })
    },
    loginButtonText: {
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
    signupLink: {
      color: colors.accentSoft,
      fontWeight: "600"
    }
  });
}
