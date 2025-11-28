/**
 * GET /api/ops/messaging/conversations
 * Tüm kullanıcı sohbetlerini listele (Admin için)
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
    const _search = searchParams.get("search") || ""; // TODO: implement search
    const type = searchParams.get("type"); // direct, group
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    // Sohbetleri getir
    let query = adminSupabase
      .from("conversations")
      .select(`
        id,
        type,
        name,
        avatar_url,
        last_message_at,
        created_at,
        conversation_participants!inner (
          user_id,
          unread_count
        )
      `)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(limit + 1);

    if (type) {
      query = query.eq("type", type);
    }

    if (cursor) {
      query = query.lt("last_message_at", cursor);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error("[Messaging] Error loading conversations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Participant user_id'lerini topla
    const userIds = new Set<string>();
    conversations?.forEach((conv) => {
      conv.conversation_participants?.forEach((p: { user_id: string }) => {
        userIds.add(p.user_id);
      });
    });

    // Profilleri getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", Array.from(userIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Son mesajları getir
    const convIds = conversations?.map((c) => c.id) || [];
    const { data: lastMessages } = await adminSupabase
      .from("messages")
      .select("conversation_id, content, content_type, sender_id, created_at")
      .in("conversation_id", convIds)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // Her conversation için son mesajı bul
    type MessageType = {
      conversation_id: string;
      content: string;
      content_type: string;
      sender_id: string;
      created_at: string;
    };
    const lastMessageMap = new Map<string, MessageType>();
    lastMessages?.forEach((msg) => {
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    });

    // Response hazırla
    const hasMore = (conversations?.length || 0) > limit;
    const resultConversations = hasMore ? conversations?.slice(0, limit) : conversations;

    const enrichedConversations = resultConversations?.map((conv) => {
      const participants = conv.conversation_participants?.map((p: { user_id: string; unread_count: number }) => ({
        ...p,
        profile: profileMap.get(p.user_id),
      }));

      const lastMessage = lastMessageMap.get(conv.id);

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        avatar_url: conv.avatar_url,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
        participants,
        last_message: lastMessage
          ? {
              content: lastMessage.content,
              content_type: lastMessage.content_type,
              sender: profileMap.get(lastMessage.sender_id),
              created_at: lastMessage.created_at,
            }
          : null,
      };
    });

    const nextCursor = hasMore && resultConversations?.length
      ? resultConversations[resultConversations.length - 1]?.last_message_at
      : null;

    return NextResponse.json({
      success: true,
      data: enrichedConversations,
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
