import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { lockUserByOps } from '@ipelya/api';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authSupabase = await createServerSupabaseClient();
    const supabase = createAdminSupabaseClient();
    const { userId } = await params;
    
    // Check if user is admin
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { reason, durationMinutes } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Lock user
    await lockUserByOps(
      supabase,
      userId,
      reason,
      durationMinutes || null,
      user.id
    );

    return NextResponse.json({
      success: true,
      message: 'User locked successfully',
    });
  } catch (error) {
    console.error('Lock user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to lock user' },
      { status: 500 }
    );
  }
}
