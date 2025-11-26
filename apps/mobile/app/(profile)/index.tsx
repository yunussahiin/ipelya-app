/**
 * Own Profile Screen - Refactored
 * Uses new profile-view components
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, RefreshControl, Text, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ban, Radio } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { useFollowersRealtime } from "@/hooks/useFollowersRealtime";
import { useShadowMode } from "@/hooks/useShadowMode";
import {
  ProfileTopBar,
  ProfileHeader,
  ProfileActions,
  StoryHighlights,
  ProfileTabs,
  ProfileSkeleton,
  type Profile,
  type ProfileStatsType,
  type PostItem,
  type Highlight,
  type TabType
} from "@/components/profile-view";

export default function OwnProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { enabled: shadowModeEnabled } = useShadowMode();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [currentProfileType, setCurrentProfileType] = useState<"real" | "shadow">(
    shadowModeEnabled ? "shadow" : "real"
  );
  const [hasShadowProfile, setHasShadowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [exclusivePosts, setExclusivePosts] = useState<PostItem[]>([]);
  const [reels, setReels] = useState<PostItem[]>([]);
  const [highlights] = useState<Highlight[]>([]);
  const [broadcastChannelId, setBroadcastChannelId] = useState<string | null>(null);

  const { stats: followersStats } = useFollowersRealtime(currentUserId);

  const stats: ProfileStatsType = useMemo(
    () => ({
      followers_count: followersStats.followers_count,
      following_count: followersStats.following_count,
      posts_count: posts.length
    }),
    [followersStats, posts.length]
  );

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [currentProfileType]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      if (profile) reloadProfile();
    }, [profile?.id])
  );

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Load profile based on type
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", currentProfileType)
        .single();

      if (error) throw error;
      setProfile(data);

      // Check shadow profile exists
      const { data: shadowData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "shadow")
        .single();

      setHasShadowProfile(!!shadowData);

      // Check broadcast channel
      const { data: channelData } = await supabase
        .from("broadcast_channels")
        .select("id")
        .eq("creator_id", user.id)
        .single();

      setBroadcastChannelId(channelData?.id || null);

      // Load posts
      await loadPosts(user.id);
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadProfile = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", currentProfileType)
        .single();

      if (data) setProfile(data);
    } catch (error) {
      console.error("Profile reload error:", error);
    }
  };

  const loadPosts = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("posts")
        .select(
          `
          id, caption, likes_count, comments_count, views_count,
          post_type, is_exclusive, created_at,
          post_media (id, media_url, thumbnail_url, media_type)
        `
        )
        .eq("user_id", userId)
        .eq("profile_type", currentProfileType)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (data) {
        const allPosts: PostItem[] = data.map((p) => ({
          id: p.id,
          caption: p.caption || "",
          thumbnail_url: p.post_media?.[0]?.thumbnail_url || p.post_media?.[0]?.media_url || "",
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
          media_count: p.post_media?.length || 1,
          views_count: p.views_count,
          post_type: p.post_type,
          is_exclusive: p.is_exclusive,
          media: p.post_media || []
        }));

        setPosts(allPosts.filter((p) => !p.is_exclusive && p.post_type !== "reels"));
        setExclusivePosts(allPosts.filter((p) => p.is_exclusive));
        setReels(
          allPosts.filter((p) => p.post_type === "reels" || p.media?.[0]?.media_type === "video")
        );
      }
    } catch (error) {
      console.error("Posts load error:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  };

  const handleProfileSwitch = (type: "real" | "shadow") => {
    if (type !== currentProfileType) {
      setCurrentProfileType(type);
    }
  };

  const handleCreatePost = () => router.push("/(create)/post");
  const handleMenuPress = () => router.push("/(settings)");
  const handleEditProfile = () => {
    router.push(currentProfileType === "shadow" ? "/(profile)/shadow-edit" : "/(profile)/edit");
  };
  const handleSettings = () => router.push("/(settings)");
  const handleShareProfile = () => console.log("Share profile");
  const handleFollowersPress = () => {
    if (profile) router.push(`/(profile)/followers?userId=${profile.id}`);
  };
  const handleFollowingPress = () => {
    if (profile) router.push(`/(profile)/followers?userId=${profile.id}&tab=following`);
  };
  const handlePostPress = (post: PostItem, index: number, tab?: TabType) => {
    console.log("Open post:", post.id, "tab:", tab);
  };
  const handleHighlightPress = (highlight: Highlight) => {
    console.log("Open highlight:", highlight.id);
  };

  // Yayın kanalı işlemleri
  const handleBroadcastChannelPress = () => {
    if (broadcastChannelId) {
      // Mevcut kanala git
      router.push(`/(broadcast)/${broadcastChannelId}`);
    } else {
      // Yeni kanal oluştur
      router.push("/(broadcast)/create");
    }
  };

  // Loading state
  if (isLoading || !profile) {
    return <ProfileSkeleton showTopBar={true} />;
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <ProfileTopBar
        username={profile.username || ""}
        isOwnProfile={true}
        currentProfileType={currentProfileType}
        hasShadowProfile={hasShadowProfile}
        onProfileSwitch={handleProfileSwitch}
        onCreatePost={handleCreatePost}
        onMenuPress={handleMenuPress}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <ProfileHeader
          profile={profile}
          stats={stats}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
        />

        {/* Actions */}
        <ProfileActions
          viewMode="own"
          onEditProfilePress={handleEditProfile}
          onSettingsPress={handleSettings}
          onShareProfilePress={handleShareProfile}
        />

        {/* Story Highlights */}
        <StoryHighlights
          highlights={highlights}
          isOwnProfile={true}
          onHighlightPress={handleHighlightPress}
        />

        {/* Yayın Kanalı */}
        <Pressable style={styles.broadcastButton} onPress={handleBroadcastChannelPress}>
          <Radio size={20} color={colors.accent} />
          <View style={styles.broadcastTextContainer}>
            <Text style={styles.broadcastButtonText}>
              {broadcastChannelId ? "Yayın Kanalım" : "Yayın Kanalı Oluştur"}
            </Text>
            <Text style={styles.broadcastButtonSubtext}>
              {broadcastChannelId
                ? "Takipçilerinle içerik paylaş"
                : "Abonelerinle özel içerik paylaşın"}
            </Text>
          </View>
        </Pressable>

        {/* Blocked Users Link */}
        <Pressable
          style={styles.blockedUsersButton}
          onPress={() => router.push("/(profile)/blocked-users")}
        >
          <Ban size={20} color={colors.textMuted} />
          <Text style={styles.blockedUsersText}>Engellenen Kullanıcılar</Text>
        </Pressable>

        {/* Tabs */}
        <ProfileTabs
          posts={posts}
          exclusivePosts={exclusivePosts}
          reels={reels}
          isSubscribed={true}
          onPostPress={handlePostPress}
          onSubscribe={() => {}}
        />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    scrollView: {
      flex: 1
    },
    broadcastButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent
    },
    broadcastTextContainer: {
      flex: 1
    },
    broadcastButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary
    },
    broadcastButtonSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2
    },
    blockedUsersButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    blockedUsersText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted
    }
  });
