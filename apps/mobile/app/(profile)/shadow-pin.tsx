import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from "react-native";
import { ArrowLeft, Lock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";

export default function ShadowPinScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handleCreatePin() {
    if (pin.length < 4) {
      setError("PIN en az 4 haneli olmalı");
      return;
    }

    if (step === "create") {
      setStep("confirm");
      setError("");
      return;
    }

    if (pin !== confirmPin) {
      setError("PIN'ler eşleşmiyor");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error("No user");

      // Edge Function çağrısı (enable-shadow-mode)
      const { error: functionError } = await supabase.functions.invoke("enable-shadow-mode", {
        body: { pin }
      });

      if (functionError) throw functionError;
      router.back();
    } catch (err) {
      console.error("Shadow PIN error:", err);
      setError("PIN ayarlanırken hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageScreen>
      {() => (
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessible={true}
              accessibilityLabel="Geri dön"
              accessibilityRole="button"
            >
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Gizli Profil PIN'i</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.iconSection}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
                <Lock size={48} color={colors.accent} />
              </View>
            </View>

            <View style={styles.textSection}>
              <Text style={styles.mainTitle}>
                {step === "create" ? "PIN Oluştur" : "PIN'i Onayla"}
              </Text>
              <Text style={styles.subtitle}>
                {step === "create"
                  ? "Gizli profilinize erişmek için 4-6 haneli bir PIN belirleyin"
                  : "PIN'inizi doğrulamak için tekrar girin"}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {step === "create" ? "PIN" : "PIN'i Onayla"}
                </Text>
                <TextInput
                  style={styles.pinInput}
                  placeholder="••••"
                  placeholderTextColor={colors.textMuted}
                  value={step === "create" ? pin : confirmPin}
                  onChangeText={step === "create" ? setPin : setConfirmPin}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              {error && (
                <View style={[styles.errorBox, { backgroundColor: colors.surface }]}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                onPress={handleCreatePin}
                disabled={loading}
                accessible={true}
                accessibilityLabel="Onayla"
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {step === "create" ? "Devam Et" : "PIN'i Ayarla"}
                  </Text>
                )}
              </Pressable>

              {step === "confirm" && (
                <Pressable
                  style={styles.backStepButton}
                  onPress={() => {
                    setStep("create");
                    setConfirmPin("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  <Text style={styles.backStepButtonText}>Geri Dön</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Güvenlik İpuçları</Text>
              <Text style={styles.infoText}>• Doğum tarihinizi PIN olarak kullanmayın</Text>
              <Text style={styles.infoText}>• Kolayca tahmin edilebilir sayıları kaçının</Text>
              <Text style={styles.infoText}>• PIN'inizi kimseyle paylaşmayın</Text>
            </View>
          </View>
        </View>
      )}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 32
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      flex: 1
    },
    content: {
      flex: 1,
      justifyContent: "center",
      gap: 32
    },
    iconSection: {
      alignItems: "center"
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center"
    },
    textSection: {
      alignItems: "center",
      gap: 8
    },
    mainTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center"
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20
    },
    form: {
      gap: 16
    },
    formGroup: {
      gap: 8
    },
    label: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    pinInput: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      fontSize: 24,
      color: colors.textPrimary,
      textAlign: "center",
      letterSpacing: 8,
      minHeight: 56
    },
    errorBox: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#ef4444"
    },
    errorText: {
      color: "#ef4444",
      fontSize: 14
    },
    confirmButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 48
    },
    confirmButtonDisabled: {
      opacity: 0.6
    },
    confirmButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "700"
    },
    backStepButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center"
    },
    backStepButtonText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    infoBox: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8
    },
    infoTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18
    }
  });
