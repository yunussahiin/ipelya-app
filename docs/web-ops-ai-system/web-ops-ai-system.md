İpelya Web Ops AI Sistemi Teknik Dokümantasyonu

> **Son Güncelleme:** 2025-11-28
> **Versiyon:** 2.0
> **Durum:** Aktif Geliştirme

Bu dokümantasyon, İpelya projesi içinde Web Ops tarafında geliştirilen AI Chat Sistemi ve AI Settings Paneli için kapsamlı teknik detayları içerir.

---

## 1. Genel Bakış

### 1.1 Amaç

- Web Ops paneli üzerinden ekip üyelerinin AI Chat arayüzüyle platforma, kullanıcı verilerine ve sistem altyapısına dair sorular sorabilmesini sağlamak
- AI sisteminin İpelya veritabanındaki kullanıcılar ve sistem hakkında konuşabilmesini sağlamak
- Konfigürasyonu dinamik şekilde yönetmek için AI Settings sayfası sunmak
- Vercel AI SDK tool calling ile veritabanı sorgulama yetenekleri sağlamak

### 1.2 Teknoloji Stack

| Teknoloji                       | Kullanım                                        |
| ------------------------------- | ----------------------------------------------- |
| **Vercel AI SDK**               | Chat streaming, tool calling, UI hooks          |
| **OpenRouter**                  | LLM provider (çoklu model desteği)              |
| **@openrouter/ai-sdk-provider** | AI SDK için OpenRouter entegrasyonu             |
| **Supabase**                    | Veritabanı, ayarlar ve log depolama             |
| **Next.js 16**                  | API routes ve frontend                          |
| **shadcn/ui**                   | UI components                                   |
| **assistant-ui**                | AI Chat UI components (sadece shadcn uyumlu UI) |
| **Zod**                         | Tool input schema validation                    |

### 1.3 Environment Variables

```env
OPENROUTER_API_KEY=sk-or-v1-xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 2. Mimari

### 2.1 Sistem Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web Ops Panel                             │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   AI Chat UI    │    │  AI Settings    │                     │
│  │  (useChat hook) │    │    Panel        │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
└───────────┼──────────────────────┼──────────────────────────────┘
            │                      │
            ▼                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ /api/ops/ai/    │  │ /api/ops/ai/    │  │ /api/ops/ai/    │   │
│  │     chat        │  │    settings     │  │     logs        │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                         Backend Services                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   OpenRouter    │  │    Supabase     │  │   AI Tools      │   │
│  │  (AI SDK)       │  │   (Settings)    │  │  (DB Queries)   │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 Bileşenler

#### 2.2.1 AI Chat API (`/api/ops/ai/chat`)
- Vercel AI SDK `streamText` ile streaming response
- OpenRouter provider üzerinden model çağrıları
- Tool calling ile veritabanı sorguları
- Chat geçmişi ve context yönetimi

#### 2.2.2 AI Settings API (`/api/ops/ai/settings`)
- Model konfigürasyonu (model, temperature, max_tokens)
- System prompt yönetimi
- Tool izinleri
- Rate limit ayarları

#### 2.2.3 AI Logs API (`/api/ops/ai/logs`)
- Chat geçmişi
- Token kullanım istatistikleri
- Tool invocation logları

---

## 3. AI Chat Sistemi

### 3.1 Yetenekler

AI Chat arayüzü şunları yapabilir:

- **Kullanıcı Sorguları**: ID, email, username ile kullanıcı arama
- **Profil Analizi**: Kullanıcı davranış geçmişi, ban durumu
- **İçerik Moderasyonu**: Post, yorum analizi
- **Sistem Bilgisi**: Platform istatistikleri, aktif kullanıcılar
- **Debugging**: Hata logları, sistem durumu

### 3.2 Tool Definitions

```typescript
// Örnek tool tanımı
const tools = {
  lookupUser: tool({
    description: 'Kullanıcı bilgilerini ID, email veya username ile sorgula',
    parameters: z.object({
      identifier: z.string().describe('User ID, email veya username'),
      identifierType: z.enum(['id', 'email', 'username']).default('id')
    }),
    execute: async ({ identifier, identifierType }) => {
      // Supabase sorgusu
    }
  }),
  
  getRecentPosts: tool({
    description: 'Son paylaşılan postları getir',
    parameters: z.object({
      limit: z.number().default(10),
      userId: z.string().optional()
    }),
    execute: async ({ limit, userId }) => {
      // Supabase sorgusu
    }
  }),
  
  getSystemStats: tool({
    description: 'Platform istatistiklerini getir',
    parameters: z.object({
      period: z.enum(['today', 'week', 'month']).default('today')
    }),
    execute: async ({ period }) => {
      // Supabase sorgusu
    }
  })
};
```

### 3.3 Güvenlik

- **Veri Maskeleme**: Hassas alanlar (telefon, adres) maskelenir
- **Tool İzinleri**: Sadece izin verilen tool'lar çalıştırılır
- **Rate Limiting**: Dakikada maksimum istek sayısı
- **Audit Logging**: Tüm AI etkileşimleri loglanır
- **Admin Kontrolü**: Sadece admin rolündeki kullanıcılar erişebilir

---

## 4. AI Settings Sayfası

### 4.1 Model Ayarları

| Ayar             | Açıklama                   | Varsayılan                               |
| ---------------- | -------------------------- | ---------------------------------------- |
| `model`          | Kullanılacak LLM modeli    | `google/gemini-2.0-flash-exp:free`       |
| `fallback_model` | Yedek model                | `meta-llama/llama-3.3-70b-instruct:free` |
| `temperature`    | Yaratıcılık seviyesi (0-2) | `0.7`                                    |
| `max_tokens`     | Maksimum token sayısı      | `4096`                                   |
| `top_p`          | Nucleus sampling           | `0.9`                                    |

### 4.2 System Prompt Presets

```typescript
const systemPromptPresets = {
  technical: `Sen İpelya platformunun teknik asistanısın. 
    Veritabanı yapısı, API'ler ve sistem mimarisi hakkında detaylı bilgi ver.`,
  
  support: `Sen İpelya müşteri destek asistanısın.
    Kullanıcı sorunlarını çözmek için yardımcı ol.`,
  
  analytics: `Sen İpelya veri analisti asistanısın.
    Platform metrikleri ve kullanıcı davranışları hakkında analiz yap.`,
  
  moderation: `Sen İpelya içerik moderasyon asistanısın.
    İçerik politikaları ve moderasyon kararları hakkında yardımcı ol.`
};
```

### 4.3 Tool İzinleri

```typescript
const toolPermissions = {
  lookupUser: { enabled: true, sensitiveFields: ['phone', 'email'] },
  getRecentPosts: { enabled: true },
  getSystemStats: { enabled: true },
  banUser: { enabled: false }, // Tehlikeli işlemler varsayılan kapalı
  deleteContent: { enabled: false }
};
```

---

## 5. Veritabanı Şeması

### 5.1 ai_settings Tablosu

```sql
CREATE TABLE ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Varsayılan ayarlar
INSERT INTO ai_settings (key, value, description) VALUES
  ('model_config', '{"model": "google/gemini-2.0-flash-exp:free", "temperature": 0.7, "max_tokens": 4096}', 'Model konfigürasyonu'),
  ('system_prompt', '{"preset": "technical", "custom": null}', 'System prompt ayarları'),
  ('tool_permissions', '{"lookupUser": true, "getRecentPosts": true, "getSystemStats": true}', 'Tool izinleri'),
  ('rate_limits', '{"requests_per_minute": 20, "tokens_per_day": 100000}', 'Rate limit ayarları');
```

### 5.2 ai_chat_logs Tablosu

```sql
CREATE TABLE ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_profiles(id) NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  model TEXT,
  tokens_used INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_chat_logs_admin_id ON ai_chat_logs(admin_id);
CREATE INDEX idx_ai_chat_logs_session_id ON ai_chat_logs(session_id);
CREATE INDEX idx_ai_chat_logs_created_at ON ai_chat_logs(created_at DESC);
```

---

## 6. API Endpoints

### 6.1 Chat API

```typescript
// POST /api/ops/ai/chat
// Request
{
  "messages": UIMessage[],
  "sessionId": string
}

// Response: Streaming UIMessageStreamResponse
```

### 6.2 Settings API

```typescript
// GET /api/ops/ai/settings
// Response
{
  "model_config": { "model": "...", "temperature": 0.7, ... },
  "system_prompt": { "preset": "technical", "custom": null },
  "tool_permissions": { ... },
  "rate_limits": { ... }
}

// POST /api/ops/ai/settings
// Request
{
  "key": "model_config",
  "value": { "model": "...", "temperature": 0.8 }
}
```

### 6.3 Logs API

```typescript
// GET /api/ops/ai/logs?limit=50&offset=0&sessionId=xxx
// Response
{
  "logs": [...],
  "total": 150,
  "stats": {
    "total_tokens": 50000,
    "total_requests": 200,
    "avg_duration_ms": 1500
  }
}
```

---

## 7. UI Components

### 7.1 assistant-ui Entegrasyonu

> **ÖNEMLİ:** assistant-ui kütüphanesinden **SADECE shadcn uyumlu UI componentlerini** kullanıyoruz.
> Runtime, state management veya hook'larını KULLANMIYORUZ.
> Referans: https://www.assistant-ui.com/docs/ui/Thread

#### Kullanılan assistant-ui Components

| Component           | Dosya                                             | Açıklama                                      |
| ------------------- | ------------------------------------------------- | --------------------------------------------- |
| `Thread`            | `components/assistant-ui/thread.tsx`              | Ana chat thread UI (mesajlar, input, scroll)  |
| `MarkdownText`      | `components/assistant-ui/markdown-text.tsx`       | Markdown rendering (GFM, syntax highlighting) |
| `ToolFallback`      | `components/assistant-ui/tool-fallback.tsx`       | Tool çağrı sonuçlarını gösterme               |
| `TooltipIconButton` | `components/assistant-ui/tooltip-icon-button.tsx` | Tooltip'li icon button                        |
| `Attachment`        | `components/assistant-ui/attachment.tsx`          | Dosya ekleme UI                               |
| `Reasoning`         | `components/assistant-ui/reasoning.tsx`           | AI reasoning steps gösterimi                  |
| `ShikiHighlighter`  | `components/assistant-ui/shiki-highlighter.tsx`   | Kod syntax highlighting                       |
| `ThreadList`        | `components/assistant-ui/thread-list.tsx`         | Thread listesi                                |
| `AssistantModal`    | `components/assistant-ui/assistant-modal.tsx`     | Modal chat UI                                 |
| `AssistantSidebar`  | `components/assistant-ui/assistant-sidebar.tsx`   | Sidebar chat UI                               |

#### Thread Component Yapısı

```tsx
// Thread component'i şu primitives'leri kullanır:
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";

// Thread içindeki alt componentler:
// - ThreadWelcome: Boş state welcome mesajı
// - ThreadSuggestions: Öneri butonları
// - Composer: Mesaj input alanı
// - AssistantMessage: AI mesajları (MarkdownText + ToolFallback)
// - UserMessage: Kullanıcı mesajları
// - BranchPicker: Mesaj branch navigasyonu
// - ActionBar: Copy, Refresh, Edit butonları
```

#### Kullanım Örneği

```tsx
// AI Chat sayfasında Thread component'ini kullan
import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

export default function AIChatPage() {
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}
```

### 7.2 Dosya Yapısı

```
apps/web/
├── app/ops/(private)/ai/
│   ├── page.tsx              # AI Chat sayfası
│   ├── settings/
│   │   └── page.tsx          # AI Settings sayfası
│   └── logs/
│       └── page.tsx          # AI Logs sayfası
├── components/assistant-ui/   # assistant-ui shadcn components
│   ├── thread.tsx            # Ana chat thread
│   ├── markdown-text.tsx     # Markdown rendering
│   ├── tool-fallback.tsx     # Tool sonuç gösterimi
│   ├── tooltip-icon-button.tsx
│   ├── attachment.tsx
│   ├── reasoning.tsx
│   ├── shiki-highlighter.tsx
│   ├── thread-list.tsx
│   ├── assistant-modal.tsx
│   ├── assistant-sidebar.tsx
│   └── threadlist-sidebar.tsx
├── components/ops/ai/         # Özel ops AI components
│   ├── AISettingsForm.tsx    # Ayarlar formu
│   ├── AIModelSelector.tsx   # Model seçici
│   └── AILogsTable.tsx       # Log tablosu
└── lib/ai/
    ├── openrouter.ts         # OpenRouter client
    ├── tools.ts              # Tool definitions
    ├── prompts.ts            # System prompts
    └── types.ts              # TypeScript types
```

### 7.3 Component Özellikleri

- **Dark/Light Mode**: CSS variables ile tam uyum
- **Responsive**: Mobile-first tasarım
- **Accessible**: ARIA labels ve keyboard navigation
- **Streaming**: Real-time mesaj gösterimi (ThreadPrimitive.Viewport)
- **Code Highlighting**: Shiki ile syntax highlighting
- **Markdown**: GFM (GitHub Flavored Markdown) desteği
- **Tool Results**: Collapsible tool sonuç gösterimi
- **Branch Navigation**: Mesaj versiyonları arası geçiş
- **Copy/Refresh**: Mesaj aksiyonları

---

## 8. Örnek Kullanım Senaryoları

### 8.1 Kullanıcı Sorgulama

```
Admin: "user_id=abc123 kullanıcısının bilgilerini göster"

AI: [lookupUser tool çağrısı]
    Kullanıcı Bilgileri:
    - Username: @johndoe
    - Display Name: John Doe
    - Kayıt Tarihi: 2024-01-15
    - Son Giriş: 2 saat önce
    - Durum: Aktif
    - Post Sayısı: 45
```

### 8.2 Platform İstatistikleri

```
Admin: "Bugünkü platform istatistiklerini göster"

AI: [getSystemStats tool çağrısı]
    Bugünkü İstatistikler:
    - Aktif Kullanıcı: 1,234
    - Yeni Kayıt: 56
    - Toplam Post: 789
    - Toplam Yorum: 2,345
```

---

## 9. Geliştirme Yol Haritası

### Phase 1 (MVP) ✅ Aktif
- [x] Döküman güncelleme
- [ ] Database migration (ai_settings, ai_chat_logs)
- [ ] OpenRouter + AI SDK entegrasyonu
- [ ] Temel chat API
- [ ] Basit chat UI
- [ ] lookupUser tool

### Phase 2
- [ ] AI Settings sayfası
- [ ] System prompt yönetimi
- [ ] Tool izinleri
- [ ] Log görüntüleme

### Phase 3
- [ ] Gelişmiş analytics tools
- [ ] Batch user operations
- [ ] Export/Import ayarlar
- [ ] AI kullanım raporları

---

## 10. Vercel AI SDK Detayları

### 10.1 Tool Tanımlama (inputSchema ile)

```typescript
import { z } from 'zod';

// Tool tanımı - inputSchema kullanılır
const tools = {
  lookupUser: {
    description: 'Kullanıcı bilgilerini sorgula',
    inputSchema: z.object({
      identifier: z.string().describe('User ID, email veya username'),
      identifierType: z.enum(['id', 'email', 'username']).default('id'),
    }),
    execute: async ({ identifier, identifierType }) => {
      // Supabase sorgusu
      return { success: true, user: { ... } };
    },
  },
};
```

### 10.2 streamText Kullanımı

```typescript
import { streamText, convertToCoreMessages } from 'ai';
import { openrouter } from '@/lib/ai/openrouter';

const result = streamText({
  model: openrouter.chat('google/gemini-2.0-flash-exp:free'),
  system: systemPrompt,
  messages: convertToCoreMessages(messages),
  tools: aiTools,
  temperature: 0.7,
  maxOutputTokens: 4096,
  onFinish: async ({ text, usage, toolCalls, toolResults }) => {
    // Log kaydet
  },
});

// Response döndür
return result.toTextStreamResponse(); // Basit text stream
// veya
return result.toDataStreamResponse(); // useChat hook ile kullanım için
```

### 10.3 Response Tipleri

| Method                        | Kullanım        | Açıklama                               |
| ----------------------------- | --------------- | -------------------------------------- |
| `toTextStreamResponse()`      | Basit streaming | Her text delta UTF-8 olarak gönderilir |
| `toDataStreamResponse()`      | useChat hook    | Tool calls, usage, metadata dahil      |
| `toUIMessageStreamResponse()` | UI Messages     | assistant-ui uyumlu format             |

### 10.4 useChat Hook (Client-Side)

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function Chat() {
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ops/ai/chat',
    }),
    onFinish: (message) => console.log('Complete:', message),
    onError: (error) => console.error('Error:', error),
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.parts.map((part, i) => {
            if (part.type === 'text') return <p key={i}>{part.text}</p>;
            if (part.type === 'tool-call') return <ToolUI key={i} {...part} />;
            return null;
          })}
        </div>
      ))}
    </div>
  );
}
```

### 10.5 Tool Stream Parts

```typescript
// Tool call başlangıcı
{ type: 'tool-call-start', toolCallId: 'call_abc123', toolName: 'lookupUser' }

// Tool arguments delta (streaming)
{ type: 'tool-call-delta', toolCallId: 'call_abc123', argsTextDelta: '{"identifier":' }

// Tool sonucu
{
  type: 'tool-result',
  toolCallId: 'call_abc123',
  toolName: 'lookupUser',
  input: { identifier: 'user123', identifierType: 'id' },
  output: { success: true, user: { ... } }
}
```

---

## 11. OpenRouter Entegrasyonu

### 11.1 Provider Kurulumu

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Model kullanımı
const model = openrouter.chat('google/gemini-2.0-flash-exp:free');
```

### 11.2 Önerilen Modeller

| Model                                    | Özellik             | Ücretsiz |
| ---------------------------------------- | ------------------- | -------- |
| `google/gemini-2.0-flash-exp:free`       | Hızlı, tool calling | ✅        |
| `meta-llama/llama-3.3-70b-instruct:free` | Güçlü reasoning     | ✅        |
| `qwen/qwen-2.5-72b-instruct:free`        | Çok dilli           | ✅        |
| `anthropic/claude-3.5-sonnet`            | En iyi genel        | ❌        |
| `openai/gpt-4o`                          | OpenAI flagship     | ❌        |

### 11.3 Usage Tracking

```typescript
const model = openrouter('openai/gpt-4o', {
  usage: { include: true },
});

const result = await generateText({ model, prompt: '...' });

if (result.providerMetadata?.openrouter?.usage) {
  console.log('Cost:', result.providerMetadata.openrouter.usage.cost);
  console.log('Tokens:', result.providerMetadata.openrouter.usage.totalTokens);
}
```

---

## 12. Referanslar

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [AI SDK v5 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-4-0)
- [OpenRouter AI SDK Provider](https://github.com/openrouterteam/ai-sdk-provider)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [assistant-ui Thread Docs](https://www.assistant-ui.com/docs/ui/Thread) - **Sadece UI components kullanılıyor**
- [assistant-ui Primitives](https://www.assistant-ui.com/docs/api-reference/primitives/Thread)