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

### 🔄 Devam Eden
- [ ] Tool calling test edilecek (kredi eklendi)
- [ ] Chat persistence (thread'lerin kaydedilmesi)

---

## 📋 Öncelik 1: Tool Calling Düzeltmeleri

### Sorunlar
1. **Tool calls çalışmıyor** - Model tool'ları çağırmıyor
   - System prompt'a tool talimatları eklendi ✅
   - Test edilmeli

### Yapılacaklar
- [ ] Tool calling test et (Gemini 2.0 Flash veya GPT-4o ile)
- [ ] Tool results UI'da göster
- [ ] Tool call hata yönetimi ekle

---

## 📋 Öncelik 2: Chat Persistence

### Yapılacaklar
- [ ] Thread'leri Supabase'e kaydet
- [ ] Thread list'i Supabase'den yükle
- [ ] Thread silme/arşivleme
- [ ] Thread başlığı otomatik oluşturma

### Tablo Şeması (ai_chat_threads)
```sql
CREATE TABLE ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_profiles(id),
  title TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES ai_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'tool'
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 Öncelik 3: OpenRouter Yönetim API Entegrasyonu

### Referans Dokümantasyon
- `/docs/web-ops-ai-system/openrouter-docs/openrouter-api-docs/API-Reference/`

### Yapılacaklar
- [ ] Kredi durumu gösterimi (`GET /api/v1/credits`)
- [ ] Model listesi dinamik yükleme (`GET /api/v1/models`)
- [ ] Kullanım analitikleri (`/Analytics/`)
- [ ] API key yönetimi (opsiyonel)

### UI Eklemeleri
- [ ] Header'da kredi göstergesi
- [ ] Model seçiminde dinamik liste
- [ ] Kullanım istatistikleri sayfası

---

## 📋 Öncelik 4: Gelişmiş Özellikler

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

## 📋 Öncelik 5: UI/UX İyileştirmeleri

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
