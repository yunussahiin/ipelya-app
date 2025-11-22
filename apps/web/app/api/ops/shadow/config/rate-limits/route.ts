import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { updateRateLimitConfig } from '@ipelya/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Get rate limit config from settings table
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shadow_rate_limits')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const defaultConfig = {
      pin: {
        max_attempts: 5,
        window_minutes: 15,
        lockout_minutes: 30,
      },
      biometric: {
        max_attempts: 3,
        window_minutes: 5,
        lockout_minutes: 15,
      },
    };

    return NextResponse.json(data?.value || defaultConfig);
  } catch (error) {
    console.error('Rate limit config endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const { userId, type, config } = await request.json();

    if (!userId || !type || !config) {
      return NextResponse.json(
        { error: 'userId, type, and config are required' },
        { status: 400 }
      );
    }

    // Update or insert rate limit config BEFORE sending broadcast
    const { error } = await supabase
      .from('ops_config')
      .upsert({
        user_id: userId,
        config_type: `rate_limit_${type}`,
        config: config,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Send broadcast to mobile
    await updateRateLimitConfig(supabase, userId, type as 'pin' | 'biometric', config);

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'rate_limit_config_updated_by_ops',
      profile_type: 'real',
      metadata: { type, config, ops_action: true },
    });

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Rate limit config update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
