# İpelya PGMQ Media Processing System

> Arka plan medya optimizasyonu için PGMQ tabanlı async işleme sistemi

**Son Güncelleme:** 2025-11-27

---

## 📋 Genel Bakış

Bu sistem, kullanıcı deneyimini iyileştirmek için medya dosyalarını (fotoğraf/video) arka planda optimize eder.

### Temel Prensip

```
Raw Upload (hızlı) → Kullanıcı HEMEN görür → PGMQ Job → Worker optimize eder
```

### Avantajlar

| Önceki (Senkron)          | Şimdi (PGMQ Async)           |
| ------------------------- | ---------------------------- |
| ❌ Kullanıcı 5-10sn bekler | ✅ Kullanıcı hemen devam eder |
| ❌ Timeout riski           | ✅ Retry mekanizması          |
| ❌ UI donabilir            | ✅ Smooth UX                  |
| ❌ Scale sorunu            | ✅ Worker ekleyerek ölçekle   |

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                    PGMQ MEDIA PROCESSING                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 Mobile App                                                   │
│       │                                                          │
│       │ 1. uploadMedia() - Raw file upload                      │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Supabase Storage (message-media bucket)                 │    │
│  │  • userId/timestamp_random.jpg                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       │ 2. queueMediaProcessing() - Job gönder                  │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PGMQ: media_processing_queue                            │    │
│  │  {                                                       │    │
│  │    job_type: "image_optimize",                          │    │
│  │    user_id: "xxx",                                      │    │
│  │    source_path: "xxx/photo.jpg",                        │    │
│  │    options: { width: 1080, quality: 0.8 }               │    │
│  │  }                                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       │ 3. Worker process (Cron veya manuel trigger)            │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Edge Function: media-worker                             │    │
│  │  • Queue'dan mesaj oku                                   │    │
│  │  • Dosyayı indir                                         │    │
│  │  • Optimize et (resize, compress)                        │    │
│  │  • DB güncelle (is_optimized: true)                      │    │
│  │  • Queue mesajını sil                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Bileşenler

### 1. PGMQ Queue'ları

```sql
-- Oluşturulan queue'lar
SELECT pgmq.create('media_processing_queue');      -- Fotoğraf optimize
SELECT pgmq.create('video_transcoding_queue');     -- Video dönüştürme
SELECT pgmq.create('thumbnail_generation_queue');  -- Thumbnail oluşturma
```

### 2. Database Kolonları

```sql
-- messages tablosuna eklenen kolonlar
ALTER TABLE messages 
ADD COLUMN is_optimized BOOLEAN DEFAULT FALSE,
ADD COLUMN optimization_info JSONB DEFAULT NULL;

-- Index
CREATE INDEX idx_messages_not_optimized 
ON messages (is_optimized) 
WHERE is_optimized = FALSE AND media_url IS NOT NULL;
```

### 3. Edge Function: media-worker

**Konum:** Supabase Edge Functions (deploy edildi)

**Özellikler:**
- Queue'dan batch mesaj okuma (5 mesaj/çağrı)
- Visibility timeout: 60 saniye
- Retry mekanizması (timeout sonrası otomatik)
- Job tipine göre işleme (image_optimize, video_transcode)

### 4. Client Helper Fonksiyonları

**Dosya:** `apps/mobile/src/services/media-upload.service.ts`

```typescript
// Queue'ya job gönder
queueMediaProcessing(userId, sourcePath, accessToken, messageId?, options?)

// Upload + Queue kombine
uploadMediaWithOptimization(uri, userId, bucket, accessToken, messageId?, options?)

// Worker'ı manuel tetikle
triggerMediaWorker(accessToken)
```

---

## 🔧 Kullanım

### Chat'te Medya Gönderme

```typescript
// GiftedChatScreen.tsx
import { uploadMedia, queueMediaProcessing } from "@/services/media-upload.service";

// 1. Raw upload (hızlı)
const result = await uploadMedia(media.uri, user.id, "message-media", accessToken);

// 2. Mesajı hemen göster
handleSend([mediaMessage]);

// 3. Arka planda optimize (non-blocking)
queueMediaProcessing(
  user.id,
  result.path,
  accessToken,
  undefined,
  { width: 1080, quality: 0.8 }
).then((queueResult) => {
  console.log("Optimization queued:", queueResult.queued);
});
```

### Worker'ı Tetikleme

```typescript
// Manuel tetikleme (test için)
const result = await triggerMediaWorker(accessToken);
console.log("Processed:", result.processed, "Failed:", result.failed);
```

### Queue Durumunu Kontrol

```sql
-- Tüm queue'ların metrikleri
SELECT * FROM pgmq.metrics_all();

-- Belirli queue'daki mesajlar
SELECT * FROM pgmq.read('media_processing_queue', 0, 10);
```

---

## 📊 Job Formatı

### Image Optimize Job

```json
{
  "job_type": "image_optimize",
  "user_id": "uuid",
  "source_path": "userId/timestamp_random.jpg",
  "message_id": "uuid (opsiyonel)",
  "options": {
    "width": 1080,
    "height": null,
    "quality": 0.8,
    "format": "jpeg"
  },
  "created_at": "2025-11-27T00:00:00.000Z"
}
```

### Video Transcode Job

```json
{
  "job_type": "video_transcode",
  "user_id": "uuid",
  "source_path": "userId/timestamp_random.mp4",
  "message_id": "uuid (opsiyonel)",
  "options": {
    "width": 1080,
    "quality": 0.8
  },
  "created_at": "2025-11-27T00:00:00.000Z"
}
```

---

## ⚠️ Önemli Notlar

### 1. Edge Function Sınırlamaları

Edge Function'da Sharp gibi native image processing kütüphaneleri kullanılamaz. Gerçek image processing için:

- **Seçenek 1:** Cloudinary, imgproxy gibi harici servis
- **Seçenek 2:** Supabase Storage Transform (built-in)
- **Seçenek 3:** Ayrı bir Node.js worker (Docker)

Şu anki implementasyon:
- Dosya boyutunu kontrol eder
- 500KB altı dosyaları skip eder
- DB'yi `is_optimized: true` olarak günceller
- Gerçek resize/compress harici servise bırakılabilir

### 2. Retry Mekanizması

- Visibility timeout: 60 saniye
- Job başarısız olursa mesaj silinmez
- Timeout sonrası mesaj tekrar görünür olur
- Worker tekrar işlemeyi dener

### 3. Dead Letter Queue (DLQ)

Şu an DLQ yok. İleride eklenebilir:

```sql
SELECT pgmq.create('media_processing_dlq');
```

---

## 🧪 Test

### Queue Test

```sql
-- Test mesajı gönder
SELECT pgmq.send('media_processing_queue', '{"job_type": "image_optimize", "user_id": "test"}'::jsonb);

-- Mesajı oku
SELECT * FROM pgmq.read('media_processing_queue', 0, 1);

-- Mesajı sil
SELECT pgmq.delete('media_processing_queue', 1);
```

### Worker Test

```bash
# cURL ile worker'ı tetikle
curl -X POST https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/media-worker \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📈 Gelecek İyileştirmeler

- [ ] Cron job ile otomatik worker tetikleme
- [ ] Dead Letter Queue (DLQ) ekleme
- [ ] Cloudinary/imgproxy entegrasyonu
- [ ] Video transcoding (FFmpeg)
- [ ] Progress tracking (realtime)
- [ ] Batch processing optimization

---

## 📚 İlgili Dosyalar

| Dosya                                              | Açıklama                       |
| -------------------------------------------------- | ------------------------------ |
| `apps/mobile/src/services/media-upload.service.ts` | Client helper fonksiyonları    |
| `supabase/functions/media-worker/index.ts`         | Edge function (MCP ile deploy) |
| `docs/mobile/vision-camera/IMAGE-PROCESSING.md`    | Görsel işleme pipeline         |
| `docs/mobile/vision-camera/Supabase-Queuses.md`    | PGMQ API referansı             |
| `docs/pgmq-system/pgmq-system-docs.md`             | PGMQ sistem dokümantasyonu     |
