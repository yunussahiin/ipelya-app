import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { unlockUserByOps } from '@ipelya/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const { userId } = await params;
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
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

    // Unlock user
    await unlockUserByOps(supabase, userId);

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
