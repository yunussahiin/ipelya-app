  /**
 * LiveKit Webhook Logs API
 * Webhook event loglarını listeler
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("event_type");
    const status = searchParams.get("status");
    const roomName = searchParams.get("room_name");
    const limit = parseInt(searchParams.get("limit") || "100");
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

    // Admin client ile logları getir (RLS bypass)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Logları getir
    let query = adminSupabase
      .from("live_webhook_logs")
      .select(`
        id,
        event_type,
        room_name,
        room_sid,
        participant_identity,
        participant_sid,
        session_id,
        call_id,
        raw_payload,
        processing_status,
        error_message,
        processing_time_ms,
        created_at
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (status) {
      query = query.eq("processing_status", status);
    }

    if (roomName) {
      query = query.ilike("room_name", `%${roomName}%`);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Webhook logs fetch error:", error);
      return NextResponse.json({ error: "Loglar alınamadı" }, { status: 500 });
    }

    // Event type ve status sayıları
    const { data: stats } = await adminSupabase
      .from("live_webhook_logs")
      .select("event_type, processing_status")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => {
        const eventCounts: Record<string, number> = {};
        const statusCounts = { success: 0, error: 0, skipped: 0 };

        data?.forEach((log) => {
          eventCounts[log.event_type] = (eventCounts[log.event_type] || 0) + 1;
          if (log.processing_status in statusCounts) {
            statusCounts[log.processing_status as keyof typeof statusCounts]++;
          }
        });

        return { data: { eventCounts, statusCounts, total: data?.length || 0 } };
      });

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      stats: stats || { eventCounts: {}, statusCounts: { success: 0, error: 0, skipped: 0 }, total: 0 },
    });
  } catch (error) {
    console.error("Webhook logs error:", error);
    return NextResponse.json(
      { error: "Loglar alınırken hata oluştu" },
      { status: 500 }
    );
  }
}
