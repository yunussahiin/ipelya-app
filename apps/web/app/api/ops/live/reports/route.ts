/**
 * LiveKit Şikayet Listesi API
 * Bekleyen ve işlenmiş şikayetleri listeler
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending"; // pending, resolved, dismissed
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

    // Şikayetleri getir (FK ilişkisi olmadığı için embedded query kullanmıyoruz)
    let query = supabase
      .from("live_reports")
      .select(`
        id,
        session_id,
        reporter_id,
        reported_user_id,
        reason,
        description,
        status,
        action_taken,
        action_note,
        reviewed_by,
        reviewed_at,
        created_at
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: rawReports, error, count } = await query;

    if (error) {
      console.error("Reports fetch error:", error);
      return NextResponse.json({ error: "Şikayetler alınamadı" }, { status: 500 });
    }

    // Profil ve session bilgilerini ayrı sorgularla al
    const userIds = new Set<string>();
    const sessionIds = new Set<string>();
    
    rawReports?.forEach(r => {
      if (r.reporter_id) userIds.add(r.reporter_id);
      if (r.reported_user_id) userIds.add(r.reported_user_id);
      if (r.session_id) sessionIds.add(r.session_id);
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
          .select("id, title, type, status")
          .in("id", Array.from(sessionIds))
      : { data: [] };

    // Map'ler oluştur
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const sessionMap = new Map(sessions?.map(s => [s.id, s]) || []);

    // Reports'a profil ve session bilgilerini ekle
    const reports = rawReports?.map(r => ({
      ...r,
      reporter: profileMap.get(r.reporter_id) || null,
      reported_user: profileMap.get(r.reported_user_id) || null,
      session: sessionMap.get(r.session_id) || null,
    }));

    if (error) {
      console.error("Reports fetch error:", error);
      return NextResponse.json({ error: "Şikayetler alınamadı" }, { status: 500 });
    }

    // Durum sayıları
    const { data: statusCounts } = await supabase
      .from("live_reports")
      .select("status")
      .then(({ data }) => {
        const counts = { pending: 0, resolved: 0, dismissed: 0 };
        data?.forEach(r => {
          if (r.status in counts) {
            counts[r.status as keyof typeof counts]++;
          }
        });
        return { data: counts };
      });

    return NextResponse.json({
      reports: reports || [],
      total: count || 0,
      statusCounts,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Şikayetler alınırken hata oluştu" },
      { status: 500 }
    );
  }
}
