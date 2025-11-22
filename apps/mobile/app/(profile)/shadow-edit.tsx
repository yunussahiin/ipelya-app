import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator
} from "react-native";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { supabase } from "@/lib/supabaseClient";

interface EditFormData {
  display_name: string;
  bio: string;
  gender: string;
}

export default function ShadowEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [form, setForm] = useState<EditFormData>({
    display_name: "",
    bio: "",
    gender: "male"
  });
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) throw authError || new Error("No user");

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, bio, gender, avatar_url")
        .eq("user_id", user.id)
        .eq("type", "shadow")
        .single();

      if (error) throw error;

      if (data) {
        setForm({
          display_name: data.display_name || "",
          bio: data.bio || "",
          gender: data.gender || "male"
        });
        setCurrentAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Load profile error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) throw authError || new Error("No user");

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name,
          bio: form.bio,
          gender: form.gender,
          avatar_url: currentAvatarUrl
        })
        .eq("user_id", user.id)
        .eq("type", "shadow");

      if (error) throw error;
      console.log("✅ Shadow profile updated successfully");
      router.back();
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setSaving(false);
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
            <Text style={styles.title}>Gölge Profili Düzenle</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Avatar Uploader Component */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profil Fotoğrafı</Text>
              <AvatarUploader
                currentAvatarUrl={currentAvatarUrl}
                profileType="shadow"
                onUploadSuccess={(url) => {
                  setCurrentAvatarUrl(url || null);
                }}
                onUploadError={(error) => {
                  console.error("Avatar upload error:", error);
                }}
              />
            </View>

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Görünen Ad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adınız"
                  placeholderTextColor={colors.textMuted}
                  value={form.display_name}
                  onChangeText={(text) => setForm({ ...form, display_name: text })}
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Biyografi</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Kendiniz hakkında yazın..."
                  placeholderTextColor={colors.textMuted}
                  value={form.bio}
                  onChangeText={(text) => setForm({ ...form, bio: text })}
                  multiline
                  numberOfLines={4}
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Cinsiyet</Text>
                <View style={styles.genderRow}>
                  {["male", "female", "lgbt"].map((option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.genderOption,
                        form.gender === option && styles.genderOptionActive
                      ]}
                      onPress={() => setForm({ ...form, gender: option })}
                      accessible={true}
                      accessibilityLabel={option}
                      accessibilityRole="radio"
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          form.gender === option && styles.genderOptionTextActive
                        ]}
                      >
                        {option === "male" ? "Erkek" : option === "female" ? "Kadın" : "LGBTQ+"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                style={styles.vibeLink}
                onPress={() => router.push("/(profile)/vibe-preferences")}
                accessible={true}
                accessibilityLabel="Vibe Tercihleri"
                accessibilityRole="button"
              >
                <View>
                  <Text style={styles.vibeLinkLabel}>Vibe Tercihleri</Text>
                  <Text style={styles.vibeLinkDescription}>Seni tanımlayan enerjileri seç</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

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
          </ScrollView>
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
    section: {
      gap: 16,
      marginBottom: 28,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700"
    },
    form: {
      gap: 20,
      marginBottom: 24
    },
    formGroup: {
      gap: 8
    },
    label: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.textPrimary,
      minHeight: 48
    },
    bioInput: {
      minHeight: 100,
      textAlignVertical: "top"
    },
    genderRow: {
      flexDirection: "row",
      gap: 12
    },
    genderOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center"
    },
    genderOptionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    genderOptionText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    genderOptionTextActive: {
      color: colors.background
    },
    vibeLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    vibeLinkLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4
    },
    vibeLinkDescription: {
      color: colors.textSecondary,
      fontSize: 13
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
