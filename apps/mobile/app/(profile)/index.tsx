import { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { Settings, Edit2, Users, Heart, Ban } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { useFollowersRealtime } from "@/hooks/useFollowersRealtime";
import { useShadowMode } from "@/hooks/useShadowMode";

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
  gender: string;
}

interface ShadowProfileData {
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
  const { enabled: shadowModeEnabled } = useShadowMode();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [shadowProfile, setShadowProfile] = useState<ShadowProfileData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"real" | "shadow">(
    shadowModeEnabled ? "shadow" : "real"
  );
  const { stats: followersStats } = useFollowersRealtime(currentUserId);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reload profiles when returning from edit screen (without loading spinner)
      reloadProfiles();
    }, [])
  );

  async function loadProfile() {
    try {
      setLoading(true);
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) throw authError || new Error("No user");

      console.log("👤 Current user ID:", user.id);
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, is_creator, gender")
        .eq("user_id", user.id)
        .eq("type", "real")
        .single();

      if (error) throw error;
      console.log("📊 Profile loaded:", data);
      setProfile(data);

      // Load shadow profile
      await loadShadowProfile();
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadShadowProfile() {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: shadowData, error: shadowError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, is_creator, gender")
        .eq("user_id", user.id)
        .eq("type", "shadow")
        .single();

      if (!shadowError && shadowData) {
        console.log("🎭 Shadow profile loaded:", shadowData);
        setShadowProfile(shadowData);
      }
    } catch (error) {
      console.error("Shadow profile load error:", error);
    }
  }

  async function reloadProfiles() {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      // Reload real profile
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, is_creator, gender")
        .eq("user_id", user.id)
        .eq("type", "real")
        .single();

      if (!error && data) {
        console.log("👤 Profile reloaded:", data);
        setProfile(data);
      }

      // Reload shadow profile
      const { data: shadowData, error: shadowError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, is_creator, gender")
        .eq("user_id", user.id)
        .eq("type", "shadow")
        .single();

      if (!shadowError && shadowData) {
        console.log("🎭 Shadow profile reloaded:", shadowData);
        setShadowProfile(shadowData);
      }
    } catch (error) {
      console.error("Profile reload error:", error);
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
              <View style={styles.headerActions}>
                <NotificationBell />
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
          </View>

          {shadowProfile && (
            <View style={styles.tabContainer}>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === "real" && styles.tabActive,
                  { borderBottomColor: activeTab === "real" ? colors.accent : colors.border }
                ]}
                onPress={() => setActiveTab("real")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "real" && styles.tabTextActive,
                    { color: activeTab === "real" ? colors.accent : colors.textSecondary }
                  ]}
                >
                  👤 Normal Profil
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === "shadow" && styles.tabActive,
                  { borderBottomColor: activeTab === "shadow" ? colors.accent : colors.border }
                ]}
                onPress={() => setActiveTab("shadow")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "shadow" && styles.tabTextActive,
                    { color: activeTab === "shadow" ? colors.accent : colors.textSecondary }
                  ]}
                >
                  🎭 Gölge Profil
                </Text>
              </Pressable>
            </View>
          )}

          {profile && (
            <View style={[styles.profileCard, activeTab === "shadow" && styles.profileCardShadow]}>
              <View style={styles.avatarSection}>
                {(activeTab === "shadow" ? shadowProfile : profile)?.avatar_url ? (
                  <Image
                    source={{
                      uri: (activeTab === "shadow" ? shadowProfile : profile)?.avatar_url || ""
                    }}
                    style={styles.avatar}
                    accessible={true}
                    accessibilityLabel={
                      activeTab === "shadow" ? "Gölge profil fotoğrafı" : "Profil fotoğrafı"
                    }
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarPlaceholderText}>
                      {(activeTab === "shadow" ? shadowProfile : profile)?.display_name
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>
                  {(activeTab === "shadow" ? shadowProfile : profile)?.display_name}
                </Text>
                {(activeTab === "shadow" ? shadowProfile : profile)?.bio && (
                  <Text style={styles.bio}>
                    {(activeTab === "shadow" ? shadowProfile : profile)?.bio}
                  </Text>
                )}

                <View style={styles.badgeRow}>
                  {(activeTab === "shadow" ? shadowProfile : profile)?.is_creator && (
                    <View style={[styles.badge, activeTab === "shadow" && styles.badgeShadow]}>
                      <Text style={styles.badgeText}>Creator</Text>
                    </View>
                  )}
                  <View style={[styles.badge, activeTab === "shadow" && styles.badgeShadow]}>
                    <Text style={styles.badgeText}>
                      {(activeTab === "shadow" ? shadowProfile : profile)?.gender}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <Pressable
                  style={styles.editButton}
                  onPress={() =>
                    router.push(
                      activeTab === "shadow" ? "/(profile)/shadow-edit" : "/(profile)/edit"
                    )
                  }
                  accessible={true}
                  accessibilityLabel={
                    activeTab === "shadow" ? "Gölge profili düzenle" : "Profili düzenle"
                  }
                  accessibilityRole="button"
                >
                  <Edit2 size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>
          )}

          <Pressable
            style={styles.statsSection}
            onPress={() => router.push(`/(profile)/followers?userId=${profile?.id}`)}
            accessible={true}
            accessibilityLabel={`Takipçiler ${followersStats.followers_count}, Takip Edilen ${followersStats.following_count}`}
            accessibilityRole="button"
          >
            <View style={styles.statItem}>
              <Users size={20} color={colors.accent} />
              <View>
                <Text style={styles.statLabel}>Takipçiler</Text>
                <Text style={styles.statValue}>{followersStats.followers_count}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Heart size={20} color={colors.accent} />
              <View>
                <Text style={styles.statLabel}>Takip Edilen</Text>
                <Text style={styles.statValue}>{followersStats.following_count}</Text>
              </View>
            </View>
          </Pressable>

          {/* Blocked Users Button */}
          <Pressable
            style={styles.blockedUsersButton}
            onPress={() => router.push("/(profile)/blocked-users")}
            accessible={true}
            accessibilityLabel="Engellenen kullanıcılar"
            accessibilityRole="button"
          >
            <Ban size={20} color={colors.accent} />
            <Text style={[styles.blockedUsersButtonText, { color: colors.textPrimary }]}>
              Engellenen Kullanıcılar
            </Text>
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
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
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
      height: "100%",
      backgroundColor: colors.border
    },
    blockedUsersButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    blockedUsersButtonText: {
      fontSize: 14,
      fontWeight: "600"
    },
    tabContainer: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 16,
      marginHorizontal: 16
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
      alignItems: "center"
    },
    tabActive: {
      borderBottomColor: colors.accent
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary
    },
    tabTextActive: {
      color: colors.accent
    },
    buttonGroup: {
      flexDirection: "row",
      gap: 8
    },
    shadowEditButton: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      justifyContent: "center",
      alignItems: "center"
    },
    profileCardShadow: {
      borderColor: colors.accent,
      borderWidth: 2
    },
    badgeShadow: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
      borderWidth: 1
    }
  });
