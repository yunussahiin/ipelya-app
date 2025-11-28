import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    // const metric = searchParams.get('metric') || 'all'; // TODO: Use for filtering specific metrics

    const periodDays: Record<string, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };

    const days = periodDays[period] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sessions data
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (sessionsError) throw sessionsError;

    // Get authentication data
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .in('action', ['pin_verified', 'pin_failed', 'biometric_verified', 'biometric_failed']);

    if (auditError) throw auditError;

    // Calculate metrics
    const totalSessions = sessions?.length || 0;
    const activeSessions = sessions?.filter(s => s.status === 'active').length || 0;
    const successfulAuths = auditLogs?.filter(l => l.action.includes('verified')).length || 0;
    const failedAuths = auditLogs?.filter(l => l.action.includes('failed')).length || 0;
    const totalAuths = successfulAuths + failedAuths;
    const failureRate = totalAuths > 0 ? ((failedAuths / totalAuths) * 100).toFixed(2) : '0';

    const uniqueUsers = new Set(sessions?.map(s => s.user_id) || []).size;
    const avgSessionDuration = totalSessions > 0 
      ? Math.round(
          (sessions?.reduce((sum, s) => {
            const start = new Date(s.started_at).getTime();
            const end = new Date(s.last_activity || s.expires_at).getTime();
            return sum + (end - start);
          }, 0) || 0) / totalSessions / 60000
        )
      : 0;

    // Create hourly breakdown for chart
    const hourlyData: Record<string, { time: string; count: number }> = {};
    const now = new Date();
    
    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i);
      const key = hour.toISOString().slice(0, 13);
      hourlyData[key] = { time: hour.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), count: 0 };
    }

    // Count sessions per hour
    sessions?.forEach(session => {
      const createdAt = new Date(session.created_at);
      const key = createdAt.toISOString().slice(0, 13);
      if (hourlyData[key]) {
        hourlyData[key].count++;
      }
    });

    const hourlyBreakdown = Object.values(hourlyData);

    return NextResponse.json({
      period,
      metrics: {
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        successful_authentications: successfulAuths,
        failed_authentications: failedAuths,
        failure_rate: parseFloat(failureRate as string),
        average_session_duration_minutes: avgSessionDuration,
        peak_concurrent_users: activeSessions,
        unique_users: uniqueUsers,
      },
      sessions_over_time: hourlyBreakdown,
      hourly_breakdown: hourlyBreakdown,
    });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
