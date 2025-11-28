/**
 * GET /api/ops/messaging/users/with-conversations
 * Sohbeti olan kullanıcıları listele (Admin için - impersonation)
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
      .from("admin_profiles")
      .select("id, is_active")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Sohbeti olan unique kullanıcıları bul
    const { data: participants, error: partError } = await adminSupabase
      .from("conversation_participants")
      .select("user_id")
      .is("left_at", null);

    if (partError) {
      console.error("[Users with conversations] Error:", partError);
      return NextResponse.json({ error: partError.message }, { status: 500 });
    }

    // Unique user_id'leri al
    const userIds = [...new Set(participants?.map((p) => p.user_id) || [])];

    if (userIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Profilleri getir (admin olmayanlar)
    let query = adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, is_creator, is_verified, role")
      .eq("type", "real")
      .in("user_id", userIds)
      .neq("role", "admin")
      .order("display_name", { ascending: true })
      .limit(limit);

    // Arama filtresi
    if (search.length >= 2) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("[Users with conversations] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Her kullanıcının sohbet sayısını hesapla
    const userConversationCounts: Record<string, number> = {};
    participants?.forEach((p) => {
      userConversationCounts[p.user_id] = (userConversationCounts[p.user_id] || 0) + 1;
    });

    const enrichedUsers = users?.map((u) => ({
      ...u,
      conversation_count: userConversationCounts[u.user_id] || 0,
    }));

    // Sohbet sayısına göre sırala (çoktan aza)
    enrichedUsers?.sort((a, b) => b.conversation_count - a.conversation_count);

    return NextResponse.json({
      success: true,
      data: enrichedUsers || [],
      total: enrichedUsers?.length || 0,
    });
  } catch (error) {
    console.error("[Users with conversations] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
