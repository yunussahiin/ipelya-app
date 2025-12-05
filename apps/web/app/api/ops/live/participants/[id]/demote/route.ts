/**
 * LiveKit Participant Rol Düşürme API
 * Katılımcının rolünü düşürür (co_host → speaker → viewer)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const ROLE_HIERARCHY = ["viewer", "speaker", "co_host", "host"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: participantId } = await params;
    const body = await request.json();
    const { targetRole } = body; // Opsiyonel: belirli bir role düşür

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

    // Participant bilgisi al
    const { data: participant } = await supabase
      .from("live_participants")
      .select("id, session_id, user_id, role, is_active")
      .eq("id", participantId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Katılımcı bulunamadı" }, { status: 404 });
    }

    if (!participant.is_active) {
      return NextResponse.json({ error: "Katılımcı aktif değil" }, { status: 400 });
    }

    if (participant.role === "host") {
      return NextResponse.json({ error: "Host rolü düşürülemez" }, { status: 400 });
    }

    // Yeni rol hesapla
    const currentIndex = ROLE_HIERARCHY.indexOf(participant.role);
    let newRole: string;

    if (targetRole && ROLE_HIERARCHY.includes(targetRole)) {
      // Belirli bir role düşür
      const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);
      if (targetIndex >= currentIndex) {
        return NextResponse.json({ error: "Hedef rol mevcut rolden yüksek veya eşit" }, { status: 400 });
      }
      newRole = targetRole;
    } else {
      // Bir alt role düşür
      if (currentIndex <= 0) {
        return NextResponse.json({ error: "Daha fazla düşürülemez" }, { status: 400 });
      }
      newRole = ROLE_HIERARCHY[currentIndex - 1];
    }

    // Admin client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Rolü güncelle
    const { error: updateError } = await adminSupabase
      .from("live_participants")
      .update({ role: newRole })
      .eq("id", participantId);

    if (updateError) {
      console.error("Role update error:", updateError);
      return NextResponse.json({ error: "Rol güncellenemedi" }, { status: 500 });
    }

    // Realtime bildirim
    const channel = adminSupabase.channel(`live:${participant.session_id}`);
    await channel.send({
      type: "broadcast",
      event: "participant_demoted",
      payload: {
        participantId,
        userId: participant.user_id,
        oldRole: participant.role,
        newRole,
      },
    });

    // Admin log
    await adminSupabase.from("live_admin_logs").insert({
      admin_id: user.id,
      action: "demote",
      target_type: "participant",
      target_id: participantId,
      details: {
        sessionId: participant.session_id,
        userId: participant.user_id,
        oldRole: participant.role,
        newRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Rol ${participant.role} → ${newRole} olarak güncellendi`,
      oldRole: participant.role,
      newRole,
    });
  } catch (error) {
    console.error("Demote API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
