/**
 * OpenRouter Models API
 * GET /api/ops/ai/models
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { getModels, supportsToolCalling, supportsStructuredOutput, formatPrice } from '@/lib/ai/openrouter-api';

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

    // Query params
    const { searchParams } = new URL(request.url);
    const toolsOnly = searchParams.get('tools_only') === 'true';

    // OpenRouter'dan model listesi al
    const allModels = await getModels(toolsOnly ? 'tools' : undefined);

    // Modelleri formatla
    const models = allModels.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      context_length: model.context_length,
      pricing: {
        prompt: formatPrice(model.pricing.prompt),
        completion: formatPrice(model.pricing.completion),
        is_free: model.pricing.prompt === 0 || model.pricing.prompt === '0',
      },
      capabilities: {
        tools: supportsToolCalling(model),
        structured_outputs: supportsStructuredOutput(model),
        input_modalities: model.architecture?.input_modalities || ['text'],
        output_modalities: model.architecture?.output_modalities || ['text'],
      },
      defaults: {
        temperature: model.default_parameters?.temperature ?? 1.0,
        top_p: model.default_parameters?.top_p ?? 1.0,
      },
      supported_parameters: model.supported_parameters || [],
    }));

    return NextResponse.json({
      success: true,
      data: models,
      count: models.length,
    });
  } catch (error) {
    console.error('[Models API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
