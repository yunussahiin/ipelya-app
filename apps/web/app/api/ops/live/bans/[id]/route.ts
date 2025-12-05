/**
 * LiveKit Ban Kaldırma API
 * Bir ban'ı kaldırır
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: banId } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Admin kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id, is_active, is_super_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminProfile || !adminProfile.is_active) {
      return NextResponse.json({ error: "Admin yetkisi gerekli" }, { status: 403 });
    }

    // Ban'ı getir
    const { data: ban, error: fetchError } = await supabase
      .from("live_session_bans")
      .select("*")
      .eq("id", banId)
      .single();

    if (fetchError || !ban) {
      return NextResponse.json({ error: "Ban bulunamadı" }, { status: 404 });
    }

    if (ban.lifted_at) {
      return NextResponse.json({ error: "Bu ban zaten kaldırılmış" }, { status: 400 });
    }

    // Global ban sadece super admin kaldırabilir
    if (ban.ban_type === "global" && !adminProfile.is_super_admin) {
      return NextResponse.json(
        { error: "Global ban kaldırmak için süper admin yetkisi gerekli" },
        { status: 403 }
      );
    }

    // Ban'ı kaldır
    const { error: updateError } = await supabase
      .from("live_session_bans")
      .update({
        lifted_at: new Date().toISOString(),
        lifted_by: user.id,
        lift_reason: reason,
      })
      .eq("id", banId);

    if (updateError) {
      console.error("Ban lift error:", updateError);
      return NextResponse.json({ error: "Ban kaldırılamadı" }, { status: 500 });
    }

    // Admin log
    await supabase.from("live_admin_logs").insert({
      admin_id: user.id,
      action: "ban_lifted",
      target_type: "ban",
      target_id: banId,
      details: { reason, banType: ban.ban_type, userId: ban.user_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ban lift error:", error);
    return NextResponse.json(
      { error: "Ban kaldırılırken hata oluştu" },
      { status: 500 }
    );
  }
}
