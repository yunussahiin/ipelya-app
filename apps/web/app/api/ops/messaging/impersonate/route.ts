/**
 * POST /api/ops/messaging/impersonate
 * Kullanıcı adına mesaj gönder (Admin Impersonation)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

interface ImpersonateRequest {
  target_user_id: string;
  conversation_id: string;
  content: string;
  content_type?: "text" | "image" | "file";
  reply_to_id?: string;
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

    const body: ImpersonateRequest = await request.json();
    const { target_user_id, conversation_id, content, content_type = "text", reply_to_id } = body;

    if (!target_user_id || !conversation_id || !content) {
      return NextResponse.json(
        { error: "target_user_id, conversation_id, and content are required" },
        { status: 400 }
      );
    }

    // Hedef kullanıcının varlığını kontrol et
    const { data: targetUser, error: userError } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, type")
      .eq("user_id", target_user_id)
      .eq("type", "real")
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Sohbetin varlığını ve kullanıcının katılımcı olduğunu kontrol et
    const { data: participant, error: partError } = await adminSupabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("user_id", target_user_id)
      .is("left_at", null)
      .single();

    if (partError || !participant) {
      return NextResponse.json(
        { error: "Target user is not a participant of this conversation" },
        { status: 400 }
      );
    }

    // Mesajı oluştur (kullanıcı adına, impersonated olarak işaretle)
    const { data: message, error: msgError } = await adminSupabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id: target_user_id, // Kullanıcı adına gönderiliyor
        content,
        content_type,
        reply_to_id,
        is_impersonated: true,
        sent_by_admin_id: user.id, // Hangi admin gönderdi
      })
      .select("id, created_at")
      .single();

    if (msgError) {
      console.error("[Impersonate] Error creating message:", msgError);
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Audit log oluştur
    const { data: auditLog, error: auditError } = await adminSupabase
      .from("admin_impersonation_logs")
      .insert({
        admin_id: user.id,
        target_user_id,
        conversation_id,
        message_id: message.id,
        action: "send_message",
        metadata: {
          content_preview: content.substring(0, 100),
          content_type,
          admin_name: adminProfile.display_name,
          target_user_name: targetUser.display_name,
        },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
      })
      .select("id")
      .single();

    if (auditError) {
      console.error("[Impersonate] Error creating audit log:", auditError);
      // Audit log hatası mesaj gönderimini engellemez
    }

    return NextResponse.json({
      success: true,
      data: {
        message_id: message.id,
        audit_log_id: auditLog?.id,
        created_at: message.created_at,
      },
    });
  } catch (error) {
    console.error("[Impersonate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
