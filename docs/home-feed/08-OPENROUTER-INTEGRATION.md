# İpelya Home Feed - OpenRouter AI Integration

## 🎯 Genel Bakış

Bu döküman, İpelya Home Feed sisteminde OpenRouter AI entegrasyonunu açıklar. OpenRouter, tek bir API üzerinden 300+ AI modeline erişim sağlayan unified bir platformdur.

---

## 🔑 Neden OpenRouter?

### Avantajlar

1. **Model Esnekliği**
   - 300+ model tek API'den
   - Primary + fallback model desteği
   - Free ve ücretli model seçenekleri

2. **Maliyet Optimizasyonu**
   - Free tier modeller (Llama 2, Mistral)
   - Model bazlı pricing
   - Fallback ile maliyet kontrolü

3. **Kolay Entegrasyon**
   - OpenAI SDK uyumlu
   - Anthropic SDK uyumlu
   - Basit API yapısı

4. **Yönetilebilirlik**
   - Web Ops panel'den model değiştirme
   - A/B testing desteği
   - Model performans tracking

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                    Web Ops Panel                        │
│  (Model yönetimi, A/B testing, performans tracking)    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              AI Model Config (Database)                 │
│  - Primary model: anthropic/claude-3.5-sonnet          │
│  - Fallback models: [llama-2-70b, gpt-4o-mini]        │
│  - Custom models: [claude-haiku, mistral-7b]          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│            OpenRouter Client (_shared/openrouter.ts)    │
│  - Model config fetching                               │
│  - Fallback handling                                   │
│  - Error handling                                      │
│  - JSON parsing                                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Edge Functions                         │
│  1. moderate-content (toxicity, NSFW, spam)           │
│  2. analyze-content-quality (quality, tags, sentiment) │
│  3. calculate-feed-scores (scoring algorithms)         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Database Schema

### ai_model_config

```sql
CREATE TABLE ai_model_config (
  id UUID PRIMARY KEY,
  config_type TEXT CHECK (config_type IN ('primary', 'fallback', 'custom')),
  model_slug TEXT NOT NULL, -- OpenRouter model slug
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL, -- openai, anthropic, meta, etc.
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0, -- Fallback sırası
  use_cases TEXT[], -- ['moderation', 'quality_scoring', 'feed_ranking']
  pricing_prompt DECIMAL(10, 8),
  pricing_completion DECIMAL(10, 8),
  context_length INTEGER,
  max_output_length INTEGER,
  features TEXT[], -- ['tools', 'json_mode', 'streaming']
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Default Models

| Type     | Model               | Provider  | Free | Use Cases           |
| -------- | ------------------- | --------- | ---- | ------------------- |
| Primary  | claude-3.5-sonnet   | Anthropic | ❌    | All                 |
| Fallback | llama-2-70b-chat    | Meta      | ✅    | Moderation, Quality |
| Fallback | gpt-4o-mini         | OpenAI    | ❌    | All                 |
| Custom   | claude-3-haiku      | Anthropic | ❌    | Moderation          |
| Custom   | mistral-7b-instruct | Mistral   | ✅    | Quality Scoring     |

---

## 🔧 OpenRouter Client

### Initialization

```typescript
import { createOpenRouterClient } from "../_shared/openrouter.ts";

const openRouter = createOpenRouterClient();
// API key otomatik olarak OPENROUTER_API_KEY env'den alınır
```

### Model Config Fetching

```typescript
const modelConfig = await OpenRouterClient.getModelConfig(
  supabase,
  "moderation" // use case
);

// Returns:
// {
//   model: "anthropic/claude-3.5-sonnet",
//   fallbackModels: ["meta-llama/llama-2-70b-chat", "openai/gpt-4o-mini"]
// }
```

### Chat Completion

```typescript
const response = await openRouter.createChatCompletion(
  [{ role: "user", content: "Analyze this content..." }],
  {
    model: modelConfig.model,
    fallbackModels: modelConfig.fallbackModels,
    temperature: 0.7,
    maxTokens: 4096,
  }
);

// Returns:
// {
//   content: "...",
//   model: "anthropic/claude-3.5-sonnet", // Kullanılan model
//   usage: { promptTokens, completionTokens, totalTokens }
// }
```

### Fallback Handling

OpenRouter otomatik olarak fallback modellerini dener:

1. Primary model başarısız olursa
2. Rate limit aşılırsa
3. Model unavailable ise

```typescript
// Primary: claude-3.5-sonnet (başarısız)
// ↓
// Fallback 1: llama-2-70b-chat (başarısız)
// ↓
// Fallback 2: gpt-4o-mini (başarılı) ✅
```

---

## 🎯 Edge Functions

### 1. moderate-content

**Amaç:** İçerik moderasyonu (toxicity, NSFW, spam)

**Input:**
```json
{
  "content_type": "post",
  "content_id": "uuid",
  "content_text": "...",
  "user_id": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "is_safe": true,
    "action_taken": "approved",
    "toxicity_score": 0.1,
    "categories": [],
    "model_used": "anthropic/claude-3.5-sonnet"
  }
}
```

**Actions:**
- `approved`: Safe content (toxicity < 0.5)
- `shadow_banned`: Slightly toxic (0.5 - 0.8)
- `flagged`: Toxic (0.5 - 0.8)
- `removed`: Very toxic (> 0.8)

---

### 2. analyze-content-quality

**Amaç:** İçerik kalitesi analizi

**Input:**
```json
{
  "content_id": "uuid",
  "content_text": "...",
  "has_media": true,
  "caption_length": 150
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "quality_score": 0.85,
    "ai_quality_score": 0.7,
    "sentiment": "positive",
    "tags": ["travel", "adventure", "nature"],
    "engagement_potential": 0.8,
    "explanation": "...",
    "model_used": "anthropic/claude-3.5-sonnet"
  }
}
```

**Quality Score Calculation:**
```
final_score = ai_quality_score
  + caption_bonus (0.05-0.1)
  + media_bonus (0.15)
```

---

### 3. calculate-feed-scores

**Amaç:** Feed scoring hesaplama

**Input:**
```json
{
  "user_id": "uuid",
  "content_type": "post",
  "content_id": "uuid",
  "force_recalculate": false
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "base_score": 0.65,
    "vibe_match_score": 0.7,
    "intent_match_score": 0.6,
    "social_graph_score": 0.5,
    "final_score": 0.625,
    "cached": false
  }
}
```

**Final Score Formula:**
```
final_score = 
  base_score * 0.30 +
  vibe_match_score * 0.25 +
  intent_match_score * 0.25 +
  social_graph_score * 0.20
```

---

## 🔐 Environment Variables

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

**API Key Alma:**
1. https://openrouter.ai/ adresine git
2. Sign up / Login
3. API Keys sayfasından yeni key oluştur
4. Key'i `.env.local` dosyasına ekle

---

## 💰 Pricing & Cost Management

### Free Models

| Model               | Provider | Context | Speed     |
| ------------------- | -------- | ------- | --------- |
| llama-2-70b-chat    | Meta     | 4K      | Fast      |
| mistral-7b-instruct | Mistral  | 8K      | Very Fast |

### Paid Models

| Model             | Prompt   | Completion | Context |
| ----------------- | -------- | ---------- | ------- |
| claude-3.5-sonnet | $3/1M    | $15/1M     | 200K    |
| gpt-4o-mini       | $0.15/1M | $0.60/1M   | 128K    |
| claude-3-haiku    | $0.25/1M | $1.25/1M   | 200K    |

### Cost Optimization Strategies

1. **Free Models First**
   - Moderation için Llama 2
   - Quality scoring için Mistral

2. **Fallback Chain**
   - Primary: Claude (high quality)
   - Fallback 1: Llama 2 (free)
   - Fallback 2: GPT-4o Mini (cheap)

3. **Caching**
   - Feed scores: 1 hour cache
   - Quality analysis: Permanent
   - Moderation: Permanent

4. **Batch Processing**
   - Bulk moderation
   - Scheduled scoring updates

---

## 🎨 Web Ops Panel Integration

### Model Management Page

```typescript
// Web Ops: /ops/ai-models

// Features:
- Model listesi (primary, fallback, custom)
- Model aktif/pasif toggle
- Priority sıralaması (drag & drop)
- Use case assignment
- Pricing tracking
- Performance metrics
```

### A/B Testing

```typescript
// Experiment setup
{
  name: "Claude vs Llama Moderation",
  variants: {
    control: { model: "anthropic/claude-3.5-sonnet" },
    treatment: { model: "meta-llama/llama-2-70b-chat" }
  },
  allocation: 0.5 // 50% split
}
```

### Performance Tracking

```typescript
// Metrics per model
{
  model: "anthropic/claude-3.5-sonnet",
  total_requests: 1000,
  success_rate: 0.98,
  avg_latency_ms: 1200,
  total_cost_usd: 0.45,
  use_cases: {
    moderation: { requests: 500, success_rate: 0.99 },
    quality_scoring: { requests: 500, success_rate: 0.97 }
  }
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
// Test OpenRouter client
describe("OpenRouterClient", () => {
  it("should fetch model config from database", async () => {
    const config = await OpenRouterClient.getModelConfig(supabase, "moderation");
    expect(config.model).toBe("anthropic/claude-3.5-sonnet");
    expect(config.fallbackModels).toHaveLength(2);
  });

  it("should handle fallback on primary failure", async () => {
    // Mock primary failure
    // Verify fallback model used
  });
});
```

### Integration Tests

```typescript
// Test Edge Functions
describe("moderate-content", () => {
  it("should flag toxic content", async () => {
    const response = await fetch("/moderate-content", {
      method: "POST",
      body: JSON.stringify({
        content_text: "toxic content here",
        content_id: "uuid",
        user_id: "uuid"
      })
    });
    
    const data = await response.json();
    expect(data.data.action_taken).toBe("flagged");
  });
});
```

---

## 📈 Monitoring & Alerts

### Key Metrics

1. **Model Performance**
   - Success rate per model
   - Average latency
   - Error rate

2. **Cost Tracking**
   - Daily/monthly spend
   - Cost per use case
   - Budget alerts

3. **Quality Metrics**
   - Moderation accuracy
   - Quality score distribution
   - User feedback

### Alerts

```typescript
// Alert conditions
{
  model_error_rate: { threshold: 0.05, action: "switch_to_fallback" },
  daily_cost: { threshold: 100, action: "notify_admin" },
  latency: { threshold: 5000, action: "investigate" }
}
```

---

## 🚀 Deployment

### 1. Database Migration (Supabase MCP)

```typescript
// Supabase MCP kullanımı
await mcp4_apply_migration({
  name: 'ai_model_config',
  query: `-- SQL migration content here`
});

// Sonuç: Migration başarıyla uygulandı
```

**Oluşturulan Tablolar:**
- `ai_model_config` - Model yapılandırmaları
- `user_behavior_logs` - Kullanıcı davranış logları
- `content_moderation_logs` - Moderasyon logları
- `feed_scores_cache` - Feed score cache

### 2. Deploy Edge Functions (Supabase MCP)

```typescript
// 1. moderate-content
await mcp4_deploy_edge_function({
  name: 'moderate-content',
  entrypoint_path: 'index.ts',
  files: [
    { name: 'index.ts', content: '...' },
    { name: '../_shared/openrouter.ts', content: '...' }
  ]
});
// Status: ACTIVE (v2)

// 2. analyze-content-quality
await mcp4_deploy_edge_function({
  name: 'analyze-content-quality',
  entrypoint_path: 'index.ts',
  files: [...]
});
// Status: ACTIVE (v1)

// 3. calculate-feed-scores
await mcp4_deploy_edge_function({
  name: 'calculate-feed-scores',
  entrypoint_path: 'index.ts',
  files: [...]
});
// Status: ACTIVE (v1)
```

**Deployed Functions:**
- ✅ `moderate-content` (v2) - ACTIVE
- ✅ `analyze-content-quality` (v1) - ACTIVE
- ✅ `calculate-feed-scores` (v1) - ACTIVE

### 3. Set Environment Variables

```bash
# Supabase secrets
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### 4. Verify Deployment

```bash
# List all functions
supabase functions list

# Test moderation
curl -X POST https://your-project.supabase.co/functions/v1/moderate-content \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content_text": "test", "content_id": "uuid", "user_id": "uuid"}'
```

---

## 🔍 Troubleshooting

### Common Issues

**1. "OPENROUTER_API_KEY is required"**
```bash
# Solution: Set API key
supabase secrets set OPENROUTER_API_KEY=your-key
```

**2. "No AI model found for use case"**
```sql
-- Solution: Check database
SELECT * FROM ai_model_config WHERE 'moderation' = ANY(use_cases);
```

**3. "All models failed"**
```typescript
// Solution: Check model availability
// Verify fallback models are active
// Check OpenRouter status page
```

---

## 📚 Resources

- **OpenRouter Docs:** https://openrouter.ai/docs
- **OpenRouter Models:** https://openrouter.ai/models
- **OpenRouter Pricing:** https://openrouter.ai/pricing
- **Anthropic SDK:** https://github.com/anthropics/anthropic-sdk-typescript
- **Algorithm Docs:** [05-ALGORITHM-SCORING.md](./05-ALGORITHM-SCORING.md)

---

**Son Güncelleme:** 2025-11-24 05:10 UTC+03:00
**Durum:** Tamamlandı ✅
**Deployment:** Supabase MCP ile production'a deploy edildi
