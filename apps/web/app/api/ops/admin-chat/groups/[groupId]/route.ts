/**
 * PUT /api/ops/admin-chat/groups/[groupId] - Grup güncelle
 * DELETE /api/ops/admin-chat/groups/[groupId] - Grup sil
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
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
    const { name, avatar_url, add_members, remove_members } = body;

    // Grup var mı ve kullanıcı admin mi kontrol et
    const { data: participant } = await adminSupabase
      .from("ops_conversation_participants")
      .select("role")
      .eq("conversation_id", groupId)
      .eq("admin_id", user.id)
      .is("left_at", null)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Group not found or access denied" }, { status: 404 });
    }

    if (participant.role !== "admin") {
      return NextResponse.json({ error: "Only group admins can update the group" }, { status: 403 });
    }

    // Grup bilgilerini güncelle
    if (name || avatar_url !== undefined) {
      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      const { error: updateError } = await adminSupabase
        .from("ops_conversations")
        .update(updateData)
        .eq("id", groupId);

      if (updateError) {
        console.error("[AdminChat] Error updating group:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Üye ekle
    if (add_members && Array.isArray(add_members) && add_members.length > 0) {
      const memberInserts = add_members.map((adminId: string) => ({
        conversation_id: groupId,
        admin_id: adminId,
        role: "member",
      }));

      const { error: addError } = await adminSupabase
        .from("ops_conversation_participants")
        .upsert(memberInserts, { onConflict: "conversation_id,admin_id" });

      if (addError) {
        console.error("[AdminChat] Error adding members:", addError);
        return NextResponse.json({ error: addError.message }, { status: 500 });
      }
    }

    // Üye çıkar
    if (remove_members && Array.isArray(remove_members) && remove_members.length > 0) {
      const { error: removeError } = await adminSupabase
        .from("ops_conversation_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("conversation_id", groupId)
        .in("admin_id", remove_members);

      if (removeError) {
        console.error("[AdminChat] Error removing members:", removeError);
        return NextResponse.json({ error: removeError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: groupId, updated: true },
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
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
      .select("role, is_super_admin")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Grup var mı ve kullanıcı admin mi kontrol et
    const { data: group } = await adminSupabase
      .from("ops_conversations")
      .select("id, created_by")
      .eq("id", groupId)
      .eq("type", "group")
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Sadece grup oluşturucu veya super admin silebilir
    if (group.created_by !== user.id && !adminProfile.is_super_admin) {
      return NextResponse.json(
        { error: "Only group creator or super admin can delete the group" },
        { status: 403 }
      );
    }

    // Grubu arşivle (soft delete)
    const { error: archiveError } = await adminSupabase
      .from("ops_conversations")
      .update({ is_archived: true })
      .eq("id", groupId);

    if (archiveError) {
      console.error("[AdminChat] Error archiving group:", archiveError);
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    // Tüm katılımcıları çıkar
    await adminSupabase
      .from("ops_conversation_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("conversation_id", groupId);

    return NextResponse.json({
      success: true,
      data: { id: groupId, deleted: true },
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
