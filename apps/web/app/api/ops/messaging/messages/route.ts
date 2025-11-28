/**
 * GET /api/ops/messaging/messages
 * Sohbet mesajlarını listele (Admin için)
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

    // Mesajları getir
    let query = adminSupabase
      .from("messages")
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
        deleted_at,
        is_impersonated,
        sent_by_admin_id,
        created_at,
        updated_at
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("[Messaging] Error loading messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sender ID'lerini topla
    const senderIds = new Set<string>();
    const adminIds = new Set<string>();
    messages?.forEach((msg) => {
      senderIds.add(msg.sender_id);
      if (msg.sent_by_admin_id) {
        adminIds.add(msg.sent_by_admin_id);
      }
    });

    // Profilleri getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, type")
      .in("user_id", Array.from(senderIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Admin profillerini getir (impersonation için)
    let adminProfileMap = new Map();
    if (adminIds.size > 0) {
      const { data: adminProfiles } = await adminSupabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", Array.from(adminIds))
        .eq("type", "real");
      
      adminProfileMap = new Map(adminProfiles?.map((p) => [p.user_id, p]) || []);
    }

    // Reply mesajlarını getir
    const replyToIds = messages?.filter((m) => m.reply_to_id).map((m) => m.reply_to_id) || [];
    let replyMap = new Map();
    if (replyToIds.length > 0) {
      const { data: replyMessages } = await adminSupabase
        .from("messages")
        .select("id, content, content_type, sender_id")
        .in("id", replyToIds);

      replyMap = new Map(replyMessages?.map((m) => [m.id, m]) || []);
    }

    // Response hazırla
    const hasMore = (messages?.length || 0) > limit;
    const resultMessages = hasMore ? messages?.slice(0, limit) : messages;

    const enrichedMessages = resultMessages?.map((msg) => ({
      ...msg,
      sender_profile: profileMap.get(msg.sender_id),
      admin_profile: msg.sent_by_admin_id ? adminProfileMap.get(msg.sent_by_admin_id) : null,
      reply_to: msg.reply_to_id ? {
        ...replyMap.get(msg.reply_to_id),
        sender_profile: replyMap.get(msg.reply_to_id)?.sender_id 
          ? profileMap.get(replyMap.get(msg.reply_to_id).sender_id)
          : null,
      } : null,
    }));

    const nextCursor = hasMore && resultMessages?.length
      ? resultMessages[resultMessages.length - 1]?.created_at
      : null;

    return NextResponse.json({
      success: true,
      data: enrichedMessages,
      nextCursor,
    });
  } catch (error) {
    console.error("[Messaging] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
