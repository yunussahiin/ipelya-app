import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { clearSession } from "@/services/secure-store.service";
import { useAuthStore } from "@/store/auth.store";
import { useShadowMode } from "@/hooks/useShadowMode";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, accent, setAccent } = useTheme();
  const clearAuthSession = useAuthStore((s) => s.clearSession);
  const { enabled: shadowModeEnabled } = useShadowMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await clearSession();
      clearAuthSession();
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <PageScreen showNavigation={false}>
      {() => (
        <>
          <View style={styles.headerContainer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Ayarlar</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tercihler</Text>
            <View style={styles.settingsCard}>
              <Pressable style={styles.settingRow} onPress={() => router.push("/(settings)/theme")}>
                <View style={styles.settingRowContent}>
                  <Text style={styles.settingEmoji}>🎨</Text>
                  <View style={styles.settingRowText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Tema Ayarları
                    </Text>
                    <Text style={styles.settingRowHint}>Mod ve renk seçimi</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
              <Pressable
                style={styles.settingRow}
                onPress={() => router.push("/(settings)/notifications")}
              >
                <View style={styles.settingRowContent}>
                  <Text style={styles.settingEmoji}>🔔</Text>
                  <View style={styles.settingRowText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Bildirim Ayarları
                    </Text>
                    <Text style={styles.settingRowHint}>Push, e-posta ve mesaj</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
              <Pressable
                style={styles.settingRow}
                onPress={() => router.push("/(settings)/privacy")}
              >
                <View style={styles.settingRowContent}>
                  <Text style={styles.settingEmoji}>🔒</Text>
                  <View style={styles.settingRowText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Gizlilik Ayarları
                    </Text>
                    <Text style={styles.settingRowHint}>Profil ve mesajlaşma</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
              <Pressable
                style={[styles.settingRow, styles.settingRowLast]}
                onPress={() => router.push("/(settings)/shadow-profile")}
              >
                <View style={styles.settingRowContent}>
                  <Text style={styles.settingEmoji}>🎭</Text>
                  <View style={styles.settingRowText}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Gölge Profil
                    </Text>
                    <Text style={styles.settingRowHint}>PIN, biometric ve aktivite</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </Pressable>
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
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: 13
    },
    themeControlRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface
    },
    themeLabel: {
      color: colors.textPrimary,
      fontWeight: "600"
    },
    settingLabel: {
      color: colors.textPrimary,
      fontWeight: "500",
      fontSize: 16,
      flex: 1
    },
    themeHint: {
      color: colors.textMuted,
      fontSize: 15
    },
    settingHint: {
      color: colors.textMuted,
      fontSize: 13
    },
    accentRow: {
      flexDirection: "row",
      gap: 12
    },
    accentOption: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 6
    },
    accentOptionActive: {
      shadowColor: colors.accent,
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10
    },
    accentSwatch: {
      width: 24,
      height: 24,
      borderRadius: 12
    },
    accentLabel: {
      color: colors.textSecondary,
      fontWeight: "600"
    },
    accentLabelActive: {
      color: colors.textPrimary
    },
    accentDescription: {
      color: colors.textMuted,
      fontSize: 12
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
    settingEmoji: {
      fontSize: 24
    },
    settingRowText: {
      flex: 1,
      gap: 4
    },
    settingRowHint: {
      color: colors.textMuted,
      fontSize: 13
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 12,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.3)"
    },
    logoutText: {
      color: "#ef4444",
      fontSize: 15,
      fontWeight: "600"
    },
    settingButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 0
    },
    settingButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1
    },
    settingButtonText: {
      flex: 1,
      gap: 4
    }
  });
