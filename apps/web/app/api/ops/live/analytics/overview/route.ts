/**
 * LiveKit Analitik Özet API
 * Günlük, haftalık ve aylık istatistikleri döner
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Bugünkü istatistikler
    const { data: todaySessions } = await supabase
      .from("live_sessions")
      .select("id, type, viewer_count, duration_seconds")
      .gte("created_at", today.toISOString());

    // Haftalık istatistikler
    const { data: weekSessions } = await supabase
      .from("live_sessions")
      .select("id, type, viewer_count, duration_seconds, created_at")
      .gte("created_at", weekAgo.toISOString());

    // Aylık istatistikler
    const { data: monthSessions } = await supabase
      .from("live_sessions")
      .select("id, type, viewer_count, duration_seconds, created_at")
      .gte("created_at", monthAgo.toISOString());

    // Bugünkü çağrılar
    const { data: todayCalls } = await supabase
      .from("calls")
      .select("id, type, duration_seconds")
      .gte("created_at", today.toISOString());

    // Haftalık çağrılar
    const { data: weekCalls } = await supabase
      .from("calls")
      .select("id, type, duration_seconds, created_at")
      .gte("created_at", weekAgo.toISOString());

    // Haftalık günlük breakdown
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const daySessions = (weekSessions || []).filter(s => {
        const sessionDate = new Date(s.created_at);
        return sessionDate >= date && sessionDate < nextDate;
      });

      const dayCalls = (weekCalls || []).filter(c => {
        const callDate = new Date(c.created_at);
        return callDate >= date && callDate < nextDate;
      });

      dailyBreakdown.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("tr-TR", { weekday: "short" }),
        videoSessions: daySessions.filter(s => s.type === "video").length,
        audioSessions: daySessions.filter(s => s.type === "audio_room").length,
        calls: dayCalls.length,
        totalViewers: daySessions.reduce((sum, s) => sum + (s.viewer_count || 0), 0),
        totalDuration: daySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0),
      });
    }

    // Oturum türü dağılımı
    const typeDistribution = {
      video: (monthSessions || []).filter(s => s.type === "video").length,
      audio_room: (monthSessions || []).filter(s => s.type === "audio_room").length,
      calls: (weekCalls || []).length,
    };

    // Özet metrikleri hesapla
    const calculateStats = (sessions: typeof todaySessions) => ({
      totalSessions: sessions?.length || 0,
      videoSessions: sessions?.filter(s => s.type === "video").length || 0,
      audioSessions: sessions?.filter(s => s.type === "audio_room").length || 0,
      totalViewers: sessions?.reduce((sum, s) => sum + (s.viewer_count || 0), 0) || 0,
      totalDuration: sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0,
      avgDuration: sessions?.length 
        ? Math.round((sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)) / sessions.length)
        : 0,
    });

    return NextResponse.json({
      today: {
        ...calculateStats(todaySessions),
        calls: todayCalls?.length || 0,
      },
      week: {
        ...calculateStats(weekSessions),
        calls: weekCalls?.length || 0,
      },
      month: {
        ...calculateStats(monthSessions),
      },
      dailyBreakdown,
      typeDistribution,
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return NextResponse.json(
      { error: "İstatistikler alınırken hata oluştu" },
      { status: 500 }
    );
  }
}
