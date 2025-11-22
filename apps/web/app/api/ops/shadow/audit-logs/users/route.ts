import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Get unique users from audit_logs with their profile info
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('user_id')
      .order('created_at', { ascending: false });

    if (auditError) throw auditError;

    // Get unique user IDs
    const uniqueUserIds = Array.from(
      new Set((auditLogs || []).map((log) => log.user_id))
    );

    // Get profile info for these users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, id, username, email, is_creator, role, type')
      .in('user_id', uniqueUserIds);

    if (profileError) throw profileError;

    // Get unique profiles - prefer real profile over shadow
    const uniqueProfiles = new Map();
    (profiles || []).forEach((p) => {
      const existing = uniqueProfiles.get(p.user_id);
      
      // Only set if this is the first profile, or if it's a real profile (prefer real over shadow)
      if (!existing || (p.type === 'real' && existing.type === 'shadow')) {
        uniqueProfiles.set(p.user_id, {
          id: p.user_id, // Use user_id for filtering in audit logs
          username: p.username,
          email: p.email,
          is_creator: p.is_creator,
          role: p.role,
          user_id: p.user_id,
          type: p.type
        });
      }
    });

    // Sort by username/email
    const sortedProfiles = Array.from(uniqueProfiles.values()).sort((a, b) => {
      const aLabel = a.username || a.email || '';
      const bLabel = b.username || b.email || '';
      return aLabel.localeCompare(bLabel);
    });

    return NextResponse.json(sortedProfiles);
  } catch (error) {
    console.error('Audit logs users endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
