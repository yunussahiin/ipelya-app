/**
 * Follow User Edge Function
 *
 * Amaç: Kullanıcıyı takip et/takipten çık
 *
 * Body:
 * - target_user_id: Takip edilecek kullanıcının user_id'si
 * - action: 'follow' | 'unfollow'
 */

import { createClient } from "npm:@supabase/supabase-js@2";

console.log("🚀 Follow User Function Started");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

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

    // Parse body
    const body = await req.json();
    const { target_user_id, action } = body;

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "target_user_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!action || !["follow", "unfollow"].includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: "action must be follow or unfollow" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Can't follow yourself
    if (user.id === target_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot follow yourself" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Follow request:", { follower: user.id, target: target_user_id, action });

    // Check if target user exists
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .eq("user_id", target_user_id)
      .eq("type", "real")
      .single();

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check current follow status
    const { data: existingFollow } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", target_user_id)
      .single();

    if (action === "follow") {
      if (existingFollow) {
        return new Response(
          JSON.stringify({ success: true, message: "Already following", is_following: true }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create follow relationship
      const { error: insertError } = await supabase.from("followers").insert({
        follower_id: user.id,
        following_id: target_user_id
      });

      if (insertError) {
        console.error("❌ Follow insert error:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to follow" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Followed:", targetProfile.username);

      // Create notification for target user
      const followerUsername = await getUsername(user.id);
      await supabase.from("notifications").insert({
        user_id: target_user_id,
        type: "follow",
        title: "Yeni Takipçi",
        body: `@${followerUsername} seni takip etmeye başladı`,
        data: { follower_id: user.id },
        channel: "social"
      });

      return new Response(
        JSON.stringify({ success: true, message: "Followed successfully", is_following: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Unfollow
      if (!existingFollow) {
        return new Response(
          JSON.stringify({ success: true, message: "Not following", is_following: false }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", target_user_id);

      if (deleteError) {
        console.error("❌ Unfollow delete error:", deleteError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to unfollow" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Unfollowed:", targetProfile.username);

      return new Response(
        JSON.stringify({ success: true, message: "Unfollowed successfully", is_following: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("❌ Error in follow-user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Helper function to get username
async function getUsername(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", userId)
    .eq("type", "real")
    .single();
  return data?.username || "user";
}
