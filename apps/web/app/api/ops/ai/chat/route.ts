/**
 * AI Chat API Route
 * Web Ops AI Chat için streaming endpoint
 * 
 * POST /api/ops/ai/chat
 * - Vercel AI SDK streamText kullanır
 * - OpenRouter üzerinden model çağrısı yapar
 * - Tool calling ile veritabanı sorguları destekler
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { openrouter, DEFAULT_MODEL } from '@/lib/ai/openrouter';
import { aiTools } from '@/lib/ai/tools';
import { getSystemPrompt } from '@/lib/ai/prompts';
import type { AIModelConfig, AISystemPromptConfig, SystemPromptPreset } from '@/lib/ai/types';

// Streaming response için max duration
export const maxDuration = 60;

/**
 * AI Chat endpoint
 * Streaming response döndürür
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('[AI Chat API] 🚀 POST /api/ops/ai/chat started');
  
  try {
    // User session'ı almak için server client kullan (cookie'lerden)
    const serverSupabase = await createServerSupabaseClient();
    
    // Admin işlemleri için admin client kullan (service role)
    const adminSupabase = createAdminSupabaseClient();

    // Admin authentication kontrolü - cookie'lerden session al
    console.log('[AI Chat API] 🔐 Checking authentication from cookies...');
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    console.log('[AI Chat API] 👤 Auth user:', {
      userId: user?.id,
      email: user?.email,
      authenticated: !!user,
      authError: authError?.message
    });

    if (!user) {
      console.error('[AI Chat API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin profil kontrolü - admin client ile (RLS bypass)
    console.log('[AI Chat API] 🔍 Checking admin profile...');
    const { data: adminProfile, error: profileError } = await adminSupabase
      .from('admin_profiles')
      .select('id, is_active, full_name')
      .eq('id', user.id)
      .single();

    console.log('[AI Chat API] 👨‍💼 Admin profile:', {
      profileId: adminProfile?.id,
      isActive: adminProfile?.is_active,
      fullName: adminProfile?.full_name,
      profileError: profileError?.message
    });

    if (!adminProfile?.is_active) {
      console.error('[AI Chat API] ❌ Admin profile not active or not found');
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Request body'yi parse et
    console.log('[AI Chat API] 📥 Parsing request body...');
    const body = await request.json();
    const { messages, sessionId, model: requestModel } = body;

    console.log('[AI Chat API] 📋 Request body:', {
      messagesCount: Array.isArray(messages) ? messages.length : 'invalid',
      sessionId: sessionId?.substring(0, 8) + '...',
      requestModel,
      bodyKeys: Object.keys(body),
      firstMessageRaw: messages?.[0] ? JSON.stringify(messages[0]).substring(0, 200) : 'none'
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('[AI Chat API] ❌ Messages array is required');
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // SessionId opsiyonel - assistant-ui kendi session yönetimini yapıyor
    // if (!sessionId) {
    //   console.error('[AI Chat API] ❌ Session ID is required');
    //   return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    // }

    // AI ayarlarını al
    const { data: settings } = await adminSupabase
      .from('ai_settings')
      .select('key, value')
      .in('key', ['model_config', 'system_prompt']);

    // Ayarları parse et
    const modelConfig = settings?.find((s: { key: string; value: unknown }) => s.key === 'model_config')?.value as AIModelConfig | undefined;
    const systemPromptConfig = settings?.find((s: { key: string; value: unknown }) => s.key === 'system_prompt')?.value as AISystemPromptConfig | undefined;

    // Model ve system prompt belirle
    // Öncelik: 1. Request'ten gelen model, 2. Settings'ten gelen model, 3. Default model
    const modelId = requestModel || modelConfig?.model || DEFAULT_MODEL;
    const fallbackModelId = modelConfig?.fallback_model || 'meta-llama/llama-3.3-70b-instruct:free';
    const temperature = modelConfig?.temperature ?? 0.7;
    const maxTokens = modelConfig?.max_tokens ?? 4096;
    
    const systemPrompt = getSystemPrompt(
      (systemPromptConfig?.preset as SystemPromptPreset) || 'technical',
      systemPromptConfig?.custom
    );

    // User mesajını logla (UIMessage formatından text çıkar)
    const lastUserMessage = messages[messages.length - 1] as UIMessage | undefined;
    if (lastUserMessage?.role === 'user') {
      console.log('[AI Chat API] 💾 Logging user message...');
      
      // UIMessage formatından text çıkar
      // UIMessage.parts: [{ type: 'text', text: '...' }]
      let userContent = '';
      if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
        userContent = lastUserMessage.parts
          .filter((part) => part.type === 'text')
          .map((part) => 'text' in part ? part.text : '')
          .join('');
      }
      
      console.log('[AI Chat API] 💾 User content extracted:', { length: userContent.length });
      
      if (userContent) {
        await adminSupabase.from('ai_chat_logs').insert({
          admin_id: user.id,
          session_id: sessionId || 'no-session',
          role: 'user',
          content: userContent,
          model: modelId,
        });
      }
    }

    // Mesajları ModelMessage formatına dönüştür
    // assistant-ui UIMessage formatını AI SDK'nın convertToModelMessages ile dönüştür
    console.log('[AI Chat API] 📝 Converting messages with convertToModelMessages...');
    const coreMessages = convertToModelMessages(messages as UIMessage[]);
    
    console.log('[AI Chat API] 📝 Converted messages:', {
      count: coreMessages.length,
      firstMessage: coreMessages[0] ? { role: coreMessages[0].role, contentLength: JSON.stringify(coreMessages[0].content).length } : null
    });
    
    // Eğer mesaj yoksa hata döndür
    if (coreMessages.length === 0) {
      console.error('[AI Chat API] ❌ No valid messages after conversion');
      return NextResponse.json({ error: 'No valid messages provided' }, { status: 400 });
    }

    // Kullanılacak modelleri belirle (ana + fallback)
    const modelsToTry = [modelId];
    if (fallbackModelId && fallbackModelId !== modelId) {
      modelsToTry.push(fallbackModelId);
    }

    console.log('[AI Chat API] 🤖 Creating streamText with:', {
      model: modelId,
      fallbackModel: fallbackModelId,
      temperature,
      maxTokens,
      messagesCount: coreMessages.length,
      toolsCount: Object.keys(aiTools).length,
      toolNames: Object.keys(aiTools),
      firstMessage: coreMessages[0]
    });

    // Streaming response oluştur
    // stopWhen: Tool call sonrası model'in yanıt üretmesini sağlar
    const result = streamText({
      model: openrouter.chat(modelId),
      system: systemPrompt,
      messages: coreMessages,
      tools: aiTools,
      toolChoice: 'auto', // Model tool kullanıp kullanmamaya karar verir
      stopWhen: stepCountIs(5), // Max 5 step (tool call + response)
      temperature,
      maxOutputTokens: maxTokens,
      // Streaming tamamlandığında log kaydet
      onFinish: async ({ text, usage, toolCalls, toolResults }) => {
        const duration = Date.now() - startTime;
        
        console.log('[AI Chat API] ✅ Stream finished:', {
          duration,
          textLength: text.length,
          totalTokens: usage?.totalTokens,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0
        });
        
        // Assistant yanıtını logla
        await adminSupabase.from('ai_chat_logs').insert({
          admin_id: user.id,
          session_id: sessionId,
          role: 'assistant',
          content: text,
          tool_calls: toolCalls?.length ? toolCalls : null,
          tool_results: toolResults?.length ? toolResults : null,
          model: modelId,
          tokens_used: usage?.totalTokens,
          duration_ms: duration,
        });
      },
    });

    console.log('[AI Chat API] 📤 Returning UI message stream response');
    // assistant-ui için toUIMessageStreamResponse kullan
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[AI Chat Error] ❌ Exception caught:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Hata tipine göre response
    if (error instanceof Error) {
      // Rate limit hatası
      if (error.message.includes('rate limit')) {
        console.warn('[AI Chat Error] 🚫 Rate limit exceeded');
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      // Model hatası
      if (error.message.includes('model')) {
        console.warn('[AI Chat Error] 🤖 Model error');
        return NextResponse.json(
          { error: 'Model error. Please check AI settings.' },
          { status: 503 }
        );
      }

      // Authentication hatası
      if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
        console.warn('[AI Chat Error] 🔐 Authentication error');
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[AI Chat Error] 📋 Final error response:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
