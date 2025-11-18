import { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { ArrowLeft, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";

interface Vibe {
  id: string;
  label: string;
  emoji: string;
  description: string;
  colors: [string, string];
}

const vibes: Vibe[] = [
  {
    id: "innocent",
    label: "Masum",
    emoji: "😇",
    description: "Tatlı, naif ve oyuncu",
    colors: ["#ffd3f3", "#ffa9d7"]
  },
  {
    id: "dominant",
    label: "Dominant",
    emoji: "👑",
    description: "Güçlü, otoriter ve kontrollü",
    colors: ["#10142a", "#501437"]
  },
  {
    id: "girl_next_door",
    label: "Girl Next Door",
    emoji: "👧",
    description: "Yaklaşılabilir, samimi ve rahat",
    colors: ["#f2f4ff", "#c5d3ff"]
  },
  {
    id: "romantic",
    label: "Romantik",
    emoji: "��",
    description: "Duygusal, hassas ve sevecen",
    colors: ["#fff2da", "#ffb581"]
  },
  {
    id: "mysterious",
    label: "Gizemli",
    emoji: "🌙",
    description: "Gizli, çekici ve merak uyandırıcı",
    colors: ["#140a1b", "#34244a"]
  }
];

export default function VibePreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [favoriteVibe, setFavoriteVibe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) throw authError || new Error("No user");

      const { data, error } = await supabase
        .from("profiles")
        .select("vibe_preferences, favorite_vibe")
        .eq("user_id", user.id)
        .eq("type", "real")
        .single();

      if (error) throw error;
      
      if (data) {
        setSelectedVibes(data.vibe_preferences || []);
        setFavoriteVibe(data.favorite_vibe || null);
      }
    } catch (error) {
      console.error("Load preferences error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) throw authError || new Error("No user");

      const { error } = await supabase
        .from("profiles")
        .update({
          vibe_preferences: selectedVibes,
          favorite_vibe: favoriteVibe
        })
        .eq("user_id", user.id)
        .eq("type", "real");

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error("Save preferences error:", error);
    } finally {
      setSaving(false);
    }
  }

  function toggleVibe(vibeId: string) {
    setSelectedVibes((prev) => {
      if (prev.includes(vibeId)) {
        return prev.filter((v) => v !== vibeId);
      } else {
        return [...prev, vibeId];
      }
    });
    
    // Eğer ilk seçim ise, otomatik olarak favorite yap
    if (selectedVibes.length === 0) {
      setFavoriteVibe(vibeId);
    }
  }

  if (loading) {
    return (
      <PageScreen>
        {() => (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}
      </PageScreen>
    );
  }

  return (
    <PageScreen>
      {() => (
        <>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessible={true}
              accessibilityLabel="Geri dön"
              accessibilityRole="button"
            >
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Vibe Tercihleri</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.intro}>
              <Text style={styles.introTitle}>Seni tanımlayan enerjileri seç</Text>
              <Text style={styles.introSubtitle}>
                Birden fazla vibe seçebilirsin. Seçtiğin vibe'lar profil kartında gösterilecek.
              </Text>
            </View>

            <View style={styles.vibesContainer}>
              {vibes.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe.id);
                const isFavorite = favoriteVibe === vibe.id;

                return (
                  <Pressable
                    key={vibe.id}
                    style={[
                      styles.vibeCard,
                      isSelected && styles.vibeCardSelected,
                      isFavorite && styles.vibeCardFavorite
                    ]}
                    onPress={() => toggleVibe(vibe.id)}
                    accessible={true}
                    accessibilityLabel={vibe.label}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={styles.vibeHeader}>
                      <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                      <View style={styles.vibeLabelContainer}>
                        <Text style={styles.vibeLabel}>{vibe.label}</Text>
                        {isFavorite && (
                          <Text style={styles.favoriteBadge}>Favori</Text>
                        )}
                      </View>
                      {isSelected && (
                        <View style={[styles.checkbox, { backgroundColor: colors.accent }]}>
                          <Check size={16} color={colors.background} />
                        </View>
                      )}
                    </View>

                    <Text style={styles.vibeDescription}>{vibe.description}</Text>

                    {isSelected && (
                      <Pressable
                        style={[
                          styles.favoriteButton,
                          isFavorite && styles.favoriteButtonActive
                        ]}
                        onPress={() => setFavoriteVibe(isFavorite ? null : vibe.id)}
                        accessible={true}
                        accessibilityLabel={`${vibe.label} favoriye ${isFavorite ? "çıkar" : "ekle"}`}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.favoriteButtonText,
                            isFavorite && styles.favoriteButtonTextActive
                          ]}
                        >
                          {isFavorite ? "⭐ Favori" : "☆ Favori Yap"}
                        </Text>
                      </Pressable>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {selectedVibes.length > 0 && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Seçilen Vibe'lar</Text>
                <View style={styles.summaryTags}>
                  {selectedVibes.map((vibeId) => {
                    const vibe = vibes.find((v) => v.id === vibeId);
                    return (
                      <View key={vibeId} style={styles.summaryTag}>
                        <Text style={styles.summaryTagText}>
                          {vibe?.emoji} {vibe?.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonGroup}>
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessible={true}
              accessibilityLabel="Kaydet"
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={saving}
              accessible={true}
              accessibilityLabel="İptal"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </Pressable>
          </View>
        </>
      )}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 24
    },
    backButton: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      flex: 1
    },
    scrollView: {
      flex: 1
    },
    scrollContent: {
      paddingBottom: 32
    },
    intro: {
      gap: 8,
      marginBottom: 28,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    introTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700"
    },
    introSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20
    },
    vibesContainer: {
      gap: 12,
      marginBottom: 24
    },
    vibeCard: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    vibeCardSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
      backgroundColor: colors.surface
    },
    vibeCardFavorite: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8
    },
    vibeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    vibeEmoji: {
      fontSize: 32
    },
    vibeLabelContainer: {
      flex: 1,
      gap: 4
    },
    vibeLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700"
    },
    favoriteBadge: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "600"
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center"
    },
    vibeDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20
    },
    favoriteButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center"
    },
    favoriteButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent
    },
    favoriteButtonText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600"
    },
    favoriteButtonTextActive: {
      color: colors.accent
    },
    summaryBox: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    summaryTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700"
    },
    summaryTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8
    },
    summaryTag: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.accentSoft
    },
    summaryTagText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "600"
    },
    buttonGroup: {
      gap: 12
    },
    saveButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 48
    },
    saveButtonDisabled: {
      opacity: 0.6
    },
    saveButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "700"
    },
    cancelButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center"
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600"
    }
  });
