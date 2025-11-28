/**
 * AI Settings API Route
 * Web Ops AI ayarlarını yönetir
 * 
 * GET /api/ops/ai/settings - Tüm ayarları getir
 * POST /api/ops/ai/settings - Ayar güncelle
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { AISettings, AISettingsKey } from '@/lib/ai/types';

/**
 * GET - Tüm AI ayarlarını getir
 */
export async function GET() {
  try {
    // User session için server client, DB işlemleri için admin client
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Admin authentication kontrolü - cookie'lerden session al
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Tüm ayarları al
    const { data: settings, error } = await adminSupabase
      .from('ai_settings')
      .select('key, value, description, updated_at');

    if (error) {
      console.error('[AI Settings Error]:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Ayarları obje formatına dönüştür
    const settingsObj: Partial<AISettings> = {};
    settings?.forEach((setting) => {
      settingsObj[setting.key as keyof AISettings] = setting.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsObj,
      raw: settings, // UI'da description ve updated_at göstermek için
    });
  } catch (error) {
    console.error('[AI Settings Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - AI ayarını güncelle
 */
export async function POST(request: NextRequest) {
  try {
    // User session için server client, DB işlemleri için admin client
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Admin authentication kontrolü - cookie'lerden session al
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Request body'yi parse et
    const body = await request.json();
    const { key, value } = body as { key: AISettingsKey; value: unknown };

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Geçerli key kontrolü
    const validKeys: AISettingsKey[] = ['model_config', 'system_prompt', 'tool_permissions', 'rate_limits'];
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid settings key' }, { status: 400 });
    }

    // Ayarı güncelle
    const { data, error } = await adminSupabase
      .from('ai_settings')
      .update({
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('[AI Settings Update Error]:', error);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      setting: data,
    });
  } catch (error) {
    console.error('[AI Settings Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
