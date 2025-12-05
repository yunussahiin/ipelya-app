/**
 * LiveKit Creator İstatistikleri API
 * En aktif creator'ları ve performanslarını döner
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const period = searchParams.get("period") || "week"; // day, week, month

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

    // Tarih aralığı hesapla
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Creator bazlı oturum istatistikleri
    const { data: sessions } = await supabase
      .from("live_sessions")
      .select(`
        id,
        creator_id,
        type,
        viewer_count,
        max_viewer_count,
        duration_seconds,
        created_at,
        profiles:creator_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (!sessions) {
      return NextResponse.json({ creators: [] });
    }

    // Creator bazlı gruplama
    const creatorStats = new Map<string, {
      creator_id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      totalSessions: number;
      videoSessions: number;
      audioSessions: number;
      totalViewers: number;
      maxViewers: number;
      totalDuration: number;
      avgDuration: number;
      lastSession: string;
    }>();

    sessions.forEach(session => {
      const creatorId = session.creator_id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileData = session.profiles as any;
      const profile = profileData ? {
        id: profileData.id as string,
        username: profileData.username as string,
        display_name: profileData.display_name as string,
        avatar_url: profileData.avatar_url as string | null,
      } : null;

      if (!profile) return;

      const existing = creatorStats.get(creatorId);

      if (existing) {
        existing.totalSessions++;
        if (session.type === "video") existing.videoSessions++;
        if (session.type === "audio_room") existing.audioSessions++;
        existing.totalViewers += session.viewer_count || 0;
        existing.maxViewers = Math.max(existing.maxViewers, session.max_viewer_count || 0);
        existing.totalDuration += session.duration_seconds || 0;
        existing.avgDuration = Math.round(existing.totalDuration / existing.totalSessions);
        if (session.created_at > existing.lastSession) {
          existing.lastSession = session.created_at;
        }
      } else {
        creatorStats.set(creatorId, {
          creator_id: creatorId,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          totalSessions: 1,
          videoSessions: session.type === "video" ? 1 : 0,
          audioSessions: session.type === "audio_room" ? 1 : 0,
          totalViewers: session.viewer_count || 0,
          maxViewers: session.max_viewer_count || 0,
          totalDuration: session.duration_seconds || 0,
          avgDuration: session.duration_seconds || 0,
          lastSession: session.created_at,
        });
      }
    });

    // En aktif creator'ları sırala (toplam oturum sayısına göre)
    const sortedCreators = Array.from(creatorStats.values())
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, limit);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      creators: sortedCreators,
      totalCreators: creatorStats.size,
    });
  } catch (error) {
    console.error("Creator analytics error:", error);
    return NextResponse.json(
      { error: "Creator istatistikleri alınırken hata oluştu" },
      { status: 500 }
    );
  }
}
