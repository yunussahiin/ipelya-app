# Face Effects Module

Instagram/Snapchat tarzı gerçek zamanlı yüz efektleri.

## Kullanım

### Temel Kullanım (VisionCamera ile)

```tsx
import { VisionCamera } from "@/components/camera/VisionCamera";

function CameraScreen() {
  return (
    <VisionCamera
      mode="photo"
      enableFaceEffects={true}
      showFaceEffectSelector={true}
      faceDetectionPerformance="fast"
      onCapture={(media) => console.log(media)}
    />
  );
}
```

### Manuel Kullanım (Hook'lar ile)

```tsx
import {
  useFaceDetection,
  useFaceEffects,
  FaceEffectOverlay,
  EffectCarousel,
  getCarouselEffects,
} from "@/components/camera/VisionCamera/components/face-effects";

function CustomCameraScreen() {
  const { faces, frameProcessor } = useFaceDetection({ enabled: true });
  const { activeEffects, addEffect, removeEffect } = useFaceEffects();
  const [selectedEffectId, setSelectedEffectId] = useState("none");

  const carouselEffects = useMemo(() => {
    return getCarouselEffects().map((config) => ({
      id: config.id,
      name: config.name,
      type: "effect" as const,
      icon: config.icon,
      config,
    }));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        frameProcessor={frameProcessor}
        isActive={true}
      />

      {/* Efekt Overlay */}
      <FaceEffectOverlay
        faces={faces}
        effects={activeEffects}
        width={screenWidth}
        height={screenHeight}
        cameraPosition="front"
      />

      {/* Efekt Carousel */}
      <EffectCarousel
        effects={carouselEffects}
        selectedEffectId={selectedEffectId}
        onSelectEffect={(effect) => {
          setSelectedEffectId(effect.id);
          if (effect.config) addEffect(effect.config);
        }}
        onCapture={handleCapture}
      />
    </View>
  );
}
```

## Mevcut Efektler

### Aksesuarlar (Gözlükler)
- 🕶️ Aviator
- 👓 Yuvarlak
- 💕 Kalp
- ⭐ Yıldız

### Makyaj
- 💄 Kırmızı Ruj
- 💋 Pembe Ruj
- 🤎 Nude Ruj
- 🍇 Berry Ruj

### Güzellik
- ✨ Cilt Düzeltme
- 💫 Yoğun Düzeltme

### Parçacıklar
- ✨ Parıltı
- 💕 Kalpler

### Maskeler
- 🐱 Kedi Kulakları
- 🐰 Tavşan Kulakları
- 🐶 Köpek Kulakları

## Dosya Yapısı

```
face-effects/
├── index.ts                    # Ana export
├── types.ts                    # Tip tanımlamaları
├── presets.ts                  # Efekt presetleri
├── FaceEffectOverlay.tsx       # Ana overlay component
├── FaceEffectSelector.tsx      # Kategori bazlı seçici
├── EffectCarousel.tsx          # Instagram tarzı carousel
├── hooks/
│   ├── index.ts
│   ├── useFaceDetection.ts     # Yüz algılama hook'u
│   └── useFaceEffects.ts       # Efekt yönetimi hook'u
└── effects/
    ├── index.ts
    ├── GlassesEffect.tsx       # Gözlük efekti
    ├── LipstickEffect.tsx      # Ruj efekti
    ├── SkinSmoothEffect.tsx    # Cilt düzeltme
    └── SparkleEffect.tsx       # Parıltı efekti
```

## Asset'ler

```
assets/effects/
├── glasses/
│   ├── aviator.svg
│   ├── round.svg
│   ├── heart.svg
│   └── star.svg
├── masks/
│   ├── cat-ears.svg
│   ├── bunny-ears.svg
│   └── dog-ears.svg
└── frames/
    └── sparkle.svg
```

## Gereksinimler

- `react-native-vision-camera` (frame processor için)
- `react-native-vision-camera-face-detector` (MLKit face detection)
- `@shopify/react-native-skia` (GPU rendering)
- `react-native-worklets-core` (worklet desteği)
- Development build (Expo Go desteklemiyor)

## Performans

- **Fast Mode**: 30 FPS, düşük gecikme
- **Accurate Mode**: Daha hassas landmark algılama

## TODO

- [ ] Göz makyajı efektleri (eyeliner, eyeshadow)
- [ ] Allık efekti
- [ ] 3D AR objeler (taç, şapka)
- [ ] Animasyonlu parçacıklar
- [ ] Efekt intensity slider
- [ ] Özel efekt oluşturma
