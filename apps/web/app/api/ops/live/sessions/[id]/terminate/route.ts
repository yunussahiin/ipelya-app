/**
 * API: POST /api/ops/live/sessions/[id]/terminate
 * Oturumu zorla sonlandırır
 * Referans: WEB_ADMIN_DASHBOARD.md → Force End Session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { terminateRoom } from '@/lib/livekit/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { reason } = body;

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
      .select('id, is_active, is_super_admin')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Session bilgisi al
    const { data: session, error: sessionError } = await adminSupabase
      .from('live_sessions')
      .select('id, livekit_room_name, status, title')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'live') {
      return NextResponse.json({ error: 'Session is not live' }, { status: 400 });
    }

    // LiveKit odayı kapat
    if (session.livekit_room_name) {
      const result = await terminateRoom(session.livekit_room_name, reason);
      if (!result.success) {
        console.error('LiveKit terminate error:', result.error);
        // LiveKit hatası olsa bile DB'yi güncelle
      }
    }

    // Session durumunu güncelle
    const { error: updateError } = await adminSupabase
      .from('live_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Session update error:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    // Tüm katılımcıları pasif yap
    await adminSupabase
      .from('live_participants')
      .update({
        is_active: false,
        left_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .is('left_at', null);

    // Admin log kaydet
    await adminSupabase.from('live_admin_logs').insert({
      admin_id: user.id,
      action: 'terminate_session',
      target_type: 'session',
      target_id: sessionId,
      metadata: { 
        session_title: session.title,
        reason: reason || 'Admin tarafından sonlandırıldı',
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Oturum başarıyla sonlandırıldı',
    });

  } catch (error) {
    console.error('Terminate session API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
