/**
 * LiveKit System Status API
 * Gerçek zamanlı sistem durumu ve kullanım istatistikleri
 * 
 * LiveKit Cloud kota API'si sunmuyor, bu yüzden:
 * - Gerçek veriler: RoomService.listRooms(), Supabase stats
 * - Limitler: Manuel tanımlı (.env veya sabit)
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RoomServiceClient } from "livekit-server-sdk";

// LiveKit Cloud limitleri (plan'a göre değişir)
// Build plan defaults - https://docs.livekit.io/home/cloud/quotas-and-limits
const LIVEKIT_LIMITS = {
  maxParticipants: parseInt(process.env.LIVEKIT_MAX_PARTICIPANTS || "100"),
  maxRooms: parseInt(process.env.LIVEKIT_MAX_ROOMS || "50"),
  maxEgressRequests: parseInt(process.env.LIVEKIT_MAX_EGRESS || "2"),
  monthlyVideoMinutes: parseInt(process.env.LIVEKIT_MONTHLY_MINUTES || "5000"),
  monthlyBandwidthGB: parseInt(process.env.LIVEKIT_MONTHLY_BANDWIDTH_GB || "50"),
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

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

    // LiveKit RoomService ile aktif odaları çek
    let livekitStatus: "healthy" | "degraded" | "down" = "healthy";
    let activeRooms = 0;
    let totalParticipants = 0;

    try {
      const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace("wss://", "https://");
      if (livekitHost && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
        const roomService = new RoomServiceClient(
          livekitHost,
          process.env.LIVEKIT_API_KEY,
          process.env.LIVEKIT_API_SECRET
        );

        const rooms = await roomService.listRooms();
        activeRooms = rooms.length;
        totalParticipants = rooms.reduce((sum, room) => sum + room.numParticipants, 0);
      }
    } catch (err) {
      console.error("LiveKit connection error:", err);
      // Bağlantı hatası - down olarak işaretle
      livekitStatus = "down";
    }

    // Supabase'den bu ayki istatistikler
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyStats } = await supabase
      .from("live_sessions")
      .select("id, total_duration_seconds, peak_viewers")
      .gte("created_at", startOfMonth.toISOString());

    const totalMinutesThisMonth = Math.round(
      (monthlyStats?.reduce((sum, s) => sum + (s.total_duration_seconds || 0), 0) || 0) / 60
    );

    // Supabase health check
    let supabaseStatus: "healthy" | "degraded" | "down" = "healthy";
    try {
      const { error } = await supabase.from("live_sessions").select("id").limit(1);
      if (error) supabaseStatus = "degraded";
    } catch {
      supabaseStatus = "down";
    }

    // Realtime health check (supabase ile aynı durumda)
    const realtimeStatus: "healthy" | "degraded" | "down" = supabaseStatus;

    // Kota kullanımları hesapla
    const quotas = [
      {
        name: "Eşzamanlı Katılımcı",
        used: totalParticipants,
        limit: LIVEKIT_LIMITS.maxParticipants,
        unit: "katılımcı",
        percentage: Math.round((totalParticipants / LIVEKIT_LIMITS.maxParticipants) * 100),
        status: getQuotaStatus(totalParticipants, LIVEKIT_LIMITS.maxParticipants),
      },
      {
        name: "Aktif Oda",
        used: activeRooms,
        limit: LIVEKIT_LIMITS.maxRooms,
        unit: "oda",
        percentage: Math.round((activeRooms / LIVEKIT_LIMITS.maxRooms) * 100),
        status: getQuotaStatus(activeRooms, LIVEKIT_LIMITS.maxRooms),
      },
      {
        name: "Aylık Video Dakikası",
        used: totalMinutesThisMonth,
        limit: LIVEKIT_LIMITS.monthlyVideoMinutes,
        unit: "dakika",
        percentage: Math.round((totalMinutesThisMonth / LIVEKIT_LIMITS.monthlyVideoMinutes) * 100),
        status: getQuotaStatus(totalMinutesThisMonth, LIVEKIT_LIMITS.monthlyVideoMinutes),
      },
      {
        name: "Egress (Kayıt)",
        used: 0, // Egress henüz implement edilmedi
        limit: LIVEKIT_LIMITS.maxEgressRequests,
        unit: "eşzamanlı",
        percentage: 0,
        status: "normal" as const,
      },
    ];

    // Sistem uyarıları oluştur
    const alerts: Array<{
      id: string;
      type: "info" | "warning" | "error" | "success";
      title: string;
      message: string;
      source: string;
      created_at: string;
      is_resolved: boolean;
    }> = [];

    // Kota uyarıları
    quotas.forEach((quota) => {
      if (quota.status === "warning") {
        alerts.push({
          id: `quota-warning-${quota.name}`,
          type: "warning",
          title: `${quota.name} Uyarısı`,
          message: `${quota.name} kullanımı %${quota.percentage}'e ulaştı.`,
          source: "quota_monitor",
          created_at: new Date().toISOString(),
          is_resolved: false,
        });
      } else if (quota.status === "critical") {
        alerts.push({
          id: `quota-critical-${quota.name}`,
          type: "error",
          title: `${quota.name} Kritik!`,
          message: `${quota.name} limiti aşılmak üzere! (%${quota.percentage})`,
          source: "quota_monitor",
          created_at: new Date().toISOString(),
          is_resolved: false,
        });
      }
    });

    // Sistem durumu uyarıları
    if (livekitStatus !== "healthy") {
      const isDown = livekitStatus === "down";
      alerts.push({
        id: "livekit-status",
        type: isDown ? "error" : "warning",
        title: "LiveKit Bağlantı Sorunu",
        message: "LiveKit Cloud bağlantısında sorun tespit edildi.",
        source: "system",
        created_at: new Date().toISOString(),
        is_resolved: false,
      });
    }

    if (supabaseStatus !== "healthy") {
      const isDown = supabaseStatus === "down";
      alerts.push({
        id: "supabase-status",
        type: isDown ? "error" : "warning",
        title: "Supabase Bağlantı Sorunu",
        message: "Supabase bağlantısında sorun tespit edildi.",
        source: "system",
        created_at: new Date().toISOString(),
        is_resolved: false,
      });
    }

    return NextResponse.json({
      health: {
        livekit: livekitStatus,
        supabase: supabaseStatus,
        realtime: realtimeStatus,
        lastCheck: new Date().toISOString(),
      },
      quotas,
      alerts,
      stats: {
        activeRooms,
        totalParticipants,
        totalMinutesThisMonth,
        sessionsThisMonth: monthlyStats?.length || 0,
      },
    });
  } catch (error) {
    console.error("System status API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

function getQuotaStatus(used: number, limit: number): "normal" | "warning" | "critical" {
  const percentage = (used / limit) * 100;
  if (percentage >= 90) return "critical";
  if (percentage >= 70) return "warning";
  return "normal";
}
