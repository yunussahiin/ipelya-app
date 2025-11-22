import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';
    const sort = searchParams.get('sort') || 'last_activity';

    let query = supabase
      .from('sessions')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order(sort, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error('Sessions endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
