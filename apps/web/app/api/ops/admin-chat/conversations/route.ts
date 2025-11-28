/**
 * GET /api/ops/admin-chat/conversations - Admin sohbetlerini listele
 * POST /api/ops/admin-chat/conversations - Yeni sohbet oluştur
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    // Admin'in sohbetlerini getir
    let query = adminSupabase
      .from("ops_conversation_participants")
      .select(`
        conversation_id,
        unread_count,
        is_muted,
        joined_at,
        conversation:ops_conversations (
          id,
          type,
          name,
          avatar_url,
          last_message_at,
          created_at
        )
      `)
      .eq("admin_id", user.id)
      .is("left_at", null)
      .order("joined_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("joined_at", cursor);
    }

    const { data: participations, error } = await query;

    if (error) {
      console.error("[AdminChat] Error loading conversations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Conversation ID'lerini topla
    const convIds = participations?.map((p) => p.conversation_id) || [];

    if (convIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        nextCursor: null,
      });
    }

    // Tüm katılımcıları getir
    const { data: allParticipants } = await adminSupabase
      .from("ops_conversation_participants")
      .select("conversation_id, admin_id")
      .in("conversation_id", convIds)
      .is("left_at", null);

    // Admin ID'lerini topla
    const adminIds = new Set<string>();
    allParticipants?.forEach((p) => adminIds.add(p.admin_id));

    // Admin profillerini getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, role, is_super_admin")
      .in("user_id", Array.from(adminIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Son mesajları getir
    const { data: lastMessages } = await adminSupabase
      .from("ops_messages")
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

      // Katılımcıları bul
      const convParticipants = allParticipants?.filter((ap) => ap.conversation_id === p.conversation_id) || [];
      const otherParticipant = convParticipants.find((cp) => cp.admin_id !== user.id);
      const otherProfile = otherParticipant ? profileMap.get(otherParticipant.admin_id) : null;

      const lastMessage = lastMessageMap.get(p.conversation_id);

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name || otherProfile?.display_name || otherProfile?.username,
        avatar_url: conv.avatar_url || otherProfile?.avatar_url,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
        unread_count: p.unread_count,
        is_muted: p.is_muted,
        other_participant: otherProfile ? {
          id: otherParticipant?.admin_id,
          display_name: otherProfile.display_name,
          username: otherProfile.username,
          avatar_url: otherProfile.avatar_url,
          role: otherProfile.is_super_admin ? "super_admin" : otherProfile.role,
        } : null,
        participants: convParticipants.map((cp) => {
          const profile = profileMap.get(cp.admin_id);
          return {
            id: cp.admin_id,
            display_name: profile?.display_name,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            role: profile?.is_super_admin ? "super_admin" : profile?.role,
          };
        }),
        last_message: lastMessage
          ? {
              content: lastMessage.content,
              content_type: lastMessage.content_type,
              sender: profileMap.get(lastMessage.sender_id),
              is_mine: lastMessage.sender_id === user.id,
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
      data: enrichedConversations,
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
      .select("role")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, participant_ids, name } = body;

    if (!type || !participant_ids || !Array.isArray(participant_ids)) {
      return NextResponse.json(
        { error: "type and participant_ids are required" },
        { status: 400 }
      );
    }

    // Direct chat için mevcut sohbeti kontrol et
    if (type === "direct" && participant_ids.length === 1) {
      const otherAdminId = participant_ids[0];

      // Mevcut direct sohbet var mı?
      const { data: existingConv } = await adminSupabase
        .from("ops_conversations")
        .select(`
          id,
          ops_conversation_participants!inner (admin_id)
        `)
        .eq("type", "direct");

      // Her iki admin'in de katılımcı olduğu sohbeti bul
      const existingDirectChat = existingConv?.find((conv) => {
        const participantIds = conv.ops_conversation_participants.map((p: { admin_id: string }) => p.admin_id);
        return participantIds.includes(user.id) && participantIds.includes(otherAdminId);
      });

      if (existingDirectChat) {
        return NextResponse.json({
          success: true,
          data: { id: existingDirectChat.id, existing: true },
        });
      }
    }

    // Yeni sohbet oluştur
    const { data: conversation, error: convError } = await adminSupabase
      .from("ops_conversations")
      .insert({
        type,
        name: type === "group" ? name : null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (convError) {
      console.error("[AdminChat] Error creating conversation:", convError);
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Katılımcıları ekle (kendisi dahil)
    const allParticipantIds = [...new Set([user.id, ...participant_ids])];
    const participantInserts = allParticipantIds.map((adminId) => ({
      conversation_id: conversation.id,
      admin_id: adminId,
      role: adminId === user.id ? "admin" : "member",
    }));

    const { error: partError } = await adminSupabase
      .from("ops_conversation_participants")
      .insert(participantInserts);

    if (partError) {
      console.error("[AdminChat] Error adding participants:", partError);
      // Rollback: sohbeti sil
      await adminSupabase.from("ops_conversations").delete().eq("id", conversation.id);
      return NextResponse.json({ error: partError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { id: conversation.id, existing: false },
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
