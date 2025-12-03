# KYC VisionCamera Plugin Entegrasyonu TODO

> **Referans Dökümanlar:** 
> - [FACE-DETECTOR.md](./FACE-DETECTOR.md)
> - [OCR-PLUS.md](./OCR-PLUS.md)
> - [DOCUMENT-NORMALIZER.md](./DOCUMENT-NORMALIZER.md)

---

## Mevcut Durum

### Yüklü Paketler
| Paket                                         | Versiyon | Durumu                      |
| --------------------------------------------- | -------- | --------------------------- |
| `react-native-vision-camera`                  | ^4.7.3   | ✅ KYC'de kullanılıyor       |
| `react-native-vision-camera-face-detector`    | ^1.9.1   | ✅ KYC + Yüz filtreleri      |
| `react-native-vision-camera-ocr-plus`         | ^1.0.9   | ✅ KYC OCR için kullanılıyor |
| `vision-camera-dynamsoft-document-normalizer` | ^4.1.0   | ✅ Entegre (opsiyonel)       |

### Mevcut KYC Ekranları
```
apps/mobile/app/(creator)/kyc/
├── _layout.tsx     # Stack navigator
├── index.tsx       # KYC durumu
├── form.tsx        # Kişisel bilgi formu
├── id-front.tsx    # Kimlik ön yüz (basit fotoğraf)
├── id-back.tsx     # Kimlik arka yüz (basit fotoğraf)
├── selfie.tsx      # Selfie (basit fotoğraf)
└── result.tsx      # Sonuç
```

**✅ Tamamlandı:**
- ✅ OCR ile kimlik bilgisi okuma
- ✅ Yüz algılama ile selfie validasyonu
- ✅ Belge kenar algılama/düzeltme (opsiyonel)

---

## Phase 1: Face Detector KYC Entegrasyonu ✅

### 1.1 KYC Selfie Detection Hook
- [x] **id:** hook_kyc_selfie_detection
  - **description:** `useKYCSelfieDetection` hook oluştur
  - **file:** `apps/mobile/src/hooks/creator/useKYCSelfieDetection.ts`
  - **details:**
    - ✅ Yüz algılama (tek yüz kontrolü)
    - ✅ Yüz pozisyonu kontrolü (düz bakıyor mu)
    - ✅ Göz açık kontrolü (canlılık)
    - ✅ Yüz boyutu kontrolü (çok uzak/yakın)
  - **priority:** high
  - **completed:** 2024-12-03

### 1.2 Selfie Ekranı Güncelleme
- [x] **id:** screen_selfie_face_detection
  - **description:** `selfie.tsx` ekranını face detection ile güncelle
  - **file:** `apps/mobile/app/(creator)/kyc/selfie.tsx`
  - **details:**
    - ✅ Real-time yüz algılama feedback
    - ✅ "Yüzünüzü çerçeveye yerleştirin" mesajı
    - ✅ "Gözleriniz açık olmalı" uyarısı
    - ✅ Otomatik çekim (validasyon geçince)
  - **priority:** high
  - **completed:** 2024-12-03

### 1.3 Selfie Overlay Component
- [x] **id:** comp_selfie_face_overlay
  - **description:** Yüz pozisyon overlay'i oluştur
  - **file:** `apps/mobile/src/components/creator/kyc/SelfieFaceOverlay.tsx`
  - **details:**
    - ✅ Oval yüz çerçevesi
    - ✅ Yeşil/kırmızı border (valid/invalid)
    - ✅ Pozisyon rehberi (sağa/sola/yukarı/aşağı)
  - **priority:** medium
  - **completed:** 2024-12-03

---

## Phase 2: OCR Entegrasyonu ✅

### 2.1 ID Card OCR Hook
- [x] **id:** hook_id_card_ocr
  - **description:** `useIDCardOCR` hook oluştur
  - **file:** `apps/mobile/src/hooks/creator/useIDCardOCR.ts`
  - **details:**
    - ✅ TC Kimlik No çıkarma (11 hane, mod10 validasyon)
    - ✅ Ad/Soyad çıkarma
    - ✅ Doğum tarihi çıkarma
    - ✅ Güven skoru hesaplama
  - **priority:** medium
  - **completed:** 2024-12-03

### 2.2 ID Front Ekranı OCR Entegrasyonu
- [x] **id:** screen_id_front_ocr
  - **description:** `id-front.tsx` ekranını OCR ile güncelle
  - **file:** `apps/mobile/app/(creator)/kyc/id-front.tsx`
  - **details:**
    - ✅ Real-time OCR okuma
    - ✅ Algılanan bilgileri gösterme
    - ✅ Form ile otomatik karşılaştırma
    - ✅ Eşleşmezse uyarı
  - **priority:** medium
  - **completed:** 2024-12-03

### 2.3 OCR Result Overlay
- [x] **id:** comp_ocr_result_overlay
  - **description:** OCR sonuç overlay'i
  - **file:** `apps/mobile/src/components/creator/kyc/OCRResultOverlay.tsx`
  - **details:**
    - ✅ Algılanan TC gösterimi
    - ✅ Algılanan isim gösterimi
    - ✅ Güven skoru bar
  - **priority:** low
  - **completed:** 2024-12-03

---

## Phase 3: Document Normalizer Entegrasyonu (Opsiyonel) ✅

### 3.1 Document Normalizer Hook
- [x] **id:** hook_document_normalizer
  - **description:** `useDocumentNormalizer` hook oluştur
  - **file:** `apps/mobile/src/hooks/creator/useDocumentNormalizer.ts`
  - **details:**
    - ✅ Belge kenar algılama
    - ✅ Perspektif düzeltme
    - ✅ Crop işlemi
  - **priority:** low
  - **note:** VisionCamera frame processor olarak ücretsiz
  - **completed:** 2024-12-03

### 3.2 Document Overlay Component
- [x] **id:** comp_document_overlay
  - **description:** Belge kenar overlay'i
  - **file:** `apps/mobile/src/components/creator/kyc/DocumentEdgeOverlay.tsx`
  - **details:**
    - ✅ 4 köşe gösterimi
    - ✅ Yeşil border (algılandığında)
    - ✅ "Kimliği çerçeveye yerleştirin" mesajı
  - **priority:** low
  - **completed:** 2024-12-03

---

## Phase 4: Validation & Auto-Capture ✅

### 4.1 Auto-Capture Logic
- [x] **id:** feature_auto_capture
  - **description:** Otomatik çekim özelliği
  - **details:**
    - ✅ Tüm validasyonlar geçtiğinde otomatik çekim (~0.5sn)
    - ✅ Kullanıcı hareket ederse reset
    - ✅ Haptic feedback (Vibration)
  - **priority:** low
  - **completed:** 2024-12-03

### 4.2 Form Auto-Fill
- [x] **id:** feature_form_autofill
  - **description:** OCR'dan form otomatik doldurma
  - **details:**
    - ✅ ID çekildikten sonra form alanlarını doldur (setOCRData)
    - ✅ validateOCRMatch ile eşleşme kontrolü
    - ✅ useKYCVerification hook'a entegre
  - **priority:** low
  - **completed:** 2024-12-03

---

## Dosya Yapısı (Hedef)

```
apps/mobile/src/
├── hooks/creator/
│   ├── useKYCSelfieDetection.ts  # Selfie yüz algılama
│   ├── useIDCardOCR.ts           # Kimlik OCR
│   └── useDocumentNormalizer.ts  # Belge düzeltme
│
└── components/creator/kyc/
    ├── SelfieFaceOverlay.tsx     # Yüz pozisyon overlay
    ├── OCRResultOverlay.tsx      # OCR sonuç overlay
    └── DocumentEdgeOverlay.tsx   # Belge kenar overlay
```

---

## Öncelik Sırası

| Öncelik | Görev                 | Değer                             |
| ------- | --------------------- | --------------------------------- |
| 1       | Selfie Face Detection | Canlılık kontrolü, fraud önleme   |
| 2       | ID Card OCR           | Otomatik form doldurma, doğrulama |
| 3       | Document Normalizer   | Görüntü kalitesi (opsiyonel)      |
| 4       | Auto-Capture          | UX iyileştirme                    |

---

## Notlar

- ✅ Face Detector zaten yüz filtreleri için kullanılıyor, **ayrı options** ile KYC'de kullanıldı
- ✅ OCR Plus ücretsiz, ML Kit tabanlı
- ✅ Document Normalizer VisionCamera frame processor olarak ücretsiz
- ⚠️ Expo managed workflow'da prebuild gerekebilir (development build)

---

## Tamamlanma Durumu

| Phase                        | Durum        | Tarih      |
| ---------------------------- | ------------ | ---------- |
| Phase 1: Face Detector       | ✅ Tamamlandı | 2024-12-03 |
| Phase 2: OCR                 | ✅ Tamamlandı | 2024-12-03 |
| Phase 3: Document Normalizer | ✅ Tamamlandı | 2024-12-03 |
| Phase 4: Auto-Capture        | ✅ Tamamlandı | 2024-12-03 |

**Tüm görevler tamamlandı! 🎉**
