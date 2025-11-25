/**
 * VibeSheet Component
 * Bottom sheet showing user's vibe preferences
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, Modal } from "react-native";
import { Sparkles, Heart, Zap, User } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

interface VibeSheetProps {
  visible: boolean;
  onClose: () => void;
  favoriteVibe: string | null;
  vibePreferences: string[] | null;
  mood: string | null;
  energy: string | null;
  personality: string | null;
}

const VIBE_ICONS: Record<string, string> = {
  dominant: "🔥",
  innocent: "🌸",
  mysterious: "🌙",
  romantic: "💕",
  playful: "✨",
  girl_next_door: "🏡"
};

const VIBE_LABELS: Record<string, string> = {
  dominant: "Dominant",
  innocent: "Masum",
  mysterious: "Gizemli",
  romantic: "Romantik",
  playful: "Oyuncu",
  girl_next_door: "Komşu Kızı"
};

export function VibeSheet({
  visible,
  onClose,
  favoriteVibe,
  vibePreferences,
  mood,
  energy,
  personality
}: VibeSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Title */}
          <View style={styles.header}>
            <Sparkles size={20} color={colors.accent} />
            <Text style={styles.title}>Vibe Profili</Text>
          </View>

          {/* Favorite Vibe */}
          {favoriteVibe && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ana Vibe</Text>
              <View style={[styles.vibeCard, styles.favoriteCard]}>
                <Text style={styles.vibeEmoji}>{VIBE_ICONS[favoriteVibe] || "✨"}</Text>
                <Text style={styles.vibeName}>{VIBE_LABELS[favoriteVibe] || favoriteVibe}</Text>
              </View>
            </View>
          )}

          {/* Vibe Preferences */}
          {vibePreferences && vibePreferences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vibe Tercihleri</Text>
              <View style={styles.vibeGrid}>
                {vibePreferences.map((vibe) => (
                  <View key={vibe} style={styles.vibeChip}>
                    <Text style={styles.chipEmoji}>{VIBE_ICONS[vibe] || "✨"}</Text>
                    <Text style={styles.chipText}>{VIBE_LABELS[vibe] || vibe}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mood, Energy, Personality */}
          {(mood || energy || personality) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kişilik</Text>
              <View style={styles.traitsGrid}>
                {mood && (
                  <View style={styles.traitCard}>
                    <Heart size={18} color={colors.accent} />
                    <Text style={styles.traitLabel}>Mood</Text>
                    <Text style={styles.traitValue}>{mood}</Text>
                  </View>
                )}
                {energy && (
                  <View style={styles.traitCard}>
                    <Zap size={18} color={colors.warning} />
                    <Text style={styles.traitLabel}>Enerji</Text>
                    <Text style={styles.traitValue}>{energy}</Text>
                  </View>
                )}
                {personality && (
                  <View style={styles.traitCard}>
                    <User size={18} color={colors.success} />
                    <Text style={styles.traitLabel}>Kişilik</Text>
                    <Text style={styles.traitValue}>{personality}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 20 }} />
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end"
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 34
    },
    handleBar: {
      width: 36,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 16
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 20
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary
    },
    section: {
      marginBottom: 20
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12
    },
    vibeCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.background
    },
    favoriteCard: {
      borderWidth: 1,
      borderColor: colors.accent
    },
    vibeEmoji: {
      fontSize: 28
    },
    vibeName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary
    },
    vibeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8
    },
    vibeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: colors.background
    },
    chipEmoji: {
      fontSize: 16
    },
    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textPrimary
    },
    traitsGrid: {
      flexDirection: "row",
      gap: 10
    },
    traitCard: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.background
    },
    traitLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: "uppercase"
    },
    traitValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      textTransform: "capitalize"
    }
  });
