import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { PageScreen } from "@/components/layout/PageScreen";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme, type ThemeColors, type ThemeAccent } from "@/theme/ThemeProvider";

const auditSections = [
  { label: "Güven", value: "PIN bağlı", status: "aktif" },
  { label: "Gelir", value: "₺24.8K", status: "+12%" },
  { label: "DM", value: "1.1dk", status: "hedef" }
];

const accentOptions: Array<{ key: ThemeAccent; label: string; description: string; swatch: string }> = [
  { key: "magenta", label: "Neon", description: "Varsayılan", swatch: "#ff3b81" },
  { key: "aqua", label: "Aqua", description: "Minimal", swatch: "#22d3ee" },
  { key: "amber", label: "Amber", description: "Sunset", swatch: "#fbbf24" }
];

export default function ProfileScreen() {
  const { colors, accent, setAccent } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScreen>
      {() => (
        <>
          <View style={styles.header}>
            <Text style={styles.label}>Profil</Text>
            <Text style={styles.title}>Studio Hesabı</Text>
            <Text style={styles.subtitle}>Güvenlik, ekip izinleri ve gelir özetlerini tek bakışta kontrol et.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tema Yönetimi</Text>
            <Text style={styles.sectionSubtitle}>Demo alanında karanlık/aydınlık modunu ve vurgu rengini test et.</Text>
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
                    style={[styles.accentOption, isActive && styles.accentOptionActive, isActive && { borderColor: colors.textPrimary }]}
                  >
                    <View style={[styles.accentSwatch, { backgroundColor: option.swatch }]} />
                    <Text style={[styles.accentLabel, isActive && styles.accentLabelActive]}>{option.label}</Text>
                    <Text style={styles.accentDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Özet</Text>
            <View style={styles.statRow}>
              {auditSections.map((item) => (
                <View key={item.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statStatus}>{item.status}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ekip</Text>
            <View style={styles.memberCard}>
              <Text style={styles.memberName}>Shadow Admin</Text>
              <Text style={styles.memberRole}>Full access · 3 MFA cihazı</Text>
            </View>
          </View>
        </>
      )}
    </PageScreen>
  );
}

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
    statRow: {
      flexDirection: "row",
      gap: 12
    },
    statCard: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 6
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 12
    },
    statValue: {
      color: colors.textPrimary,
      fontWeight: "700",
      fontSize: 18
    },
    statStatus: {
      color: colors.success,
      fontSize: 12
    },
    memberCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 18,
      gap: 6
    },
    memberName: {
      color: colors.textPrimary,
      fontWeight: "600"
    },
    memberRole: {
      color: colors.textSecondary
    }
  });
