/**
 * AI Logs API Route
 * Web Ops AI chat loglarını yönetir
 * 
 * GET /api/ops/ai/logs - Logları getir (pagination, filter destekli)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

/**
 * GET - AI chat loglarını getir
 * Query params:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - sessionId: string (optional)
 * - adminId: string (optional)
 * - role: string (optional: user, assistant, system, tool)
 */
export async function GET(request: NextRequest) {
  try {
    // User session için server client, DB işlemleri için admin client
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Admin authentication kontrolü - cookie'lerden session al
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin profil kontrolü
    const { data: adminProfile } = await adminSupabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Query parametrelerini al
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('sessionId');
    const adminId = searchParams.get('adminId');
    const role = searchParams.get('role');

    // Logları al
    let query = adminSupabase
      .from('ai_chat_logs')
      .select(`
        id,
        admin_id,
        session_id,
        role,
        content,
        tool_calls,
        tool_results,
        model,
        tokens_used,
        duration_ms,
        error,
        created_at,
        admin:admin_profiles!ai_chat_logs_admin_id_fkey (
          full_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtreler
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (adminId) {
      query = query.eq('admin_id', adminId);
    }
    if (role) {
      query = query.eq('role', role);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('[AI Logs Error]:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // İstatistikleri hesapla
    const { data: statsData } = await adminSupabase
      .from('ai_chat_logs')
      .select('tokens_used, duration_ms, error')
      .not('tokens_used', 'is', null);

    const stats = {
      total_requests: count || 0,
      total_tokens: statsData?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0,
      avg_duration_ms: statsData?.length
        ? Math.round(
            statsData.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / statsData.length
          )
        : 0,
      error_count: statsData?.filter((log) => log.error).length || 0,
    };

    return NextResponse.json({
      success: true,
      logs,
      total: count || 0,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('[AI Logs Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
