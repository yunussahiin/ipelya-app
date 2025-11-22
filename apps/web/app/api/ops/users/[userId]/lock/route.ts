import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lockUserByOps } from '@ipelya/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    
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

    // Get request body
    const body = await request.json();
    const { reason, durationMinutes } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Lock user
    await lockUserByOps(
      supabase,
      params.userId,
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
