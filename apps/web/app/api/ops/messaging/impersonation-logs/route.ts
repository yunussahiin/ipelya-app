/**
 * GET /api/ops/messaging/impersonation-logs
 * Impersonation loglarını listele (Admin için)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Auth kontrolü
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin kontrolü
    const { data: adminProfile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("admin_id");
    const targetUserId = searchParams.get("target_user_id");
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    // Logları getir
    let query = adminSupabase
      .from("admin_impersonation_logs")
      .select(`
        id,
        admin_id,
        target_user_id,
        conversation_id,
        message_id,
        action,
        metadata,
        ip_address,
        user_agent,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (adminId) {
      query = query.eq("admin_id", adminId);
    }

    if (targetUserId) {
      query = query.eq("target_user_id", targetUserId);
    }

    if (action) {
      query = query.eq("action", action);
    }

    if (from) {
      query = query.gte("created_at", from);
    }

    if (to) {
      query = query.lte("created_at", to);
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("[ImpersonationLogs] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Admin ve target user ID'lerini topla
    const adminIds = new Set<string>();
    const targetUserIds = new Set<string>();
    logs?.forEach((log) => {
      adminIds.add(log.admin_id);
      targetUserIds.add(log.target_user_id);
    });

    // Profilleri getir
    const allUserIds = [...Array.from(adminIds), ...Array.from(targetUserIds)];
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", allUserIds)
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Response hazırla
    const hasMore = (logs?.length || 0) > limit;
    const resultLogs = hasMore ? logs?.slice(0, limit) : logs;

    const enrichedLogs = resultLogs?.map((log) => ({
      ...log,
      admin_profile: profileMap.get(log.admin_id),
      target_user_profile: profileMap.get(log.target_user_id),
    }));

    const nextCursor = hasMore && resultLogs?.length
      ? resultLogs[resultLogs.length - 1]?.created_at
      : null;

    // İstatistikler
    const stats = {
      total_logs: logs?.length || 0,
      unique_admins: adminIds.size,
      unique_targets: targetUserIds.size,
    };

    return NextResponse.json({
      success: true,
      data: enrichedLogs,
      stats,
      nextCursor,
    });
  } catch (error) {
    console.error("[ImpersonationLogs] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
