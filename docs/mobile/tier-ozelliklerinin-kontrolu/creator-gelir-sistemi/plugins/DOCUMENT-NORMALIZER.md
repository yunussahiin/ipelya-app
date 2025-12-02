# vision-camera-dynamsoft-document-normalizer

## Genel Bilgi

Dynamsoft tarafından geliştirilen belge normalleştirme plugin'i. Kimlik kartını otomatik algılar, perspektif düzeltmesi yapar ve düzgün bir görüntü oluşturur.

**Özellikler:**
- Otomatik belge kenar algılama
- Perspektif düzeltme (eğik çekimleri düzeltir)
- Gölge ve parlaklık iyileştirme
- Crop ve rotate

## Lisans Durumu

✅ **VisionCamera Frame Processor olarak:** Ücretsiz kullanılabilir

Bu paket `react-native-vision-camera` ile entegre çalışan bir frame processor plugin'idir. VisionCamera kendi başına ücretsiz olduğu için, bu plugin de frame processor olarak ücretsiz kullanılabilir.

**Alternatif:** Dynamsoft'un standalone SDK'sı (react-native-vision-camera dışında) ticari lisans gerektirir, ama biz VisionCamera frame processor kullanıyoruz.

**Biz Ne Kullanıyoruz:**
- ✅ `react-native-vision-camera` - Ücretsiz, ana kamera kütüphanesi
- ✅ Bu plugin frame processor olarak - Ücretsiz

---

## Kurulum

```bash
yarn add vision-camera-dynamsoft-document-normalizer
cd ios && pod install
```

### Babel Yapılandırması

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__detectDocument', '__normalizeDocument'],
      },
    ],
  ],
};
```

Babel config değişikliği sonrası Metro cache temizle: biz react native expo kullanıyoruz!
```bash
npx react-native start --reset-cache
```

---

## Lisans Biz bunu değil vision camera kullanıyoruz!


### Ücretsiz Deneme
Dynamsoft 30 günlük ücretsiz deneme lisansı sunar: Biz bunu değil vision camera kullanıyoruz!

https://www.dynamsoft.com/customer/license/trialLicense Biz bunu değil vision camera kullanıyoruz!


### Lisans Aktivasyonu Biz bunu değil vision camera kullanıyoruz!

 
```typescript
// App.tsx veya başlangıç dosyasında
import { initLicense } from 'vision-camera-dynamsoft-document-normalizer';

useEffect(() => {
  initLicense('YOUR_LICENSE_KEY');
}, []);
```

---

## API Reference

### detectDocument

Belge kenarlarını algılar.

```typescript
import { detectDocument } from 'vision-camera-dynamsoft-document-normalizer';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const result = detectDocument(frame);
  
  if (result.detected) {
    console.log('Köşeler:', result.points);
    // result.points = [topLeft, topRight, bottomRight, bottomLeft]
  }
}, []);
```

### normalizeDocument

Algılanan belgeyi düzeltir.

```typescript
import { normalizeDocument } from 'vision-camera-dynamsoft-document-normalizer';

const normalize = async (imagePath: string, points: Point[]) => {
  const result = await normalizeDocument(imagePath, {
    points: points,
    colorMode: 'colour', // 'colour' | 'grayscale' | 'binary'
  });
  
  return result.normalizedImagePath;
};
```

### Sonuç Yapısı

```typescript
interface DetectionResult {
  detected: boolean;
  points?: [Point, Point, Point, Point]; // 4 köşe
  confidence: number; // 0.0 - 1.0
}

interface Point {
  x: number;
  y: number;
}

interface NormalizationResult {
  normalizedImagePath: string;
  width: number;
  height: number;
}
```

---

## Kullanım Örnekleri

### 1. Otomatik Belge Algılama

```typescript
import { detectDocument } from 'vision-camera-dynamsoft-document-normalizer';
import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

function DocumentScanner() {
  const [documentDetected, setDocumentDetected] = useState(false);
  const [corners, setCorners] = useState<Point[]>([]);

  const handleDetection = Worklets.createRunOnJS((
    detected: boolean, 
    points: Point[]
  ) => {
    setDocumentDetected(detected);
    if (detected) {
      setCorners(points);
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const result = detectDocument(frame);
    handleDetection(result.detected, result.points || []);
  }, [handleDetection]);

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={StyleSheet.absoluteFill}
        frameProcessor={frameProcessor}
      />
      
      {documentDetected && (
        <DocumentOverlay corners={corners} />
      )}
    </View>
  );
}
```

### 2. Kimlik Kartı Tarama ve Düzeltme

```typescript
// apps/mobile/src/hooks/creator/useDocumentNormalizer.ts

import { 
  detectDocument, 
  normalizeDocument,
  initLicense 
} from 'vision-camera-dynamsoft-document-normalizer';
import { useEffect, useState } from 'react';

export function useDocumentNormalizer() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Lisans aktivasyonu
    initLicense(process.env.DYNAMSOFT_LICENSE_KEY || '')
      .then(() => setIsReady(true))
      .catch(console.error);
  }, []);

  const processIDCard = async (
    imagePath: string
  ): Promise<{ path: string; corners: Point[] } | null> => {
    try {
      // 1. Belge kenarlarını algıla
      const detection = await detectDocument(imagePath);
      
      if (!detection.detected || !detection.points) {
        console.log('Belge algılanamadı');
        return null;
      }

      // 2. Belgeyi düzelt
      const normalized = await normalizeDocument(imagePath, {
        points: detection.points,
        colorMode: 'colour',
      });

      return {
        path: normalized.normalizedImagePath,
        corners: detection.points,
      };
    } catch (error) {
      console.error('Document normalization failed:', error);
      return null;
    }
  };

  return {
    isReady,
    processIDCard,
    detectDocument,
  };
}
```

### 3. Overlay Component

```typescript
// apps/mobile/src/components/creator/kyc/DocumentOverlay.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';

interface Props {
  corners: Point[];
  width: number;
  height: number;
}

export function DocumentOverlay({ corners, width, height }: Props) {
  if (corners.length !== 4) return null;

  const points = corners
    .map(p => `${p.x * width},${p.y * height}`)
    .join(' ');

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        {/* Belge kenarları */}
        <Polygon
          points={points}
          fill="rgba(0, 255, 0, 0.1)"
          stroke="#00FF00"
          strokeWidth="3"
        />
        
        {/* Köşe noktaları */}
        {corners.map((corner, i) => (
          <Circle
            key={i}
            cx={corner.x * width}
            cy={corner.y * height}
            r={10}
            fill="#00FF00"
          />
        ))}
      </Svg>
    </View>
  );
}
```

---

## KYC Entegrasyonu

### Kimlik Çekim Akışı

```typescript
// apps/mobile/app/(creator)/kyc/id-front.tsx içinde

const { processIDCard, isReady } = useDocumentNormalizer();

const handleCapture = async (media: CapturedMedia) => {
  if (!isReady) return;

  // 1. Fotoğrafı çek (VisionCamera)
  const photoPath = media.path;

  // 2. Belgeyi algıla ve düzelt
  const result = await processIDCard(photoPath);

  if (result) {
    // 3. Düzeltilmiş görüntüyü kaydet
    setDocumentPhoto(result.path, 'id-front');
  } else {
    // 4. Manuel fotoğrafı kullan (düzeltme başarısız)
    setDocumentPhoto(photoPath, 'id-front');
    Alert.alert('Uyarı', 'Kimlik otomatik algılanamadı. Lütfen düzgün çekin.');
  }
};
```

---

## Alternatif: Lisans Gerektirmeyen Çözüm

Dynamsoft lisansı maliyetli olabilir. Alternatif olarak:

### 1. Manuel Crop (Ücretsiz)
Kullanıcıya köşeleri seçtir, react-native-image-crop-picker kullan.

### 2. ML Kit Document Scanner (Google)
Android/iOS native, ücretsiz ama daha az özellik.

### 3. Sadece OCR Kullan
`react-native-vision-camera-ocr-plus` ile kimlikten metin oku, görüntü düzeltme yapma.

---

## Performans Notları

1. **Battery:** Sürekli belge algılama pil tüketir, sadece gerekli ekranlarda aktif et
2. **Memory:** Yüksek çözünürlüklü görüntüler bellek tüketir, normalize sonrası orijinali sil
3. **Frame Rate:** Her frame'de algılama yapma, 200ms debounce kullan

---

## Dosya Konumları

```
apps/mobile/src/
├── hooks/creator/
│   └── useDocumentNormalizer.ts  # Hook (lisans kontrolü + işlem)
└── components/creator/kyc/
    └── DocumentOverlay.tsx       # Kenar gösterimi
```

---

## Lisans Alternatifleri

| Çözüm       | Maliyet                             | Özellikler                         |
| ----------- | ----------------------------------- | ---------------------------------- |
| Dynamsoft   | Ücretli (~$500/yıl)                 | En iyi kalite, perspektif düzeltme |
| ML Kit      | Ücretsiz                            | Temel belge algılama (Android/iOS) |
| OpenCV      | Ücretsiz (react-native-fast-opencv) | Manuel implementasyon gerekir      |
| Manuel Crop | Ücretsiz                            | Kullanıcı köşeleri seçer           |

**Tavsiye:** Başlangıçta lisanssız devam et, gerekirse sonra ekle. OCR ile kimlik bilgisi okumak yeterli olabilir.
