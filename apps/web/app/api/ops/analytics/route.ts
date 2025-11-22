import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get analytics data
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Active sessions count
    const { count: activeSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('profile_type', 'shadow');

    // Total sessions (last 24h)
    const { count: sessions24h } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('profile_type', 'shadow')
      .gte('started_at', last24h.toISOString());

    // Terminated sessions (last 24h)
    const { count: terminatedSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('profile_type', 'shadow')
      .in('status', ['invalidated', 'expired'])
      .gte('started_at', last24h.toISOString());

    // Active locks count
    const { count: activeLocks } = await supabase
      .from('user_locks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Anomaly alerts (last 7 days)
    const { data: anomalyAlerts } = await supabase
      .from('anomaly_alerts')
      .select('severity')
      .gte('created_at', last7d.toISOString());

    const anomalyStats = {
      total: anomalyAlerts?.length || 0,
      high: anomalyAlerts?.filter((a) => a.severity === 'high').length || 0,
      medium: anomalyAlerts?.filter((a) => a.severity === 'medium').length || 0,
      low: anomalyAlerts?.filter((a) => a.severity === 'low').length || 0,
    };

    // Failed PIN attempts (last 24h)
    const { count: failedPinAttempts } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'pin_failed')
      .gte('created_at', last24h.toISOString());

    // Session duration stats (last 7 days)
    const { data: sessionDurations } = await supabase
      .from('sessions')
      .select('started_at, ended_at')
      .eq('profile_type', 'shadow')
      .not('ended_at', 'is', null)
      .gte('started_at', last7d.toISOString());

    const avgDuration = sessionDurations?.length
      ? sessionDurations.reduce((acc, s) => {
          const duration = new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime();
          return acc + duration;
        }, 0) / sessionDurations.length / 60000 // Convert to minutes
      : 0;

    return NextResponse.json({
      activeSessions: activeSessions || 0,
      sessions24h: sessions24h || 0,
      terminatedSessions: terminatedSessions || 0,
      activeLocks: activeLocks || 0,
      anomalyStats,
      failedPinAttempts: failedPinAttempts || 0,
      avgSessionDuration: Math.round(avgDuration),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
