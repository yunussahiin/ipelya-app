/**
 * Live Stats API Route
 *
 * GET: Get real-time feed statistics from database
 */

import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authorization
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", session.user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Time ranges
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    // Count posts in last minute
    const { count: postsLastMinute } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneMinuteAgo);

    // Count likes in last minute
    const { count: likesLastMinute } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneMinuteAgo);

    // Count comments in last minute
    const { count: commentsLastMinute } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneMinuteAgo);

    // Active users in last hour (users who posted, liked, or commented)
    const [postsUsers, likesUsers, commentsUsers] = await Promise.all([
      supabase.from("posts").select("user_id").gte("created_at", oneHourAgo),
      supabase.from("post_likes").select("user_id").gte("created_at", oneHourAgo),
      supabase.from("comments").select("user_id").gte("created_at", oneHourAgo)
    ]);

    const activeUserIds = new Set([
      ...(postsUsers.data?.map((p) => p.user_id) || []),
      ...(likesUsers.data?.map((l) => l.user_id) || []),
      ...(commentsUsers.data?.map((c) => c.user_id) || [])
    ]);
    const activeUsersCount = activeUserIds.size;

    // Peak users today - count distinct users who were active
    const [postsTodayUsers, likesTodayUsers, commentsTodayUsers] = await Promise.all([
      supabase.from("posts").select("user_id").gte("created_at", todayStart),
      supabase.from("post_likes").select("user_id").gte("created_at", todayStart),
      supabase.from("comments").select("user_id").gte("created_at", todayStart)
    ]);

    const peakUserIds = new Set([
      ...(postsTodayUsers.data?.map((p) => p.user_id) || []),
      ...(likesTodayUsers.data?.map((l) => l.user_id) || []),
      ...(commentsTodayUsers.data?.map((c) => c.user_id) || [])
    ]);
    const peakUsersToday = peakUserIds.size;

    // Trending content type (most posts in last 5 minutes)
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("post_type")
      .gte("created_at", fiveMinutesAgo);

    const typeCounts: Record<string, number> = {};
    recentPosts?.forEach((p) => {
      const type = p.post_type || "post";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const trendingType =
      Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "post";

    // Calculate engagement rate (interactions / active users)
    const totalInteractions = (likesLastMinute || 0) + (commentsLastMinute || 0);
    const engagementRate =
      activeUsersCount > 0 ? (totalInteractions / activeUsersCount) * 100 : 0;

    // Get recent activities (last 10 posts, likes, comments)
    const [recentPostsData, recentLikesData, recentCommentsData] = await Promise.all([
      supabase
        .from("posts")
        .select("id, user_id, created_at, profiles!posts_user_id_fkey(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("post_likes")
        .select("id, user_id, created_at, profiles!post_likes_user_id_fkey(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("comments")
        .select("id, user_id, created_at, profiles!comments_user_id_fkey(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    // Combine and sort activities
    const activities = [
      ...(recentPostsData.data?.map((p) => ({
        id: `post-${p.id}`,
        type: "post" as const,
        user: (p.profiles as { username?: string })?.username || "unknown",
        avatar_url: (p.profiles as { avatar_url?: string })?.avatar_url,
        timestamp: p.created_at
      })) || []),
      ...(recentLikesData.data?.map((l) => ({
        id: `like-${l.id}`,
        type: "like" as const,
        user: (l.profiles as { username?: string })?.username || "unknown",
        avatar_url: (l.profiles as { avatar_url?: string })?.avatar_url,
        timestamp: l.created_at
      })) || []),
      ...(recentCommentsData.data?.map((c) => ({
        id: `comment-${c.id}`,
        type: "comment" as const,
        user: (c.profiles as { username?: string })?.username || "unknown",
        avatar_url: (c.profiles as { avatar_url?: string })?.avatar_url,
        timestamp: c.created_at
      })) || [])
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const stats = {
      active_users: activeUsersCount,
      posts_per_minute: postsLastMinute || 0,
      likes_per_minute: likesLastMinute || 0,
      comments_per_minute: commentsLastMinute || 0,
      active_sessions: activeUsersCount, // Same as active users (no session tracking)
      peak_users_today: Math.max(peakUsersToday, activeUsersCount),
      engagement_rate: Math.min(engagementRate, 100), // Cap at 100%
      trending_content_type: trendingType
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        activities
      }
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
