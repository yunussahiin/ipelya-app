/**
 * API: GET /api/ops/live/sessions
 * Aktif canlı yayınları ve çağrıları listeler
 * Referans: WEB_ADMIN_DASHBOARD.md → Live Overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { LiveSession, LiveAnalyticsOverview } from '@/lib/types/live';

export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü - cookie'lerden session al
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin client - RLS bypass
    const adminSupabase = createAdminSupabaseClient();

    // Admin profil kontrolü
    const { data: adminProfile } = await adminSupabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'live';
    const type = searchParams.get('type'); // video_live, audio_room
    const limit = parseInt(searchParams.get('limit') || '50');

    // Aktif video/audio sessions
    let sessionsQuery = adminSupabase
      .from('live_sessions')
      .select(`
        *,
        creator:profiles!live_sessions_creator_profile_id_fkey(
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', status)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (type) {
      sessionsQuery = sessionsQuery.eq('session_type', type);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Her session için aktif katılımcı sayısını al
    const sessionsWithViewers = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count } = await adminSupabase
          .from('live_participants')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)
          .eq('is_active', true);

        // Süre hesapla
        const startedAt = session.started_at ? new Date(session.started_at) : new Date();
        const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

        return {
          ...session,
          current_viewers: count || 0,
          duration_seconds: durationSeconds,
        } as LiveSession;
      })
    );

    // Aktif çağrıları al
    const { data: calls, error: callsError } = await adminSupabase
      .from('calls')
      .select(`
        *,
        caller:profiles!calls_caller_profile_id_fkey(
          username,
          display_name,
          avatar_url
        ),
        callee:profiles!calls_callee_profile_id_fkey(
          username,
          display_name,
          avatar_url
        )
      `)
      .in('status', ['ringing', 'accepted', 'in_call'])
      .order('initiated_at', { ascending: false })
      .limit(20);

    if (callsError) {
      console.error('Calls query error:', callsError);
    }

    // Özet istatistikler
    const videoSessions = sessionsWithViewers.filter(s => s.session_type === 'video_live');
    const audioRooms = sessionsWithViewers.filter(s => s.session_type === 'audio_room');
    const totalViewers = sessionsWithViewers.reduce((sum, s) => sum + (s.current_viewers || 0), 0);

    // Bekleyen şikayet sayısı
    const { count: pendingReports } = await adminSupabase
      .from('live_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Aktif ban sayısı
    const { count: activeBans } = await adminSupabase
      .from('live_session_bans')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const overview: LiveAnalyticsOverview = {
      active_sessions: sessionsWithViewers.length,
      active_video_sessions: videoSessions.length,
      active_audio_rooms: audioRooms.length,
      active_calls: calls?.length || 0,
      total_viewers: totalViewers,
      pending_reports: pendingReports || 0,
      active_bans: activeBans || 0,
    };

    return NextResponse.json({
      sessions: sessionsWithViewers,
      calls: calls || [],
      overview,
    });

  } catch (error) {
    console.error('Live sessions API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
