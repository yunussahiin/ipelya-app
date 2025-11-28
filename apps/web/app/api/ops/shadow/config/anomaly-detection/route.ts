import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { updateAnomalyDetectionConfig } from '@ipelya/api';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Get anomaly detection config from settings table
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shadow_anomaly_detection')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const defaultConfig = {
      excessive_failed_attempts: {
        enabled: true,
        threshold: 10,
        window_minutes: 60,
        severity: 'high',
      },
      multiple_ips: {
        enabled: true,
        threshold: 2,
        window_minutes: 60,
        severity: 'medium',
      },
      long_sessions: {
        enabled: true,
        threshold_minutes: 120,
        severity: 'low',
      },
      unusual_access_time: {
        enabled: true,
        normal_hours: '08:00-23:00',
        severity: 'low',
      },
    };

    return NextResponse.json(data?.value || defaultConfig);
  } catch (error) {
    console.error('Anomaly detection config endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const { userId, config } = await request.json();

    if (!userId || !config) {
      return NextResponse.json(
        { error: 'userId and config are required' },
        { status: 400 }
      );
    }

    // Update or insert anomaly detection config BEFORE sending broadcast
    const { error } = await supabase
      .from('ops_config')
      .upsert({
        user_id: userId,
        config_type: 'anomaly_detection',
        config: config,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Send broadcast to mobile
    await updateAnomalyDetectionConfig(supabase, userId, config);

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'anomaly_detection_config_updated_by_ops',
      profile_type: 'real',
      metadata: { config, ops_action: true },
    });

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Anomaly detection config update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
