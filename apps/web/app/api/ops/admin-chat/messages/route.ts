/**
 * GET /api/ops/admin-chat/messages - Admin mesajlarını listele
 * POST /api/ops/admin-chat/messages - Mesaj gönder
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
    const conversationId = searchParams.get("conversation_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    if (!conversationId) {
      return NextResponse.json({ error: "conversation_id is required" }, { status: 400 });
    }

    // Kullanıcının bu sohbete erişimi var mı?
    const { data: participant } = await adminSupabase
      .from("ops_conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("admin_id", user.id)
      .is("left_at", null)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    // Mesajları getir
    let query = adminSupabase
      .from("ops_messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        content_type,
        media_url,
        media_metadata,
        reply_to_id,
        is_edited,
        edited_at,
        is_deleted,
        created_at
      `)
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("[AdminChat] Error loading messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sender ID'lerini topla
    const senderIds = new Set<string>();
    messages?.forEach((msg) => senderIds.add(msg.sender_id));

    // Profilleri getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, role, is_super_admin")
      .in("user_id", Array.from(senderIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Reply mesajlarını getir
    const replyToIds = messages?.filter((m) => m.reply_to_id).map((m) => m.reply_to_id) || [];
    let replyMap = new Map();
    if (replyToIds.length > 0) {
      const { data: replyMessages } = await adminSupabase
        .from("ops_messages")
        .select("id, content, content_type, sender_id")
        .in("id", replyToIds);

      replyMap = new Map(replyMessages?.map((m) => [m.id, m]) || []);
    }

    // Response hazırla
    const hasMore = (messages?.length || 0) > limit;
    const resultMessages = hasMore ? messages?.slice(0, limit) : messages;

    const enrichedMessages = resultMessages?.map((msg) => {
      const senderProfile = profileMap.get(msg.sender_id);
      const replyTo = msg.reply_to_id ? replyMap.get(msg.reply_to_id) : null;

      return {
        ...msg,
        sender: senderProfile ? {
          id: msg.sender_id,
          display_name: senderProfile.display_name,
          username: senderProfile.username,
          avatar_url: senderProfile.avatar_url,
          role: senderProfile.is_super_admin ? "super_admin" : senderProfile.role,
        } : null,
        reply_to: replyTo ? {
          id: replyTo.id,
          content: replyTo.content,
          content_type: replyTo.content_type,
          sender: profileMap.get(replyTo.sender_id),
        } : null,
      };
    });

    const nextCursor = hasMore && resultMessages?.length
      ? resultMessages[resultMessages.length - 1]?.created_at
      : null;

    return NextResponse.json({
      success: true,
      data: enrichedMessages,
      nextCursor,
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
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
      .select("role, display_name, avatar_url")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { conversation_id, content, content_type = "text", reply_to_id } = body;

    if (!conversation_id || !content) {
      return NextResponse.json(
        { error: "conversation_id and content are required" },
        { status: 400 }
      );
    }

    // Kullanıcının bu sohbete erişimi var mı?
    const { data: participant } = await adminSupabase
      .from("ops_conversation_participants")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("admin_id", user.id)
      .is("left_at", null)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    // Mesajı oluştur
    const { data: message, error: msgError } = await adminSupabase
      .from("ops_messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content,
        content_type,
        reply_to_id,
      })
      .select("id, created_at")
      .single();

    if (msgError) {
      console.error("[AdminChat] Error creating message:", msgError);
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        conversation_id,
        sender_id: user.id,
        content,
        content_type,
        reply_to_id,
        created_at: message.created_at,
        sender: {
          id: user.id,
          display_name: adminProfile.display_name,
          avatar_url: adminProfile.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
