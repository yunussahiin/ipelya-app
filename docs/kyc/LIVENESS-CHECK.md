# KYC Liveness Check (Canlılık Kontrolü)

## 📋 TODO List

### Phase 1: Altyapı ✅
- [x] `useLivenessDetection.ts` hook oluştur
- [x] Liveness step types tanımla
- [x] Face detection options güncelle (landmarkMode: 'all')

### Phase 2: Components ✅
- [x] `LivenessCheck/index.tsx` - Ana container
- [x] `LivenessProgress.tsx` - İlerleme göstergesi (4 adım)
- [x] `LivenessOverlay.tsx` - Yüz çerçevesi + animasyonlu talimatlar

### Phase 3: Selfie Entegrasyonu ✅
- [x] `selfie.tsx`'e Liveness entegre et
- [x] Liveness sonucunu KYC flow'a bağla
- [x] `liveness_frames` database'e kaydet

### Phase 4: Backend ✅
- [x] `verify-kyc-documents` edge function güncelle
- [x] Liveness score hesaplama ekle (calculateLivenessScore)

### Phase 5: Test & Polish 🔄
- [ ] Tüm adımları test et
- [ ] Hata durumlarını handle et
- [ ] Animasyonları optimize et

---

## 🎯 Genel Bakış

Aktif Liveness Check, kullanıcının gerçek bir insan olduğunu doğrulamak için 4 aşamalı interaktif bir süreç kullanır.

### Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                    LIVENESS CHECK                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ Adım 1  │ → │ Adım 2  │ → │ Adım 3  │ → │ Adım 4  │    │
│  │ Kırp 👁️ │   │ Gülümse │   │ Sağa ➡️ │   │ Sola ⬅️ │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│       │             │             │             │          │
│       ▼             ▼             ▼             ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Progress Bar (4 segment)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                    ┌─────────────┐                         │
│                    │   SUCCESS   │                         │
│                    │     ✅      │                         │
│                    └─────────────┘                         │
│                          │                                  │
│                          ▼                                  │
│                   Selfie Capture                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Liveness Adımları

### Adım 1: Göz Kırpma 👁️

**Amaç:** Kullanıcının gözlerini kontrol edebilmesi

**UI:**
- Mesaj: "Gözlerinizi kırpın"
- İkon: Animasyonlu göz ikonu (açık → kapalı → açık)
- Süre: Max 5 saniye

**Tespit Mantığı:**
```typescript
// Göz kapalı tespit
const isBlinking = 
  leftEyeOpenProbability < 0.3 && 
  rightEyeOpenProbability < 0.3;

// Ardından göz açık tespit
const eyesOpen = 
  leftEyeOpenProbability > 0.7 && 
  rightEyeOpenProbability > 0.7;

// Kırpma = kapalı → açık geçişi
```

**Başarı Kriteri:**
- Gözler kapalı (< 0.3) tespit edildi
- Ardından gözler açık (> 0.7) tespit edildi

---

### Adım 2: Gülümseme 😊

**Amaç:** Yüz ifadesi kontrolü

**UI:**
- Mesaj: "Gülümseyin"
- İkon: Animasyonlu gülümseyen yüz
- Süre: Max 5 saniye

**Tespit Mantığı:**
```typescript
const isSmiling = smilingProbability > 0.7;
```

**Başarı Kriteri:**
- `smilingProbability > 0.7` en az 10 frame boyunca

---

### Adım 3: Başı Sağa Çevir ➡️

**Amaç:** Baş hareketi kontrolü (sağ)

**UI:**
- Mesaj: "Başınızı sağa çevirin"
- İkon: Animasyonlu ok (sağa)
- Süre: Max 5 saniye

**Tespit Mantığı:**
```typescript
const isTurnedRight = yawAngle > 20; // 20 derece sağa
```

**Başarı Kriteri:**
- `yawAngle > 20` tespit edildi

---

### Adım 4: Başı Sola Çevir ⬅️

**Amaç:** Baş hareketi kontrolü (sol)

**UI:**
- Mesaj: "Başınızı sola çevirin"
- İkon: Animasyonlu ok (sola)
- Süre: Max 5 saniye

**Tespit Mantığı:**
```typescript
const isTurnedLeft = yawAngle < -20; // 20 derece sola
```

**Başarı Kriteri:**
- `yawAngle < -20` tespit edildi

---

## 🎨 UI/UX Tasarımı

### Ana Ekran Layout

```
┌────────────────────────────────────────┐
│  ← Geri                    Adım 1/4   │
├────────────────────────────────────────┤
│                                        │
│         ┌──────────────────┐          │
│         │                  │          │
│         │   KAMERA VIEW    │          │
│         │                  │          │
│         │   ┌──────────┐   │          │
│         │   │  OVAL    │   │          │
│         │   │  FRAME   │   │          │
│         │   └──────────┘   │          │
│         │                  │          │
│         └──────────────────┘          │
│                                        │
│         ┌──────────────────┐          │
│         │   👁️ ANIMASYON   │          │
│         └──────────────────┘          │
│                                        │
│         "Gözlerinizi kırpın"          │
│                                        │
│  ████░░░░░░░░░░░░  Progress (1/4)     │
│                                        │
└────────────────────────────────────────┘
```

### Renk Kodları

| Durum                  | Renk    | Hex       |
| ---------------------- | ------- | --------- |
| Bekliyor               | Mavi    | `#3B82F6` |
| Tespit Edildi          | Yeşil   | `#10B981` |
| Hata/Timeout           | Kırmızı | `#EF4444` |
| Progress (Tamamlanmış) | Yeşil   | `#10B981` |
| Progress (Bekleyen)    | Gri     | `#6B7280` |

### Animasyonlar

1. **Göz Kırpma Animasyonu:**
   - Lottie veya Reanimated ile
   - Göz açık → kapalı → açık döngüsü
   - 1.5 saniye döngü

2. **Gülümseme Animasyonu:**
   - Yüz ifadesi değişimi
   - Nötr → Gülümseyen

3. **Baş Çevirme Animasyonu:**
   - Ok ikonu pulse efekti
   - Yön göstergesi

4. **Başarı Animasyonu:**
   - Confetti efekti
   - Yeşil checkmark
   - Haptic feedback

---

## 🔧 Teknik Detaylar

### Face Detection Options

```typescript
const LIVENESS_FACE_DETECTION_OPTIONS: FaceDetectionOptions = {
  cameraFacing: 'front',
  performanceMode: 'accurate',    // Doğruluk öncelikli
  landmarkMode: 'all',            // Landmark'lar açık
  contourMode: 'none',            // Contour gereksiz
  classificationMode: 'all',      // Gülümseme, göz açık/kapalı
  minFaceSize: 0.25,              // Yüz ekranın %25'i
  trackingEnabled: true,          // Yüz takibi açık
  autoMode: true,
  windowWidth: SCREEN_WIDTH,
  windowHeight: SCREEN_HEIGHT,
};
```

### State Management

```typescript
interface LivenessState {
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: boolean[];
  isProcessing: boolean;
  error: string | null;
  frames: LivenessFrame[];  // Kayıt için
}

interface LivenessFrame {
  timestamp: number;
  step: number;
  faceData: {
    yawAngle: number;
    pitchAngle: number;
    leftEyeOpen: number;
    rightEyeOpen: number;
    smiling: number;
  };
}
```

### Timeout Handling

```typescript
const STEP_TIMEOUT = 10000; // 10 saniye per adım
const TOTAL_TIMEOUT = 60000; // Toplam 60 saniye

// Timeout durumunda:
// 1. Uyarı göster
// 2. Adımı tekrar başlat
// 3. 3 başarısız deneme → Manuel çekim seçeneği
```

---

## 📊 Skor Hesaplama

### Liveness Score (25 puan)

```typescript
const calculateLivenessScore = (frames: LivenessFrame[]): number => {
  let score = 0;
  
  // Her adım 6.25 puan
  const completedSteps = new Set(frames.map(f => f.step)).size;
  score += completedSteps * 6.25;
  
  // Bonus: Hızlı tamamlama (< 20 saniye)
  const totalTime = frames[frames.length - 1].timestamp - frames[0].timestamp;
  if (totalTime < 20000) {
    score += 1; // Bonus puan
  }
  
  return Math.min(score, 25);
};
```

### Toplam KYC Skoru

| Kategori     | Puan    |
| ------------ | ------- |
| OCR Eşleşme  | 25      |
| Yüz Algılama | 25      |
| OCR Güven    | 25      |
| **Liveness** | **25**  |
| **TOPLAM**   | **100** |

---

## 🗂️ Dosya Yapısı

```
apps/mobile/
├── src/
│   ├── components/
│   │   └── creator/
│   │       └── kyc/
│   │           └── LivenessCheck/
│   │               ├── index.tsx           # Ana export
│   │               ├── LivenessContainer.tsx
│   │               ├── LivenessStep.tsx
│   │               ├── LivenessProgress.tsx
│   │               ├── LivenessOverlay.tsx
│   │               ├── LivenessSuccess.tsx
│   │               ├── animations/
│   │               │   ├── BlinkAnimation.tsx
│   │               │   ├── SmileAnimation.tsx
│   │               │   └── TurnAnimation.tsx
│   │               └── styles.ts
│   │
│   └── hooks/
│       └── creator/
│           └── useLivenessDetection.ts
│
└── app/
    └── (creator)/
        └── kyc/
            └── selfie.tsx  # Liveness entegrasyonu
```

---

## 🚀 Implementasyon Planı

### Gün 1: Altyapı
1. `useLivenessDetection.ts` hook
2. Types ve interfaces
3. Face detection options güncelleme

### Gün 2: UI Components
1. LivenessContainer
2. LivenessStep
3. LivenessProgress
4. LivenessOverlay

### Gün 3: Animasyonlar & Polish
1. Adım animasyonları
2. Başarı animasyonu
3. Haptic feedback
4. Error handling

### Gün 4: Entegrasyon & Test
1. Selfie.tsx entegrasyonu
2. Backend güncelleme
3. End-to-end test
4. Edge case handling

---

## 📝 Notlar

### Güvenlik Önlemleri
- Frame'ler arası tutarlılık kontrolü
- Ani değişim tespiti (sahte video)
- Minimum frame sayısı gereksinimi

### UX İyileştirmeleri
- Sesli talimatlar (opsiyonel)
- Görme engelli desteği
- Düşük ışık uyarısı

### Performans
- Frame skip (her 3 frame'de 1 işle)
- Memory management
- Battery optimization
