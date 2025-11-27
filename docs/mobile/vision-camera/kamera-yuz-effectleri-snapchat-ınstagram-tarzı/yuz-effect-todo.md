# 🎭 Yüz Efektleri - Geliştirme TODO

Bu dosya, VisionCamera component'ına yüz efektleri (AR filtreleri) eklemek için yapılacak işleri takip eder.

---

## 📦 Paket Durumu

### ✅ Yüklü Paketler
| Paket                                    | Versiyon | Kullanım                  |
| ---------------------------------------- | -------- | ------------------------- |
| react-native-vision-camera               | 4.7.3    | Kamera + Frame Processor  |
| @shopify/react-native-skia               | 2.2.12   | GPU render, overlay çizim |
| react-native-worklets-core               | 0.5.1    | Worklet desteği           |
| react-native-reanimated                  | 4.1.5    | Animasyonlar              |
| react-native-gesture-handler             | 2.28.0   | Gesture desteği           |
| react-native-vision-camera-face-detector | 1.9.1    | MLKit yüz algılama ✅ YENİ |

### ❌ Kurulması Gereken Paketler
*Tüm gerekli paketler kuruldu!*

### ⚠️ Araştırılacak Paketler
| Paket                   | Amaç                  | Not                              |
| ----------------------- | --------------------- | -------------------------------- |
| vision-camera-face-mesh | MediaPipe 468 nokta   | Expo uyumluluğu kontrol edilmeli |
| vision-camera-image-lab | Shader/LUT filtreleri | Alternatif: Custom SKSL          |

---

## 🏗️ Mimari Plan

### Yeni Klasör Yapısı
```
apps/mobile/src/components/camera/VisionCamera/
├── ... (mevcut dosyalar)
├── hooks/
│   ├── index.ts
│   ├── useCameraSettings.ts      # ✅ Mevcut
│   ├── useFaceDetection.ts       # 🆕 Yüz algılama hook'u
│   └── useFaceEffects.ts         # 🆕 Efekt yönetimi hook'u
└── components/
    ├── ... (mevcut dosyalar)
    ├── face-effects/              # 🆕 Yüz efektleri modülü
    │   ├── index.ts
    │   ├── types.ts               # Face effect tipleri
    │   ├── FaceEffectOverlay.tsx  # Ana overlay component
    │   ├── FaceEffectSelector.tsx # Efekt seçici UI
    │   ├── effects/
    │   │   ├── index.ts
    │   │   ├── GlassesEffect.tsx      # 🕶 Gözlük
    │   │   ├── LipstickEffect.tsx     # 💄 Ruj
    │   │   ├── EyelinerEffect.tsx     # 👁 Eyeliner
    │   │   ├── EyeshadowEffect.tsx    # 👁 Göz farı
    │   │   ├── BlushEffect.tsx        # 🎀 Allık
    │   │   ├── SkinSmoothEffect.tsx   # ✨ Cilt düzeltme
    │   │   ├── CrownEffect.tsx        # 👑 Taç/Şapka
    │   │   ├── AnimalFaceEffect.tsx   # 🐱 Hayvan yüzü
    │   │   ├── SparkleEffect.tsx      # ✨ Parıltı
    │   │   └── ParticleEffect.tsx     # 🌈 Parçacık efektleri
    │   ├── presets/
    │   │   ├── index.ts
    │   │   ├── makeup-presets.ts      # Makyaj preset'leri
    │   │   ├── filter-presets.ts      # Filtre preset'leri
    │   │   └── mask-presets.ts        # Maske preset'leri
    │   └── assets/
    │       ├── glasses/               # Gözlük PNG'leri
    │       ├── masks/                 # Maske PNG'leri
    │       ├── crowns/                # Taç/Şapka PNG'leri
    │       └── particles/             # Parçacık PNG'leri
    └── preview/
        └── effects/
            ├── ... (mevcut efektler)
            └── face/                  # 🆕 Preview için yüz efektleri
                └── FaceEffectPreview.tsx
```

---

## 📋 Geliştirme Fazları

### Phase 1: Temel Altyapı 🔴 Öncelikli

#### 1.1 Paket Kurulumu ✅ TAMAMLANDI
- [x] `react-native-vision-camera-face-detector` kurulumu (v1.9.1)
- [ ] Development build oluşturma (Expo Go desteklemiyor)
- [ ] iOS/Android native bağımlılıkları kontrol

```bash
# ✅ Kurulum tamamlandı
# npx expo install react-native-vision-camera-face-detector

# Development build (gerekli - native modül)
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

#### 1.2 Tip Tanımlamaları
- [ ] `face-effects/types.ts` oluştur
  - FaceData interface
  - FaceLandmarks interface
  - FaceEffectType enum
  - FaceEffectConfig interface

```typescript
// Örnek tip tanımlamaları
export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  leftMouth: { x: number; y: number };
  rightMouth: { x: number; y: number };
  // ... diğer noktalar
}

export interface FaceData {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  landmarks: FaceLandmarks;
  headRotation: { yaw: number; pitch: number; roll: number };
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

export type FaceEffectType = 
  | 'glasses'
  | 'lipstick'
  | 'eyeliner'
  | 'eyeshadow'
  | 'blush'
  | 'skin_smooth'
  | 'crown'
  | 'animal_face'
  | 'sparkle'
  | 'particles';

export interface FaceEffectConfig {
  type: FaceEffectType;
  enabled: boolean;
  intensity: number; // 0-1
  color?: string;
  asset?: string; // PNG path
}
```

#### 1.3 useFaceDetection Hook
- [ ] `hooks/useFaceDetection.ts` oluştur
- [ ] Face detection options konfigürasyonu
- [ ] Frame processor entegrasyonu
- [ ] Face data state yönetimi

```typescript
// hooks/useFaceDetection.ts
import { useRef, useState, useCallback } from 'react';
import { useFrameProcessor, runAsync } from 'react-native-vision-camera';
import { useFaceDetector, Face, FaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

export interface UseFaceDetectionOptions {
  enabled?: boolean;
  performanceMode?: 'fast' | 'accurate';
  maxFaces?: number;
}

export function useFaceDetection(options: UseFaceDetectionOptions = {}) {
  const { enabled = true, performanceMode = 'fast', maxFaces = 1 } = options;
  
  const [faces, setFaces] = useState<Face[]>([]);
  
  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode,
    landmarkMode: 'all',
    contourMode: 'none', // Performans için kapalı
    classificationMode: 'all',
    minFaceSize: 0.15,
    trackingEnabled: true,
  }).current;

  const { detectFaces, stopListeners } = useFaceDetector(faceDetectionOptions);

  const handleDetectedFaces = Worklets.createRunOnJS((detectedFaces: Face[]) => {
    setFaces(detectedFaces.slice(0, maxFaces));
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!enabled) return;
    
    runAsync(frame, () => {
      'worklet';
      const detectedFaces = detectFaces(frame);
      handleDetectedFaces(detectedFaces);
    });
  }, [enabled, handleDetectedFaces]);

  return {
    faces,
    frameProcessor,
    stopListeners,
    hasFace: faces.length > 0,
  };
}
```

---

### Phase 2: Temel Efektler 🟡 Orta Öncelik

#### 2.1 FaceEffectOverlay Component
- [ ] `face-effects/FaceEffectOverlay.tsx` oluştur
- [ ] Skia Canvas entegrasyonu
- [ ] Face data'ya göre overlay pozisyonlama
- [ ] Efekt render pipeline

```typescript
// face-effects/FaceEffectOverlay.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { FaceData, FaceEffectConfig } from './types';

interface FaceEffectOverlayProps {
  faces: FaceData[];
  effects: FaceEffectConfig[];
  width: number;
  height: number;
}

export function FaceEffectOverlay({ faces, effects, width, height }: FaceEffectOverlayProps) {
  if (faces.length === 0) return null;

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]}>
      {faces.map((face, index) => (
        <React.Fragment key={face.id || index}>
          {effects.map((effect) => (
            <FaceEffect key={effect.type} face={face} effect={effect} />
          ))}
        </React.Fragment>
      ))}
    </Canvas>
  );
}
```

#### 2.2 Gözlük Efekti (GlassesEffect)
- [ ] `effects/GlassesEffect.tsx` oluştur
- [ ] Göz noktalarından pozisyon hesaplama
- [ ] Scale ve rotation hesaplama
- [ ] PNG overlay render

```typescript
// effects/GlassesEffect.tsx
import React from 'react';
import { Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import { FaceData } from '../types';

interface GlassesEffectProps {
  face: FaceData;
  asset: string;
  intensity: number;
}

export function GlassesEffect({ face, asset, intensity }: GlassesEffectProps) {
  const image = useImage(asset);
  if (!image || !face.landmarks) return null;

  const { leftEye, rightEye } = face.landmarks;
  
  // Göz merkezi
  const centerX = (leftEye.x + rightEye.x) / 2;
  const centerY = (leftEye.y + rightEye.y) / 2;
  
  // Göz mesafesi → scale
  const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  const width = eyeDistance * 2.5;
  const height = eyeDistance * 1.2;
  
  // Baş rotasyonu
  const rotation = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

  return (
    <SkiaImage
      image={image}
      x={centerX - width / 2}
      y={centerY - height / 2}
      width={width}
      height={height}
      opacity={intensity}
      transform={[{ rotate: rotation }]}
      origin={{ x: centerX, y: centerY }}
    />
  );
}
```

#### 2.3 Ruj Efekti (LipstickEffect)
- [ ] `effects/LipstickEffect.tsx` oluştur
- [ ] Dudak noktalarından path oluşturma
- [ ] Renk ve opasite ayarları
- [ ] Blur ile yumuşak kenarlar

```typescript
// effects/LipstickEffect.tsx
import React from 'react';
import { Path, Skia, BlurMask } from '@shopify/react-native-skia';
import { FaceData } from '../types';

interface LipstickEffectProps {
  face: FaceData;
  color: string;
  intensity: number;
}

export function LipstickEffect({ face, color, intensity }: LipstickEffectProps) {
  if (!face.landmarks?.lipsUpperOuter || !face.landmarks?.lipsLowerOuter) {
    return null;
  }

  const lipPoints = [
    ...face.landmarks.lipsUpperOuter,
    ...face.landmarks.lipsLowerOuter.reverse(),
  ];

  const path = Skia.Path.Make();
  path.moveTo(lipPoints[0].x, lipPoints[0].y);
  lipPoints.forEach((point) => path.lineTo(point.x, point.y));
  path.close();

  return (
    <Path
      path={path}
      color={color}
      opacity={intensity * 0.5}
      style="fill"
    >
      <BlurMask blur={2} style="normal" />
    </Path>
  );
}
```

#### 2.4 Cilt Düzeltme (SkinSmoothEffect)
- [ ] `effects/SkinSmoothEffect.tsx` oluştur
- [ ] Yüz bölgesi maskeleme
- [ ] Gaussian blur uygulama
- [ ] Blend mode ayarları

---

### Phase 3: Gelişmiş Efektler 🟢 Düşük Öncelik

#### 3.1 Göz Makyajı
- [ ] EyelinerEffect.tsx
- [ ] EyeshadowEffect.tsx
- [ ] Göz konturu çizimi

#### 3.2 Allık (BlushEffect)
- [ ] Yanak bölgesi tespiti
- [ ] Radial gradient overlay
- [ ] Renk seçenekleri

#### 3.3 AR Objeler
- [ ] CrownEffect.tsx (Taç/Şapka)
- [ ] AnimalFaceEffect.tsx (Kedi/Köpek yüzü)
- [ ] 3D transform desteği

#### 3.4 Parçacık Efektleri
- [ ] SparkleEffect.tsx (Parıltı)
- [ ] ParticleEffect.tsx (Kalp, Kar, Glitter)
- [ ] Animasyon sistemi

---

### Phase 4: UI & UX 🔵 Son Aşama

#### 4.1 Efekt Seçici UI
- [ ] FaceEffectSelector.tsx
- [ ] Kategori tabları (Makyaj, Filtreler, Maskeler)
- [ ] Efekt önizleme thumbnails
- [ ] Intensity slider

#### 4.2 Preset Sistemi
- [ ] makeup-presets.ts (Doğal, Gece, Parti)
- [ ] filter-presets.ts (Vintage, Glow, B&W)
- [ ] mask-presets.ts (Kedi, Köpek, Tavşan)

#### 4.3 VisionCamera Entegrasyonu
- [ ] VisionCamera.tsx'e face effects prop'ları ekle
- [ ] TopControls'a efekt butonu ekle
- [ ] Preview'da efekt gösterimi

---

## 🧪 Test Planı

### Unit Tests
- [ ] useFaceDetection hook testleri
- [ ] Effect component render testleri
- [ ] Utility function testleri

### Integration Tests
- [ ] Kamera + Face detection entegrasyonu
- [ ] Efekt overlay doğruluğu
- [ ] Performans testleri (FPS)

### Manual Tests
- [ ] Farklı yüz açılarında test
- [ ] Çoklu yüz tespiti
- [ ] Düşük ışık koşulları
- [ ] Ön/arka kamera geçişi

---

## 📊 Performans Hedefleri

| Metrik  | Hedef  | Not                     |
| ------- | ------ | ----------------------- |
| FPS     | ≥30    | Face detection + render |
| Latency | <50ms  | Yüz algılama gecikmesi  |
| Memory  | <100MB | Ek bellek kullanımı     |
| CPU     | <30%   | İşlemci kullanımı       |

---

## 🔗 Referanslar

### Dokümantasyon
- [react-native-vision-camera](https://react-native-vision-camera.com/)
- [react-native-vision-camera-face-detector](https://github.com/luicfrr/react-native-vision-camera-face-detector)
- [@shopify/react-native-skia](https://shopify.github.io/react-native-skia/)
- [MediaPipe Face Mesh](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)

### Örnek Projeler
- [VisionCamera Example](https://github.com/mrousavy/react-native-vision-camera/tree/main/package/example)
- [Skia Examples](https://github.com/Shopify/react-native-skia/tree/main/example)

---

## 📝 Notlar

### Expo Go Uyumluluğu
⚠️ Face detection native modül gerektirdiği için **Expo Go'da çalışmaz**.
Development build veya standalone build gereklidir.

### Performans İpuçları
1. `performanceMode: 'fast'` kullan (30+ FPS için)
2. `contourMode: 'none'` kullan (468 nokta gereksizse)
3. `maxFaces: 1` ile sınırla (tek yüz yeterliyse)
4. Frame processor'da ağır işlemlerden kaçın
5. Skia Canvas'ı memoize et

### Asset Yönetimi
- PNG'ler için şeffaf arka plan kullan
- Farklı çözünürlükler için @2x, @3x versiyonları
- Lazy loading ile bellek optimizasyonu

---

## 🚀 Başlangıç Adımları

1. **Paket Kurulumu**
   ```bash
   cd apps/mobile
   npx expo install react-native-vision-camera-face-detector
   ```

2. **Development Build**
   ```bash
   npx eas build --profile development --platform ios
   ```

3. **Tip Tanımlamaları**
   - `face-effects/types.ts` oluştur

4. **Hook Geliştirme**
   - `hooks/useFaceDetection.ts` oluştur

5. **İlk Efekt**
   - `effects/GlassesEffect.tsx` ile başla

---

*Son Güncelleme: 2025-11-27*
