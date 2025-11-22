import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ArrowLeft, Lock, Fingerprint, History, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

/**
 * Shadow Profile Settings Screen
 *
 * Gölge profil ayarlarını yönetir:
 * - PIN Değiştir
 * - Biometric Ayarları
 * - Aktivite Geçmişi
 */
export default function ShadowProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScreen showNavigation={false}>
      {() => (
        <>
          <View style={styles.headerContainer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Gölge Profil</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Güvenlik</Text>
            <View style={styles.settingsCard}>
              <Pressable
                style={styles.settingRow}
                onPress={() => router.push("/(profile)/shadow-pin")}
              >
                <View style={styles.settingRowContent}>
                  <Lock size={20} color={colors.accent} />
                  <View style={styles.settingRowText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      PIN Değiştir
                    </Text>
                    <Text style={styles.settingRowHint}>
                      Gölge profilinizin PIN'ini güncelleyin
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
              <Pressable
                style={[styles.settingRow, styles.settingRowLast]}
                onPress={() => router.push("/(settings)/shadow-biometric")}
              >
                <View style={styles.settingRowContent}>
                  <Fingerprint size={20} color={colors.accent} />
                  <View style={styles.settingRowText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Biometric Ayarları
                    </Text>
                    <Text style={styles.settingRowHint}>Face ID/Touch ID'yi yönetin</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktivite</Text>
            <View style={styles.settingsCard}>
              <Pressable
                style={styles.settingRow}
                onPress={() => router.push("/(settings)/shadow-audit")}
              >
                <View style={styles.settingRowContent}>
                  <History size={20} color={colors.accent} />
                  <View style={styles.settingRowText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Aktivite Geçmişi
                    </Text>
                    <Text style={styles.settingRowHint}>
                      Gölge profil aktivitelerinizi görüntüleyin
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
            </View>
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
      alignItems: "center",
      gap: 12,
      paddingBottom: 20,
      paddingTop: 8
    },
    backButton: {
      padding: 8,
      marginLeft: -8
    },
    title: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: "700",
      flex: 1
    },
    section: {
      gap: 24,
      marginBottom: 24
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginLeft: 16,
      marginBottom: 8
    },
    settingsCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    settingRowLast: {
      borderBottomWidth: 0
    },
    settingRowContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1
    },
    settingRowText: {
      flex: 1,
      gap: 4
    },
    settingLabel: {
      fontWeight: "500",
      fontSize: 16
    },
    settingRowHint: {
      color: colors.textMuted,
      fontSize: 13
    }
  });
