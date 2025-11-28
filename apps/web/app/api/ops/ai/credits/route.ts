/**
 * OpenRouter Credits API
 * GET /api/ops/ai/credits
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { getCredits } from '@/lib/ai/openrouter-api';

export async function GET() {
  try {
    // Auth kontrolü
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin profil kontrolü
    const { data: adminProfile } = await adminSupabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // OpenRouter'dan kredi bilgisi al
    const credits = await getCredits();

    return NextResponse.json({
      success: true,
      data: {
        total_credits: credits.total_credits,
        total_usage: credits.total_usage,
        remaining: credits.total_credits - credits.total_usage,
      },
    });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
