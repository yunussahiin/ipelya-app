/**
 * LiveKit Şikayet Aksiyon API
 * Şikayeti çözümle veya reddet
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: reportId } = await params;
    const body = await request.json();
    const { action, banType, banDuration, notes } = body;

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

    // Şikayeti getir
    const { data: report, error: fetchError } = await supabase
      .from("live_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: "Şikayet bulunamadı" }, { status: 404 });
    }

    if (report.status !== "pending") {
      return NextResponse.json({ error: "Bu şikayet zaten işlenmiş" }, { status: 400 });
    }

    // Aksiyona göre işlem yap
    let actionTaken = "";
    
    switch (action) {
      case "dismiss":
        actionTaken = "dismissed";
        break;
        
      case "warn":
        actionTaken = "warning_sent";
        // TODO: Kullanıcıya uyarı bildirimi gönder
        break;
        
      case "kick":
        actionTaken = "user_kicked";
        // Kullanıcıyı oturumdan çıkar
        if (report.session_id) {
          await supabase
            .from("live_participants")
            .update({ status: "kicked", left_at: new Date().toISOString() })
            .eq("session_id", report.session_id)
            .eq("user_id", report.reported_user_id);
        }
        break;
        
      case "ban_session":
        actionTaken = "session_ban";
        // Oturum bazlı ban
        await supabase.from("live_session_bans").insert({
          session_id: report.session_id,
          user_id: report.reported_user_id,
          banned_by: user.id,
          reason: report.reason,
          is_permanent: false,
          expires_at: banDuration 
            ? new Date(Date.now() + banDuration * 60 * 60 * 1000).toISOString()
            : null,
        });
        break;
        
      case "ban_creator":
        actionTaken = "creator_ban";
        // Creator'dan kalıcı ban
        await supabase.from("live_session_bans").insert({
          user_id: report.reported_user_id,
          banned_by: user.id,
          reason: report.reason,
          ban_type: "creator",
          is_permanent: banType === "permanent",
          expires_at: banType !== "permanent" && banDuration
            ? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000).toISOString()
            : null,
        });
        break;
        
      case "ban_global":
        actionTaken = "global_ban";
        // Platform genelinde ban
        await supabase.from("live_session_bans").insert({
          user_id: report.reported_user_id,
          banned_by: user.id,
          reason: report.reason,
          ban_type: "global",
          is_permanent: true,
        });
        break;
        
      default:
        return NextResponse.json({ error: "Geçersiz aksiyon" }, { status: 400 });
    }

    // Şikayeti güncelle
    const { error: updateError } = await supabase
      .from("live_reports")
      .update({
        status: action === "dismiss" ? "dismissed" : "resolved",
        action_taken: actionTaken,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        admin_notes: notes,
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("Report update error:", updateError);
      return NextResponse.json({ error: "Şikayet güncellenemedi" }, { status: 500 });
    }

    // Admin log
    await supabase.from("live_admin_logs").insert({
      admin_id: user.id,
      action: `report_${action}`,
      target_type: "report",
      target_id: reportId,
      details: { action, actionTaken, notes, reportedUserId: report.reported_user_id },
    });

    return NextResponse.json({
      success: true,
      action: actionTaken,
    });
  } catch (error) {
    console.error("Report action error:", error);
    return NextResponse.json(
      { error: "İşlem yapılırken hata oluştu" },
      { status: 500 }
    );
  }
}
