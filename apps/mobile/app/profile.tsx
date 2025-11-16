import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { useTabsNavigation } from "@/navigation/useTabsNavigation";
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
  const layout = useDeviceLayout();
  const { tabs, activeKey, onChange } = useTabsNavigation();
  const { colors, accent, setAccent, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showGlows = scheme === "dark";

  const contentStyle = [
    styles.scroll,
    {
      paddingTop: layout.topPadding,
      paddingBottom: layout.navPadding,
      paddingHorizontal: layout.contentPaddingHorizontal,
      gap: layout.sectionGap
    },
    layout.contentWidth ? { width: layout.contentWidth, alignSelf: "center" } : null
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View style={styles.chrome}>
        {showGlows ? (
          <>
            <View pointerEvents="none" style={[styles.edgeGlow, styles.topGlow, { height: layout.insets.top + 80 }]} />
            <View pointerEvents="none" style={[styles.edgeGlow, styles.bottomGlow, { height: layout.insets.bottom + 140 }]} />
          </>
        ) : null}
        <ScrollView style={styles.scrollView} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
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
        </ScrollView>
        <BottomNavigation items={tabs} activeKey={activeKey} onChange={onChange} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background
    },
    chrome: {
      flex: 1,
      position: "relative"
    },
    edgeGlow: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: -1,
      backgroundColor: colors.background
    },
    topGlow: {
      top: 0,
      shadowColor: colors.glowShadow,
      shadowOffset: { height: 24, width: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 50,
      elevation: 35
    },
    bottomGlow: {
      bottom: 0,
      shadowColor: colors.glowShadow,
      shadowOffset: { height: -24, width: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 60,
      elevation: 40
    },
    scrollView: {
      flex: 1
    },
    scroll: {
      flexGrow: 1
    },
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
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 18
    },
    memberName: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 16
    },
    memberRole: {
      color: colors.textSecondary,
      marginTop: 6
    },
    themeControlRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 8
    },
    themeLabel: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 14
    },
    themeHint: {
      color: colors.textSecondary,
      fontSize: 12
    },
    accentRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12
    },
    accentOption: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 16,
      padding: 12,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      gap: 6
    },
    accentOptionActive: {
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.2,
      shadowRadius: 8
    },
    accentSwatch: {
      width: 28,
      height: 28,
      borderRadius: 14
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
      fontSize: 11
    }
  });
