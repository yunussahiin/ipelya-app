import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import { ArrowLeft, Eye, Lock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

/**
 * Privacy Settings Screen
 *
 * Gizlilik ayarlarını yönetir:
 * - Çevrimiçi durumu göster/gizle
 * - Direkt mesajlara izin ver/engelle
 */
export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScreen showNavigation={false}>
      {() => (
        <>
          <View style={styles.headerContainer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.header}>
              <Text style={styles.label}>Ayarlar</Text>
              <Text style={styles.title}>Gizlilik</Text>
              <Text style={styles.subtitle}>Gizlilik tercihlerinizi yönetin.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil Gizliliği</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Eye size={20} color={colors.accent} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Çevrimiçi Durumu Göster
                    </Text>
                    <Text style={styles.settingHint}>
                      Diğer kullanıcılar çevrimiçi olup olmadığınızı görebilir
                    </Text>
                  </View>
                </View>
                <Switch
                  value={onlineStatus}
                  onValueChange={setOnlineStatus}
                  trackColor={{ false: "#374151", true: colors.accent }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mesajlaşma</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Lock size={20} color={colors.accent} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Direkt Mesajlara İzin Ver
                    </Text>
                    <Text style={styles.settingHint}>Herkes size mesaj gönderebilir</Text>
                  </View>
                </View>
                <Switch
                  value={allowMessages}
                  onValueChange={setAllowMessages}
                  trackColor={{ false: "#374151", true: colors.accent }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 İpucu</Text>
            <Text style={styles.infoText}>
              Bu ayarlar sadece normal profiliniz için geçerlidir. Gölge profiliniz her zaman
              gizlidir.
            </Text>
          </View>
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
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 12,
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
    }
  });
