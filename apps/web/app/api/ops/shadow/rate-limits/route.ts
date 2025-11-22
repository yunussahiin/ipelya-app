import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Get rate limit violations from audit logs (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: auditLogs, error } = await supabase
      .from('audit_logs')
      .select('action')
      .gte('created_at', oneDayAgo);

    if (error) throw error;

    // Count violations by type
    const pinViolations = auditLogs?.filter(l => l.action.includes('pin_failed')) || [];
    const biometricViolations = auditLogs?.filter(l => l.action.includes('biometric_failed')) || [];

    // Get currently locked users
    const now = new Date().toISOString();
    const { data: lockedUsers, error: lockError } = await supabase
      .from('user_lockouts')
      .select('reason')
      .gt('locked_until', now);

    if (lockError) throw lockError;

    const pinLockedCount = lockedUsers?.filter(l => l.reason?.includes('pin')).length || 0;
    const biometricLockedCount = lockedUsers?.filter(l => l.reason?.includes('biometric')).length || 0;

    return NextResponse.json({
      pin_attempts: {
        total_violations: pinViolations.length,
        locked_users: pinLockedCount,
        violations_last_24h: pinViolations.length,
      },
      biometric_attempts: {
        total_violations: biometricViolations.length,
        locked_users: biometricLockedCount,
        violations_last_24h: biometricViolations.length,
      },
    });
  } catch (error) {
    console.error('Rate limits endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
