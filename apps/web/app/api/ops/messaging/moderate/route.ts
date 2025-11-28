/**
 * POST /api/ops/messaging/moderate
 * Mesaj moderasyon işlemi (Admin için)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

type ModerationAction = "hide" | "unhide" | "delete" | "flag" | "unflag";

interface ModerationRequest {
  message_id: string;
  message_type: "dm" | "broadcast";
  action: ModerationAction;
  reason?: string;
}

export async function POST(request: NextRequest) {
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
      .select("role, display_name")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: ModerationRequest = await request.json();
    const { message_id, message_type, action, reason } = body;

    if (!message_id || !message_type || !action) {
      return NextResponse.json(
        { error: "message_id, message_type, and action are required" },
        { status: 400 }
      );
    }

    const validActions: ModerationAction[] = ["hide", "unhide", "delete", "flag", "unflag"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Mesaj tablosunu belirle
    const tableName = message_type === "dm" ? "messages" : "broadcast_messages";

    // Mevcut mesajı kontrol et
    const { data: existingMessage, error: fetchError } = await adminSupabase
      .from(tableName)
      .select("id, is_deleted, is_hidden, is_flagged")
      .eq("id", message_id)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Moderasyon işlemini uygula
    let updateData: Record<string, unknown> = {};
    
    switch (action) {
      case "hide":
        updateData = { is_hidden: true, hidden_at: new Date().toISOString(), hidden_by: user.id };
        break;
      case "unhide":
        updateData = { is_hidden: false, hidden_at: null, hidden_by: null };
        break;
      case "delete":
        updateData = { is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user.id };
        break;
      case "flag":
        updateData = { is_flagged: true, flagged_at: new Date().toISOString(), flagged_by: user.id, flag_reason: reason };
        break;
      case "unflag":
        updateData = { is_flagged: false, flagged_at: null, flagged_by: null, flag_reason: null };
        break;
    }

    const { error: updateError } = await adminSupabase
      .from(tableName)
      .update(updateData)
      .eq("id", message_id);

    if (updateError) {
      console.error("[Moderation] Error updating message:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Audit log oluştur
    await adminSupabase.from("audit_logs").insert({
      admin_id: user.id,
      action: `message_${action}`,
      target_type: message_type === "dm" ? "message" : "broadcast_message",
      target_id: message_id,
      metadata: {
        reason,
        admin_name: adminProfile.display_name,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message_id,
        action,
        performed_by: user.id,
      },
    });
  } catch (error) {
    console.error("[Moderation] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
