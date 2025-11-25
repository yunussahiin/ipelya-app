/**
 * Report User Edge Function
 *
 * Amaç: Kullanıcıyı şikayet et
 *
 * Body:
 * - target_user_id: Şikayet edilecek kullanıcının user_id'si
 * - reason: Şikayet sebebi (spam, harassment, inappropriate, fake, other)
 * - description: (opsiyonel) Ek açıklama
 */

import { createClient } from "npm:@supabase/supabase-js@2";

console.log("🚀 Report User Function Started");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const VALID_REASONS = ["spam", "harassment", "inappropriate", "fake", "other"];

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
    const { target_user_id, reason, description } = body;

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "target_user_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `reason must be one of: ${VALID_REASONS.join(", ")}`
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Can't report yourself
    if (user.id === target_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot report yourself" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Report request:", { reporter: user.id, target: target_user_id, reason });

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

    // Check for duplicate report (same reporter, same target, same reason in last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingReport } = await supabase
      .from("user_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("reported_user_id", target_user_id)
      .eq("reason", reason)
      .gte("created_at", oneDayAgo)
      .single();

    if (existingReport) {
      return new Response(
        JSON.stringify({ success: true, message: "Report already submitted" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create report
    const { error: insertError } = await supabase.from("user_reports").insert({
      reporter_id: user.id,
      reported_user_id: target_user_id,
      reason,
      description: description || null,
      status: "pending"
    });

    if (insertError) {
      console.error("❌ Report insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to submit report" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Reported:", targetProfile.username, "for", reason);

    return new Response(
      JSON.stringify({ success: true, message: "Report submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in report-user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
