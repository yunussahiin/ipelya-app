/**
 * OpenRouter Providers API
 * GET /api/ops/ai/providers
 * 
 * OpenRouter'dan provider listesini getirir
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // OpenRouter'dan provider listesini al
    const response = await fetch('https://openrouter.ai/api/v1/providers', {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('[Providers API] OpenRouter error:', response.status);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      providers: data.data || [],
    });
  } catch (error) {
    console.error('[Providers API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
