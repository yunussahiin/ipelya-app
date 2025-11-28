# Web Ops AI System - TODO

## 🎯 Mevcut Durum

### ✅ Tamamlanan
- [x] OpenRouter entegrasyonu (openrouter.ts)
- [x] AI Tools tanımları (tools.ts) - 6 tool
- [x] System prompts (prompts.ts) - 4 preset
- [x] Chat API route (/api/ops/ai/chat)
- [x] assistant-ui entegrasyonu
- [x] Model seçimi UI + localStorage persistence
- [x] `convertToModelMessages` ile doğru mesaj dönüşümü
- [x] Tool calling destekli model listesi güncellendi
- [x] **Tool calling çalışıyor!** ✅ (2025-11-28)
  - `getSystemStats` tool test edildi
  - Doğru veri döndürüyor (5 kullanıcı, 26 post, 77 mesaj)
  - Türkçe + Markdown formatında yanıt
- [x] `stopWhen: stepCountIs(5)` ile multi-step tool calling
- [x] System prompt güncellendi (halüsinasyon önleme)
- [x] **AI Settings Sayfası** ✅ (2025-11-28)
  - [x] `/api/ops/ai/credits` endpoint
  - [x] `/api/ops/ai/activity` endpoint
  - [x] `/api/ops/ai/models` endpoint
  - [x] `/api/ops/ai/providers` endpoint
  - [x] `/api/ops/ai/endpoints` endpoint
  - [x] `/api/ops/ai/logs` endpoint
  - [x] `/api/ops/ai/settings` endpoint
  - [x] Settings sayfası UI (`/ops/ai/settings`)
  - [x] CreditsSection - Kredi durumu gösterimi
  - [x] AnalyticsSection - Kullanım analitikleri
  - [x] ModelsSection - Model listesi (DataTable + Sayfalandırma + Filtreleme)
  - [x] ProvidersSection - Provider listesi
  - [x] Endpoints Modal - Model satırına tıklayınca endpoint detayları
  - [x] LogsSection - AI chat logları (DataTable)
  - [x] PreferencesSection - Model tercihleri
  - [x] PromptsSection - System prompt yönetimi
  - [x] ToolsSection - Tool tanımları görüntüleme
  - [x] DatabaseSection - Veritabanı istatistikleri
  - [x] ApiKeysSection - API key yönetimi

- [x] **Chat Persistence** ✅ (2025-11-28)
  - [x] `ai_chat_threads` tablosu (messages JSONB olarak)
  - [x] RLS policies mevcut
  - [x] `/api/ops/ai/threads` - Thread listesi (GET)
  - [x] `/api/ops/ai/threads` - Yeni thread oluştur (POST)
  - [x] `/api/ops/ai/threads/[threadId]` - Thread detayı (GET)
  - [x] `/api/ops/ai/threads/[threadId]` - Thread güncelle (PATCH)
  - [x] `/api/ops/ai/threads/[threadId]` - Thread sil (DELETE)
  - [x] Chat API thread desteği (mesajları kaydet)
  - [x] Thread list sidebar component
  - [x] Thread oluşturma/seçme/silme/arşivleme UI
  - [x] `useThreadPersistence` hook
- [x] **Header Kredi Badge** ✅ (2025-11-28)
  - [x] `CreditsBadge` component
  - [x] Düşük kredi uyarısı (< $1)
  - [x] Tooltip ile detaylı bilgi
  - [x] Tıklanınca settings'e yönlendirme

### 🔄 Devam Eden
- [ ] Thread başlığı otomatik oluşturma (AI ile)

### ⚠️ Bilinen Sorunlar
- Free modeller rate limit'e takılabiliyor (Gemini 2.0 Flash)
- GPT OSS 20B bazen halüsinasyon yapıyor (ama düzeldi)

---

## 📋 ~~Öncelik 1: AI Settings Sayfası~~ ✅ TAMAMLANDI

> Tüm API endpoints ve UI components tamamlandı.

---

## 📋 ~~Öncelik 1: Chat Persistence~~ ✅ TAMAMLANDI

> Thread persistence, sidebar UI ve kredi badge tamamlandı.

---

## 📋 ~~Öncelik 2: Header Kredi Badge~~ ✅ TAMAMLANDI

> CreditsBadge component oluşturuldu ve AIFullPageChat header'ına eklendi.

### Tablo Şeması
```sql
-- ai_chat_threads
CREATE TABLE ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_profiles(id) ON DELETE CASCADE,
  title TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ai_chat_messages (mevcut ai_chat_logs'dan farklı - thread bazlı)
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES ai_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'tool' | 'system'
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_threads_admin ON ai_chat_threads(admin_id);
CREATE INDEX idx_threads_created ON ai_chat_threads(created_at DESC);
CREATE INDEX idx_messages_thread ON ai_chat_messages(thread_id);
```

---

## 📋 Öncelik 2: Header Kredi Badge

### Yapılacaklar
- [ ] Header component'e kredi badge ekle
- [ ] Kredi durumunu context/store'da tut
- [ ] Düşük kredi uyarısı (< $1)
- [ ] Tıklanınca settings'e yönlendir

---

## 📋 Öncelik 3: Gelişmiş Özellikler

### Structured Outputs
- [ ] JSON Schema ile yapılandırılmış yanıtlar
- [ ] Analitik sorgular için structured output

### Message Transforms
- [ ] `middle-out` compression uzun sohbetler için
- [ ] Context window yönetimi

### Presets
- [ ] OpenRouter presets entegrasyonu
- [ ] Özel preset oluşturma UI

---

## 📋 Öncelik 4: UI/UX İyileştirmeleri

### Yapılacaklar
- [ ] Tool call sonuçlarını collapsible card olarak göster
- [ ] Markdown rendering iyileştirmeleri
- [ ] Code syntax highlighting
- [ ] Streaming sırasında typing indicator
- [ ] Hata mesajları için toast notifications
- [ ] Model değiştiğinde uyarı (mevcut sohbet silinecek)

---

## 🔧 Teknik Notlar

### OpenRouter Tool Calling Formatı
```typescript
// Tool tanımı
{
  type: "function",
  function: {
    name: "lookupUser",
    description: "Kullanıcı bilgilerini sorgula",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string" },
        identifierType: { type: "string", enum: ["id", "email", "username"] }
      },
      required: ["identifier"]
    }
  }
}

// Tool response
{
  role: "tool",
  tool_call_id: "call_abc123",
  content: JSON.stringify(result)
}
```

### Desteklenen Modeller (Tool Calling)
| Model                                         | Free | Tool Calling |
| --------------------------------------------- | ---- | ------------ |
| google/gemini-2.0-flash-exp:free              | ✅    | ✅            |
| openai/gpt-oss-20b:free                       | ✅    | ✅            |
| z-ai/glm-4.5-air:free                         | ✅    | ✅            |
| qwen/qwen3-coder-480b-a35b:free               | ✅    | ✅            |
| qwen/qwen3-235b-a22b:free                     | ✅    | ✅            |
| mistralai/mistral-small-3.1-24b-instruct:free | ✅    | ✅            |
| anthropic/claude-3.5-sonnet                   | ❌    | ✅            |
| openai/gpt-4o                                 | ❌    | ✅            |

### Dosya Yapısı
```
/apps/web/
├── app/api/ops/ai/
│   ├── chat/route.ts      # Chat API
│   ├── settings/route.ts  # Settings API
│   └── logs/route.ts      # Logs API
├── components/ops/ai/
│   ├── AIFullPageChat.tsx # Ana chat sayfası
│   └── ...
├── lib/ai/
│   ├── openrouter.ts      # OpenRouter client
│   ├── tools.ts           # Tool tanımları
│   ├── prompts.ts         # System prompts
│   └── types.ts           # TypeScript types
└── components/assistant-ui/
    ├── thread.tsx         # Chat thread
    └── thread-list.tsx    # Thread listesi
```

---

## 📚 Referans Dokümantasyon

### OpenRouter Docs
- `/docs/web-ops-ai-system/openrouter-docs/tool-calling.md`
- `/docs/web-ops-ai-system/openrouter-docs/structured-outputs.md`
- `/docs/web-ops-ai-system/openrouter-docs/message-transforms.md`
- `/docs/web-ops-ai-system/openrouter-docs/presets.md`

### OpenRouter API Reference
- `/docs/web-ops-ai-system/openrouter-docs/openrouter-api-docs/overview.md`
- `/docs/web-ops-ai-system/openrouter-docs/openrouter-api-docs/parameters.md`
- `/docs/web-ops-ai-system/openrouter-docs/openrouter-api-docs/streaming.md`

### API Endpoints
- `/docs/web-ops-ai-system/openrouter-docs/openrouter-api-docs/API-Reference/`
  - Models/, Credits/, API Keys/, Analytics/, Generations/

### Responses API (Beta)
- `/docs/web-ops-ai-system/openrouter-docs/openrouter-api-docs/responses-api-docs/`
