/**
 * OpenRouter Management API
 * Kredi, model listesi ve kullanım analitikleri için API fonksiyonları
 */

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter API Key'i al
 */
function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  return apiKey;
}

// ============================================
// Types
// ============================================

export interface OpenRouterCredits {
  total_credits: number;
  total_usage: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number | null;
  pricing: {
    prompt: number | string;
    completion: number | string;
  };
  architecture: {
    tokenizer: string;
    instruct_type: string | null;
    modality: string | null;
    input_modalities: string[];
    output_modalities: string[];
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  supported_parameters: string[];
  default_parameters?: {
    temperature?: number | null;
    top_p?: number | null;
    frequency_penalty?: number | null;
  };
}

export interface OpenRouterActivity {
  date: string;
  model_id: string;
  usage: number;
  cost: number;
  num_requests: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Kredi durumunu al
 */
export async function getCredits(): Promise<OpenRouterCredits> {
  const response = await fetch(`${OPENROUTER_API_BASE}/credits`, {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch credits: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Model listesini al
 * @param supportedParameters - Filtreleme için desteklenen parametreler (örn: "tools")
 */
export async function getModels(supportedParameters?: string): Promise<OpenRouterModel[]> {
  const url = new URL(`${OPENROUTER_API_BASE}/models`);
  if (supportedParameters) {
    url.searchParams.set('supported_parameters', supportedParameters);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Kullanım aktivitesini al
 * @param date - Opsiyonel tarih filtresi (YYYY-MM-DD)
 */
export async function getActivity(date?: string): Promise<OpenRouterActivity[]> {
  const url = new URL(`${OPENROUTER_API_BASE}/activity`);
  if (date) {
    url.searchParams.set('date', date);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Model'in tool calling destekleyip desteklemediğini kontrol et
 */
export function supportsToolCalling(model: OpenRouterModel): boolean {
  return model.supported_parameters?.includes('tools') ?? false;
}

/**
 * Model'in structured output destekleyip desteklemediğini kontrol et
 */
export function supportsStructuredOutput(model: OpenRouterModel): boolean {
  return model.supported_parameters?.includes('structured_outputs') ?? false;
}

/**
 * Model fiyatını formatla ($ cinsinden)
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (numPrice === 0) return 'Free';
  // Fiyat 1M token başına
  return `$${(numPrice * 1000000).toFixed(2)}/1M`;
}

/**
 * Kredi miktarını formatla
 */
export function formatCredits(amount: number): string {
  return `$${amount.toFixed(4)}`;
}
