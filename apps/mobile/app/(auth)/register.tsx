import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";
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
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable
        onPress={onSubmit}
        disabled={isLoading}
        style={({ pressed }) => [
          {
            backgroundColor: "#a855f7",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            opacity: isLoading || pressed ? 0.7 : 1
          }
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Kayıt ol</Text>
        )}
      </Pressable>
    </AuthScreen>
  );
}
