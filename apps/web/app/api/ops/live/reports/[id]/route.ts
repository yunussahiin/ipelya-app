/**
 * LiveKit Şikayet Detay API
 * Tek bir şikayetin detaylarını döner
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: reportId } = await params;

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

    // Şikayet detayını al
    const { data: report, error } = await supabase
      .from("live_reports")
      .select(`
        id,
        session_id,
        reporter_id,
        reported_user_id,
        reason,
        description,
        evidence_urls,
        status,
        reviewed_by,
        reviewed_at,
        action_taken,
        action_note,
        created_at,
        updated_at
      `)
      .eq("id", reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: "Şikayet bulunamadı" }, { status: 404 });
    }

    // İlgili profilleri al
    const userIds = [report.reporter_id, report.reported_user_id].filter(Boolean);
    if (report.reviewed_by) userIds.push(report.reviewed_by);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, username, display_name, avatar_url")
      .in("user_id", userIds)
      .eq("type", "real");

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Session bilgisi al
    const { data: session } = report.session_id
      ? await supabase
          .from("live_sessions")
          .select("id, title, type, status, creator_id, created_at")
          .eq("id", report.session_id)
          .single()
      : { data: null };

    // Aynı kullanıcının diğer şikayetleri
    const { data: previousReports, count: previousReportCount } = await supabase
      .from("live_reports")
      .select("id, reason, status, created_at", { count: "exact" })
      .eq("reported_user_id", report.reported_user_id)
      .neq("id", reportId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Kullanıcının ban geçmişi
    const { data: banHistory, count: banCount } = await supabase
      .from("live_session_bans")
      .select("id, ban_type, reason, is_active, created_at", { count: "exact" })
      .eq("banned_user_id", report.reported_user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      report: {
        ...report,
        reporter: profileMap.get(report.reporter_id) || null,
        reported_user: profileMap.get(report.reported_user_id) || null,
        reviewed_by_user: report.reviewed_by ? profileMap.get(report.reviewed_by) : null,
        session,
      },
      context: {
        previousReports: previousReports || [],
        previousReportCount: previousReportCount || 0,
        banHistory: banHistory || [],
        banCount: banCount || 0,
      },
    });
  } catch (error) {
    console.error("Report detail API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
