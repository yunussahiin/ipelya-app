/**
 * LiveKit Session Mesajları API
 * Oturum chat mesajlarını listeler
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Admin kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminProfile || !adminProfile.is_active) {
      return NextResponse.json({ error: "Admin yetkisi gerekli" }, { status: 403 });
    }

    // Mesajları getir
    const { data: rawMessages, error, count } = await supabase
      .from("live_messages")
      .select(`
        id,
        session_id,
        sender_id,
        sender_profile_id,
        content,
        message_type,
        gift_id,
        gift_quantity,
        gift_coin_value,
        is_deleted,
        deleted_by,
        created_at
      `, { count: "exact" })
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Messages fetch error:", error);
      return NextResponse.json({ error: "Mesajlar alınamadı" }, { status: 500 });
    }

    // Profil bilgilerini ayrı sorgula
    const userIds = new Set<string>();
    rawMessages?.forEach(m => {
      if (m.sender_id) userIds.add(m.sender_id);
    });

    const { data: profiles } = userIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, user_id, username, display_name, avatar_url")
          .in("user_id", Array.from(userIds))
          .eq("type", "real")
      : { data: [] };

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const messages = rawMessages?.map(m => ({
      ...m,
      sender: profileMap.get(m.sender_id) || null,
    }));

    return NextResponse.json({
      messages,
      total: count || 0,
      sessionId,
    });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
