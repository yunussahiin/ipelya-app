import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { unlockUserByOps } from '@ipelya/api';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const { userId } = await params;

    // Delete user lockout BEFORE sending broadcast
    const { error } = await supabase
      .from('user_lockouts')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    // Send broadcast to mobile
    await unlockUserByOps(supabase, userId);

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'user_unlocked_by_ops',
      profile_type: 'real',
      metadata: { ops_action: true },
    });

    return NextResponse.json({
      success: true,
      user_id: userId,
      message: 'User unlocked successfully',
    });
  } catch (error) {
    console.error('User unlock endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
