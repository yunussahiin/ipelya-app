# VisionCamera Geliştirme Planı ve TODO List

## 📁 Modüler Yapı (Tamamlandı ✅)

```
VisionCamera/
├── index.tsx              # Export barrel
├── VisionCamera.tsx       # Ana component (~350 satır)
├── types.ts               # Tip tanımlamaları + UI_TEXTS
└── components/
    ├── index.ts           # Component exports
    ├── TopControls.tsx    # Üst kontroller (X, Flash)
    ├── BottomControls.tsx # Alt kontroller wrapper
    ├── ModeSelector.tsx   # Fotoğraf/Video seçici (Türkçe)
    ├── CaptureButton.tsx  # Yakalama butonu
    ├── FlipCameraButton.tsx # Kamera çevirme
    ├── RecordingIndicator.tsx # Kayıt göstergesi
    ├── ZoomIndicator.tsx  # Zoom göstergesi
    ├── PermissionView.tsx # İzin ekranı (Türkçe)
    └── LoadingView.tsx    # Yükleme ekranı (Skeleton)
```

---

## ✅ Tamamlanan İşler

### 1. Modüler Yapı
- [x] Component'leri ayrı dosyalara böl
- [x] types.ts oluştur
- [x] UI_TEXTS Türkçe metinler ekle
- [x] Export barrel (index.ts) oluştur

### 2. Türkçe UI
- [x] ModeSelector'da "Fotoğraf" / "Video" etiketleri
- [x] Flash Auto için "A" + Zap ikonu
- [x] PermissionView Türkçe metinler
- [x] LoadingView Türkçe metin

### 3. Skeleton Loading
- [x] ActivityIndicator yerine Skeleton animasyonu
- [x] Pulse effect (0.3 - 0.7 opacity)

### 4. Animasyonlar
- [x] CaptureButton pulse animasyonu (kayıt sırasında)
- [x] FlipCameraButton döndürme animasyonu
- [x] RecordingIndicator pulse animasyonu

---

## 📋 TODO List (Öncelik Sırasına Göre)

### 🔴 Öncelik 1: Pause/Resume/Cancel Recording
**Durum:** ⏳ Bekliyor
**Zorluk:** Orta
**Süre:** 1 saat

**Yapılacaklar:**
- [ ] `isPaused` state ekle
- [ ] `pauseRecording()` fonksiyonu ekle
- [ ] `resumeRecording()` fonksiyonu ekle
- [ ] `cancelRecording()` fonksiyonu ekle
- [ ] RecordingIndicator'a pause/resume butonları ekle
- [ ] RecordingIndicator'a cancel butonu ekle
- [ ] Haptic feedback ekle

**Dosyalar:**
- `VisionCamera.tsx` - State ve fonksiyonlar
- `RecordingIndicator.tsx` - UI güncellemesi
- `types.ts` - RecordingIndicatorProps güncelle

---

### 🔴 Öncelik 2: Exposure Kontrolü
**Durum:** ⏳ Bekliyor
**Zorluk:** Orta
**Süre:** 2 saat

**Yapılacaklar:**
- [ ] `exposure` state ekle
- [ ] Animated props'a exposure ekle
- [ ] Vertical swipe gesture ekle
- [ ] ExposureIndicator component oluştur
- [ ] Sun ikonu ile göster

**Dosyalar:**
- `VisionCamera.tsx` - State ve gesture
- `components/ExposureIndicator.tsx` - Yeni component
- `types.ts` - ExposureIndicatorProps ekle

---

### 🟡 Öncelik 3: Video Stabilization Seçimi
**Durum:** ⏳ Bekliyor
**Zorluk:** Kolay
**Süre:** 30dk

**Yapılacaklar:**
- [ ] `videoStabilization` prop ekle
- [ ] Format seçiminde kullan
- [ ] Settings modal oluştur (opsiyonel)

**Dosyalar:**
- `VisionCamera.tsx` - Prop ve format
- `types.ts` - VisionCameraProps güncelle

---

### 🟡 Öncelik 4: Photo Quality Balance
**Durum:** ⏳ Bekliyor
**Zorluk:** Kolay
**Süre:** 15dk

**Yapılacaklar:**
- [ ] `photoQuality` prop ekle
- [ ] Camera component'e `photoQualityBalance` prop'u ekle

**Dosyalar:**
- `VisionCamera.tsx` - Prop
- `types.ts` - VisionCameraProps güncelle

---

### 🟡 Öncelik 5: Error Handling İyileştirmesi
**Durum:** ⏳ Bekliyor
**Zorluk:** Kolay
**Süre:** 30dk

**Yapılacaklar:**
- [ ] `handleCameraError` fonksiyonu ekle
- [ ] Error code'lara göre Türkçe mesajlar
- [ ] Alert.alert ile kullanıcıya göster
- [ ] UI_TEXTS'e hata mesajları ekle (zaten var)

**Dosyalar:**
- `VisionCamera.tsx` - Error handler
- `types.ts` - UI_TEXTS (zaten var)

---

### 🟢 Öncelik 6: Snapshot Desteği
**Durum:** ⏳ Bekliyor
**Zorluk:** Kolay
**Süre:** 30dk

**Yapılacaklar:**
- [ ] `takeSnapshot()` fonksiyonu ekle
- [ ] Double-tap gesture ekle (opsiyonel)
- [ ] Video kaydı sırasında fotoğraf çekme (opsiyonel)

**Dosyalar:**
- `VisionCamera.tsx` - Fonksiyon

---

### 🟢 Öncelik 7: Location Metadata
**Durum:** ⏳ Bekliyor
**Zorluk:** Kolay
**Süre:** 30dk

**Yapılacaklar:**
- [ ] `useLocationPermission` hook ekle
- [ ] `enableLocation` prop ekle
- [ ] Camera'ya `enableLocation` prop'u geç

**Dosyalar:**
- `VisionCamera.tsx` - Permission ve prop
- `types.ts` - VisionCameraProps güncelle

---

### 🟢 Öncelik 8: Orientation Kontrolü
**Durum:** ⏳ Bekliyor
**Zorluk:** Orta
**Süre:** 1 saat

**Yapılacaklar:**
- [ ] `outputOrientation` state ekle
- [ ] `uiRotation` state ekle
- [ ] Camera callbacks ekle
- [ ] UI rotation animasyonu

**Dosyalar:**
- `VisionCamera.tsx` - State ve callbacks

---

## ❌ Kapsam Dışı (Şimdilik)

- QR/Barcode Tarama (gerekli değil)
- Frame Processors (gerekli değil)
- External Camera desteği (gerekli değil)

---

## 🧪 Test Planı

### Manuel Testler (Simulator/Device)

#### Fotoğraf Modu
- [ ] Fotoğraf çekme çalışıyor mu?
- [ ] Flash off/on/auto geçişi çalışıyor mu?
- [ ] Ön/arka kamera geçişi çalışıyor mu?
- [ ] Zoom (pinch) çalışıyor mu?
- [ ] Focus (tap) çalışıyor mu?
- [ ] Haptic feedback çalışıyor mu?

#### Video Modu
- [ ] Video kaydı başlıyor mu?
- [ ] Video kaydı duruyor mu?
- [ ] Kayıt süresi göstergesi çalışıyor mu?
- [ ] Max duration'da otomatik duruyor mu?
- [ ] Flash (torch) çalışıyor mu?

#### UI/UX
- [ ] "Fotoğraf" / "Video" etiketleri görünüyor mu?
- [ ] Flash Auto "A" ikonu görünüyor mu?
- [ ] İzin ekranı Türkçe mi?
- [ ] Loading ekranı Skeleton animasyonu mu?
- [ ] Zoom göstergesi (1.0x) görünüyor mu?

#### Animasyonlar
- [ ] CaptureButton pulse animasyonu çalışıyor mu?
- [ ] FlipCameraButton döndürme animasyonu çalışıyor mu?
- [ ] RecordingIndicator pulse animasyonu çalışıyor mu?

#### Kullanım Yerleri
- [ ] StoryCreator'da çalışıyor mu?
- [ ] ReelsCreator'da çalışıyor mu?

---

## 📊 İlerleme Durumu

| Kategori | Tamamlanan | Toplam | Yüzde |
|----------|------------|--------|-------|
| Modüler Yapı | 4 | 4 | 100% |
| Türkçe UI | 4 | 4 | 100% |
| Skeleton Loading | 1 | 1 | 100% |
| Animasyonlar | 3 | 3 | 100% |
| Pause/Resume | 0 | 6 | 0% |
| Exposure | 0 | 4 | 0% |
| Video Stabilization | 0 | 2 | 0% |
| Photo Quality | 0 | 2 | 0% |
| Error Handling | 0 | 4 | 0% |
| **TOPLAM** | **12** | **30** | **40%** |

---

## 🚀 Sonraki Adımlar

1. **Test Et:** Mevcut değişiklikleri test et
2. **Pause/Resume:** En önemli eksik özellik
3. **Exposure:** Kullanıcı deneyimini iyileştirir
4. **Error Handling:** Hata durumlarını yönet
