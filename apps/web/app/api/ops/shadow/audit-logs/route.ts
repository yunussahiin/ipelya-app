import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Audit logs API - Filters:', { userId, action, startDate, endDate, limit, offset });

    // Get audit logs
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action);

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get unique user IDs from logs
    const userIds = Array.from(new Set((logs || []).map((log) => log.user_id)));

    // Get profile info for these users (including type)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, id, username, email, is_creator, role, type, avatar_url')
      .in('user_id', userIds);

    if (profileError) throw profileError;

    // Create a map of user_id+type -> profile
    const profileMap = new Map();
    (profiles || []).forEach((p) => {
      profileMap.set(`${p.user_id}:${p.type}`, p);
    });

    // Merge logs with profile data (match by user_id and profile_type)
    const logsWithProfiles = (logs || []).map((log) => {
      const profile = profileMap.get(`${log.user_id}:${log.profile_type}`);
      console.log(`Log ${log.id}: Looking for profile with key ${log.user_id}:${log.profile_type}, found:`, profile);
      return {
        ...log,
        profiles: profile,
      };
    });

    console.log('Logs with profiles:', logsWithProfiles);

    return NextResponse.json({
      data: logsWithProfiles,
      total: count,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error('Audit logs endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
