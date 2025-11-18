import { ActivityIndicator, Pressable, Text } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { AuthScreen } from "@/components/layout/AuthScreen";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { useAuthActions } from "@/hooks/useAuthActions";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(6, "En az 6 karakter")
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn, isLoading, error, setError } = useAuthActions();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await signIn(email, password);
  });

  return (
    <AuthScreen
      title="Tekrar hoş geldin"
      subtitle="Shadow mode ve token ekonomisine kaldığın yerden devam et."
      footer={
        <Text style={{ color: "#94a3b8" }}>
          Hesabın yok mu?{" "}
          <Link href="/(auth)/register" style={{ color: "#f472b6", fontWeight: "600" }}>
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
      <Pressable>
        <Text style={{ color: "#c084fc", textAlign: "right" }}>Şifremi unuttum</Text>
      </Pressable>
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable
        onPress={onSubmit}
        disabled={isLoading}
        style={({ pressed }) => [
          {
            backgroundColor: "#f472b6",
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
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Giriş yap</Text>
        )}
      </Pressable>
    </AuthScreen>
  );
}
