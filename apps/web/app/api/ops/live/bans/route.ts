/**
 * LiveKit Ban Listesi API
 * Aktif ve geçmiş banları listeler
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // session, creator, global, all
    const active = searchParams.get("active") !== "false"; // true by default
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

    // Ban'ları getir (FK ilişkisi olmadığı için embedded query kullanmıyoruz)
    let query = supabase
      .from("live_session_bans")
      .select(`
        id,
        session_id,
        banned_user_id,
        banned_by,
        reason,
        ban_type,
        is_active,
        expires_at,
        lifted_at,
        lifted_by,
        created_at
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Tür filtreleme
    if (type !== "all") {
      query = query.eq("ban_type", type);
    }

    // Aktif/Geçmiş filtreleme
    if (active) {
      query = query.eq("is_active", true);
    } else {
      // Kaldırılmış
      query = query.eq("is_active", false);
    }

    const { data: rawBans, error, count } = await query;

    if (error) {
      console.error("Bans fetch error:", error);
      return NextResponse.json({ error: "Banlar alınamadı" }, { status: 500 });
    }

    // Profil ve session bilgilerini ayrı sorgularla al
    const userIds = new Set<string>();
    const sessionIds = new Set<string>();
    
    rawBans?.forEach(b => {
      if (b.banned_user_id) userIds.add(b.banned_user_id);
      if (b.banned_by) userIds.add(b.banned_by);
      if (b.session_id) sessionIds.add(b.session_id);
    });

    // Profilleri al
    const { data: profiles } = userIds.size > 0 
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", Array.from(userIds))
      : { data: [] };

    // Session'ları al
    const { data: sessions } = sessionIds.size > 0
      ? await supabase
          .from("live_sessions")
          .select("id, title, type")
          .in("id", Array.from(sessionIds))
      : { data: [] };

    // Map'ler oluştur
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const sessionMap = new Map(sessions?.map(s => [s.id, s]) || []);

    // Bans'a profil ve session bilgilerini ekle
    const bans = rawBans?.map(b => ({
      ...b,
      user: profileMap.get(b.banned_user_id) || null,
      banned_by_user: profileMap.get(b.banned_by) || null,
      session: sessionMap.get(b.session_id) || null,
    }));

    if (error) {
      console.error("Bans fetch error:", error);
      return NextResponse.json({ error: "Banlar alınamadı" }, { status: 500 });
    }

    // Tür sayıları
    const { data: typeCounts } = await supabase
      .from("live_session_bans")
      .select("ban_type, is_permanent, expires_at, lifted_at")
      .is("lifted_at", null)
      .then(({ data }) => {
        const now = new Date();
        const counts = { session: 0, creator: 0, global: 0, total: 0 };
        data?.forEach(b => {
          // Aktif mi kontrol et
          const isActive = b.is_permanent || !b.expires_at || new Date(b.expires_at) > now;
          if (isActive && b.ban_type in counts) {
            counts[b.ban_type as keyof typeof counts]++;
            counts.total++;
          }
        });
        return { data: counts };
      });

    return NextResponse.json({
      bans: bans || [],
      total: count || 0,
      typeCounts,
    });
  } catch (error) {
    console.error("Bans error:", error);
    return NextResponse.json(
      { error: "Banlar alınırken hata oluştu" },
      { status: 500 }
    );
  }
}
