/**
 * GET /api/ops/messaging/users/[userId]/conversations
 * Belirli bir kullanıcının sohbetlerini listele (Admin için - Impersonation)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    // Hedef kullanıcının varlığını kontrol et
    const { data: targetUser, error: userError } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .eq("user_id", userId)
      .eq("type", "real")
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Audit log - view action
    await adminSupabase.from("admin_impersonation_logs").insert({
      admin_id: user.id,
      target_user_id: userId,
      conversation_id: "00000000-0000-0000-0000-000000000000", // Placeholder for list view
      action: "view",
      metadata: {
        action_type: "list_conversations",
        admin_name: adminProfile.display_name,
        target_user_name: targetUser.display_name,
      },
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
    });

    // Query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    // Kullanıcının sohbetlerini getir
    let query = adminSupabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        unread_count,
        joined_at,
        conversation:conversations (
          id,
          type,
          name,
          avatar_url,
          last_message_at,
          created_at
        )
      `)
      .eq("user_id", userId)
      .is("left_at", null)
      .order("joined_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("joined_at", cursor);
    }

    const { data: participations, error } = await query;

    if (error) {
      console.error("[UserConversations] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Conversation ID'lerini topla
    const convIds = participations?.map((p) => p.conversation_id) || [];

    // Tüm katılımcıları getir
    const { data: allParticipants } = await adminSupabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .is("left_at", null);

    // Katılımcı user_id'lerini topla
    const participantUserIds = new Set<string>();
    allParticipants?.forEach((p) => participantUserIds.add(p.user_id));

    // Profilleri getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", Array.from(participantUserIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Son mesajları getir
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
    const hasMore = (participations?.length || 0) > limit;
    const resultParticipations = hasMore ? participations?.slice(0, limit) : participations;

    type ConversationType = {
      id: string;
      type: string;
      name: string | null;
      avatar_url: string | null;
      last_message_at: string | null;
      created_at: string;
    };

    const enrichedConversations = resultParticipations?.map((p) => {
      const conv = p.conversation as unknown as ConversationType | null;
      if (!conv) return null;

      // Karşı tarafı bul (direct chat için)
      const convParticipants = allParticipants?.filter((ap) => ap.conversation_id === p.conversation_id) || [];
      const otherParticipant = convParticipants.find((cp) => cp.user_id !== userId);
      const otherProfile = otherParticipant ? profileMap.get(otherParticipant.user_id) : null;

      const lastMessage = lastMessageMap.get(p.conversation_id);

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name || otherProfile?.display_name || otherProfile?.username,
        avatar_url: conv.avatar_url || otherProfile?.avatar_url,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
        unread_count: p.unread_count,
        other_participant: otherProfile,
        last_message: lastMessage
          ? {
              content: lastMessage.content,
              content_type: lastMessage.content_type,
              is_mine: lastMessage.sender_id === userId,
              created_at: lastMessage.created_at,
            }
          : null,
      };
    }).filter(Boolean);

    const nextCursor = hasMore && resultParticipations?.length
      ? resultParticipations[resultParticipations.length - 1]?.joined_at
      : null;

    return NextResponse.json({
      success: true,
      data: {
        target_user: targetUser,
        conversations: enrichedConversations,
      },
      nextCursor,
    });
  } catch (error) {
    console.error("[UserConversations] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
