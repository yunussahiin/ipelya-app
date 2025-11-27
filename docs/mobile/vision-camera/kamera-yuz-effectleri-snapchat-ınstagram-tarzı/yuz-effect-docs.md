# React Native Yüz Efektleri (Instagram / Snapchat Tarzı)

Bu doküman, VisionCamera kullanan bir React Native projesine **gözlük takma, makyaj, yüz maskeleri, güzelleştirme (beautify)** gibi AR filtreleri eklemek için gereken yapıyı özetler.

---

## 📁 Mevcut VisionCamera Yapısı

```
apps/mobile/src/components/camera/VisionCamera/
├── VisionCamera.tsx          # Ana kamera component (860 satır)
├── index.tsx                 # Entry point & exports
├── types.ts                  # Type tanımlamaları
├── hooks/
│   ├── index.ts
│   └── useCameraSettings.ts  # Kamera ayarları hook'u
└── components/
    ├── index.ts              # Component exports
    ├── TopControls.tsx       # Üst kontroller (flash, HDR, settings)
    ├── BottomControls.tsx    # Alt kontroller (mode, capture, flip)
    ├── CaptureButton.tsx     # Çekim butonu
    ├── RecordingIndicator.tsx # Kayıt göstergesi
    ├── ZoomIndicator.tsx     # Zoom kontrolü
    ├── ModeSelector.tsx      # Fotoğraf/Video mod seçici
    ├── FlipCameraButton.tsx  # Kamera çevirme
    ├── FocusIndicator.tsx    # Odak göstergesi
    ├── ExposureIndicator.tsx # Pozlama göstergesi
    ├── PermissionView.tsx    # İzin ekranı
    ├── LoadingView.tsx       # Yükleme ekranı
    ├── CameraSettingsSheet.tsx # Ayarlar bottom sheet
    ├── MediaPreview.tsx      # Medya önizleme
    └── preview/
        ├── index.ts
        ├── PhotoPreview.tsx  # Fotoğraf önizleme (22KB)
        ├── VideoPreview.tsx  # Video önizleme
        ├── PreviewControls.tsx
        ├── FilterSelector.tsx # Filtre seçici
        ├── FilterPresets.ts  # Filtre presetleri
        ├── AdjustmentSlider.tsx # Ayar slider'ları
        ├── CanvasText.tsx    # Canvas metin
        ├── TextEditor/       # Metin editörü
        └── effects/          # Skia efektleri
            ├── index.ts
            ├── VignetteEffect.tsx
            ├── VignetteShader.ts
            ├── BackdropBlurEffect.tsx
            └── GradientOverlay.tsx
```

### Mevcut Özellikler (✅ Tamamlanmış)
- Fotoğraf çekme (HDR desteği)
- Video kayıt (başlat/durdur/duraklat)
- Ön/arka kamera geçişi
- Flash/Torch kontrolü
- Zoom (pinch gesture)
- Focus (tap to focus)
- Exposure kontrolü
- Filtre presetleri (ColorMatrix)
- Vignette, Backdrop Blur, Gradient efektleri
- Metin ekleme (CanvasText)

---

## 🎯 Temel Gereken Teknolojiler

### 1) **react-native-vision-camera** ✅ YÜKLÜ (v4.7.3)

Gerçek zamanlı kamera + frame processor desteği.

**Mevcut Kullanım:**
```typescript
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCameraFormat,
  useFrameProcessor
} from "react-native-vision-camera";
```

### 2) **Face Landmark Detection** (yüz noktaları)

#### A) react-native-vision-camera-face-detector ✅ YÜKLÜ (v1.9.1)

MLKit tabanlı yüz algılama - kolay entegrasyon.

**Özellikler:**
- Göz, burun, ağız noktaları (landmarks)
- Yaw / pitch / roll (baş açısı)
- Gülümseme algılama (classification)
- Yüz takibi (tracking)
- autoMode ile otomatik scaling

**Kurulum:**
```bash
npx expo install react-native-vision-camera-face-detector
```

**Kullanım:**
```typescript
import { 
  Face,
  Camera,
  useFaceDetector,
  FaceDetectionOptions
} from 'react-native-vision-camera-face-detector'

const faceDetectionOptions: FaceDetectionOptions = {
  performanceMode: 'fast',      // 'fast' | 'accurate'
  landmarkMode: 'all',          // 'none' | 'all'
  contourMode: 'all',           // 'none' | 'all'
  classificationMode: 'all',    // 'none' | 'all'
  minFaceSize: 0.15,
  trackingEnabled: true
}

const { detectFaces } = useFaceDetector(faceDetectionOptions)

const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  const faces = detectFaces(frame)
  // faces[0].leftEye, faces[0].rightEye, faces[0].noseTip, etc.
}, [])
```

#### B) MediaPipe FaceMesh (gelişmiş - 468 nokta) ⚠️ ARAŞTIRILACAK

Makyaj, dudak boyama, göz farı, yüz konturu için ideal.
React Native için native modül gerektirir.

**Not:** `vision-camera-face-mesh` paketi community tarafından geliştirilmiş, 
güncelliği ve Expo uyumluluğu kontrol edilmeli.

### 3) **@shopify/react-native-skia** ✅ YÜKLÜ (v2.2.12)

GPU hızında render için Skia kütüphanesi.

**Mevcut Kullanım (preview/effects/):**
```typescript
import {
  Canvas,
  Image,
  Path,
  Circle,
  Blur,
  ColorMatrix,
  BackdropBlur,
  LinearGradient,
  Shader,
  useImage,
  Skia
} from "@shopify/react-native-skia";
```

**Yüz Efektleri İçin Kullanılacak:**
- `Path` - Dudak, göz konturu çizimi
- `Image` - Gözlük, maske overlay
- `Blur` - Skin smoothing
- `ColorMatrix` - Renk filtreleri
- `Shader` - Custom SKSL shaders

### 4) **react-native-worklets-core** ✅ YÜKLÜ (v0.5.1)

Frame processor'lar için worklet desteği.

```typescript
import { Worklets } from 'react-native-worklets-core'

const handleDetectedFaces = Worklets.createRunOnJS((faces: Face[]) => { 
  // UI thread'de face data işle
})
```

### 5) **Shader / LUT Filtreleri** ⚠️ ARAŞTIRILACAK

`vision-camera-image-lab` paketi beautify efektleri için.
Alternatif: Custom SKSL shaders ile Skia'da implement edilebilir.

---

## 🧠 Filtre Türlerine Göre Çözüm

### ⭐ 1) Gözlük Takma (2D/3D AR)

* MLKit veya FaceMesh ile göz merkezlerini al
* İki göz arasındaki mesafeyi ölç → scale belirle
* Yaw/pitch/roll ile döndür
* PNG gözlük overlay'i Skia ile çiz

### ⭐ 2) Makyaj Efektleri (lipstick, eyeshadow)

FaceMesh gerektirir.

* Dudak polygon → kırmızı/roze overlay
* Göz kapağı polygon → far rengi
* Opacity + blur kombinasyonu

### ⭐ 3) Skin Smoothing (Beautify)

* Frame processor + shader (gaussian blur + blend)
* Yüz maskesi üzerinden uygulanır (FaceMesh gerekli)

### ⭐ 4) Maskeler (dog face, cat, clown vb.)

* Burun + göz noktaları üzerinden sprite yerleştir
* Baş döndükçe transform et

---

## 🏗 Genel Mimarî Akışı

1. VisionCamera frameProcessor çalışır
2. Face detector / FaceMesh landmark verir
3. Landmark'lar Skia'ya aktarılır
4. Skia layer üzerinde PNG / shape / shader uygulanır
5. Sonuç gerçek zamanlı olarak kameraya bindirilir

---

## 📦 Kullanılacak Paket Listesi (Net)

```
react-native-vision-camera
vision-camera-face-detector
vision-camera-face-mesh
@shopify/react-native-skia
vision-camera-image-lab
```

---

## 🌍 Community Frame Processor Plugins (Yüz Efektleri İçin Gerekli Olanlar)

Aşağıdaki plugin'ler yüz filtreleri, AR efektleri ve makyaj işlemleri için uygundur.

### ✔ vision-camera-face-detector

* MLKit tabanlı yüz algılama
* Göz, burun, ağız noktaları
* Head rotation (yaw/pitch/roll)

### ✔ vision-camera-face-mesh

* MediaPipe FaceMesh → 468 yüz noktası
* Makyaj (lipstick, eyeshadow), yüz konturu, smoothing

### ✔ vision-camera-image-lab

* Shader + LUT filtreleri
* Beautify efektleri

### ✔ @shopify/react-native-skia

* Overlay çizim (gözlük, maske, 2D/3D efekt)

---

# 📦 React Native Hazır Örnekler

Aşağıda doğrudan VisionCamera + FaceMesh + Skia üzerinde kullanılabilir **hazır örnek kodlar** vardır.

---

## 🕶 Örnek 1 — Gözlük Takma Filtresi (2D PNG Overlay)

```tsx
import { useFrameProcessor } from 'react-native-vision-camera';
import { FaceMesh } from 'vision-camera-face-mesh';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';

const glasses = useImage(require('./glasses.png'));

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  return FaceMesh(frame);
}, []);

function GlassesOverlay({ mesh }) {
  if (!mesh || !glasses) return null;

  const leftEye = mesh.leftEye;
  const rightEye = mesh.rightEye;

  const midX = (leftEye.x + rightEye.x) / 2;
  const midY = (leftEye.y + rightEye.y) / 2;

  const eyeDistance = Math.hypot(
    rightEye.x - leftEye.x,
    rightEye.y - leftEye.y
  );

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <SkiaImage
        image={glasses}
        x={midX - eyeDistance}
        y={midY - eyeDistance / 2}
        width={eyeDistance * 2.2}
        height={eyeDistance * 1.2}
      />
    </Canvas>
  );
}
```

---

## 💄 Örnek 2 — Dudak Boyama (Lipstick)

```tsx
import { useFrameProcessor } from 'react-native-vision-camera';
import { FaceMesh } from 'vision-camera-face-mesh';
import { Canvas, Path, Paint } from '@shopify/react-native-skia';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  return FaceMesh(frame);
}, []);

function Lipstick({ mesh }) {
  if (!mesh) return null;

  const points = mesh.lipsUpperOuter.concat(mesh.lipsLowerOuter);

  const path = new Path();
  path.moveTo(points[0].x, points[0].y);
  points.forEach((p) => path.lineTo(p.x, p.y));
  path.close();

  const paint = new Paint();
  paint.color = 'rgba(255,0,80,0.35)';

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <Path path={path} paint={paint} />
    </Canvas>
  );
}
```

---

## ✨ Örnek 3 — Skin Smoothing (Beautify Shader)

```tsx
import { useFrameProcessor } from 'react-native-vision-camera';
import { blurFrame } from 'vision-camera-image-lab';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  return blurFrame(frame, { radius: 6 });
}, []);
```

---

Bu örnekler ile Instagram / Snapchat tarzı filtrelerin çekirdeği hazırdır. Kullanmak istersen üzerine direkt geliştirme yapabilirsin. 👉 gözlük, makyaj, kulak/maske, beautify, glow vb. efektlerin hepsi yapılır.

```
react-native-vision-camera
vision-camera-face-detector
vision-camera-face-mesh
@shopify/react-native-skia
vision-camera-image-lab
```

---

## ✔ Hazır Örnekler (Geliştirilecek)


* 🕶 2D & 3D Gözlük Filtreleri
* 💄 Makyaj Seti (Lipstick, Eyeliner, Eyeshadow, Blush)
* ✨ Beauty Filters (Skin Smoothing, Skin Tone, Glow)
* 🧊 Face Morphing
* 🐺 Animal Face Transform (Cat, Dog, Bear, Anime)
* 👑 AR Objects (Crown, Hat, Mask)
* 🔥 TikTok Glow / Sparkle Filtre
* 🎨 Color LUT Filters (VSCO, Instagram Preset)
* 🌈 Particle Effects (Snow, Hearts, Glitter)



# 🧱 Genel Kullanım Template

```tsx
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  return FaceMesh(frame);
}, []);
```

Aşağıdaki tüm örnekler bu mesh üzerinden çalışır.

---

# 🕶 1) 3D Gözlük Filtre (Perspective + Rotation)

```tsx
export function Glasses3D({ mesh }) {
  if (!mesh) return null;
  const left = mesh.leftEye;
  const right = mesh.rightEye;

  const centerX = (left.x + right.x) / 2;
  const centerY = (left.y + right.y) / 2;
  const dist = Math.hypot(right.x - left.x, right.y - left.y);

  const yaw = mesh.headYaw;

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <SkiaImage
        image={require('./glasses3d.png')}
        x={centerX - dist * 1.5}
        y={centerY - dist * 0.7}
        width={dist * 3}
        height={dist * 1.5}
        transform={[{ rotate: yaw * 0.3 }]}
      />
    </Canvas>
  );
}
```

---

# 💄 2) Lipstick + Eyeliner + Eyeshadow Kombinasyonu

```tsx
export function FullMakeup({ mesh }) {
  if (!mesh) return null;

  const lips = [...mesh.lipsUpperOuter, ...mesh.lipsLowerOuter];
  const leftEye = [...mesh.leftEyeUpper0, ...mesh.leftEyeLower0];
  const rightEye = [...mesh.rightEyeUpper0, ...mesh.rightEyeLower0];

  const lipsPaint = new Paint();
  lipsPaint.color = 'rgba(255,20,80,0.35)';

  const eyelinerPaint = new Paint();
  eyelinerPaint.color = 'rgba(0,0,0,0.6)';

  const eyeshadowPaint = new Paint();
  eyeshadowPaint.color = 'rgba(130,0,200,0.25)';

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      {/* Lipstick */}
      <Path path={polygon(lips)} paint={lipsPaint} />

      {/* Eyeliner */}
      <Path path={polygon(leftEye)} paint={eyelinerPaint} />
      <Path path={polygon(rightEye)} paint={eyelinerPaint} />

      {/* Eyeshadow */}
      <Path path={polygon(leftEye)} paint={eyeshadowPaint} />
      <Path path={polygon(rightEye)} paint={eyeshadowPaint} />
    </Canvas>
  );
}
```

---

# ✨ 3) Skin Smoothing + Skin Tone Adjustment

```tsx
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const blurred = blurFrame(frame, { radius: 5 });
  return adjustSaturation(blurred, { saturation: 1.1 });
}, []);
```

---

# 🧊 4) Face Morphing (Cartoon / Slim Face)

```tsx
export function FaceSlim({ mesh }) {
  if (!mesh) return null;

  const leftCheek = mesh.leftCheek;
  const rightCheek = mesh.rightCheek;

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <Circle cx={leftCheek.x} cy={leftCheek.y} r={8} color="rgba(255,255,255,0.4)" />
      <Circle cx={rightCheek.x} cy={rightCheek.y} r={8} color="rgba(255,255,255,0.4)" />
    </Canvas>
  );
}
```

(Not: Gerçek face morph için pixel warp gerekir, bu Skia shader ile eklenebilir.)

---

# 🐺 5) Animal Face Transform (Kedi / Köpek / Anime)

```tsx
export function AnimeEyes({ mesh }) {
  if (!mesh) return null;
  const left = mesh.leftEye;
  const right = mesh.rightEye;

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <SkiaImage image={require('./anime_eye.png')} x={left.x - 40} y={left.y - 40} width={80} height={80} />
      <SkiaImage image={require('./anime_eye.png')} x={right.x - 40} y={right.y - 40} width={80} height={80} />
    </Canvas>
  );
}
```

---

# 👑 6) Crown / Hat / Mask Filters

```tsx
export function Crown({ mesh }) {
  if (!mesh) return null;

  const forehead = mesh.forehead;

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <SkiaImage
        image={require('./crown.png')}
        x={forehead.x - 150}
        y={forehead.y - 200}
        width={300}
        height={180}
      />
    </Canvas>
  );
}
```

---

# 🔥 7) TikTok Glow / Sparkle Filter

```tsx
export function Sparkle({ mesh }) {
  if (!mesh) return null;

  const nose = mesh.noseTip;

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <Circle cx={nose.x} cy={nose.y} r={20} color="rgba(255,255,0,0.6)" />
      <Circle cx={nose.x} cy={nose.y} r={35} color="rgba(255,255,0,0.2)" />
    </Canvas>
  );
}
```

---

# 🎨 8) Instagram / VSCO LUT Filtreleri

```tsx
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  return applyLUT(frame, { lut: require('./teal_orange.png') });
}, []);
```

---

# 🌈 9) Particle Effects (Hearts, Glitter, Snow)

```tsx
export function Hearts() {
  const hearts = [...Array(20)].map(() => ({
    x: Math.random() * 300,
    y: Math.random() * 600,
    size: 20 + Math.random() * 20,
  }));

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      {hearts.map((h, i) => (
        <SkiaImage key={i} image={require('./heart.png')} x={h.x} y={h.y} width={h.size} height={h.size} />
      ))}
    </Canvas>
  );
}
```

---

# 🎭 10) Tam AR Kamera Pipeline (Hepsi Bir Arada)

```tsx
export default function ARCamera() {
  const device = useCameraDevice('front');
  const [mesh, setMesh] = useState(null);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    return FaceMesh(frame);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Camera
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        onFrameProcessorResult={setMesh}
        frameProcessorFps={30}
        style={StyleSheet.absoluteFill}
      />

      <Glasses3D mesh={mesh} />
      <FullMakeup mesh={mesh} />
      <Sparkle mesh={mesh} />
      {/* <AnimeEyes mesh={mesh} /> */}
      {/* <Crown mesh={mesh} /> */}
      {/* <Hearts /> */}
    </View>
  );
}
```

---

Bu paket, React Native için **profesyonel düzeyde** yüz filtresi geliştirmek isteyenler için tam kapsamlı bir başlangıç setidir. Daha fazla shader, 3D mesh veya özel efekt istersen ekleyebilirim.
