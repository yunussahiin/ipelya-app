import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import { LogOut } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme, type ThemeColors, type ThemeAccent } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { clearSession } from "@/services/secure-store.service";
import { useAuthStore } from "@/store/auth.store";

const accentOptions: Array<{
  key: ThemeAccent;
  label: string;
  description: string;
  swatch: string;
}> = [
  { key: "magenta", label: "Neon", description: "Varsayılan", swatch: "#ff3b81" },
  { key: "aqua", label: "Aqua", description: "Minimal", swatch: "#22d3ee" },
  { key: "amber", label: "Amber", description: "Sunset", swatch: "#fbbf24" }
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, accent, setAccent } = useTheme();
  const clearAuthSession = useAuthStore((s) => s.clearSession);
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
          <View style={styles.header}>
            <Text style={styles.label}>Ayarlar</Text>
            <Text style={styles.title}>Tercihler</Text>
            <Text style={styles.subtitle}>Uygulama tercihlerinizi yönetin ve özelleştirin.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tema Yönetimi</Text>
            <Text style={styles.sectionSubtitle}>Açık/koyu modunu ve vurgu rengini seçin.</Text>
            <View style={styles.themeControlRow}>
              <View>
                <Text style={styles.themeLabel}>Görünüm Modu</Text>
                <Text style={styles.themeHint}>Sistem tercihini anında değiştir.</Text>
              </View>
              <ThemeToggle />
            </View>
            <Text style={styles.themeLabel}>Vurgu Rengi</Text>
            <View style={styles.accentRow}>
              {accentOptions.map((option) => {
                const isActive = accent === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setAccent(option.key)}
                    style={[
                      styles.accentOption,
                      isActive && styles.accentOptionActive,
                      isActive && { borderColor: colors.textPrimary }
                    ]}
                  >
                    <View style={[styles.accentSwatch, { backgroundColor: option.swatch }]} />
                    <Text style={[styles.accentLabel, isActive && styles.accentLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={styles.accentDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bildirimler</Text>
            <View style={styles.settingsCard}>
              <SettingRow label="Push Bildirimleri" defaultValue={true} colors={colors} />
              <SettingRow label="E-posta Bildirimleri" defaultValue={true} colors={colors} />
              <SettingRow label="Mesaj Bildirimleri" defaultValue={true} colors={colors} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gizlilik</Text>
            <View style={styles.settingsCard}>
              <SettingRow label="Çevrimiçi Durumu Göster" defaultValue={true} colors={colors} />
              <SettingRow label="Direkt Mesajlara İzin Ver" defaultValue={true} colors={colors} />
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

function SettingRow({
  label,
  defaultValue,
  colors
}: {
  label: string;
  defaultValue: boolean;
  colors: ThemeColors;
}) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <View style={staticStyles.settingRow}>
      <Text style={[staticStyles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{ false: "#374151", true: colors.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

import React from "react";

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      gap: 6
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
      gap: 12
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600"
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
    themeHint: {
      color: colors.textSecondary,
      fontSize: 12
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
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 12
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
    }
  });

const staticStyles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8
  },
  settingLabel: {
    fontSize: 15
  }
});
