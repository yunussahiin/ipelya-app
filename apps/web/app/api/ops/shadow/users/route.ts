import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Get shadow profiles (type='shadow')
    let shadowQuery = supabase
      .from('profiles')
      .select('id, user_id, username, email, type, is_creator, created_at, last_login_at')
      .eq('type', 'shadow')
      .order('created_at', { ascending: false })
      .limit(100);

    if (search) {
      shadowQuery = shadowQuery.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: shadowProfiles, error: shadowError } = await shadowQuery;

    if (shadowError) throw shadowError;

    const shadowUserIds = shadowProfiles?.map(p => p.user_id) || [];

    // Get normal profiles for these users
    let normalProfiles: any[] = [];
    if (shadowUserIds.length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, email, type, is_creator, created_at, last_login_at')
        .eq('type', 'real')
        .in('user_id', shadowUserIds);

      if (error) throw error;
      normalProfiles = data || [];
    }

    // Get lockout status for each user
    let lockoutData: any[] = [];
    if (shadowUserIds.length > 0) {
      const { data, error } = await supabase
        .from('user_lockouts')
        .select('user_id, reason, locked_until')
        .in('user_id', shadowUserIds);

      if (error) throw error;
      lockoutData = data || [];
    }

    // Combine shadow, normal profile and lockout data
    const users = shadowProfiles?.map(shadowProfile => {
      const normalProfile = normalProfiles.find(p => p.user_id === shadowProfile.user_id);
      const lockout = lockoutData.find(l => l.user_id === shadowProfile.user_id);
      const isLocked = lockout && new Date(lockout.locked_until) > new Date();

      return {
        id: shadowProfile.id,
        user_id: shadowProfile.user_id,
        shadow_username: shadowProfile.username,
        shadow_email: shadowProfile.email,
        normal_username: normalProfile?.username,
        normal_email: normalProfile?.email,
        type: shadowProfile.type,
        is_creator: shadowProfile.is_creator,
        is_locked: isLocked || false,
        lock_reason: lockout?.reason,
        locked_at: lockout?.locked_until,
        shadow_created_at: shadowProfile.created_at,
        last_activity: normalProfile?.last_login_at || normalProfile?.created_at,
      };
    }) || [];

    return NextResponse.json({
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error('Get users endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
