# react-native-vision-camera-face-detector

## Genel Bilgi

Bu paket VisionCamera ile entegre çalışan yüz algılama plugin'idir. Projemizde **iki farklı amaç** için kullanılabilir:

1. **Yüz Filtreleri** - Story/Reels çekiminde AR efektleri (mevcut kullanım)
2. **KYC Selfie Doğrulama** - Kimlik doğrulama sırasında yüz algılama

## ⚠️ Önemli: Kullanım Ayrımı

### Yüz Filtreleri (Mevcut)
```
apps/mobile/src/components/camera/VisionCamera/hooks/useFaceCamera.ts
apps/mobile/src/components/camera/VisionCamera/components/face-effects/
```

### KYC Selfie (Yeni)
```
apps/mobile/src/components/creator/kyc/SelfieCaptureOverlay.tsx
apps/mobile/app/(creator)/kyc/selfie.tsx
```

**Çakışma Önleme:** Her iki kullanım için ayrı `FaceDetectionOptions` instance'ı kullanılmalı!

---

## Kurulum

```bash
yarn add react-native-vision-camera-face-detector
cd ios && pod install
```

**Peer Dependencies:**
- `react-native-vision-camera` (>=4.0.0)
- `react-native-worklets-core` (>=1.0.0)

---

## API Reference

### FaceDetectionOptions

```typescript
interface FaceDetectionOptions {
  // Kamera yönü - 'front' selfie için, 'back' kimlik için
  cameraFacing?: 'front' | 'back';
  
  // Performans modu
  // 'fast' - Düşük gecikme, daha az doğru (filtrelerde kullan)
  // 'accurate' - Yüksek doğruluk, daha yavaş (KYC'de kullan)
  performanceMode?: 'fast' | 'accurate';
  
  // Yüz noktaları (göz, burun, ağız pozisyonları)
  // 'all' - Tüm noktalar (filtreler için gerekli)
  // 'none' - Devre dışı (KYC için yeterli)
  landmarkMode?: 'none' | 'all';
  
  // Yüz konturu (yüzün kenar çizgisi)
  // 'all' - Detaylı kontur (AR mask için)
  // 'none' - Devre dışı (KYC için yeterli)
  contourMode?: 'none' | 'all';
  
  // Sınıflandırma (gülümseme, göz açık/kapalı)
  // 'all' - Aktif (KYC canlılık kontrolü için)
  // 'none' - Devre dışı
  classificationMode?: 'none' | 'all';
  
  // Minimum yüz boyutu (0.0 - 1.0 arası)
  // Küçük değer = uzak yüzler de algılanır
  minFaceSize?: number; // default: 0.15
  
  // Yüz takibi (aynı yüze ID atar)
  trackingEnabled?: boolean; // default: false
  
  // Otomatik ölçekleme
  autoMode?: boolean; // default: false
  windowWidth?: number;
  windowHeight?: number;
}
```

### Face Result

```typescript
interface Face {
  // Yüz sınırlayıcı kutu
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Yüz açıları (derece)
  pitchAngle: number;  // Yukarı/aşağı eğim
  rollAngle: number;   // Sağa/sola yatma
  yawAngle: number;    // Sağa/sola dönme
  
  // Sınıflandırma (classificationMode: 'all' ise)
  smilingProbability?: number;      // 0.0 - 1.0
  leftEyeOpenProbability?: number;  // 0.0 - 1.0
  rightEyeOpenProbability?: number; // 0.0 - 1.0
  
  // Landmarks (landmarkMode: 'all' ise)
  leftEye?: Point;
  rightEye?: Point;
  leftEar?: Point;
  rightEar?: Point;
  leftCheek?: Point;
  rightCheek?: Point;
  mouthLeft?: Point;
  mouthRight?: Point;
  mouthBottom?: Point;
  noseBase?: Point;
  
  // Kontur (contourMode: 'all' ise)
  contours?: FaceContours;
  
  // Takip ID (trackingEnabled: true ise)
  trackingId?: number;
}
```

---

## Kullanım Örnekleri

### 1. Yüz Filtreleri (AR Efektler)

```typescript
// apps/mobile/src/components/camera/VisionCamera/hooks/useFaceCamera.ts

const FACE_FILTER_OPTIONS: FaceDetectionOptions = {
  cameraFacing: 'front',
  performanceMode: 'fast',        // Düşük gecikme
  landmarkMode: 'all',            // Göz, burun pozisyonları (filtre yerleştirme)
  contourMode: 'all',             // Yüz konturu (mask overlay)
  classificationMode: 'none',     // Gülümseme algılama gereksiz
  minFaceSize: 0.2,
  trackingEnabled: true,          // Aynı yüzü takip et
  autoMode: true,
  windowWidth: Dimensions.get('window').width,
  windowHeight: Dimensions.get('window').height,
};
```

### 2. KYC Selfie Doğrulama

```typescript
// apps/mobile/src/hooks/creator/useKYCSelfieDetection.ts

import { useFaceDetector, FaceDetectionOptions, Face } from 'react-native-vision-camera-face-detector';

const KYC_SELFIE_OPTIONS: FaceDetectionOptions = {
  cameraFacing: 'front',
  performanceMode: 'accurate',    // Yüksek doğruluk
  landmarkMode: 'none',           // Gereksiz
  contourMode: 'none',            // Gereksiz
  classificationMode: 'all',      // Göz açık mı kontrolü
  minFaceSize: 0.3,               // Yüz yakın olmalı
  trackingEnabled: false,
  autoMode: false,
};

export function useKYCSelfieDetection() {
  const { detectFaces, stopListeners } = useFaceDetector(KYC_SELFIE_OPTIONS);

  const validateSelfie = (faces: Face[]): {
    isValid: boolean;
    error?: string;
  } => {
    // Tek yüz olmalı
    if (faces.length === 0) {
      return { isValid: false, error: 'Yüz algılanamadı' };
    }
    if (faces.length > 1) {
      return { isValid: false, error: 'Birden fazla yüz algılandı' };
    }

    const face = faces[0];

    // Yüz düz olmalı (çok fazla eğik değil)
    if (Math.abs(face.yawAngle) > 15) {
      return { isValid: false, error: 'Lütfen yüzünüzü düz tutun' };
    }
    if (Math.abs(face.pitchAngle) > 15) {
      return { isValid: false, error: 'Lütfen kameraya düz bakın' };
    }

    // Gözler açık olmalı (canlılık kontrolü)
    if (face.leftEyeOpenProbability && face.leftEyeOpenProbability < 0.5) {
      return { isValid: false, error: 'Gözleriniz açık olmalı' };
    }
    if (face.rightEyeOpenProbability && face.rightEyeOpenProbability < 0.5) {
      return { isValid: false, error: 'Gözleriniz açık olmalı' };
    }

    // Yüz yeterince büyük olmalı
    const faceArea = face.bounds.width * face.bounds.height;
    const minArea = 0.1; // Ekranın %10'u
    if (faceArea < minArea) {
      return { isValid: false, error: 'Lütfen kameraya yaklaşın' };
    }

    return { isValid: true };
  };

  return {
    detectFaces,
    validateSelfie,
    stopListeners,
  };
}
```

### 3. Frame Processor ile Kullanım

```typescript
import { useFrameProcessor, runAsync } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

function KYCSelfieScreen() {
  const { detectFaces, stopListeners } = useFaceDetector(KYC_SELFIE_OPTIONS);
  const [faceStatus, setFaceStatus] = useState<string>('');

  useEffect(() => {
    return () => stopListeners(); // Cleanup
  }, []);

  const handleFaceUpdate = Worklets.createRunOnJS((status: string) => {
    setFaceStatus(status);
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    runAsync(frame, () => {
      'worklet';
      const faces = detectFaces(frame);
      
      if (faces.length === 0) {
        handleFaceUpdate('no_face');
      } else if (faces.length > 1) {
        handleFaceUpdate('multiple_faces');
      } else {
        const face = faces[0];
        if (Math.abs(face.yawAngle) > 15) {
          handleFaceUpdate('turn_head');
        } else {
          handleFaceUpdate('ready');
        }
      }
    });
  }, [detectFaces, handleFaceUpdate]);

  return (
    <Camera
      frameProcessor={frameProcessor}
      // ...
    />
  );
}
```

---

## Troubleshooting

### Hata: "Regular javascript function cannot be shared"

**Çözüm:** `react-native-reanimated` yapılandırmasını kontrol et:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    'react-native-reanimated/plugin',
  ],
};
```

### Hata: Gradle compile error

**Çözüm:**
```bash
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

---

## Best Practices

1. **Cleanup:** Component unmount olduğunda `stopListeners()` çağır
2. **Performance:** Yüz filtreleri için `performanceMode: 'fast'`, KYC için `'accurate'`
3. **Battery:** Kamera aktif değilken face detection'ı durdur
4. **Memory:** Aynı anda birden fazla face detector instance kullanma

---

## Dosya Konumları

### Yüz Filtreleri (Mevcut)
- `src/components/camera/VisionCamera/hooks/useFaceCamera.ts`
- `src/components/camera/VisionCamera/components/face-effects/`

### KYC Selfie (Yeni)
- `src/hooks/creator/useKYCSelfieDetection.ts` (oluşturulacak)
- `src/components/creator/kyc/SelfieCaptureOverlay.tsx`
