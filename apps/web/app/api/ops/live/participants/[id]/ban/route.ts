/**
 * API: POST /api/ops/live/participants/[id]/ban
 * Katılımcıyı banlar (oturum veya kalıcı)
 * Referans: MODERATION.md → Ban Türleri
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { kickParticipant } from '@/lib/livekit/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: participantId } = await params;
    const body = await request.json();
    const { reason, ban_type = 'session', duration_hours } = body;

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

    // Katılımcı bilgisi al
    const { data: participant, error: participantError } = await adminSupabase
      .from('live_participants')
      .select(`
        *,
        session:live_sessions!live_participants_session_id_fkey(
          id,
          livekit_room_name,
          status,
          title
        ),
        profile:profiles!live_participants_profile_id_fkey(
          username,
          display_name
        )
      `)
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Host banlanamaz
    if (participant.role === 'host') {
      return NextResponse.json({ error: 'Cannot ban the host' }, { status: 400 });
    }

    const session = participant.session as { id: string; livekit_room_name: string; status: string; title: string | null };
    
    // Ban süresi hesapla
    let expiresAt: string | null = null;
    if (duration_hours && duration_hours > 0) {
      const expireDate = new Date();
      expireDate.setHours(expireDate.getHours() + duration_hours);
      expiresAt = expireDate.toISOString();
    }

    // Ban kaydı oluştur
    const { error: banError } = await adminSupabase
      .from('live_session_bans')
      .insert({
        session_id: session.id,
        banned_user_id: participant.user_id,
        banned_by: user.id,
        reason: reason || 'Admin tarafından yasaklandı',
        ban_type: ban_type,
        expires_at: expiresAt,
        is_active: true,
      });

    if (banError) {
      console.error('Ban insert error:', banError);
      return NextResponse.json({ error: 'Failed to create ban' }, { status: 500 });
    }

    // LiveKit'ten çıkar
    if (session?.livekit_room_name && session.status === 'live') {
      const result = await kickParticipant(session.livekit_room_name, participant.user_id, reason);
      if (!result.success) {
        console.error('LiveKit kick error:', result.error);
      }
    }

    // Katılımcıyı pasif yap
    await adminSupabase
      .from('live_participants')
      .update({
        is_active: false,
        left_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    // Admin log kaydet
    const profile = participant.profile as { username: string | null; display_name: string | null };
    await adminSupabase.from('live_admin_logs').insert({
      admin_id: user.id,
      action: 'ban_participant',
      target_type: 'participant',
      target_id: participantId,
      metadata: { 
        user_id: participant.user_id,
        username: profile?.username,
        ban_type: ban_type,
        duration_hours: duration_hours,
        reason: reason,
        session_title: session.title,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: ban_type === 'permanent' 
        ? 'Kullanıcı kalıcı olarak yasaklandı' 
        : 'Kullanıcı bu oturumdan yasaklandı',
    });

  } catch (error) {
    console.error('Ban participant API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
