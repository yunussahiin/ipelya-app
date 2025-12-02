/**
 * Profile Screen - Dynamic Route
 * Displays user or creator profile
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, RefreshControl, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";
import { ArrowLeft } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import {
  ProfileHeader,
  ProfileTopBar,
  ProfileActions,
  VibeSheet,
  PostFeedModal,
  ProfileTabs,
  StoryHighlights,
  MutualFollowers,
  SubscriptionSheet,
  BroadcastChannels,
  type Profile,
  type ProfileStatsType,
  type FollowStatus,
  type ViewMode,
  type MoreMenuAction,
  type PostItem,
  type Highlight,
  type TabType
} from "@/components/profile-view";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [exclusivePosts, setExclusivePosts] = useState<PostItem[]>([]);
  const [reels, setReels] = useState<PostItem[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<
    { id: string; avatar_url: string; username: string }[]
  >([]);
  const [stats, setStats] = useState<ProfileStatsType>({
    followers_count: 0,
    following_count: 0,
    posts_count: 0
  });
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false
  });
  const [viewMode, setViewMode] = useState<ViewMode>("other");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [vibeSheetVisible, setVibeSheetVisible] = useState(false);
  const [postFeedVisible, setPostFeedVisible] = useState(false);
  const [subscriptionSheetVisible, setSubscriptionSheetVisible] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [currentProfileType, setCurrentProfileType] = useState<"real" | "shadow">("real");
  const [hasShadowProfile, setHasShadowProfile] = useState(false);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  // Load profile data
  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    if (!username) return;

    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();

      // Load profile by username OR user_id (UUID format check)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        username
      );

      let query = supabase.from("profiles").select("*").eq("type", "real");

      if (isUUID) {
        query = query.eq("user_id", username);
      } else {
        query = query.eq("username", username);
      }

      const { data: profileData, error: profileError } = await query.single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Check if this is own profile
      if (user && profileData.user_id === user.id) {
        setViewMode("own");

        // Check if user has shadow profile
        const { data: shadowProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "shadow")
          .single();

        setHasShadowProfile(!!shadowProfile);
      } else {
        setViewMode("other");

        // Load follow status
        if (user) {
          const { data: followData } = await supabase
            .from("followers")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", profileData.user_id)
            .single();

          setFollowStatus({
            isFollowing: !!followData,
            isFollowedBy: false // TODO: Check reverse
          });
        }
      }

      // Load stats and posts
      await loadStats(profileData.user_id);
      await loadPosts(profileData.user_id);
      await loadHighlights(profileData.user_id);

      // Check subscription status for creators
      if (profileData.role === "creator" && user) {
        await checkSubscription(user.id, profileData.user_id);
      }

      // Load mutual followers
      if (user && profileData.user_id !== user.id) {
        await loadMutualFollowers(user.id, profileData.user_id);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      // Followers count
      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      // Following count
      const { count: followingCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      // Posts count
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("profile_type", "real")
        .eq("moderation_status", "approved");

      setStats({
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        posts_count: postsCount || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadPosts = async (userId: string) => {
    try {
      // Normal posts
      const { data: postsData } = await supabase
        .from("posts")
        .select(
          `
          id,
          caption,
          likes_count,
          comments_count,
          views_count,
          post_type,
          is_exclusive,
          post_media (
            id,
            media_url,
            thumbnail_url,
            media_type
          )
        `
        )
        .eq("user_id", userId)
        .eq("profile_type", "real")
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(30);

      if (postsData) {
        const allPosts = postsData.map((post) => ({
          id: post.id,
          caption: post.caption || "",
          media: (post.post_media || []).map((m: any) => ({
            id: m.id,
            media_url: m.media_url,
            thumbnail_url: m.thumbnail_url,
            media_type: m.media_type || "image"
          })),
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          views_count: post.views_count || 0,
          post_type: post.post_type || "normal",
          is_exclusive: post.is_exclusive || false
        }));

        // Separate posts by type
        // Grid: tüm postlar (exclusive olmayan)
        const gridPosts = allPosts.filter((p) => !p.is_exclusive);
        // Reels: video içerikler
        const reelsPosts = allPosts.filter((p) => p.media[0]?.media_type === "video");
        // Exclusive: abonelere özel
        const exclusivePostsList = allPosts.filter((p) => p.is_exclusive);

        setPosts(gridPosts);
        setExclusivePosts(exclusivePostsList);
        setReels(reelsPosts);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const loadHighlights = async (userId: string) => {
    try {
      const { data: highlightsData } = await supabase
        .from("story_highlights")
        .select("id, title, cover_url, stories_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (highlightsData) {
        setHighlights(highlightsData);
      }
    } catch (error) {
      console.error("Error loading highlights:", error);
    }
  };

  const checkSubscription = async (currentUserId: string, creatorId: string) => {
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", currentUserId)
        .eq("creator_id", creatorId)
        .eq("status", "active")
        .single();

      setIsSubscribed(!!data);
    } catch (error) {
      // Not subscribed
      setIsSubscribed(false);
    }
  };

  const loadMutualFollowers = async (currentUserId: string, targetUserId: string) => {
    try {
      // Get people that current user follows
      const { data: myFollowing } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", currentUserId);

      if (!myFollowing || myFollowing.length === 0) {
        setMutualFollowers([]);
        return;
      }

      const myFollowingIds = myFollowing.map((f) => f.following_id);

      // Get people that also follow the target user
      const { data: mutualData } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("following_id", targetUserId)
        .in("follower_id", myFollowingIds)
        .limit(3);

      if (mutualData && mutualData.length > 0) {
        const mutualIds = mutualData.map((m) => m.follower_id);

        // Get profiles of mutual followers
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", mutualIds)
          .eq("type", "real")
          .limit(3);

        if (profiles) {
          setMutualFollowers(
            profiles.map((p) => ({
              id: p.user_id,
              username: p.username || "",
              avatar_url: p.avatar_url || ""
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error loading mutual followers:", error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  }, [username]);

  const handleFollow = useCallback(async () => {
    if (!profile) return;

    try {
      setIsFollowLoading(true);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        // TODO: Navigate to login
        return;
      }

      if (followStatus.isFollowing) {
        // Unfollow
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.user_id);

        setFollowStatus((prev) => ({ ...prev, isFollowing: false }));
        setStats((prev) => ({
          ...prev,
          followers_count: Math.max(0, prev.followers_count - 1)
        }));
      } else {
        // Follow
        await supabase.from("followers").insert({
          follower_id: user.id,
          following_id: profile.user_id
        });

        setFollowStatus((prev) => ({ ...prev, isFollowing: true }));
        setStats((prev) => ({
          ...prev,
          followers_count: prev.followers_count + 1
        }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsFollowLoading(false);
    }
  }, [profile, followStatus.isFollowing]);

  const handleMessage = useCallback(() => {
    if (!profile) return;
    router.push(`/(chat)/${profile.user_id}`);
  }, [profile, router]);

  const handleMoreAction = useCallback(
    (action: MoreMenuAction) => {
      switch (action) {
        case "share":
          // TODO: Share profile
          break;
        case "copy_link":
          // TODO: Copy link
          break;
        case "block":
          // TODO: Block user
          break;
        case "report":
          // TODO: Report user
          break;
        case "mute":
          // TODO: Mute notifications
          break;
      }
    },
    [profile]
  );

  const handleFollowersPress = useCallback(() => {
    if (!profile) return;
    router.push(`/(profile)/followers?userId=${profile.id}`);
  }, [profile, router]);

  const handleFollowingPress = useCallback(() => {
    if (!profile) return;
    router.push(`/(profile)/followers?userId=${profile.id}&tab=following`);
  }, [profile, router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePostPress = useCallback(
    (post: PostItem, index: number, tab?: TabType) => {
      // Determine which posts array to use based on tab
      let targetPosts = posts;
      if (tab === "exclusive") targetPosts = exclusivePosts;
      else if (tab === "reels") targetPosts = reels;

      const actualIndex = targetPosts.findIndex((p) => p.id === post.id);
      setSelectedPostIndex(actualIndex >= 0 ? actualIndex : index);
      setPostFeedVisible(true);
    },
    [posts, exclusivePosts, reels]
  );

  const handleSubscribe = useCallback(() => {
    if (!profile) return;
    setSubscriptionSheetVisible(true);
  }, [profile]);

  const handleHighlightPress = useCallback((highlight: Highlight) => {
    // TODO: Open highlight viewer
    console.log("Open highlight:", highlight.id);
  }, []);

  const handleEditProfile = useCallback(() => {
    router.push("/(profile)/edit");
  }, [router]);

  const handleSettings = useCallback(() => {
    router.push("/(settings)");
  }, [router]);

  const handleShareProfile = useCallback(() => {
    if (!profile) return;
    // TODO: Implement share functionality
    console.log("Share profile:", profile.username);
  }, [profile]);

  const handleProfileSwitch = useCallback(
    async (type: "real" | "shadow") => {
      if (type === currentProfileType) return;

      // TODO: Implement PIN/biometric verification for shadow mode
      // For now, just switch
      setCurrentProfileType(type);

      // Reload profile with new type
      // This would typically involve a shadow mode hook
      console.log("Switch to profile type:", type);
    },
    [currentProfileType]
  );

  const handleCreatePost = useCallback(() => {
    router.push("/(create)/post");
  }, [router]);

  const handleMenuPress = useCallback(() => {
    router.push("/(settings)");
  }, [router]);

  // Loading state - TODO: Replace with skeleton
  if (isLoading || !profile) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.loadingContainer}>{/* <ProfileSkeleton /> */}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar - Username, Shadow Switcher, Actions */}
      {viewMode === "own" ? (
        <ProfileTopBar
          username={profile.username || ""}
          isOwnProfile={true}
          currentProfileType={currentProfileType}
          hasShadowProfile={hasShadowProfile}
          onProfileSwitch={handleProfileSwitch}
          onCreatePost={handleCreatePost}
          onMenuPress={handleMenuPress}
        />
      ) : (
        /* Back Button - Floating for other profiles */
        <Pressable style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </Pressable>
      )}

      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Profile Header - Instagram style with stats */}
        <ProfileHeader
          profile={profile}
          stats={stats}
          scrollY={scrollY}
          onVibePress={() => setVibeSheetVisible(true)}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
        />

        {/* Actions */}
        <ProfileActions
          viewMode={viewMode}
          followStatus={followStatus}
          isFollowLoading={isFollowLoading}
          isCreator={profile.role === "creator"}
          isSubscribed={isSubscribed}
          onFollowPress={handleFollow}
          onMessagePress={handleMessage}
          onSubscribePress={handleSubscribe}
          onMoreAction={handleMoreAction}
          onEditProfilePress={handleEditProfile}
          onSettingsPress={handleSettings}
          onShareProfilePress={handleShareProfile}
        />

        {/* Mutual Followers - "Tanıdığın X kişi takip ediyor" */}
        {viewMode === "other" && mutualFollowers.length > 0 && (
          <MutualFollowers followers={mutualFollowers} onPress={handleFollowersPress} />
        )}

        {/* Story Highlights */}
        {(highlights.length > 0 || viewMode === "own") && (
          <StoryHighlights
            highlights={highlights}
            isOwnProfile={viewMode === "own"}
            onHighlightPress={handleHighlightPress}
          />
        )}

        {/* Broadcast Channels - Creator'ın yayın kanalları */}
        {profile && (
          <BroadcastChannels
            userId={profile.user_id}
            isCreator={profile.is_creator || profile.role === "creator"}
            isOwnProfile={viewMode === "own"}
          />
        )}

        {/* Profile Tabs - Grid, Exclusive, Reels, Reposts, Tagged */}
        <ProfileTabs
          posts={posts}
          exclusivePosts={exclusivePosts}
          reels={reels}
          isCreator={profile.role === "creator"}
          isSubscribed={isSubscribed}
          username={profile.username || ""}
          onPostPress={handlePostPress}
          onSubscribe={handleSubscribe}
        />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>

      {/* Vibe Sheet */}
      <VibeSheet
        visible={vibeSheetVisible}
        onClose={() => setVibeSheetVisible(false)}
        favoriteVibe={profile.favorite_vibe}
        vibePreferences={profile.vibe_preferences}
        mood={profile.mood ?? null}
        energy={profile.energy ?? null}
        personality={profile.personality ?? null}
      />

      {/* Post Feed Modal */}
      <PostFeedModal
        visible={postFeedVisible}
        posts={posts}
        initialIndex={selectedPostIndex}
        onClose={() => setPostFeedVisible(false)}
        username={profile.username ?? undefined}
        avatarUrl={profile.avatar_url ?? undefined}
      />

      {/* Subscription Sheet */}
      <SubscriptionSheet
        visible={subscriptionSheetVisible}
        onClose={() => setSubscriptionSheetVisible(false)}
        creatorId={profile.user_id}
        creatorUsername={profile.username || ""}
        creatorAvatarUrl={profile.avatar_url || undefined}
        onSubscribed={() => {
          setIsSubscribed(true);
          loadProfile();
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    backButton: {
      position: "absolute",
      top: insets.top + 8,
      left: 16,
      zIndex: 100,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center"
    },
    scrollView: {
      flex: 1
    },
    scrollContent: {
      paddingBottom: insets.bottom
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    bottomSpacer: {
      height: 100
    }
  });
