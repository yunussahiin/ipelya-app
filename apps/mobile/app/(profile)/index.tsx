import { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { Settings, Edit2, Users, Heart } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
  gender: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
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
        .select("id, display_name, avatar_url, bio, is_creator, gender")
        .eq("user_id", user.id)
        .eq("type", "real")
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
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

  if (!profile) {
    return (
      <PageScreen>
        {() => (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Profil yüklenemedi</Text>
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
            <View style={styles.headerTop}>
              <Text style={styles.title}>Profil</Text>
              <Pressable
                style={styles.settingsButton}
                onPress={() => router.push("/(settings)")}
                accessible={true}
                accessibilityLabel="Ayarlar"
                accessibilityRole="button"
              >
                <Settings size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarSection}>
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                  accessible={true}
                  accessibilityLabel="Profil fotoğrafı"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {profile.display_name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile.display_name}</Text>
              {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

              <View style={styles.badgeRow}>
                {profile.is_creator && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Creator</Text>
                  </View>
                )}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{profile.gender}</Text>
                </View>
              </View>
            </View>

            <Pressable
              style={styles.editButton}
              onPress={() => router.push("/(profile)/edit")}
              accessible={true}
              accessibilityLabel="Profili düzenle"
              accessibilityRole="button"
            >
              <Edit2 size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Pressable
            style={styles.statsSection}
            onPress={() => router.push(`/(profile)/followers?userId=${profile.id}`)}
            accessible={true}
            accessibilityLabel="Takipçiler ve takip edilen"
            accessibilityRole="button"
          >
            <View style={styles.statItem}>
              <Users size={20} color={colors.accent} />
              <View>
                <Text style={styles.statLabel}>Takipçiler</Text>
                <Text style={styles.statValue}>1.2K</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Heart size={20} color={colors.accent} />
              <View>
                <Text style={styles.statLabel}>Takip Edilen</Text>
                <Text style={styles.statValue}>342</Text>
              </View>
            </View>
          </Pressable>
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
    errorText: {
      color: colors.textPrimary,
      fontSize: 16
    },
    header: {
      gap: 16,
      marginBottom: 24
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: "700"
    },
    settingsButton: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24
    },
    avatarSection: {
      alignItems: "center"
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40
    },
    avatarPlaceholder: {
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center"
    },
    avatarPlaceholderText: {
      color: colors.background,
      fontSize: 32,
      fontWeight: "700"
    },
    profileInfo: {
      flex: 1,
      gap: 8
    },
    displayName: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700"
    },
    bio: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20
    },
    badgeRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap"
    },
    badge: {
      backgroundColor: colors.accentSoft,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12
    },
    badgeText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "600"
    },
    editButton: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center"
    },
    statsSection: {
      flexDirection: "row",
      gap: 16,
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    statItem: {
      flex: 1,
      flexDirection: "row",
      gap: 12,
      alignItems: "center"
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 12
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700"
    },
    divider: {
      width: 1,
      backgroundColor: colors.border
    }
  });
