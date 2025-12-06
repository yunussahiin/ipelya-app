/**
 * API: GET /api/ops/live/admin-logs
 * Admin moderasyon loglarını getirir
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action'); // Filter by action type

    // Admin loglarını getir
    let query = adminSupabase
      .from('live_admin_logs')
      .select(`
        id,
        admin_id,
        action,
        target_type,
        target_id,
        metadata,
        ip_address,
        user_agent,
        created_at,
        admin:admin_profiles!live_admin_logs_admin_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Admin logs fetch error:', error);
      return NextResponse.json({ error: 'Loglar alınamadı' }, { status: 500 });
    }

    // Action counts
    const { data: actionCounts } = await adminSupabase
      .from('live_admin_logs')
      .select('action')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const counts: Record<string, number> = {};
    actionCounts?.forEach((log) => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });

    // Total count
    const { count: total } = await adminSupabase
      .from('live_admin_logs')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      logs: logs || [],
      actionCounts: counts,
      total: total || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Admin logs API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
