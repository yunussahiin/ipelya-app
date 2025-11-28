/**
 * AI Activity API
 * GET /api/ops/ai/activity
 * 
 * OpenRouter'dan kullanım aktivitesini getirir (provisioning key gerekli)
 * Fallback: Yerel veritabanından istatistik
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

const OPENROUTER_PROVISIONING_KEY = process.env.OPENROUTER_PROVISIONING_KEY;

async function fetchOpenRouterActivity() {
  if (!OPENROUTER_PROVISIONING_KEY) {
    return null;
  }

  const response = await fetch('https://openrouter.ai/api/v1/activity', {
    headers: {
      Authorization: `Bearer ${OPENROUTER_PROVISIONING_KEY}`,
    },
  });

  if (!response.ok) {
    console.warn('[Activity API] OpenRouter returned:', response.status);
    return null;
  }

  const data = await response.json();
  return data.data || [];
}

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

    // OpenRouter'dan aktivite almayı dene
    const openRouterActivity = await fetchOpenRouterActivity();

    if (openRouterActivity && openRouterActivity.length > 0) {
      // OpenRouter verisini işle
      const modelStats: Record<string, { model: string; requests: number; tokens: number; cost: number }> = {};
      const dailyStats: Record<string, { date: string; requests: number; tokens: number; cost: number }> = {};

      openRouterActivity.forEach((item: {
        model?: string;
        date?: string;
        requests?: number;
        prompt_tokens?: number;
        completion_tokens?: number;
        usage?: number;
      }) => {
        const model = item.model || 'unknown';
        const date = item.date || 'unknown';
        const tokens = (item.prompt_tokens || 0) + (item.completion_tokens || 0);
        const cost = item.usage || 0;

        // Model stats
        if (!modelStats[model]) {
          modelStats[model] = { model, requests: 0, tokens: 0, cost: 0 };
        }
        modelStats[model].requests += item.requests || 1;
        modelStats[model].tokens += tokens;
        modelStats[model].cost += cost;

        // Daily stats
        if (!dailyStats[date]) {
          dailyStats[date] = { date, requests: 0, tokens: 0, cost: 0 };
        }
        dailyStats[date].requests += item.requests || 1;
        dailyStats[date].tokens += tokens;
        dailyStats[date].cost += cost;
      });

      const totals = {
        requests: Object.values(modelStats).reduce((sum, m) => sum + m.requests, 0),
        tokens: Object.values(modelStats).reduce((sum, m) => sum + m.tokens, 0),
        cost: Object.values(modelStats).reduce((sum, m) => sum + m.cost, 0),
      };

      return NextResponse.json({
        success: true,
        source: 'openrouter',
        data: {
          byModel: Object.values(modelStats).sort((a, b) => b.tokens - a.tokens),
          byDate: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
          totals,
        },
      });
    }

    // Fallback: Yerel veritabanından
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error } = await adminSupabase
      .from('ai_chat_logs')
      .select('model, tokens_used, duration_ms, created_at, role')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('role', 'assistant');

    if (error) {
      console.error('[Activity API] DB Error:', error);
      throw new Error('Failed to fetch activity from database');
    }

    // Model bazlı gruplama
    const modelStats: Record<string, { model: string; requests: number; tokens: number; avgDuration: number }> = {};
    
    logs?.forEach((log) => {
      const model = log.model || 'unknown';
      if (!modelStats[model]) {
        modelStats[model] = { model, requests: 0, tokens: 0, avgDuration: 0 };
      }
      modelStats[model].requests += 1;
      modelStats[model].tokens += log.tokens_used || 0;
    });

    // Günlük gruplama
    const dailyStats: Record<string, { date: string; requests: number; tokens: number }> = {};
    
    logs?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, requests: 0, tokens: 0 };
      }
      dailyStats[date].requests += 1;
      dailyStats[date].tokens += log.tokens_used || 0;
    });

    const totals = {
      requests: logs?.length || 0,
      tokens: logs?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      source: 'database',
      data: {
        byModel: Object.values(modelStats).sort((a, b) => b.tokens - a.tokens),
        byDate: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
        totals,
      },
    });
  } catch (error) {
    console.error('[Activity API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
