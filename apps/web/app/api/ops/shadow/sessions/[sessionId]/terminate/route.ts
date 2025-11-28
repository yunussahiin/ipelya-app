import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { terminateSessionByOps } from '@ipelya/api';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const { sessionId } = await params;
    const { userId, reason } = await request.json();

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'userId and reason are required' },
        { status: 400 }
      );
    }

    // Update session status BEFORE sending broadcast
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'terminated', ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Send broadcast to mobile
    try {
      await terminateSessionByOps(supabase, userId, sessionId, reason);
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
      // Continue even if broadcast fails - session is already terminated
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'session_terminated_by_ops',
      profile_type: 'shadow',
      metadata: { session_id: sessionId, reason, ops_action: true },
    });

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      terminated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session terminate endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
