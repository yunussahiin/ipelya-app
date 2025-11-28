# Provider Routing

> OpenRouter'ın model isteklerini farklı provider'lara yönlendirme mekanizması.

## Genel Bakış

OpenRouter, aynı modeli birden fazla provider üzerinden sunabilir. Provider routing, isteklerin hangi provider'a gideceğini kontrol etmenizi sağlar.

## Provider Seçimi

### Otomatik Routing (Varsayılan)

OpenRouter varsayılan olarak en uygun provider'ı seçer:
- Fiyat
- Latency
- Availability
- Rate limits

### Manuel Provider Seçimi

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [...],
    provider: {
      // Belirli provider'ları tercih et
      order: ['OpenAI', 'Azure'],
      // Veya belirli provider'ları hariç tut
      ignore: ['Together'],
      // Sadece belirli provider'ları kullan
      allow_fallbacks: true,
    },
  }),
});
```

## Provider Parametreleri

| Parametre            | Tip      | Açıklama                                       |
| -------------------- | -------- | ---------------------------------------------- |
| `order`              | string[] | Tercih sırasına göre provider listesi          |
| `ignore`             | string[] | Hariç tutulacak provider'lar                   |
| `allow_fallbacks`    | boolean  | Fallback'lere izin ver (varsayılan: true)      |
| `require_parameters` | boolean  | Tüm parametrelerin desteklenmesini zorunlu kıl |

## Mevcut Provider'lar

| Provider  | Modeller                     |
| --------- | ---------------------------- |
| OpenAI    | GPT-4, GPT-4o, GPT-3.5       |
| Anthropic | Claude 3.5, Claude 3         |
| Google    | Gemini 2.0, Gemini 1.5       |
| Meta      | Llama 3.3, Llama 3.2         |
| Mistral   | Mistral Large, Mistral Small |
| Together  | Çeşitli open-source modeller |
| Fireworks | Çeşitli open-source modeller |
| DeepInfra | Çeşitli open-source modeller |

## Kullanım Senaryoları

### 1. Düşük Latency

```typescript
provider: {
  order: ['Fireworks', 'Together', 'DeepInfra'],
  allow_fallbacks: true,
}
```

### 2. Maliyet Optimizasyonu

```typescript
provider: {
  order: ['DeepInfra', 'Together', 'Fireworks'],
  allow_fallbacks: true,
}
```

### 3. Belirli Provider Zorunluluğu

```typescript
provider: {
  order: ['OpenAI'],
  allow_fallbacks: false,
}
```

## API Endpoint: Provider Listesi

```
GET https://openrouter.ai/api/v1/models/{model_id}/endpoints
```

Bu endpoint, belirli bir model için mevcut provider'ları listeler.

## Best Practices

1. **Fallback'leri Aktif Tut**: `allow_fallbacks: true` ile availability artırın
2. **Latency İçin Test Edin**: Farklı provider'ları test edip en hızlısını bulun
3. **Maliyet Takibi**: Provider bazlı maliyet farklarını izleyin
4. **Rate Limit Dağılımı**: Yoğun kullanımda birden fazla provider kullanın
