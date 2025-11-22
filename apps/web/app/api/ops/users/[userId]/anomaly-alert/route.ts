import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendAnomalyAlert } from '@ipelya/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const { userId } = await params;
    
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
    const { alertType, severity, message, metadata } = body;

    if (!alertType || !severity || !message) {
      return NextResponse.json(
        { error: 'alertType, severity, and message are required' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high'].includes(severity)) {
      return NextResponse.json(
        { error: 'Severity must be low, medium, or high' },
        { status: 400 }
      );
    }

    // Insert alert to database
    const { error: insertError } = await supabase
      .from('anomaly_alerts')
      .insert({
        user_id: userId,
        alert_type: alertType,
        severity,
        message,
        metadata: metadata || {},
      });

    if (insertError) {
      throw new Error(`Failed to insert alert: ${insertError.message}`);
    }

    // Send broadcast to mobile
    await sendAnomalyAlert(supabase, userId, alertType, severity, message);

    return NextResponse.json({
      success: true,
      message: 'Anomaly alert sent successfully',
    });
  } catch (error) {
    console.error('Send anomaly alert error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send alert' },
      { status: 500 }
    );
  }
}
