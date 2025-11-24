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
  const {
    signIn,
    signInWithGoogleOAuth,
    signInWithMagicLinkEmail,
    signInWithAppleOAuth,
    isLoading,
    error,
    setError
  } = useAuthActions();
  const { control, handleSubmit, formState, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur"
  });
  const email = watch("email");

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await signIn(email, password);
  });

  const handleGoogleSignIn = async () => {
    setError(null);
    await signInWithGoogleOAuth();
  };

  const handleMagicLink = async () => {
    setError(null);
    if (formState.isValid && email) {
      const success = await signInWithMagicLinkEmail(email);
      if (success) {
        setError(null);
        // Magic link başarıyla gönderildi - kullanıcıya bilgi ver
      }
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    await signInWithAppleOAuth();
  };

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
        style={({ pressed }) => {
          const isDisabled = isLoading || !formState.isValid;
          return [
            styles.loginButton,
            isDisabled && styles.loginButtonDisabled,
            {
              opacity: isDisabled || pressed ? 0.7 : 1
            }
          ];
        }}
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

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>veya</Text>
        <View style={styles.divider} />
      </View>

      {/* Google OAuth Button */}
      <Pressable
        onPress={handleGoogleSignIn}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.socialButton,
          {
            opacity: isLoading || pressed ? 0.7 : 1
          }
        ]}
        accessible={true}
        accessibilityLabel="Google ile giriş yap"
        accessibilityRole="button"
      >
        <Text style={styles.socialButtonText}>🔵 Google ile Giriş Yap</Text>
      </Pressable>

      {/* Magic Link Button */}
      <Pressable
        onPress={handleMagicLink}
        disabled={isLoading || !formState.isValid}
        style={({ pressed }) => [
          styles.socialButton,
          styles.magicLinkButton,
          {
            opacity: isLoading || !formState.isValid || pressed ? 0.7 : 1
          }
        ]}
        accessible={true}
        accessibilityLabel="Magic Link gönder"
        accessibilityRole="button"
      >
        <Text style={styles.magicLinkButtonText}>📧 Magic Link Gönder</Text>
      </Pressable>

      {/* Apple Sign-In Button (iOS only) */}
      {Platform.OS === "ios" && (
        <Pressable
          onPress={handleAppleSignIn}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.socialButton,
            styles.appleButton,
            {
              opacity: isLoading || pressed ? 0.7 : 1
            }
          ]}
          accessible={true}
          accessibilityLabel="Apple ile giriş yap"
          accessibilityRole="button"
        >
          <Text style={styles.appleButtonText}>🍎 Apple ile Giriş Yap</Text>
        </Pressable>
      )}
    </AuthScreen>
  );
}

function createStyles(colors: Record<string, string>) {
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
    loginButtonDisabled: {
      backgroundColor: colors.accentSoft,
      opacity: 0.5
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20
    },
    signupLink: {
      color: colors.accentSoft,
      fontWeight: "600"
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
      gap: 12
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500"
    },
    socialButton: {
      backgroundColor: colors.cardBackground,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 14 : 16,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...(Platform.OS === "android" && {
        elevation: 1
      })
    },
    socialButtonText: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 16,
      lineHeight: 24
    },
    magicLinkButton: {
      backgroundColor: colors.accentSoft + "15",
      borderColor: colors.accentSoft
    },
    magicLinkButtonText: {
      color: colors.accentSoft,
      fontWeight: "600",
      fontSize: 16,
      lineHeight: 24
    },
    appleButton: {
      backgroundColor: "#000000",
      borderColor: "#000000"
    },
    appleButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
      lineHeight: 24
    }
  });
}
