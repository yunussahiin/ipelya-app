/**
 * API: POST /api/ops/live/participants/[id]/kick
 * Katılımcıyı oturumdan çıkarır (kick)
 * Referans: MODERATION.md → Kick vs Ban
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { kickParticipant as livekitKick } from '@/lib/livekit/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: participantId } = await params;
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
      .select('id, is_active')
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
          livekit_room_name,
          status
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

    if (!participant.is_active) {
      return NextResponse.json({ error: 'Participant is not active' }, { status: 400 });
    }

    // Host kicklenemez
    if (participant.role === 'host') {
      return NextResponse.json({ error: 'Cannot kick the host' }, { status: 400 });
    }

    // LiveKit'ten çıkar
    const session = participant.session as { livekit_room_name: string; status: string };
    if (session?.livekit_room_name && session.status === 'live') {
      const result = await livekitKick(session.livekit_room_name, participant.user_id, reason);
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
      action: 'kick_participant',
      target_type: 'participant',
      target_id: participantId,
      metadata: { 
        user_id: participant.user_id,
        username: profile?.username,
        reason: reason || 'Admin tarafından çıkarıldı',
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Katılımcı başarıyla çıkarıldı',
    });

  } catch (error) {
    console.error('Kick participant API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
