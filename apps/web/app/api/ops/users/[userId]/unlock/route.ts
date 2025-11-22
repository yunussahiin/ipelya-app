import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { unlockUserByOps } from '@ipelya/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Check if user is ops
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'ops') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Unlock user
    await unlockUserByOps(supabase, params.userId);

    return NextResponse.json({
      success: true,
      message: 'User unlocked successfully',
    });
  } catch (error) {
    console.error('Unlock user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unlock user' },
      { status: 500 }
    );
  }
}
