import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { lockUserByOps } from '@ipelya/api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const { userId } = await params;
    const { reason, durationMinutes = 30 } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + durationMinutes);

    // Update user lockout status BEFORE sending broadcast
    const { error } = await supabase
      .from('user_lockouts')
      .upsert({
        user_id: userId,
        reason,
        locked_until: lockedUntil.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Send broadcast to mobile
    await lockUserByOps(supabase, userId, reason, durationMinutes);

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'user_locked_by_ops',
      profile_type: 'real',
      metadata: { reason, duration_minutes: durationMinutes, ops_action: true },
    });

    return NextResponse.json({
      success: true,
      user_id: userId,
      locked_until: lockedUntil.toISOString(),
      reason,
    });
  } catch (error) {
    console.error('User lockout endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
