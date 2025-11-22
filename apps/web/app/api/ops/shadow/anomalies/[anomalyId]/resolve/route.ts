import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ anomalyId: string }> }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const { anomalyId } = await params;
    const { resolution, notes } = await request.json();

    // Update anomaly status
    const { error } = await supabase
      .from('anomaly_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolution,
        notes,
      })
      .eq('id', anomalyId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      anomaly_id: anomalyId,
      resolved_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Anomaly resolve endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
