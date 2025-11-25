/**
 * Get Profile Edge Function
 *
 * Amaç: Kullanıcı profilini ve istatistiklerini getirir
 *
 * Parametreler:
 * - username: Profil username'i
 * - user_id: Alternatif olarak user_id ile de çekilebilir
 */

import { createClient } from "npm:@supabase/supabase-js@2";

console.log("🚀 Get Profile Function Started");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ User authenticated:", user.id);

    // Query parameters
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const targetUserId = url.searchParams.get("user_id");

    if (!username && !targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "username or user_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Profile request:", { username, targetUserId });

    // ============ GET PROFILE ============
    let profileQuery = supabase.from("profiles").select("*").eq("type", "real");

    if (username) {
      profileQuery = profileQuery.eq("username", username);
    } else {
      profileQuery = profileQuery.eq("user_id", targetUserId);
    }

    const { data: profile, error: profileError } = await profileQuery.single();

    if (profileError || !profile) {
      console.error("❌ Profile not found:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("👤 Profile found:", profile.username);

    // ============ GET STATS ============
    // Followers count
    const { count: followersCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.user_id);

    // Following count
    const { count: followingCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.user_id);

    // Posts count
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .eq("is_hidden", false);

    console.log("📊 Stats:", { followersCount, followingCount, postsCount });

    // ============ CHECK FOLLOW STATUS ============
    const isOwnProfile = user.id === profile.user_id;
    let isFollowing = false;
    let isFollowedBy = false;

    if (!isOwnProfile) {
      // Check if current user follows this profile
      const { data: followingCheck } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.user_id)
        .single();

      isFollowing = !!followingCheck;

      // Check if this profile follows current user
      const { data: followedByCheck } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", profile.user_id)
        .eq("following_id", user.id)
        .single();

      isFollowedBy = !!followedByCheck;
    }

    console.log("🔗 Follow status:", { isOwnProfile, isFollowing, isFollowedBy });

    // ============ GET RECENT POSTS ============
    const { data: recentPosts } = await supabase
      .from("posts")
      .select(
        "id, caption, likes_count, comments_count, created_at, post_media(media_url, thumbnail_url)"
      )
      .eq("user_id", profile.user_id)
      .eq("is_hidden", false)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(12);

    console.log("📸 Recent posts:", recentPosts?.length || 0);

    // ============ RESPONSE ============
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          profile: {
            id: profile.id,
            user_id: profile.user_id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            cover_url: profile.cover_url,
            bio: profile.bio,
            location: profile.location,
            website: profile.website,
            role: profile.role,
            is_verified: profile.is_verified,
            favorite_vibe: profile.favorite_vibe,
            vibe_preferences: profile.vibe_preferences,
            mood: profile.mood,
            energy: profile.energy,
            personality: profile.personality,
            created_at: profile.created_at
          },
          stats: {
            followers_count: followersCount || 0,
            following_count: followingCount || 0,
            posts_count: postsCount || 0
          },
          follow_status: {
            is_own_profile: isOwnProfile,
            is_following: isFollowing,
            is_followed_by: isFollowedBy
          },
          posts: (recentPosts || []).map((post) => ({
            id: post.id,
            caption: post.caption,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            media: post.post_media || []
          }))
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in get-profile:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
