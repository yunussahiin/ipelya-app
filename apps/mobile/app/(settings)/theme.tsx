import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme, type ThemeColors, type ThemeAccent } from "@/theme/ThemeProvider";

const getAccentOptions = (
  colors: ThemeColors
): Array<{
  key: ThemeAccent;
  label: string;
  description: string;
  swatch: string;
}> => [
  { key: "magenta", label: "Neon", description: "Varsayılan", swatch: colors.accent },
  { key: "aqua", label: "Aqua", description: "Minimal", swatch: colors.accent },
  { key: "amber", label: "Amber", description: "Sunset", swatch: colors.accent }
];

/**
 * Theme Settings Screen
 *
 * Tema ayarlarını yönetir:
 * - Açık/koyu mod seçimi
 * - Vurgu rengi seçimi
 */
export default function ThemeScreen() {
  const router = useRouter();
  const { colors, accent, setAccent } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accentOptions = useMemo(() => getAccentOptions(colors), [colors]);

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
              <Text style={styles.title}>Tema</Text>
              <Text style={styles.subtitle}>Görünüm modunu ve vurgu rengini özelleştirin.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Görünüm Modu</Text>
            <Text style={styles.sectionSubtitle}>Açık veya koyu modu seçin.</Text>
            <View style={styles.themeControlRow}>
              <View>
                <Text style={styles.themeLabel}>Sistem Tercihi</Text>
                <Text style={styles.themeHint}>Cihaz ayarlarına göre otomatik değişir.</Text>
              </View>
              <ThemeToggle />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vurgu Rengi</Text>
            <Text style={styles.sectionSubtitle}>Uygulamanın ana rengini seçin.</Text>
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
    }
  });
