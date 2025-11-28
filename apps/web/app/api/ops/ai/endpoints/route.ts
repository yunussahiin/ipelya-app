/**
 * OpenRouter Endpoints API
 * GET /api/ops/ai/endpoints?model=author/slug
 * 
 * Belirli bir model için endpoint listesini getirir
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function GET(request: NextRequest) {
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

    // Query params
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');

    if (!model) {
      return NextResponse.json({ error: 'Model parameter required (e.g., google/gemini-2.0-flash-exp)' }, { status: 400 });
    }

    // Model ID'yi author/slug formatına çevir
    const [author, ...slugParts] = model.split('/');
    const slug = slugParts.join('/');

    if (!author || !slug) {
      return NextResponse.json({ error: 'Invalid model format. Use author/slug (e.g., google/gemini-2.0-flash-exp)' }, { status: 400 });
    }

    // OpenRouter'dan endpoint listesini al
    const response = await fetch(`https://openrouter.ai/api/v1/models/${author}/${slug}/endpoints`, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Model not found' }, { status: 404 });
      }
      console.error('[Endpoints API] OpenRouter error:', response.status);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      model: data.data?.id || model,
      name: data.data?.name || model,
      description: data.data?.description || '',
      architecture: data.data?.architecture || null,
      endpoints: data.data?.endpoints || [],
    });
  } catch (error) {
    console.error('[Endpoints API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
