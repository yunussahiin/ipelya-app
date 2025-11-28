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

### 🔄 Devam Eden
- [ ] Chat persistence (thread'lerin kaydedilmesi)
- [ ] AI Settings sayfası

### ⚠️ Bilinen Sorunlar
- Free modeller rate limit'e takılabiliyor (Gemini 2.0 Flash)
- GPT OSS 20B bazen halüsinasyon yapıyor (ama düzeldi)

---

## 📋 Öncelik 1: AI Settings Sayfası ⭐ YENİ

### Sayfa: `/ops/ai/settings`

### Bölüm 1: Kredi Durumu
**API:** `GET /api/v1/credits`
```typescript
interface CreditsResponse {
  data: {
    total_credits: number;  // Toplam satın alınan
    total_usage: number;    // Toplam kullanılan
  }
}
// Kalan = total_credits - total_usage
```

**UI:**
- 💰 Kalan Kredi: $X.XX
- 📊 Kullanılan: $X.XX
- Progress bar (kullanım yüzdesi)
- "Kredi Ekle" butonu → OpenRouter'a yönlendir

### Bölüm 2: Kullanım Analitikleri
**API:** `GET /api/v1/activity`
```typescript
interface ActivityResponse {
  data: {
    date: string;           // YYYY-MM-DD
    model_id: string;       // Model adı
    usage: number;          // Token kullanımı
    cost: number;           // Maliyet
    num_requests: number;   // İstek sayısı
  }[]
}
```

**UI:**
- 📈 Son 7 gün grafiği (recharts)
- Model bazlı kullanım tablosu
- Günlük/Haftalık/Aylık filtre

### Bölüm 3: Model Tercihleri
**Kaynak:** localStorage + Supabase

**UI:**
- Varsayılan model seçimi
- Fallback model seçimi
- Temperature slider (0-2)
- Max tokens input

### Bölüm 4: System Prompt Yönetimi
**UI:**
- Preset seçimi (Technical, Support, Analytics, Moderation)
- Özel prompt textarea
- Prompt test butonu

### Dosya Yapısı
```
/apps/web/app/ops/(private)/ai/
├── page.tsx              # Chat sayfası (mevcut)
└── settings/
    └── page.tsx          # Settings sayfası (YENİ)

/apps/web/app/api/ops/ai/
├── chat/route.ts         # Chat API (mevcut)
├── credits/route.ts      # Kredi API (YENİ)
├── activity/route.ts     # Aktivite API (YENİ)
└── settings/route.ts     # Settings API (YENİ)
```

### Yapılacaklar
- [ ] `/api/ops/ai/credits` endpoint oluştur
- [ ] `/api/ops/ai/activity` endpoint oluştur
- [ ] Settings sayfası UI oluştur
- [ ] Kredi göstergesi component
- [ ] Kullanım grafiği component
- [ ] Model tercihleri formu
- [ ] Header'a kredi badge ekle

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
