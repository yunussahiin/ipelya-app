import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('anomaly_alerts')
      .select('*');

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (status === 'active') {
      query = query.is('resolved_at', null);
    } else if (status === 'resolved') {
      query = query.not('resolved_at', 'is', null);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      data,
      total: data?.length || 0,
      active: data?.filter(a => !a.resolved_at).length || 0,
    });
  } catch (error) {
    console.error('Anomalies endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
