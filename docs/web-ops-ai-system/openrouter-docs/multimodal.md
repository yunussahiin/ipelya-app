# Multimodal

> OpenRouter ile görsel, ses ve video içerikli istekler gönderin.

## Genel Bakış

Multimodal modeller, metin dışında görsel, ses ve video içeriklerini de işleyebilir. OpenRouter, bu modellere tek bir API üzerinden erişim sağlar.

## Desteklenen Modaliteler

| Modalite | Giriş | Çıkış             |
| -------- | ----- | ----------------- |
| Text     | ✅     | ✅                 |
| Image    | ✅     | ✅ (bazı modeller) |
| Audio    | ✅     | ✅ (bazı modeller) |
| Video    | ✅     | ❌                 |

## Vision (Görsel) Modelleri

### Destekleyen Modeller

| Model             | Vision | Image Output |
| ----------------- | ------ | ------------ |
| GPT-4o            | ✅      | ❌            |
| GPT-4 Vision      | ✅      | ❌            |
| Claude 3.5 Sonnet | ✅      | ❌            |
| Claude 3 Opus     | ✅      | ❌            |
| Gemini 2.0 Flash  | ✅      | ✅            |
| Gemini 1.5 Pro    | ✅      | ❌            |
| Llama 3.2 Vision  | ✅      | ❌            |

### Görsel Gönderme

#### Base64 Encoding

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
        content: [
          {
            type: 'text',
            text: 'Bu görselde ne var?'
          },
          {
            type: 'image_url',
            image_url: {
              url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
              detail: 'high' // 'low', 'high', 'auto'
            }
          }
        ]
      }
    ],
  }),
});
```

#### URL ile Görsel

```typescript
{
  type: 'image_url',
  image_url: {
    url: 'https://example.com/image.jpg',
    detail: 'auto'
  }
}
```

### Görsel Detay Seviyeleri

| Seviye | Açıklama            | Token Kullanımı |
| ------ | ------------------- | --------------- |
| `low`  | 512x512 resize      | Düşük           |
| `high` | Orijinal çözünürlük | Yüksek          |
| `auto` | Model karar verir   | Değişken        |

## Audio (Ses) Modelleri

### Destekleyen Modeller

| Model            | Audio Input | Audio Output |
| ---------------- | ----------- | ------------ |
| GPT-4o Audio     | ✅           | ✅            |
| Gemini 2.0 Flash | ✅           | ✅            |

### Ses Gönderme

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o-audio-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Bu ses kaydını analiz et'
          },
          {
            type: 'input_audio',
            input_audio: {
              data: 'base64_encoded_audio...',
              format: 'wav' // 'wav', 'mp3', 'flac', 'webm'
            }
          }
        ]
      }
    ],
    modalities: ['text', 'audio'], // Çıktı modaliteleri
    audio: {
      voice: 'alloy', // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      format: 'wav'
    }
  }),
});
```

## Video Modelleri

### Destekleyen Modeller

| Model            | Video Input |
| ---------------- | ----------- |
| Gemini 2.0 Flash | ✅           |
| Gemini 1.5 Pro   | ✅           |

### Video Gönderme

```typescript
{
  type: 'video_url',
  video_url: {
    url: 'https://example.com/video.mp4'
  }
}
```

## Fiyatlandırma

### Görsel Token Hesaplama

| Çözünürlük | Yaklaşık Token |
| ---------- | -------------- |
| 512x512    | ~85            |
| 1024x1024  | ~170           |
| 2048x2048  | ~680           |

### Ses Token Hesaplama

- Yaklaşık 1 saniye = 25 token

## Best Practices

### 1. Görsel Optimizasyonu

```typescript
// Gereksiz yüksek çözünürlükten kaçının
image_url: {
  url: imageUrl,
  detail: 'low' // Basit görseller için yeterli
}
```

### 2. Batch İşleme

```typescript
// Birden fazla görsel tek istekte
content: [
  { type: 'text', text: 'Bu görselleri karşılaştır' },
  { type: 'image_url', image_url: { url: image1 } },
  { type: 'image_url', image_url: { url: image2 } },
]
```

### 3. Fallback Stratejisi

```typescript
// Vision desteklemeyen modele fallback
try {
  await callVisionModel(image);
} catch (error) {
  // Görsel açıklaması ile text model kullan
  await callTextModel(imageDescription);
}
```

## Limitler

| Model      | Max Görsel | Max Boyut |
| ---------- | ---------- | --------- |
| GPT-4o     | 10         | 20MB      |
| Claude 3.5 | 20         | 5MB       |
| Gemini 1.5 | 16         | 20MB      |

## Model Seçimi

Multimodal model seçerken:

```typescript
// Models API'den multimodal modelleri filtrele
const response = await fetch('https://openrouter.ai/api/v1/models');
const models = await response.json();

const visionModels = models.data.filter(m => 
  m.architecture?.input_modalities?.includes('image')
);
```
