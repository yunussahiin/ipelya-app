/**
 * Moderation History API
 * 
 * Belirli bir içeriğin moderasyon geçmişini getirir
 */

import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Server client for auth check
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for operations
    const supabase = createAdminSupabaseClient();

    // Admin check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query params
    const searchParams = request.nextUrl.searchParams;
    const targetType = searchParams.get("target_type");
    const targetId = searchParams.get("target_id");

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "target_type and target_id are required" },
        { status: 400 }
      );
    }

    // Get moderation history for this content
    const { data: logs, error: logsError } = await supabase
      .from("moderation_actions")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });

    if (logsError) {
      console.error("Logs error:", logsError);
      return NextResponse.json(
        { error: "Failed to fetch moderation history" },
        { status: 500 }
      );
    }

    // Get admin info
    const adminIds = [...new Set((logs || []).map((l) => l.admin_id))];
    const { data: admins } = await supabase
      .from("admin_profiles")
      .select("id, full_name, email")
      .in("id", adminIds.length > 0 ? adminIds : ["00000000-0000-0000-0000-000000000000"]);

    const adminMap = new Map(
      (admins || []).map((a) => [a.id, { display_name: a.full_name, email: a.email }])
    );

    // Get reason templates
    const reasonCodes = [...new Set((logs || []).map((l) => l.reason_code).filter(Boolean))];
    const { data: reasons } = await supabase
      .from("moderation_reason_templates")
      .select("code, title")
      .in("code", reasonCodes.length > 0 ? reasonCodes : ["none"]);

    const reasonMap = new Map((reasons || []).map((r) => [r.code, r.title]));

    // Enrich logs
    const enrichedLogs = (logs || []).map((log) => ({
      id: log.id,
      action_type: log.action_type,
      reason_code: log.reason_code,
      reason_title: log.reason_code ? reasonMap.get(log.reason_code) : null,
      reason_custom: log.reason_custom,
      admin_note: log.admin_note,
      created_at: log.created_at,
      admin: adminMap.get(log.admin_id) || { display_name: "Bilinmeyen Admin" }
    }));

    return NextResponse.json({
      success: true,
      data: enrichedLogs
    });
  } catch (error) {
    console.error("Moderation history error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
