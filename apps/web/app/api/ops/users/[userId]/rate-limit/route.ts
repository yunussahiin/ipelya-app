import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { updateRateLimitConfig } from '@ipelya/api';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authSupabase = await createServerSupabaseClient();
    const supabase = createAdminSupabaseClient();
    const { userId } = await params;
    
    // Check if user is ops
    const { data: { user } } = await authSupabase.auth.getUser();
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
    const { type, config } = body;

    if (!type || !config) {
      return NextResponse.json(
        { error: 'Type and config are required' },
        { status: 400 }
      );
    }

    if (type !== 'pin' && type !== 'biometric') {
      return NextResponse.json(
        { error: 'Type must be pin or biometric' },
        { status: 400 }
      );
    }

    // Update config in database
    const { error: upsertError } = await supabase
      .from('rate_limit_configs')
      .upsert({
        user_id: userId,
        config_type: type,
        max_attempts: config.max_attempts,
        window_minutes: config.window_minutes,
        lockout_minutes: config.lockout_minutes,
        is_global: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,config_type',
      });

    if (upsertError) {
      throw new Error(`Failed to update config: ${upsertError.message}`);
    }

    // Send broadcast to mobile
    await updateRateLimitConfig(supabase, userId, type, config);

    return NextResponse.json({
      success: true,
      message: 'Rate limit config updated successfully',
    });
  } catch (error) {
    console.error('Update rate limit config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update config' },
      { status: 500 }
    );
  }
}
