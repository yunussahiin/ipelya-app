# 🗣️ Voice Skins (AI Ses Maskeleme) - Teknik Analiz ve Uygulama Rehberi

## 1. Vizyon ve Konsept
**"Sesin, en büyük biyometrik verindir. Onu maskele."**

Voice Skins, standart "pitch shift" (inceltme/kalınlaştırma) efektlerinin çok ötesindedir. Kullanıcının ses dalgalarını analiz eder ve gerçek zamanlı olarak (veya near-realtime) tamamen başka bir karakterin ses rengine (Timbre) dönüştürür. 

**Temel Vaat:** Bir erkek kullanıcı, ultra-gerçekçi bir "Anime Girl" veya "Cyberpunk Robot" sesiyle konuşabilir. Anonimlik %100 sağlanır.

---

## 2. Kullanıcı Deneyimi (UX)
1.  **Skin Seçimi:** Kullanıcı sohbete girmeden önce "Maskeler" menüsünden bir ses seçer (örn: *Deep Anonymous, Elf Archer, Titan*).
2.  **Konuşma:** Bas-Konuş (PTT) veya Audio Note kaydederken kendi sesiyle konuşur.
3.  **İşleme:** Sistem, sesi anlık olarak seçilen modele göre yeniden sentezler.
4.  **İletim:** Karşı tarafa giden ses dosyası, orijinal sesten tamamen arındırılmış, sentetik sestir.

---

## 3. Teknoloji Stack & Mimari

| Bileşen | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Model** | RVC (Retrieval-based Voice Conversion) | Şu an endüstri standardı. Düşük gecikme ve yüksek kalite. |
| **Mobile Inference** | `onnxruntime-react-native` | RVC modellerini (ONNX formatında) cihaz üzerinde çalıştırmak için. |
| **Audio Processing** | `react-native-audio-recorder-player` | Ham ses verisini (PCM) yakalamak için. |
| **Backend (Opsiyonel)** | Python (FastAPI) + GPU Worker | Eğer mobil işlemci yetersiz kalırsa, ses sunucuda işlenir (Daha yüksek kalite, hafif gecikme). |
| **Storage** | Supabase Storage | İşlenmiş ses notlarını saklar. |

---

## 4. Supabase Veritabanı Tasarımı

Kullanıcıların hangi Voice Skin'lere sahip olduğunu ve kullanım haklarını takip eder.

### Tablo: `voice_skins`
```sql
create table public.voice_skins (
  id text primary key, -- 'cyber_demon_v1', 'anime_girl_v2'
  name text not null,
  description text,
  preview_audio_url text, -- Örnek ses dosyası
  model_url text not null, -- .onnx veya .pth model dosyasının linki
  is_premium boolean default false
);
```

### Tablo: `user_skins`
```sql
create table public.user_skins (
  user_id uuid references auth.users(id),
  skin_id text references public.voice_skins(id),
  acquired_at timestamptz default now(),
  primary key (user_id, skin_id)
);
```

---

## 5. Implementasyon Senaryoları

İki yol haritamız var: **On-Device (Cihaz Üzerinde)** veya **Cloud-Based (Bulut Tabanlı)**.

### A. Cloud-Based (Hızlı MVP & Yüksek Kalite)
Mobil cihazlarda GPU yetersizliği riskine karşı en güvenli ve hızlı yöntem.

1.  Mobil, sesi `.wav` olarak kaydeder.
2.  Supabase Edge Function'a (veya özel GPU sunucusuna) upload eder: `POST /convert-voice`
3.  Sunucu RVC modelini çalıştırır, sesi dönüştürür.
4.  Dönen yeni ses dosyasını oynatır/gönderir.

**Gecikme:** ~2-3 saniye (Audio Note için kabul edilebilir, Realtime Call için değil).

#### Edge Function (Pseudo-Code)
```typescript
// supabase/functions/convert-voice/index.ts

serve(async (req) => {
  const { audioBase64, skinId } = await req.json();
  
  // Python GPU servisine yönlendir (Örn: Replicate veya kendi VPS'imiz)
  const output = await fetch('https://gpu-worker.ipelya.com/rvc', {
    method: 'POST',
    body: JSON.stringify({ audio: audioBase64, model: skinId })
  });

  return new Response(output.audio, { headers: { 'Content-Type': 'audio/wav' } });
});
```

### B. On-Device (Gerçek "High-Tech")
Eğer "Realtime Call" hedefliyorsak zorunludur. `onnxruntime` ve optimize edilmiş `.onnx` modelleri gerekir. TensorFlow Lite da bir alternatiftir.

```typescript
// apps/mobile/src/services/voice-processor.ts

import { InferenceSession } from 'onnxruntime-react-native';

export class VoiceProcessor {
  session: InferenceSession;

  async loadModel(modelUrl: string) {
    // Modeli indir ve belleğe al
    const modelPath = await downloadModel(modelUrl);
    this.session = await InferenceSession.create(modelPath);
  }

  async processAudioChunk(pcmData: Float32Array): Promise<Float32Array> {
    // Sesi tensöre çevir
    const tensor = new Tensor('float32', pcmData, [1, pcmData.length]);
    
    // Modelden geçir (Inference)
    const feeds = { input_audio: tensor };
    const results = await this.session.run(feeds);
    
    return results.output_audio.data as Float32Array;
  }
}
```

---

## 6. Güvenlik ve Gizlilik
*   **Deepfake Riski:** Bu teknoloji dolandırıcılık için kullanılabilir.
*   **Önlem:** Sistem tarafından üretilen tüm ses dosyalarına, duyulmayan bir **"Watermark" (Filigran)** frekansı eklenmelidir. Böylece sesin İpelya AI tarafından üretildiği analiz edilebilir.

## 7. Roadmap
1.  **Faz 1:** Cloud-Based Audio Note. (Bas-Konuş -> 3sn Bekle -> Gönder).
2.  **Faz 2:** On-Device Realtime. (Canlı sohbette anlık değişim - iOS CoreML / Android NNAPI entegrasyonu).
3.  **Faz 3:** Voice Cloning (Premium). Kullanıcının kendi sesinden özel model eğitip (1 dk kayıt ile) dijital ikizini oluşturması.
