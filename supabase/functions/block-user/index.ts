/**
 * Block User Edge Function
 *
 * Amaç: Kullanıcıyı engelle/engeli kaldır
 *
 * Body:
 * - target_user_id: Engellenecek kullanıcının user_id'si
 * - action: 'block' | 'unblock'
 * - reason: (opsiyonel) Engelleme sebebi
 */

import { createClient } from "npm:@supabase/supabase-js@2";

console.log("🚀 Block User Function Started");

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
    const { target_user_id, action, reason } = body;

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "target_user_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!action || !["block", "unblock"].includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: "action must be block or unblock" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Can't block yourself
    if (user.id === target_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot block yourself" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Block request:", { blocker: user.id, target: target_user_id, action });

    // Check if target user exists
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("user_id, username")
      .eq("user_id", target_user_id)
      .eq("type", "real")
      .single();

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check current block status
    const { data: existingBlock } = await supabase
      .from("blocked_users")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", target_user_id)
      .single();

    if (action === "block") {
      if (existingBlock) {
        return new Response(
          JSON.stringify({ success: true, message: "Already blocked", is_blocked: true }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create block relationship
      const { error: insertError } = await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: target_user_id,
        reason: reason || null
      });

      if (insertError) {
        console.error("❌ Block insert error:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to block" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Also remove any follow relationships
      await supabase
        .from("followers")
        .delete()
        .or(
          `and(follower_id.eq.${user.id},following_id.eq.${target_user_id}),and(follower_id.eq.${target_user_id},following_id.eq.${user.id})`
        );

      console.log("✅ Blocked:", targetProfile.username);

      return new Response(
        JSON.stringify({ success: true, message: "Blocked successfully", is_blocked: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Unblock
      if (!existingBlock) {
        return new Response(
          JSON.stringify({ success: true, message: "Not blocked", is_blocked: false }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", target_user_id);

      if (deleteError) {
        console.error("❌ Unblock delete error:", deleteError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to unblock" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Unblocked:", targetProfile.username);

      return new Response(
        JSON.stringify({ success: true, message: "Unblocked successfully", is_blocked: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("❌ Error in block-user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
