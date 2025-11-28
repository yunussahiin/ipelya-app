/**
 * AI Action Logs API Route
 * AI tool işlemlerini loglar ve geri alma imkanı sağlar
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { getAIActionLogs, revertAIAction } from "@/lib/ai/action-logger";

/**
 * GET - AI action loglarını getir
 */
export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Admin authentication
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await adminSupabase
      .from("admin_profiles")
      .select("id, is_active")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const toolName = searchParams.get("toolName") || undefined;
    const status = searchParams.get("status") || undefined;
    const targetType = searchParams.get("targetType") || undefined;

    const { logs, total } = await getAIActionLogs({
      limit,
      offset,
      toolName,
      status,
      targetType,
    });

    // İstatistikler
    const { data: allLogs } = await adminSupabase
      .from("ai_action_logs")
      .select("status, is_reversible, tool_name");

    const stats = {
      total: total,
      completed: allLogs?.filter(l => l.status === "completed").length || 0,
      failed: allLogs?.filter(l => l.status === "failed").length || 0,
      reverted: allLogs?.filter(l => l.status === "reverted").length || 0,
      reversible: allLogs?.filter(l => l.is_reversible && l.status === "completed").length || 0,
    };

    // Tool dağılımı
    const toolCounts: Record<string, number> = {};
    allLogs?.forEach(l => {
      toolCounts[l.tool_name] = (toolCounts[l.tool_name] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      logs,
      total,
      stats,
      toolCounts,
      pagination: {
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    });
  } catch (error) {
    console.error("[AI Action Logs Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - İşlemi geri al
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Admin authentication
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await adminSupabase
      .from("admin_profiles")
      .select("id, is_active, full_name")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { logId, reason } = body;

    if (!logId || !reason) {
      return NextResponse.json(
        { error: "logId ve reason gerekli" },
        { status: 400 }
      );
    }

    const result = await revertAIAction(logId, user.id, reason);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("[AI Action Revert Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
