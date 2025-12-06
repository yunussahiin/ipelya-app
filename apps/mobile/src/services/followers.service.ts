/**
 * Followers Management Service
 * Handles follow/unfollow operations and fetching follower/following lists
 */

import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export interface FollowerProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean | null;
  is_following?: boolean;
  created_at?: string;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

/**
 * Get follower list for a user
 */
export async function getFollowers(userId: string, currentUserId?: string): Promise<FollowerProfile[]> {
  try {
    // Get follower IDs first
    const { data: followerIds, error: idsError } = await supabase
      .from("followers")
      .select("follower_id")
      .eq("following_id", userId);

    if (idsError) throw idsError;

    if (!followerIds || followerIds.length === 0) {
      return [];
    }

    // Get profiles for those follower IDs
    const ids = followerIds.map(f => f.follower_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, avatar_url, bio, is_creator")
      .in("user_id", ids)
      .eq("type", "real");

    if (profilesError) throw profilesError;

    // If currentUserId provided, check which ones are being followed
    if (currentUserId && profiles) {
      const { data: followingData } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", ids);

      const followingIds = new Set(followingData?.map(f => f.following_id) || []);

      return profiles.map(p => ({
        ...p,
        is_following: followingIds.has(p.user_id)
      }));
    }

    return profiles || [];
  } catch (error) {
    logger.error('Get followers error', error, { tag: 'Followers' });
    return [];
  }
}

/**
 * Get following list for a user
 */
export async function getFollowing(userId: string): Promise<FollowerProfile[]> {
  try {
    // Get following IDs first
    const { data: followingIds, error: idsError } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", userId);

    if (idsError) throw idsError;

    if (!followingIds || followingIds.length === 0) {
      return [];
    }

    // Get profiles for those following IDs
    const ids = followingIds.map(f => f.following_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, avatar_url, bio, is_creator")
      .in("user_id", ids)
      .eq("type", "real");

    if (profilesError) throw profilesError;

    return profiles || [];
  } catch (error) {
    logger.error('Get following error', error, { tag: 'Followers' });
    return [];
  }
}

/**
 * Get follow stats for a user
 */
export async function getFollowStats(userId: string, currentUserId?: string): Promise<FollowStats> {
  try {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (followersError) throw followersError;

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (followingError) throw followingError;

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const { data, error: checkError } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      isFollowing = !!data;
    }

    return {
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_following: isFollowing
    };
  } catch (error) {
    logger.error('Get follow stats error', error, { tag: 'Followers' });
    return {
      followers_count: 0,
      following_count: 0,
      is_following: false
    };
  }
}

/**
 * Follow a user
 */
export async function followUser(followingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw authError || new Error("Kullanıcı bulunamadı");
    }

    if (user.id === followingId) {
      return { success: false, error: "Kendinizi takip edemezsiniz" };
    }

    const { error } = await supabase
      .from("followers")
      .insert({
        follower_id: user.id,
        following_id: followingId
      });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Zaten takip ediyorsunuz" };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Takip başarısız";
    logger.error('Follow error', error, { tag: 'Followers' });
    return { success: false, error: errorMessage };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw authError || new Error("Kullanıcı bulunamadı");
    }

    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Takipten çıkma başarısız";
    logger.error('Unfollow error', error, { tag: 'Followers' });
    return { success: false, error: errorMessage };
  }
}
