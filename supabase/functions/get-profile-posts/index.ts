/**
 * Get Profile Posts Edge Function
 *
 * Amaç: Kullanıcının postlarını sayfalama ile getirir
 *
 * Parametreler:
 * - user_id: Profil sahibinin user_id'si
 * - cursor: Sayfalama için cursor (created_at)
 * - limit: Kaç post getirilecek (default: 12)
 */

import { createClient } from "npm:@supabase/supabase-js@2";

console.log("🚀 Get Profile Posts Function Started");

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
    const targetUserId = url.searchParams.get("user_id");
    const cursor = url.searchParams.get("cursor");
    const limit = parseInt(url.searchParams.get("limit") || "12");

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Posts request:", { targetUserId, cursor, limit });

    // ============ GET POSTS ============
    let postsQuery = supabase
      .from("posts")
      .select(
        "id, caption, likes_count, comments_count, views_count, created_at, post_type, post_media(id, media_url, thumbnail_url, media_type, width, height)"
      )
      .eq("user_id", targetUserId)
      .eq("is_hidden", false)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (cursor) {
      postsQuery = postsQuery.lt("created_at", cursor);
    }

    postsQuery = postsQuery.limit(limit);

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("❌ Posts fetch error:", postsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch posts" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("📸 Posts fetched:", posts?.length || 0);

    // ============ GET USER LIKES ============
    const postIds = (posts || []).map((p) => p.id);
    const { data: userLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds.length > 0 ? postIds : ["00000000-0000-0000-0000-000000000000"]);

    const likedPostIds = new Set((userLikes || []).map((l) => l.post_id));

    // ============ FORMAT RESPONSE ============
    const formattedPosts = (posts || []).map((post) => ({
      id: post.id,
      caption: post.caption,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      views_count: post.views_count,
      post_type: post.post_type,
      is_liked: likedPostIds.has(post.id),
      media: post.post_media || [],
      created_at: post.created_at
    }));

    // Determine next cursor
    const hasMore = posts && posts.length === limit;
    const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          posts: formattedPosts,
          next_cursor: nextCursor,
          has_more: hasMore
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in get-profile-posts:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
