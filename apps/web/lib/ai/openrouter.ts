/**
 * OpenRouter Client Configuration
 * Vercel AI SDK ile OpenRouter entegrasyonu
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

/**
 * OpenRouter API key kontrolü
 */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('[AI] OPENROUTER_API_KEY is not set. AI features will not work.');
}

/**
 * OpenRouter provider instance
 * Vercel AI SDK ile kullanılır
 */
export const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY || '',
});

/**
 * Model ID'den OpenRouter model instance oluştur
 * @param modelId - OpenRouter model ID (örn: "google/gemini-2.0-flash-exp:free")
 */
export function getModel(modelId: string) {
  return openrouter.chat(modelId);
}

/**
 * Varsayılan model
 */
export const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

/**
 * Varsayılan fallback model
 */
export const DEFAULT_FALLBACK_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
