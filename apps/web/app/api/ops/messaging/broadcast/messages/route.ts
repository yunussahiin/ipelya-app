/**
 * GET /api/ops/messaging/broadcast/messages
 * Broadcast kanal mesajlarını listele (Admin için)
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
    const channelId = searchParams.get("channel_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    if (!channelId) {
      return NextResponse.json({ error: "channel_id is required" }, { status: 400 });
    }

    // Mesajları getir
    let query = adminSupabase
      .from("broadcast_messages")
      .select(`
        id,
        channel_id,
        sender_id,
        content,
        content_type,
        media_url,
        media_metadata,
        poll_data,
        reaction_counts,
        is_pinned,
        is_deleted,
        created_at,
        updated_at
      `)
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("[Broadcast] Error loading messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sender ID'lerini topla
    const senderIds = new Set<string>();
    messages?.forEach((msg) => {
      if (msg.sender_id) senderIds.add(msg.sender_id);
    });

    // Profilleri getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, is_verified")
      .in("user_id", Array.from(senderIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Response hazırla
    const hasMore = (messages?.length || 0) > limit;
    const resultMessages = hasMore ? messages?.slice(0, limit) : messages;

    const enrichedMessages = resultMessages?.map((msg) => ({
      ...msg,
      sender_profile: msg.sender_id ? profileMap.get(msg.sender_id) : null,
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
    console.error("[Broadcast] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
