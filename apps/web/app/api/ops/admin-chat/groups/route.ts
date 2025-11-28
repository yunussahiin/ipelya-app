/**
 * GET /api/ops/admin-chat/groups - Grupları listele
 * POST /api/ops/admin-chat/groups - Grup oluştur
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
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

    // Admin'in grup sohbetlerini getir
    const { data: participations, error } = await adminSupabase
      .from("ops_conversation_participants")
      .select(`
        conversation_id,
        role,
        joined_at,
        conversation:ops_conversations!inner (
          id,
          type,
          name,
          avatar_url,
          created_by,
          created_at
        )
      `)
      .eq("admin_id", user.id)
      .is("left_at", null);

    if (error) {
      console.error("[AdminChat] Error loading groups:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sadece grup sohbetlerini filtrele
    type ConversationType = {
      id: string;
      type: string;
      name: string | null;
      avatar_url: string | null;
      created_by: string;
      created_at: string;
    };

    const groups = participations?.filter((p) => {
      const conv = p.conversation as unknown as ConversationType;
      return conv?.type === "group";
    }) || [];

    // Grup ID'lerini topla
    const groupIds = groups.map((g) => g.conversation_id);

    if (groupIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Tüm katılımcıları getir
    const { data: allParticipants } = await adminSupabase
      .from("ops_conversation_participants")
      .select("conversation_id, admin_id, role")
      .in("conversation_id", groupIds)
      .is("left_at", null);

    // Admin ID'lerini topla
    const adminIds = new Set<string>();
    allParticipants?.forEach((p) => adminIds.add(p.admin_id));

    // Admin profillerini getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", Array.from(adminIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Response hazırla
    const enrichedGroups = groups.map((g) => {
      const conv = g.conversation as unknown as ConversationType;
      const members = allParticipants?.filter((p) => p.conversation_id === g.conversation_id) || [];

      return {
        id: conv.id,
        name: conv.name,
        avatar_url: conv.avatar_url,
        created_by: conv.created_by,
        created_at: conv.created_at,
        my_role: g.role,
        member_count: members.length,
        members: members.map((m) => {
          const profile = profileMap.get(m.admin_id);
          return {
            id: m.admin_id,
            display_name: profile?.display_name,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            role: m.role,
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedGroups,
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
    const { name, member_ids, avatar_url } = body;

    if (!name || !member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json(
        { error: "name and member_ids are required" },
        { status: 400 }
      );
    }

    // Grup oluştur
    const { data: group, error: groupError } = await adminSupabase
      .from("ops_conversations")
      .insert({
        type: "group",
        name,
        avatar_url,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (groupError) {
      console.error("[AdminChat] Error creating group:", groupError);
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    // Katılımcıları ekle (kendisi dahil, admin rolüyle)
    const allMemberIds = [...new Set([user.id, ...member_ids])];
    const memberInserts = allMemberIds.map((adminId) => ({
      conversation_id: group.id,
      admin_id: adminId,
      role: adminId === user.id ? "admin" : "member",
    }));

    const { error: memberError } = await adminSupabase
      .from("ops_conversation_participants")
      .insert(memberInserts);

    if (memberError) {
      console.error("[AdminChat] Error adding members:", memberError);
      // Rollback: grubu sil
      await adminSupabase.from("ops_conversations").delete().eq("id", group.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: group.id,
        name,
        member_count: allMemberIds.length,
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
