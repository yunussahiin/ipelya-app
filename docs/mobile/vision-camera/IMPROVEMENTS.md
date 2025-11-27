# VisionCamera Geliştirme Planı

> **Kaynak:** [react-native-vision-camera docs](https://react-native-vision-camera.com/docs/guides)

## 📁 Modüler Yapı

```
VisionCamera/
├── index.tsx              # Export barrel
├── VisionCamera.tsx       # Ana component (~400 satır)
├── types.ts               # Tip tanımlamaları + UI_TEXTS
└── components/
    ├── index.ts           # Component exports
    ├── TopControls.tsx    # Üst kontroller (X, Flash, HDR)
    ├── BottomControls.tsx # Alt kontroller wrapper
    ├── ModeSelector.tsx   # Fotoğraf/Video seçici
    ├── CaptureButton.tsx  # Yakalama butonu
    ├── FlipCameraButton.tsx # Kamera çevirme
    ├── RecordingIndicator.tsx # Kayıt göstergesi + Pause/Resume/Cancel
    ├── ZoomIndicator.tsx  # Zoom butonları (0.5x, 1x, 2x)
    ├── PermissionView.tsx # İzin ekranı (Türkçe)
    └── LoadingView.tsx    # Yükleme ekranı (Skeleton)
```

---

## ✅ Tamamlanan Özellikler

### Temel Özellikler
- [x] Fotoğraf çekme (`takePhoto()`)
- [x] Video kayıt (`startRecording()` / `stopRecording()`)
- [x] Pause/Resume/Cancel Recording
- [x] Ön/arka kamera geçişi
- [x] Flash kontrolü (off/on/auto)
- [x] Torch (video modunda)
- [x] Tap-to-focus + Focus göstergesi (sarı kare)
- [x] Pinch-to-zoom
- [x] Zoom butonları (0.5x, 1x, 2x)
- [x] HDR toggle (destekleniyorsa)
- [x] Video stabilization (cinematic)
- [x] Low light boost (destekleniyorsa)
- [x] Haptic feedback
- [x] Exposure kontrolü (vertical swipe)
- [x] Snapshot (video sırasında fotoğraf)
- [x] H.265 video codec
- [x] Photo quality balance (quality mode)
- [x] Türkçe hata mesajları

### UI/UX
- [x] Türkçe arayüz
- [x] Skeleton loading
- [x] Animasyonlar (pulse, rotate)
- [x] Kayıt süresi göstergesi
- [x] Debug logging
- [x] Focus göstergesi (sarı kare animasyonu)
- [x] Exposure göstergesi (sun ikonu + slider)

### Entegrasyonlar
- [x] ChatScreen MediaPicker
- [x] StoryCreator
- [x] ReelsCreator

---

## 📋 TODO List (Kalan İşler)

### ✅ Orientation Kontrolü (Tamamlandı)
- [x] `outputOrientation="device"` prop eklendi
- [x] `onUIRotationChanged` callback eklendi

### 🟢 Opsiyonel: Location Metadata
**Durum:** ⏳ Bekliyor | **Zorluk:** Kolay | **Süre:** 30dk

**Dokümantasyon:** [Location Guide](https://react-native-vision-camera.com/docs/guides/location)

```tsx
<Camera enableLocation={true} />
// Otomatik olarak EXIF/QuickTime tag'lerine GPS ekler
```

**Yapılacaklar:**
- [ ] `enableLocation` prop ekle (opsiyonel - kullanıcı izni gerektirir)
- [ ] Location permission kontrolü
- [ ] Settings'e konum seçeneği

---

## 📚 VisionCamera API Referansı

### Device Özellikleri
| Özellik                       | Açıklama             |
| ----------------------------- | -------------------- |
| `hasFlash`                    | Flash desteği        |
| `hasTorch`                    | Torch desteği        |
| `supportsFocus`               | Tap-to-focus desteği |
| `supportsLowLightBoost`       | Gece modu desteği    |
| `minZoom` / `maxZoom`         | Zoom aralığı         |
| `neutralZoom`                 | 1x zoom değeri       |
| `minExposure` / `maxExposure` | Exposure aralığı     |

### Format Özellikleri
| Özellik                      | Açıklama              |
| ---------------------------- | --------------------- |
| `supportsPhotoHdr`           | Photo HDR desteği     |
| `supportsVideoHdr`           | Video HDR desteği     |
| `videoStabilizationModes`    | Stabilizasyon modları |
| `maxFps`                     | Maksimum FPS          |
| `photoWidth` / `photoHeight` | Fotoğraf çözünürlüğü  |
| `videoWidth` / `videoHeight` | Video çözünürlüğü     |

### Camera Props
| Prop                     | Tip                     | Açıklama             |
| ------------------------ | ----------------------- | -------------------- |
| `device`                 | CameraDevice            | Kamera cihazı        |
| `isActive`               | boolean                 | Kamera aktif mi      |
| `photo`                  | boolean                 | Fotoğraf modu        |
| `video`                  | boolean                 | Video modu           |
| `audio`                  | boolean                 | Ses kaydı            |
| `zoom`                   | number                  | Zoom seviyesi        |
| `exposure`               | number                  | Pozlama              |
| `torch`                  | 'off' \| 'on'           | Torch durumu         |
| `flash`                  | 'off' \| 'on' \| 'auto' | Flash durumu         |
| `photoHdr`               | boolean                 | Photo HDR            |
| `videoHdr`               | boolean                 | Video HDR            |
| `lowLightBoost`          | boolean                 | Gece modu            |
| `videoStabilizationMode` | string                  | Video stabilizasyonu |
| `enableZoomGesture`      | boolean                 | Native zoom gesture  |
| `enableLocation`         | boolean                 | GPS metadata         |
| `outputOrientation`      | string                  | Çıktı yönü           |
| `isMirrored`             | boolean                 | Ayna efekti          |
| `photoQualityBalance`    | string                  | Fotoğraf kalitesi    |

---

## 📊 İlerleme Durumu

| Kategori             | Tamamlanan | Toplam | Yüzde   |
| -------------------- | ---------- | ------ | ------- |
| Temel Özellikler     | 19         | 19     | 100%    |
| UI/UX                | 7          | 7      | 100%    |
| Entegrasyonlar       | 3          | 3      | 100%    |
| Orientation          | 2          | 2      | 100%    |
| Location (opsiyonel) | 0          | 3      | 0%      |
| **TOPLAM**           | **31**     | **34** | **91%** |

---

## 🎉 Tamamlanan Özellikler

VisionCamera component'i artık tam özellikli:

- ✅ Fotoğraf/Video çekme
- ✅ Pause/Resume/Cancel Recording
- ✅ Flash/Torch kontrolü
- ✅ Ön/arka kamera geçişi
- ✅ Pinch-to-zoom + Zoom butonları (0.5x, 1x, 2x)
- ✅ Tap-to-focus + Focus göstergesi
- ✅ HDR toggle
- ✅ Video stabilization (cinematic)
- ✅ Low light boost
- ✅ Snapshot (video sırasında fotoğraf)
- ✅ H.265 video codec
- ✅ Photo quality balance
- ✅ Türkçe hata mesajları
- ✅ Orientation kontrolü
- ✅ Preview Sistemi
- ✅ PGMQ Media Processing

---

## 📋 Sonraki Adımlar (Görsel İşleme + PGMQ)

> Detaylı dokümantasyon: [IMAGE-PROCESSING.md](./IMAGE-PROCESSING.md)

### Faz 1: Preview Sistemi ✅
- [x] Fotoğraf preview ekranı (MediaPreview + Skia)
- [x] Video preview ekranı (expo-video)
- [x] Onay/Tekrar çek butonları
- [x] Video thumbnail (generateThumbnailsAsync)

### Faz 2: PGMQ Media Processing 🔄 (Aktif)

> **Strateji:** Raw Upload → Instant Display → Background Optimize

#### 2.1 Queue Altyapısı ✅
- [x] `media_processing_queue` oluştur (SQL)
- [x] `video_transcoding_queue` oluştur (SQL)
- [x] `thumbnail_generation_queue` oluştur (SQL)

#### 2.2 Media Worker Edge Function ✅
- [x] `media-worker` edge function oluştur
- [x] Image optimize işlemi (resize + compress)
- [x] Video transcode işlemi (placeholder - harici servis gerekli)
- [x] Queue mesaj silme (başarılı işlem sonrası)
- [x] Retry mekanizması (visibility timeout: 60s)
- [x] DB migration: `is_optimized`, `optimization_info` kolonları

#### 2.3 Client Entegrasyonu ✅
- [x] `queueMediaProcessing()` helper fonksiyonu
- [x] `uploadMediaWithOptimization()` kombine fonksiyon
- [x] `triggerMediaWorker()` manuel tetikleme
- [x] Chat upload'a PGMQ entegre et
- [ ] Post upload'a PGMQ entegre et (sonra)
- [ ] Profil foto upload'a PGMQ entegre et (sonra)

#### 2.4 Test & Dokümantasyon ✅
- [x] Queue'ları test et (pgmq.send, pgmq.read, pgmq.delete)
- [x] Worker deploy edildi (media-worker)
- [ ] End-to-end test (upload → optimize → verify) - Manuel test gerekli
- [x] Sistem dokümantasyonu yaz

### Faz 3: Skia Entegrasyonu ✅
- [ ] Profil fotoğrafı cropper (circular - bunu uygun componentte sonra yapacağız)
- [x] Temel filtreler (11 preset: Original, Vivid, Warm, Cool, Dramatic, Vintage, Sepia, Grayscale, Fade, Noir, Bright)
- [x] Brightness/Contrast/Saturation ayarları
- [x] Canvas export (filtrelenmiş görüntü kaydetme)
- [x] Filter preview (live thumbnail önizleme)
- [x] ColorMatrix ile real-time filtre uygulama
- [x] Persistent camera settings (flash, HDR, camera position - AsyncStorage)
- [x] Instagram-style UI layout (Retake sol üst, Confirm sağ üst)

### Faz 4: Gelişmiş Skia Özellikleri (Opsiyonel)
> 📚 Detaylı dokümantasyon: [SKIA-EFFECTS.md](./SKIA-EFFECTS.md)

#### Yüksek Öncelik (Kolay - 1-2 saat)
- [x] **Vignette** - Kenar karartma efekti (custom SKSL shader) ✅
- [x] **Backdrop Blur** - Fotoğrafın bir kısmını bulanıklaştırma (Instagram story tarzı) ✅
- [ ] **Circular Crop** - Profil fotoğrafı için dairesel kesme (Mask/Group clip)

#### Orta Öncelik (Orta - 2-4 saat)
- [x] **Gradient Overlay** - Text okunabilirliği için alt gradient ✅
- [ ] **Image Blur** - Tilt-shift, bokeh efekti
- [ ] **Shadows** - Inner/outer shadow, neumorphism

#### Düşük Öncelik (Zor - 4+ saat)
- [ ] **Custom Shaders (SKSL)** - Wave, glitch, distortion efektleri
- [ ] **Animated Gradients** - Shimmer, gradient animasyonları
- [x] **Text Overlay** - Instagram tarzı metin editörü (font stilleri, renk, slider ile boyut, keyboard-aware) ✅
- [ ] **Stickers/Stamps** - Görüntü üzerine sticker ekleme

#### Sonra Yapılacak
- [ ] Location metadata

### Platform Boyut Standartları (optimizasyon sırasında yapıyoruz galiba)
| Tip         | Boyut       | Oran |
| ----------- | ----------- | ---- |
| Kare        | 1080 × 1080 | 1:1  |
| Portrait    | 1080 × 1350 | 4:5  |
| Story/Reels | 1080 × 1920 | 9:16 |

---

## 📊 Faz 2 İlerleme Durumu

| Görev                | Durum        |
| -------------------- | ------------ |
| Queue Altyapısı      | ✅ Tamamlandı |
| Media Worker         | ✅ Tamamlandı |
| Client Entegrasyonu  | ✅ Tamamlandı |
| Cron Job             | ✅ Tamamlandı |
| Test & Dokümantasyon | ✅ Tamamlandı |

---

## 📁 Media Optimization Dokümantasyonu

Detaylı dokümantasyon: [media-optimization/](./media-optimization/)

| Dosya                                                               | Açıklama                |
| ------------------------------------------------------------------- | ----------------------- |
| [README.md](./media-optimization/README.md)                         | Genel bakış ve mimari   |
| [EDGE-FUNCTIONS.md](./media-optimization/EDGE-FUNCTIONS.md)         | Edge Function detayları |
| [QUEUE-SYSTEM.md](./media-optimization/QUEUE-SYSTEM.md)             | PGMQ yapılandırması     |
| [IMAGE-SETTINGS.md](./media-optimization/IMAGE-SETTINGS.md)         | Optimizasyon ayarları   |
| [CRON-JOBS.md](./media-optimization/CRON-JOBS.md)                   | Cron job yapılandırması |
| [CLIENT-INTEGRATION.md](./media-optimization/CLIENT-INTEGRATION.md) | Client entegrasyonu     |

### Sistem Özeti (v12 - Final)

- **Edge Functions:** `queue-media-job` (v3), `media-worker` (v12)
- **Queue:** `media_processing_queue` (PGMQ)
- **Cron:** Her 30 saniye (Supabase Dashboard)
- **ImageMagick:** `@imagemagick/magick-wasm@0.0.30`
- **Tipik Tasarruf:** %50-70
- **Auto-Orient:** ✅ EXIF rotation fix
- **Çözünürlük:** 1920px (Full HD) - chat preset
- **Oran Koruma:** ✅ Crop yok, sadece resize
- **EXIF Strip:** ✅ Konum/cihaz bilgisi temizleniyor

### Test Sonuçları (27 Kasım 2025)

| Çekim     | Orijinal  | Optimized | Oran             | Tasarruf |
| --------- | --------- | --------- | ---------------- | -------- |
| **Dikey** | 1188×2112 | 1188×2112 | story (9:16)     | %56      |
| **Yatay** | 2112×1188 | 1920×1080 | landscape (16:9) | %63      |

### Versiyon Geçmişi

**media-worker:**
- v12 (FINAL) - Auto-Orient fix, 1920px Full HD
- v11 - Yüksek çözünürlük denemesi
- v10 - Platform standartlarına crop (geri alındı)
- v9 - Platform standartları, preset desteği

**queue-media-job:**
- v3 (FINAL) - Options gönderme kaldırıldı
- v2 - Preset desteği
- v1 - İlk versiyon
