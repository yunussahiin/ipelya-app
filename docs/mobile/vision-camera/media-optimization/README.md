# Media Optimization System

> **Son Güncelleme:** 27 Kasım 2025  
> **Versiyon:** v12 (Auto-Orient + High Resolution)

## Genel Bakış

Bu sistem, kullanıcıların yüklediği medya dosyalarını (fotoğraf/video) arka planda optimize eder. Supabase Edge Functions, PGMQ (PostgreSQL Message Queue) ve ImageMagick WASM kullanır.

### Özellikler

- ✅ **Auto-Orient** - iPhone EXIF rotation otomatik düzeltme
- ✅ **Yüksek Çözünürlük** - Chat için 1920px (Full HD)
- ✅ **Oran Koruma** - Crop yok, sadece resize
- ✅ **EXIF Strip** - Konum/cihaz bilgisi temizleme
- ✅ **Hızlı İşlem** - ~1.5 saniye
- ✅ **İyi Sıkıştırma** - %50-70 tasarruf

## Mimari

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Mobile    │───▶│  Raw Upload  │───▶│  PGMQ Queue     │───▶│ media-worker │
│  (Camera)   │    │  (Storage)   │    │  (PostgreSQL)   │    │ (Edge Func)  │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       │                  │                                          │
       ▼                  ▼                                          ▼
┌─────────────┐    ┌──────────────┐                          ┌──────────────┐
│ VisionCamera│    │  Mesaj hemen │                          │  Optimized   │
│  Component  │    │  görünür     │                          │  file üstüne │
└─────────────┘    └──────────────┘                          │  yazılır     │
                                                             └──────────────┘
```

## Bileşenler

| Bileşen                  | Açıklama                                          | Konum                                              |
| ------------------------ | ------------------------------------------------- | -------------------------------------------------- |
| **VisionCamera**         | Kamera component'i                                | `apps/mobile/src/components/camera/VisionCamera/`  |
| **media-upload.service** | Upload + Queue servisi                            | `apps/mobile/src/services/media-upload.service.ts` |
| **queue-media-job**      | Queue'ya job ekleyen Edge Function (v3)           | Supabase Edge Functions                            |
| **media-worker**         | ImageMagick ile optimize eden Edge Function (v12) | Supabase Edge Functions                            |
| **PGMQ**                 | PostgreSQL Message Queue                          | Supabase Database                                  |
| **Cron Job**             | Worker'ı tetikleyen zamanlayıcı                   | Supabase Cron (her 30 saniye)                      |

## Akış

1. **Kullanıcı fotoğraf çeker** (VisionCamera)
2. **Raw dosya upload edilir** (Supabase Storage) - ~1-2 saniye
3. **Mesaj hemen görünür** (Optimistic UI)
4. **Queue'ya job eklenir** (queue-media-job Edge Function)
5. **Cron tetikler** (Her 30 saniye) veya manuel tetikleme
6. **Worker optimize eder** (ImageMagick WASM) - ~1.5 saniye
   - Auto-orient (EXIF rotation fix)
   - Smart resize (oran koruma)
   - EXIF strip (privacy)
   - Quality ayarla
7. **Optimized dosya üzerine yazılır**
8. **DB güncellenir** (is_optimized, optimization_info)

## Test Sonuçları

| Çekim     | Orijinal  | Optimized | Oran             | Tasarruf |
| --------- | --------- | --------- | ---------------- | -------- |
| **Dikey** | 1188×2112 | 1188×2112 | story (9:16)     | %56      |
| **Yatay** | 2112×1188 | 1920×1080 | landscape (16:9) | %63      |

## Dosyalar

- [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md) - Edge Function detayları
- [QUEUE-SYSTEM.md](./QUEUE-SYSTEM.md) - PGMQ yapılandırması
- [IMAGE-SETTINGS.md](./IMAGE-SETTINGS.md) - Optimizasyon ayarları
- [CRON-JOBS.md](./CRON-JOBS.md) - Cron job yapılandırması
- [CLIENT-INTEGRATION.md](./CLIENT-INTEGRATION.md) - Client entegrasyonu
