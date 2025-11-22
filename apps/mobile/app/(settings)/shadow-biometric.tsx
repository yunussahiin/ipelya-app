import { useMemo, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, ActivityIndicator } from "react-native";
import { ArrowLeft, Fingerprint } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useShadowMode } from "@/hooks/useShadowMode";

/**
 * Shadow Biometric Settings Screen
 *
 * Biometric authentication ayarlarını yönetir:
 * - Face ID/Touch ID etkinleştir/devre dışı bırak
 * - Biometric türünü göster
 * - Fallback PIN seçeneği
 */
export default function ShadowBiometricScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { biometricAvailable } = useShadowMode();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    console.log("📱 Biometric Ayarları sayfası yüklendi");
    console.log(`🔍 Biometric kullanılabilir mi? ${biometricAvailable}`);

    return () => {
      console.log("👋 Biometric Ayarları sayfasından çıkılıyor");
    };
  }, [biometricAvailable]);

  const handleToggleBiometric = async (value: boolean) => {
    try {
      setLoading(true);
      console.log(
        `🔐 Biometric toggle başlatılıyor: ${value ? "Etkinleştir" : "Devre dışı bırak"}`
      );

      // TODO: Biometric ayarını Supabase'e kaydet
      console.log(`📱 Biometric durumu güncelleniyor: ${value}`);
      setBiometricEnabled(value);

      console.log(
        `✅ Biometric toggle başarılı: ${value ? "Etkinleştirildi" : "Devre dışı bırakıldı"}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      console.error(`❌ Biometric toggle hatası: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageScreen showNavigation={false}>
      {() => (
        <>
          <View style={styles.headerContainer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.header}>
              <Text style={styles.label}>Gölge Profil</Text>
              <Text style={styles.title}>Biometric</Text>
              <Text style={styles.subtitle}>
                Face ID veya Touch ID ile gölge profilinize erişin.
              </Text>
            </View>
          </View>

          {!biometricAvailable && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>⚠️ Biometric Kullanılamıyor</Text>
              <Text style={styles.warningText}>
                Bu cihazda biometric donanımı yüklü değil veya kaydedilmiş biometric veri
                bulunmuyor.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biometric Kimlik Doğrulama</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Fingerprint size={20} color={colors.accent} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Biometric Etkinleştir
                    </Text>
                    <Text style={styles.settingHint}>
                      {biometricAvailable
                        ? "Face ID veya Touch ID ile hızlı erişim"
                        : "Biometric donanımı mevcut değil"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  disabled={!biometricAvailable || loading}
                  trackColor={{ false: "#374151", true: colors.accent }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Güvenlik Seçenekleri</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🔒 PIN Fallback</Text>
              <Text style={styles.infoText}>
                Biometric doğrulama başarısız olursa, PIN ile gölge profilinize erişebilirsiniz.
              </Text>
            </View>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}
        </>
      )}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingBottom: 16
    },
    backButton: {
      padding: 8,
      marginTop: -8
    },
    header: {
      gap: 8,
      flex: 1
    },
    label: {
      color: colors.textSecondary,
      textTransform: "uppercase",
      fontSize: 12
    },
    title: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: "700"
    },
    subtitle: {
      color: colors.textSecondary,
      lineHeight: 20
    },
    warningCard: {
      backgroundColor: "rgba(251, 191, 36, 0.1)",
      borderColor: "rgba(251, 191, 36, 0.3)",
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      gap: 8
    },
    warningTitle: {
      color: "#fbbf24",
      fontWeight: "600",
      fontSize: 14
    },
    warningText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18
    },
    section: {
      gap: 12,
      marginBottom: 16
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600"
    },
    settingsCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    },
    settingContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1
    },
    settingText: {
      flex: 1,
      gap: 4
    },
    settingLabel: {
      fontWeight: "600",
      fontSize: 15
    },
    settingHint: {
      color: colors.textSecondary,
      fontSize: 12
    },
    infoCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 8
    },
    infoTitle: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 14
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 32
    }
  });
