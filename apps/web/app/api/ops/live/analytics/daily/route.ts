/**
 * LiveKit Günlük Analitik API
 * Son 30 günün detaylı istatistiklerini döner
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Günlük session verileri
    const { data: sessions } = await supabase
      .from("live_sessions")
      .select("id, type, status, created_at, started_at, ended_at, total_duration_seconds, peak_viewers")
      .gte("created_at", startDate.toISOString());

    // Günlük çağrı verileri
    const { data: calls } = await supabase
      .from("calls")
      .select("id, status, created_at, duration_seconds")
      .gte("created_at", startDate.toISOString());

    // Günlük bazda grupla
    const dailyData: Record<string, {
      date: string;
      sessions: { video: number; audio: number; screen: number; total: number };
      calls: number;
      totalViewers: number;
      totalDuration: number;
      avgDuration: number;
      peakViewers: number;
    }> = {};

    // Son N gün için boş veri oluştur
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = {
        date: dateStr,
        sessions: { video: 0, audio: 0, screen: 0, total: 0 },
        calls: 0,
        totalViewers: 0,
        totalDuration: 0,
        avgDuration: 0,
        peakViewers: 0,
      };
    }

    // Session verilerini işle
    sessions?.forEach(session => {
      const dateStr = session.created_at.split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].sessions.total++;
        if (session.type === "video") dailyData[dateStr].sessions.video++;
        else if (session.type === "audio") dailyData[dateStr].sessions.audio++;
        else if (session.type === "screen") dailyData[dateStr].sessions.screen++;

        dailyData[dateStr].totalViewers += session.peak_viewers || 0;
        dailyData[dateStr].totalDuration += session.total_duration_seconds || 0;
        if ((session.peak_viewers || 0) > dailyData[dateStr].peakViewers) {
          dailyData[dateStr].peakViewers = session.peak_viewers || 0;
        }
      }
    });

    // Call verilerini işle
    calls?.forEach(call => {
      const dateStr = call.created_at.split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].calls++;
      }
    });

    // Ortalama süreleri hesapla
    Object.values(dailyData).forEach(day => {
      if (day.sessions.total > 0) {
        day.avgDuration = Math.round(day.totalDuration / day.sessions.total);
      }
    });

    // Array'e çevir ve sırala
    const daily = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Özet istatistikler
    const summary = {
      totalSessions: sessions?.length || 0,
      totalCalls: calls?.length || 0,
      totalViewers: daily.reduce((sum, d) => sum + d.totalViewers, 0),
      totalDuration: daily.reduce((sum, d) => sum + d.totalDuration, 0),
      avgSessionsPerDay: Math.round((sessions?.length || 0) / days * 10) / 10,
      avgCallsPerDay: Math.round((calls?.length || 0) / days * 10) / 10,
      peakViewersAllTime: Math.max(...daily.map(d => d.peakViewers)),
    };

    return NextResponse.json({
      daily,
      summary,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error("Daily analytics API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
