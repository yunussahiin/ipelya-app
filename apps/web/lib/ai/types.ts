/**
 * AI System Types
 * Web Ops AI Chat ve Settings için TypeScript type tanımları
 */

// ============================================
// Model Configuration Types
// ============================================

/**
 * AI model konfigürasyonu
 */
export interface AIModelConfig {
  /** Kullanılacak model ID (OpenRouter format) */
  model: string;
  /** Yedek model ID */
  fallback_model: string;
  /** Yaratıcılık seviyesi (0-2) */
  temperature: number;
  /** Maksimum token sayısı */
  max_tokens: number;
  /** Nucleus sampling değeri */
  top_p: number;
}

/**
 * System prompt preset türleri
 */
export type SystemPromptPreset = 'technical' | 'support' | 'analytics' | 'moderation';

/**
 * System prompt konfigürasyonu
 */
export interface AISystemPromptConfig {
  /** Aktif preset */
  preset: SystemPromptPreset;
  /** Özel prompt (null ise preset kullanılır) */
  custom: string | null;
  /** Preset tanımları */
  presets: Record<SystemPromptPreset, string>;
}

/**
 * Tool izin konfigürasyonu
 */
export interface AIToolPermission {
  /** Tool aktif mi */
  enabled: boolean;
  /** Maskelenecek hassas alanlar */
  sensitiveFields?: string[];
}

/**
 * Tüm tool izinleri
 */
export interface AIToolPermissions {
  lookupUser: AIToolPermission;
  getRecentPosts: AIToolPermission;
  getSystemStats: AIToolPermission;
  searchUsers: AIToolPermission;
  getPostDetails: AIToolPermission;
  getModerationQueue: AIToolPermission;
  [key: string]: AIToolPermission;
}

/**
 * Rate limit konfigürasyonu
 */
export interface AIRateLimits {
  /** Dakikada maksimum istek */
  requests_per_minute: number;
  /** Günlük maksimum token */
  tokens_per_day: number;
  /** Session başına maksimum mesaj */
  max_session_messages: number;
}

// ============================================
// Settings Types
// ============================================

/**
 * AI ayar anahtarları
 */
export type AISettingsKey = 'model_config' | 'system_prompt' | 'tool_permissions' | 'rate_limits';

/**
 * Veritabanındaki AI ayar kaydı
 */
export interface AISettingsRecord {
  id: string;
  key: AISettingsKey;
  value: AIModelConfig | AISystemPromptConfig | AIToolPermissions | AIRateLimits;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Tüm AI ayarları (frontend için)
 */
export interface AISettings {
  model_config: AIModelConfig;
  system_prompt: AISystemPromptConfig;
  tool_permissions: AIToolPermissions;
  rate_limits: AIRateLimits;
}

// ============================================
// Chat Log Types
// ============================================

/**
 * Chat mesaj rolleri
 */
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Tool çağrısı
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Tool sonucu
 */
export interface ToolResult {
  id: string;
  name: string;
  result: unknown;
  error?: string;
}

/**
 * AI chat log kaydı
 */
export interface AIChatLog {
  id: string;
  admin_id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  tool_calls: ToolCall[] | null;
  tool_results: ToolResult[] | null;
  model: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Chat log istatistikleri
 */
export interface AIChatLogStats {
  total_requests: number;
  total_tokens: number;
  avg_duration_ms: number;
  error_count: number;
}

/**
 * Chat log listesi response
 */
export interface AIChatLogsResponse {
  logs: AIChatLog[];
  total: number;
  stats: AIChatLogStats;
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Chat API request
 */
export interface AIChatRequest {
  messages: Array<{
    role: ChatRole;
    content: string;
  }>;
  sessionId: string;
}

/**
 * Settings update request
 */
export interface AISettingsUpdateRequest {
  key: AISettingsKey;
  value: AIModelConfig | AISystemPromptConfig | AIToolPermissions | AIRateLimits;
}

// ============================================
// OpenRouter Model Types
// ============================================

/**
 * Önerilen OpenRouter modelleri
 * İstediğin modeli buraya ekleyebilirsin
 */
export const RECOMMENDED_MODELS = [
  // Google Gemini Modelleri
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash ⚡',
    description: 'En hızlı, tool calling',
    free: false,
    supportsTools: true,
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite 🚀',
    description: 'Hafif ve hızlı',
    free: false,
    supportsTools: true,
  },
  {
    id: 'google/gemini-2.5-flash-lite-preview-09-2025',
    name: 'Gemini 2.5 Flash Lite Preview',
    description: 'Preview version',
    free: false,
    supportsTools: true,
  },
  // Z.AI GLM
  {
    id: 'z-ai/glm-4-32b',
    name: 'GLM 4 32B 🔧',
    description: 'Tool calling, thinking mode',
    free: false,
    supportsTools: true,
  },
  // Ücretli Modeller (En iyi performans)
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet 💎',
    description: 'En iyi tool calling',
    free: false,
    supportsTools: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o 💎',
    description: 'OpenAI flagship',
    free: false,
    supportsTools: true,
  },
] as const;

export type RecommendedModelId = typeof RECOMMENDED_MODELS[number]['id'];

/**
 * System prompt preset listesi
 */
export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = ['technical', 'support', 'analytics', 'moderation'];

/**
 * Preset açıklamaları
 */
export function getPresetDescription(preset: SystemPromptPreset): string {
  const descriptions: Record<SystemPromptPreset, string> = {
    technical: 'Teknik sorular ve veritabanı sorguları için optimize edilmiş',
    support: 'Kullanıcı destek ve sorun çözme odaklı',
    analytics: 'Veri analizi ve raporlama odaklı',
    moderation: 'İçerik moderasyonu ve güvenlik odaklı',
  };
  return descriptions[preset];
}
