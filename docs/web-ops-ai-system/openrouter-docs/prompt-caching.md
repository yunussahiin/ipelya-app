# Prompt Caching

> OpenRouter'ın prompt caching özelliği ile maliyetleri düşürün ve latency'yi azaltın.

## Genel Bakış

Prompt caching, sık kullanılan prompt'ların önbelleğe alınarak tekrar kullanılmasını sağlar. Bu özellik:
- **Maliyet tasarrufu**: Cached token'lar daha ucuz
- **Düşük latency**: Cached prompt'lar daha hızlı işlenir
- **Aynı kalite**: Yanıt kalitesi etkilenmez

## Destekleyen Modeller

| Model             | Cache Desteği | İndirim |
| ----------------- | ------------- | ------- |
| Claude 3.5 Sonnet | ✅             | %90     |
| Claude 3 Opus     | ✅             | %90     |
| GPT-4o            | ✅             | %50     |
| Gemini 1.5 Pro    | ✅             | %75     |

## Nasıl Çalışır?

### Otomatik Caching

OpenRouter, uygun prompt'ları otomatik olarak cache'ler:

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      {
        role: 'system',
        content: 'Çok uzun bir system prompt...' // Bu cache'lenebilir
      },
      {
        role: 'user',
        content: 'Kullanıcı sorusu'
      }
    ],
  }),
});
```

### Cache Breakpoints

Anthropic modelleri için cache breakpoint'leri belirleyebilirsiniz:

```typescript
messages: [
  {
    role: 'system',
    content: [
      {
        type: 'text',
        text: 'System prompt...',
        cache_control: { type: 'ephemeral' }
      }
    ]
  }
]
```

## Fiyatlandırma

### Cache Write (Yazma)

İlk kez cache'lenirken normal fiyatın %25 fazlası ödenir.

### Cache Read (Okuma)

Cache'den okunurken büyük indirimler:
- Anthropic: %90 indirim
- OpenAI: %50 indirim
- Google: %75 indirim

## Usage Response

Cache kullanımı response'da görünür:

```json
{
  "usage": {
    "prompt_tokens": 1500,
    "completion_tokens": 200,
    "total_tokens": 1700,
    "prompt_tokens_details": {
      "cached_tokens": 1200,
      "audio_tokens": 0
    }
  }
}
```

## Best Practices

### 1. Uzun System Prompt'ları Cache'leyin

```typescript
// İyi: Uzun, sabit system prompt
const systemPrompt = `
  Sen bir müşteri destek asistanısın.
  Şirket politikaları:
  - ...
  - ...
  (1000+ karakter)
`;
```

### 2. Sık Kullanılan Context'leri Öne Alın

```typescript
messages: [
  { role: 'system', content: longSystemPrompt }, // Cache'lenir
  { role: 'user', content: frequentContext },     // Cache'lenir
  { role: 'user', content: userQuestion },        // Değişken
]
```

### 3. Cache TTL'i Göz Önünde Bulundurun

- Anthropic: 5 dakika TTL
- OpenAI: Değişken
- Cache süresi dolunca yeniden yazılır

## Minimum Token Gereksinimleri

| Model             | Min. Token |
| ----------------- | ---------- |
| Claude 3.5 Sonnet | 1024       |
| Claude 3 Opus     | 1024       |
| GPT-4o            | 1024       |

## Monitoring

Cache performansını izlemek için:

```typescript
// Response'dan cache bilgisi
const cachedTokens = response.usage?.prompt_tokens_details?.cached_tokens || 0;
const totalPromptTokens = response.usage?.prompt_tokens || 0;
const cacheHitRate = cachedTokens / totalPromptTokens;

console.log(`Cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`);
```
