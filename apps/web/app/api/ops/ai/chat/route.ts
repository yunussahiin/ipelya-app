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
import { getSystemPrompt, buildSystemPromptWithUser } from '@/lib/ai/prompts';
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
    const { messages, sessionId, model: requestModel, threadId } = body;

    console.log('[AI Chat API] 📋 Request body:', {
      messagesCount: Array.isArray(messages) ? messages.length : 'invalid',
      sessionId: sessionId?.substring(0, 8) + '...',
      threadId: threadId?.substring(0, 8) + '...',
      requestModel,
      bodyKeys: Object.keys(body),
      firstMessageRaw: messages?.[0] ? JSON.stringify(messages[0]).substring(0, 200) : 'none'
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('[AI Chat API] ❌ Messages array is required');
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Thread yönetimi - threadId yoksa yeni thread oluştur, varsa önceki mesajları al
    let activeThreadId = threadId;
    let previousMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    if (activeThreadId) {
      // Mevcut thread'den önceki mesajları al
      const { data: existingThread } = await adminSupabase
        .from('ai_chat_threads')
        .select('messages')
        .eq('id', activeThreadId)
        .eq('admin_id', user.id)
        .single();
      
      if (existingThread?.messages && Array.isArray(existingThread.messages)) {
        previousMessages = existingThread.messages.map((m: { role: string; content: string }) => {
          let content = m.content;
          
          // Eğer content JSON string ise parse et
          if (typeof content === 'string' && content.startsWith('[')) {
            try {
              const parsed = JSON.parse(content);
              if (Array.isArray(parsed) && parsed[0]?.type === 'text' && parsed[0]?.text) {
                content = parsed[0].text;
              }
            } catch {
              // Parse başarısız olursa orijinal content'i kullan
            }
          }
          
          return {
            role: m.role as 'user' | 'assistant',
            content
          };
        });
        console.log('[AI Chat API] 📚 Loaded previous messages:', previousMessages.length);
      }
    } else {
      // İlk mesajdan başlık oluştur
      const firstUserMessage = messages.find((m: UIMessage) => m.role === 'user');
      let title = 'Yeni Sohbet';
      if (firstUserMessage?.parts && Array.isArray(firstUserMessage.parts)) {
        const textPart = firstUserMessage.parts.find((p: { type: string }) => p.type === 'text');
        if (textPart && 'text' in textPart) {
          title = (textPart.text as string).substring(0, 50) + ((textPart.text as string).length > 50 ? '...' : '');
        }
      }

      // Yeni thread oluştur
      const { data: newThread, error: threadError } = await adminSupabase
        .from('ai_chat_threads')
        .insert({
          admin_id: user.id,
          title,
          model: requestModel || DEFAULT_MODEL,
          messages: []
        })
        .select('id')
        .single();

      if (threadError) {
        console.error('[AI Chat API] ⚠️ Failed to create thread:', threadError);
      } else {
        activeThreadId = newThread.id;
        console.log('[AI Chat API] 📝 Created new thread:', activeThreadId);
      }
    }

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
    
    // System prompt'u kullanıcı ismiyle birlikte oluştur
    const baseSystemPrompt = getSystemPrompt(
      (systemPromptConfig?.preset as SystemPromptPreset) || 'technical',
      systemPromptConfig?.custom
    );
    const systemPrompt = buildSystemPromptWithUser(baseSystemPrompt, adminProfile?.full_name);

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
    const newMessages = convertToModelMessages(messages as UIMessage[]);
    
    // Mesajları temizle - JSON string'den text'e çevir
    const cleanedNewMessages = newMessages.map(m => {
      let content = m.content;
      
      // Eğer content JSON string ise parse et
      if (typeof content === 'string' && content.startsWith('[')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed[0]?.type === 'text' && parsed[0]?.text) {
            content = parsed[0].text;
          }
        } catch {
          // Parse başarısız olursa orijinal content'i kullan
        }
      }
      
      return {
        role: m.role as 'user' | 'assistant',
        content
      };
    });
    
    // Önceki mesajları yeni mesajlarla birleştir
    const coreMessages = [
      ...previousMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      ...cleanedNewMessages
    ] as any;
    
    console.log('[AI Chat API] 📝 Converted messages:', {
      previousCount: previousMessages.length,
      newCount: newMessages.length,
      totalCount: coreMessages.length,
      allMessages: coreMessages.map((m: { role: string; content: unknown }, i: number) => ({
        index: i,
        role: m.role,
        content: typeof m.content === 'string' ? m.content.substring(0, 100) : JSON.stringify(m.content).substring(0, 100)
      }))
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

    // Tool'ları structured args (useText: false) ile wrap et
    // Bu, assistant-ui'nin argsText sıra problemi sorununu çözer
    const toolsWithStructuredArgs = Object.fromEntries(
      Object.entries(aiTools).map(([name, tool]) => [
        name,
        {
          ...tool,
          useText: false, // JSON parametreleri text yerine structured arg olarak işle
        },
      ])
    );

    // Streaming response oluştur
    // stopWhen: Tool call sonrası model'in yanıt üretmesini sağlar
    const result = streamText({
      model: openrouter.chat(modelId),
      system: systemPrompt,
      messages: coreMessages,
      tools: toolsWithStructuredArgs,
      toolChoice: 'auto', // Model tool kullanıp kullanmamaya karar verir
      stopWhen: stepCountIs(5), // Max 5 step (tool call + response)
      temperature,
      maxOutputTokens: maxTokens,
      // Streaming tamamlandığında log kaydet ve thread'e mesajları ekle
      onFinish: async ({ text, usage, toolCalls, toolResults }) => {
        const duration = Date.now() - startTime;
        
        console.log('[AI Chat API] ✅ Stream finished:', {
          duration,
          textLength: text.length,
          totalTokens: usage?.totalTokens,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
          activeThreadId
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

        // Thread'e mesajları kaydet (eğer activeThreadId varsa)
        if (activeThreadId) {
          try {
            // Mevcut thread'i al
            const { data: thread } = await adminSupabase
              .from('ai_chat_threads')
              .select('messages')
              .eq('id', activeThreadId)
              .eq('admin_id', user.id)
              .single();

            if (thread) {
              // Yeni mesajları ekle
              const existingMessages = thread.messages || [];
              
              // User mesajını ekle (son user mesajı)
              const lastUserMessage = messages[messages.length - 1] as UIMessage | undefined;
              if (lastUserMessage?.role === 'user') {
                let userContent = '';
                if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
                  userContent = lastUserMessage.parts
                    .filter((part) => part.type === 'text')
                    .map((part) => 'text' in part ? part.text : '')
                    .join('');
                }
                existingMessages.push({
                  id: lastUserMessage.id || crypto.randomUUID(),
                  role: 'user',
                  content: userContent,
                  createdAt: new Date().toISOString()
                });
              }

              // Assistant mesajını ekle (sadece text content - tool calls UI'da sorun çıkarıyor)
              existingMessages.push({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: text,
                createdAt: new Date().toISOString()
              });

              // Thread'i güncelle
              await adminSupabase
                .from('ai_chat_threads')
                .update({ messages: existingMessages })
                .eq('id', activeThreadId)
                .eq('admin_id', user.id);

              console.log('[AI Chat API] 💾 Thread updated with new messages:', {
                activeThreadId,
                totalMessages: existingMessages.length
              });
            }
          } catch (threadError) {
            console.error('[AI Chat API] ⚠️ Failed to update thread:', threadError);
            // Thread güncelleme hatası streaming'i etkilememeli
          }
        }
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
