/**
 * API: POST /api/ops/live/participants/[id]/unmute
 * Katılımcının mikrofonunu açar (unmute)
 * Referans: MODERATION.md → Participant Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { muteAllTracks } from '@/lib/livekit/server';

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

    // Katılımcı bilgisi al - önce participant table id ile dene, yoksa user_id ile
    let participant;
    let participantError;

    // Önce participant table id olarak dene
    const { data: byId } = await adminSupabase
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
      .eq('is_active', true)
      .single();

    if (byId) {
      participant = byId;
    } else {
      // user_id olarak dene (LiveKit identity)
      const { data: byUserId, error: byUserIdError } = await adminSupabase
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
        .eq('user_id', participantId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      participant = byUserId;
      participantError = byUserIdError;
    }

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    if (!participant.is_active) {
      return NextResponse.json({ error: 'Participant is not active' }, { status: 400 });
    }

    // LiveKit'te unmute et
    const session = participant.session as { livekit_room_name: string; status: string };
    let unmutedTracks = 0;
    
    if (session?.livekit_room_name && session.status === 'live') {
      const result = await muteAllTracks(session.livekit_room_name, participant.user_id, false);
      if (!result.success) {
        console.error('LiveKit unmute error');
      }
      unmutedTracks = result.mutedTracks;
    }

    // Katılımcıyı unmuted olarak işaretle
    await adminSupabase
      .from('live_participants')
      .update({
        is_muted: false,
      })
      .eq('id', participant.id);

    // Admin log kaydet
    const profile = participant.profile as { username: string | null; display_name: string | null };
    await adminSupabase.from('live_admin_logs').insert({
      admin_id: user.id,
      action: 'unmute_participant',
      target_type: 'participant',
      target_id: participantId,
      metadata: { 
        user_id: participant.user_id,
        username: profile?.username,
        reason: reason || 'Admin tarafından mikrofonu açıldı',
        unmuted_tracks: unmutedTracks,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Katılımcının mikrofonu açıldı',
      unmutedTracks,
    });

  } catch (error) {
    console.error('Unmute participant API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
