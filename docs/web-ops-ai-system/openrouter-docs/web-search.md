# Web Search

> OpenRouter ile modellere gerçek zamanlı web arama yeteneği kazandırın.

## Genel Bakış

Web Search özelliği, modellerin güncel bilgilere erişmesini sağlar. Model, soruyu yanıtlamadan önce web'de arama yapabilir.

## Kullanım

### Temel Kullanım

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'Bugün Bitcoin fiyatı ne kadar?'
      }
    ],
    plugins: [
      {
        id: 'web',
        max_results: 5
      }
    ]
  }),
});
```

### Web Search Parametreleri

```typescript
plugins: [
  {
    id: 'web',
    max_results: 5,        // Maksimum sonuç sayısı (1-10)
    search_prompt: '',     // Özel arama prompt'u
  }
]
```

## Alternatif: web_search_options

```typescript
{
  model: 'openai/gpt-4o',
  messages: [...],
  web_search_options: {
    search_context_size: 'medium', // 'low', 'medium', 'high'
  }
}
```

| Seviye   | Açıklama                         |
| -------- | -------------------------------- |
| `low`    | Minimal context, düşük maliyet   |
| `medium` | Dengeli (varsayılan)             |
| `high`   | Maksimum context, yüksek maliyet |

## Destekleyen Modeller

| Model             | Web Search |
| ----------------- | ---------- |
| GPT-4o            | ✅          |
| GPT-4 Turbo       | ✅          |
| Claude 3.5 Sonnet | ✅          |
| Gemini 2.0 Flash  | ✅          |
| Perplexity Sonar  | ✅ (native) |

## Response Formatı

Web search kullanıldığında, response'da ek bilgiler döner:

```json
{
  "id": "gen-xxx",
  "choices": [...],
  "usage": {...},
  "web_search_results": [
    {
      "title": "Bitcoin Price Today",
      "url": "https://example.com/bitcoin",
      "snippet": "Bitcoin is currently trading at..."
    }
  ]
}
```

## Fiyatlandırma

Web search ek maliyet getirir:

| Seviye | Ek Maliyet    |
| ------ | ------------- |
| low    | ~$0.001/istek |
| medium | ~$0.003/istek |
| high   | ~$0.005/istek |

## Kullanım Senaryoları

### 1. Güncel Haberler

```typescript
messages: [
  {
    role: 'user',
    content: 'Son teknoloji haberlerini özetle'
  }
],
plugins: [{ id: 'web', max_results: 10 }]
```

### 2. Fiyat Bilgisi

```typescript
messages: [
  {
    role: 'user',
    content: 'iPhone 15 Pro fiyatları nedir?'
  }
],
plugins: [{ id: 'web', max_results: 5 }]
```

### 3. Araştırma

```typescript
messages: [
  {
    role: 'system',
    content: 'Sen bir araştırma asistanısın. Kaynaklarını belirt.'
  },
  {
    role: 'user',
    content: 'Yapay zeka regülasyonları hakkında güncel gelişmeler neler?'
  }
],
plugins: [{ id: 'web', max_results: 10 }]
```

## Best Practices

### 1. Gereksiz Aramalardan Kaçının

```typescript
// Kötü: Her istek için web search
plugins: [{ id: 'web' }]

// İyi: Sadece güncel bilgi gerektiğinde
if (requiresCurrentInfo(userMessage)) {
  plugins.push({ id: 'web' });
}
```

### 2. Sonuç Sayısını Optimize Edin

```typescript
// Basit sorular için az sonuç
{ id: 'web', max_results: 3 }

// Detaylı araştırma için çok sonuç
{ id: 'web', max_results: 10 }
```

### 3. Kaynak Gösterimi

```typescript
// System prompt'ta kaynak gösterimi iste
{
  role: 'system',
  content: 'Yanıtlarında kullandığın kaynakları [1], [2] şeklinde belirt.'
}
```

## Perplexity Sonar Modelleri

Perplexity modelleri native web search desteği sunar:

```typescript
{
  model: 'perplexity/sonar-pro',
  messages: [...],
  // plugins gerekmez, otomatik web search yapar
}
```

| Model           | Özellik                |
| --------------- | ---------------------- |
| sonar           | Temel web search       |
| sonar-pro       | Gelişmiş web search    |
| sonar-reasoning | Reasoning + web search |

## Limitler

| Limit       | Değer            |
| ----------- | ---------------- |
| Max results | 10               |
| Rate limit  | 100 istek/dakika |
| Timeout     | 30 saniye        |
