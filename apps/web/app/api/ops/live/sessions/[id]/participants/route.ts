/**
 * API: GET /api/ops/live/sessions/[id]/participants
 * Oturum katılımcılarını listeler
 * Referans: WEB_ADMIN_DASHBOARD.md → Session Detail → Participants
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

    // Query params
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    const role = searchParams.get('role');

    // Katılımcıları al
    let query = adminSupabase
      .from('live_participants')
      .select(`
        *,
        profile:profiles!live_participants_profile_id_fkey(
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('session_id', sessionId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: participants, error } = await query;

    if (error) {
      console.error('Participants query error:', error);
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    // İzleme süresini hesapla
    const participantsWithWatchTime = (participants || []).map((p) => {
      const joinedAt = new Date(p.joined_at);
      const leftAt = p.left_at ? new Date(p.left_at) : new Date();
      const watchTimeSeconds = p.is_active 
        ? Math.floor((Date.now() - joinedAt.getTime()) / 1000)
        : p.total_watch_time_seconds || Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000);

      return {
        ...p,
        watch_time_seconds: watchTimeSeconds,
      };
    });

    // Rol bazlı grupla
    const byRole = {
      host: participantsWithWatchTime.filter(p => p.role === 'host'),
      co_host: participantsWithWatchTime.filter(p => p.role === 'co_host'),
      moderator: participantsWithWatchTime.filter(p => p.role === 'moderator'),
      speaker: participantsWithWatchTime.filter(p => p.role === 'speaker'),
      viewer: participantsWithWatchTime.filter(p => ['viewer', 'listener'].includes(p.role)),
    };

    return NextResponse.json({
      participants: participantsWithWatchTime,
      by_role: byRole,
      total: participantsWithWatchTime.length,
      active_count: participantsWithWatchTime.filter(p => p.is_active).length,
    });

  } catch (error) {
    console.error('Participants API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
