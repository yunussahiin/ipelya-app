/**
 * LiveKit Session Duyuru API
 * Oturumdaki tüm katılımcılara duyuru gönderir
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: sessionId } = await params;
    const body = await request.json();
    const { message, type = "info" } = body; // type: info, warning, alert

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
    }

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

    // Session kontrolü
    const { data: session } = await supabase
      .from("live_sessions")
      .select("id, status, livekit_room_name")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 404 });
    }

    if (session.status !== "live") {
      return NextResponse.json({ error: "Oturum aktif değil" }, { status: 400 });
    }

    // Admin client ile broadcast gönder
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Supabase Realtime ile duyuru gönder
    const channel = adminSupabase.channel(`live:${sessionId}`);
    await channel.send({
      type: "broadcast",
      event: "admin_announcement",
      payload: {
        message: message.trim(),
        type,
        adminId: user.id,
        timestamp: new Date().toISOString(),
      },
    });

    // Sistem mesajı olarak da kaydet
    await adminSupabase.from("live_messages").insert({
      session_id: sessionId,
      sender_id: user.id,
      content: `📢 ${message.trim()}`,
      message_type: "system",
    });

    // Admin log
    await adminSupabase.from("live_admin_logs").insert({
      admin_id: user.id,
      action: "announce",
      target_type: "session",
      target_id: sessionId,
      details: { message, type },
    });

    return NextResponse.json({
      success: true,
      message: "Duyuru gönderildi",
    });
  } catch (error) {
    console.error("Announce API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
