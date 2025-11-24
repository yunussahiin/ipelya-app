import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { ArrowLeft, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import ColorPicker, { Panel1, Preview, HueSlider, OpacitySlider } from "reanimated-color-picker";
import { PageScreen } from "@/components/layout/PageScreen";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  useTheme,
  type ThemeColors,
  type ThemeAccent,
  type ThemeScheme
} from "@/theme/ThemeProvider";
import { useSettingsStore } from "@/store/settings.store";

const accentSwatches: Record<Exclude<ThemeAccent, "custom">, Record<ThemeScheme, string>> = {
  magenta: {
    dark: "#ff3b81",
    light: "#d946ef"
  },
  aqua: {
    dark: "#22d3ee",
    light: "#0ea5e9"
  },
  amber: {
    dark: "#fbbf24",
    light: "#f97316"
  }
};

const getAccentOptions = (
  colors: ThemeColors,
  scheme: ThemeScheme
): Array<{
  key: ThemeAccent;
  label: string;
  description: string;
  swatch: string;
}> => [
  {
    key: "magenta",
    label: "Neon",
    description: "Varsayılan",
    swatch: accentSwatches.magenta[scheme]
  },
  { key: "aqua", label: "Aqua", description: "Minimal", swatch: accentSwatches.aqua[scheme] },
  { key: "amber", label: "Amber", description: "Sunset", swatch: accentSwatches.amber[scheme] }
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
  const { colors, accent, setAccent, scheme } = useTheme();
  const { customAccentColor, setCustomAccentColor } = useSettingsStore();
  const [showColorPicker, setShowColorPicker] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const accentOptions = useMemo(() => getAccentOptions(colors, scheme), [colors, scheme]);

  const handleSelectColor = ({ hex }: { hex: string }) => {
    setCustomAccentColor(hex);
    setAccent("custom");
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

            <Pressable
              onPress={() => setShowColorPicker(true)}
              style={[
                styles.accentOption,
                accent === "custom" && styles.accentOptionActive,
                accent === "custom" && { borderColor: colors.textPrimary }
              ]}
            >
              <View style={[styles.accentSwatch, { backgroundColor: customAccentColor }]} />
              <Text style={[styles.accentLabel, accent === "custom" && styles.accentLabelActive]}>
                Özel
              </Text>
              <Text style={styles.accentDescription}>Kendi rengin</Text>
            </Pressable>
          </View>

          <Modal
            visible={showColorPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowColorPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Renk Seç</Text>
                  <Pressable onPress={() => setShowColorPicker(false)}>
                    <X size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.colorPickerContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <ColorPicker
                    value={customAccentColor}
                    onComplete={handleSelectColor}
                    style={{ width: "100%" }}
                  >
                    <Preview />
                    <Panel1 />
                    <HueSlider />
                    <OpacitySlider />
                  </ColorPicker>
                </ScrollView>

                <Pressable
                  onPress={() => setShowColorPicker(false)}
                  style={[styles.confirmButton, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.confirmButtonText}>Tamam</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
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
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center"
    },
    modalContent: {
      borderRadius: 24,
      padding: 20,
      width: "85%",
      maxWidth: 320,
      gap: 16
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600"
    },
    colorPickerContainer: {
      maxHeight: 400,
      paddingVertical: 16
    },
    confirmButton: {
      borderRadius: 12,
      padding: 12,
      alignItems: "center"
    },
    confirmButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600"
    }
  });
