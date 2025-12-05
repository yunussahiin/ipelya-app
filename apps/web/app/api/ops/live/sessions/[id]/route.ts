/**
 * API: GET /api/ops/live/sessions/[id]
 * Tek bir oturumun detaylı bilgilerini getirir
 * Referans: WEB_ADMIN_DASHBOARD.md → Session Detail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Auth kontrolü
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Session detayı
    const { data: session, error: sessionError } = await adminSupabase
      .from('live_sessions')
      .select(`
        *,
        creator:profiles!live_sessions_creator_profile_id_fkey(
          id,
          user_id,
          username,
          display_name,
          avatar_url,
          is_creator
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Aktif katılımcı sayısı
    const { count: currentViewers } = await adminSupabase
      .from('live_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_active', true);

    // Toplam katılım sayısı
    const { count: totalJoins } = await adminSupabase
      .from('live_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Mesaj sayısı
    const { count: messageCount } = await adminSupabase
      .from('live_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_deleted', false);

    // Hediye sayısı
    const { count: giftCount } = await adminSupabase
      .from('live_gifts')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Süre hesapla
    const startedAt = session.started_at ? new Date(session.started_at) : new Date();
    const endedAt = session.ended_at ? new Date(session.ended_at) : new Date();
    const durationSeconds = session.status === 'live' 
      ? Math.floor((Date.now() - startedAt.getTime()) / 1000)
      : Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    // Admin log kaydet
    await adminSupabase.from('live_admin_logs').insert({
      admin_id: user.id,
      action: 'view_session',
      target_type: 'session',
      target_id: sessionId,
      metadata: { session_title: session.title },
    });

    return NextResponse.json({
      ...session,
      current_viewers: currentViewers || 0,
      total_joins: totalJoins || 0,
      message_count: messageCount || 0,
      gift_count: giftCount || 0,
      duration_seconds: durationSeconds,
    });

  } catch (error) {
    console.error('Session detail API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
