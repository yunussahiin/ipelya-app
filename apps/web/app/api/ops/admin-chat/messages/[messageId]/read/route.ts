/**
 * POST /api/ops/admin-chat/messages/[messageId]/read - Mesajı okundu olarak işaretle
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
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

    // Mesajı bul
    const { data: message, error: fetchError } = await adminSupabase
      .from("ops_messages")
      .select("id, conversation_id")
      .eq("id", messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Kullanıcının bu sohbete erişimi var mı?
    const { data: participant } = await adminSupabase
      .from("ops_conversation_participants")
      .select("id")
      .eq("conversation_id", message.conversation_id)
      .eq("admin_id", user.id)
      .is("left_at", null)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    // Read receipt oluştur veya güncelle
    const { error: upsertError } = await adminSupabase
      .from("ops_message_read_receipts")
      .upsert(
        {
          message_id: messageId,
          admin_id: user.id,
          read_at: new Date().toISOString(),
        },
        {
          onConflict: "message_id,admin_id",
        }
      );

    if (upsertError) {
      console.error("[AdminChat] Error creating read receipt:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Participant'ın unread_count'unu sıfırla
    await adminSupabase
      .from("ops_conversation_participants")
      .update({ unread_count: 0, last_read_message_id: messageId })
      .eq("conversation_id", message.conversation_id)
      .eq("admin_id", user.id);

    return NextResponse.json({
      success: true,
      data: { message_id: messageId, read: true },
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
