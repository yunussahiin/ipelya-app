/**
 * Profile Edit Screen - Modern Instagram-style
 * Refactored with new profile-view design system
 */

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Camera,
  MapPin,
  Link2,
  Sparkles,
  User,
  AtSign,
  ImageIcon
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { supabase } from "@/lib/supabaseClient";

interface EditFormData {
  display_name: string;
  username: string;
  bio: string;
  gender: string;
  location: string;
  website: string;
}

const BIO_MAX_LENGTH = 150;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const [form, setForm] = useState<EditFormData>({
    display_name: "",
    username: "",
    bio: "",
    gender: "male",
    location: "",
    website: ""
  });
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalForm, setOriginalForm] = useState<EditFormData | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Track changes
  useEffect(() => {
    if (originalForm) {
      const changed = JSON.stringify(form) !== JSON.stringify(originalForm);
      setHasChanges(changed);
    }
  }, [form, originalForm]);

  async function loadProfile() {
    try {
      setLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username, bio, gender, avatar_url, cover_url, location, website")
        .eq("user_id", user.id)
        .eq("type", "real")
        .single();

      if (error) throw error;

      if (data) {
        const formData: EditFormData = {
          display_name: data.display_name || "",
          username: data.username || "",
          bio: data.bio || "",
          gender: data.gender || "male",
          location: data.location || "",
          website: data.website || ""
        };
        setForm(formData);
        setOriginalForm(formData);
        setCurrentAvatarUrl(data.avatar_url);
        setCoverUrl(data.cover_url);
      }
    } catch (error) {
      console.error("Load profile error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert("Değişiklikleri Kaydet?", "Kaydedilmemiş değişiklikleriniz var.", [
        { text: "Vazgeç", style: "destructive", onPress: () => router.back() },
        { text: "Kaydet", onPress: handleSave },
        { text: "İptal", style: "cancel" }
      ]);
    } else {
      router.back();
    }
  }, [hasChanges]);

  async function handleSave() {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name,
          username: form.username,
          bio: form.bio,
          gender: form.gender,
          location: form.location || null,
          website: form.website || null
        })
        .eq("user_id", user.id)
        .eq("type", "real");

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Profile update error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Hata", "Profil güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  const handleAvatarUpload = async (url: string | undefined) => {
    setCurrentAvatarUrl(url || null);
    if (url) {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ avatar_url: url })
            .eq("user_id", user.id)
            .eq("type", "real");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        console.error("Failed to save avatar:", err);
      }
    }
  };

  const selectGender = (gender: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setForm((prev) => ({ ...prev, gender }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <Pressable
          style={[styles.headerButton, styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Check size={24} color={hasChanges ? colors.background : colors.textMuted} />
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cover & Avatar Section */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.mediaSection}>
            {/* Cover Image */}
            <Pressable style={styles.coverContainer}>
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.coverImage} />
              ) : (
                <LinearGradient
                  colors={[colors.accent, colors.accentSoft]}
                  style={styles.coverPlaceholder}
                >
                  <ImageIcon size={32} color={colors.textPrimary} />
                  <Text style={styles.coverPlaceholderText}>Kapak Fotoğrafı Ekle</Text>
                </LinearGradient>
              )}
              <View style={styles.coverEditBadge}>
                <Camera size={16} color={colors.background} />
              </View>
            </Pressable>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <AvatarUploader
                currentAvatarUrl={currentAvatarUrl}
                profileType="real"
                onUploadSuccess={handleAvatarUpload}
                onUploadError={(error) => console.error("Avatar upload error:", error)}
              />
            </View>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.formSection}>
            {/* Display Name */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <User size={18} color={colors.textSecondary} />
                <Text style={styles.labelText}>Ad</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Görünen adınız"
                placeholderTextColor={colors.textMuted}
                value={form.display_name}
                onChangeText={(text) => setForm((prev) => ({ ...prev, display_name: text }))}
                editable={!saving}
              />
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <AtSign size={18} color={colors.textSecondary} />
                <Text style={styles.labelText}>Kullanıcı Adı</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="kullanici_adi"
                placeholderTextColor={colors.textMuted}
                value={form.username}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, username: text.toLowerCase().replace(/\s/g, "_") }))
                }
                autoCapitalize="none"
                editable={!saving}
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <View style={styles.inputLabel}>
                  <Sparkles size={18} color={colors.textSecondary} />
                  <Text style={styles.labelText}>Biyografi</Text>
                </View>
                <Text style={styles.charCount}>
                  {form.bio.length}/{BIO_MAX_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Kendinizi tanıtın..."
                placeholderTextColor={colors.textMuted}
                value={form.bio}
                onChangeText={(text) => {
                  if (text.length <= BIO_MAX_LENGTH) {
                    setForm((prev) => ({ ...prev, bio: text }));
                  }
                }}
                multiline
                numberOfLines={4}
                editable={!saving}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <MapPin size={18} color={colors.textSecondary} />
                <Text style={styles.labelText}>Konum</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="İstanbul, Türkiye"
                placeholderTextColor={colors.textMuted}
                value={form.location}
                onChangeText={(text) => setForm((prev) => ({ ...prev, location: text }))}
                editable={!saving}
              />
            </View>

            {/* Website */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Link2 size={18} color={colors.textSecondary} />
                <Text style={styles.labelText}>Website</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="https://website.com"
                placeholderTextColor={colors.textMuted}
                value={form.website}
                onChangeText={(text) => setForm((prev) => ({ ...prev, website: text }))}
                autoCapitalize="none"
                keyboardType="url"
                editable={!saving}
              />
            </View>
          </Animated.View>

          {/* Gender Selection */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.genderSection}>
            <Text style={styles.sectionTitle}>Cinsiyet</Text>
            <View style={styles.genderRow}>
              {[
                { value: "male", label: "Erkek", emoji: "👨" },
                { value: "female", label: "Kadın", emoji: "👩" },
                { value: "lgbt", label: "LGBTQ+", emoji: "🏳️‍🌈" }
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.genderOption,
                    form.gender === option.value && styles.genderOptionActive
                  ]}
                  onPress={() => selectGender(option.value)}
                >
                  <Text style={styles.genderEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.genderText,
                      form.gender === option.value && styles.genderTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Quick Links */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.linksSection}>
            <Pressable
              style={styles.linkItem}
              onPress={() => router.push("/(profile)/vibe-preferences")}
            >
              <View style={styles.linkIcon}>
                <Sparkles size={20} color={colors.accent} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Vibe Tercihleri</Text>
                <Text style={styles.linkDescription}>Seni tanımlayan enerjileri seç</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary
    },
    saveButton: {
      backgroundColor: colors.accent
    },
    saveButtonDisabled: {
      backgroundColor: colors.surface
    },
    keyboardView: {
      flex: 1
    },
    scrollView: {
      flex: 1
    },
    scrollContent: {
      paddingBottom: insets.bottom + 24
    },
    // Media Section
    mediaSection: {
      marginBottom: 24
    },
    coverContainer: {
      height: 140,
      backgroundColor: colors.surface,
      position: "relative"
    },
    coverImage: {
      width: "100%",
      height: "100%"
    },
    coverPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    coverPlaceholderText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: "500"
    },
    coverEditBadge: {
      position: "absolute",
      right: 16,
      bottom: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    avatarContainer: {
      alignItems: "center",
      marginTop: -50
    },
    // Form Section
    formSection: {
      paddingHorizontal: 16,
      gap: 20
    },
    inputGroup: {
      gap: 8
    },
    inputLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    inputLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    labelText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary
    },
    charCount: {
      fontSize: 12,
      color: colors.textMuted
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.textPrimary
    },
    bioInput: {
      minHeight: 100,
      textAlignVertical: "top"
    },
    // Gender Section
    genderSection: {
      paddingHorizontal: 16,
      marginTop: 24,
      gap: 12
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary
    },
    genderRow: {
      flexDirection: "row",
      gap: 12
    },
    genderOption: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      gap: 8
    },
    genderOptionActive: {
      borderColor: colors.accent,
      backgroundColor: `${colors.accent}15`
    },
    genderEmoji: {
      fontSize: 24
    },
    genderText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary
    },
    genderTextActive: {
      color: colors.accent
    },
    // Links Section
    linksSection: {
      paddingHorizontal: 16,
      marginTop: 24,
      gap: 8
    },
    linkItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    linkIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${colors.accent}15`,
      alignItems: "center",
      justifyContent: "center"
    },
    linkContent: {
      flex: 1,
      gap: 2
    },
    linkTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary
    },
    linkDescription: {
      fontSize: 13,
      color: colors.textSecondary
    }
  });
