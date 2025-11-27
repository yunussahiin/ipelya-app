# Skia Gelişmiş Efektler Dokümantasyonu

Bu dokümantasyon, React Native Skia ile uygulanabilecek gelişmiş görsel efektleri içerir.

## 🎯 Uygulama Durumu

| Efekt            | Durum        | Dosya                                                     |
| ---------------- | ------------ | --------------------------------------------------------- |
| Vignette         | ✅ Tamamlandı | `effects/VignetteShader.ts`, `effects/VignetteEffect.tsx` |
| Backdrop Blur    | ✅ Tamamlandı | `effects/BackdropBlurEffect.tsx`                          |
| Gradient Overlay | ✅ Tamamlandı | `effects/GradientOverlay.tsx`                             |
| Text Overlay     | ✅ Tamamlandı | `TextOverlay.tsx`, `CanvasText.tsx`                       |

## 📦 Gerekli Import'lar

```tsx
import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  Blur,
  BackdropBlur,
  BackdropFilter,
  Group,
  Fill,
  Circle,
  Rect,
  Mask,
  Shader,
  ImageShader,
  BlurMask,
  Shadow,
  BoxShadow,
  Box,
  Skia,
  rect,
  rrect,
  vec,
} from "@shopify/react-native-skia";
```

---

## 1. Backdrop Blur (Arka Plan Bulanıklaştırma)

Instagram story tarzı, fotoğrafın bir kısmını bulanıklaştırma.

```tsx
import { Canvas, Image, BackdropBlur, Fill, useImage } from "@shopify/react-native-skia";

export const BackdropBlurExample = () => {
  const image = useImage(require("./photo.jpg"));

  return (
    <Canvas style={{ width: 256, height: 256 }}>
      <Image image={image} x={0} y={0} width={256} height={256} fit="cover" />
      
      {/* Alt yarısını bulanıklaştır */}
      <BackdropBlur blur={10} clip={{ x: 0, y: 128, width: 256, height: 128 }}>
        <Fill color="rgba(0, 0, 0, 0.3)" />
      </BackdropBlur>
    </Canvas>
  );
};
```

### Kullanım Alanları:
- Story arka planları
- Text overlay için blur
- Modal arka planları

---

## 2. Image Blur (Görüntü Bulanıklaştırma)

Tüm görüntüye veya belirli alanlara blur uygulama.

```tsx
import { Canvas, Image, Blur, useImage } from "@shopify/react-native-skia";

export const ImageBlurExample = () => {
  const image = useImage(require("./photo.jpg"));

  return (
    <Canvas style={{ width: 256, height: 256 }}>
      <Image x={0} y={0} width={256} height={256} image={image} fit="cover">
        <Blur blur={4} mode="clamp" />
      </Image>
    </Canvas>
  );
};
```

### Blur + ColorMatrix Birlikte:
```tsx
<Image image={image} x={0} y={0} width={256} height={256} fit="cover">
  <Blur blur={2} mode="clamp">
    <ColorMatrix matrix={WARM_FILTER} />
  </Blur>
</Image>
```

---

## 3. Vignette Efekti (Custom Shader)

Kenar karartma efekti için SKSL shader.

```tsx
import { Canvas, Skia, Shader, ImageShader, Fill, useImage } from "@shopify/react-native-skia";

const vignetteShader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float2 resolution;
uniform float intensity;

half4 main(float2 xy) {
  half4 color = image.eval(xy);
  
  // Normalize coordinates to center
  float2 uv = xy / resolution;
  float2 center = float2(0.5, 0.5);
  
  // Calculate distance from center
  float dist = distance(uv, center);
  
  // Vignette factor (0 at center, 1 at corners)
  float vignette = smoothstep(0.2, 0.8, dist * intensity);
  
  // Darken edges
  color.rgb *= 1.0 - vignette * 0.7;
  
  return color;
}
`)!;

export const VignetteExample = ({ width, height, intensity = 1.5 }) => {
  const image = useImage(require("./photo.jpg"));

  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader 
          source={vignetteShader}
          uniforms={{ resolution: [width, height], intensity }}
        >
          <ImageShader
            image={image}
            fit="cover"
            rect={{ x: 0, y: 0, width, height }}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
};
```

---

## 4. Wave/Distortion Efekti (Custom Shader)

Dalgalı distortion efekti.

```tsx
const waveShader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float time;
uniform float amplitude;
uniform float frequency;

half4 main(float2 xy) {
  // Wave distortion
  xy.x += sin(xy.y * frequency + time) * amplitude;
  xy.y += cos(xy.x * frequency + time) * amplitude * 0.5;
  
  return image.eval(xy);
}
`)!;

export const WaveEffect = ({ width, height }) => {
  const image = useImage(require("./photo.jpg"));
  const clock = useClock(); // Reanimated
  
  const time = useDerivedValue(() => clock.value / 1000);

  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader 
          source={waveShader}
          uniforms={{ time, amplitude: 5, frequency: 0.05 }}
        >
          <ImageShader
            image={image}
            fit="cover"
            rect={{ x: 0, y: 0, width, height }}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
};
```

---

## 5. Glitch Efekti (Custom Shader)

RGB channel separation glitch.

```tsx
const glitchShader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float offset;

half4 main(float2 xy) {
  // RGB channel separation
  half4 r = image.eval(float2(xy.x + offset, xy.y));
  half4 g = image.eval(xy);
  half4 b = image.eval(float2(xy.x - offset, xy.y));
  
  return half4(r.r, g.g, b.b, 1.0);
}
`)!;

export const GlitchEffect = ({ width, height, offset = 5 }) => {
  const image = useImage(require("./photo.jpg"));

  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader source={glitchShader} uniforms={{ offset }}>
          <ImageShader
            image={image}
            fit="cover"
            rect={{ x: 0, y: 0, width, height }}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
};
```

---

## 6. Circular Crop (Profil Fotoğrafı)

Dairesel kesme için mask kullanımı.

```tsx
import { Canvas, Image, Group, Circle, Mask, useImage } from "@shopify/react-native-skia";

export const CircularCrop = ({ size = 200 }) => {
  const image = useImage(require("./photo.jpg"));
  const center = size / 2;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Mask
        mask={<Circle cx={center} cy={center} r={center} color="white" />}
      >
        <Image
          image={image}
          x={0}
          y={0}
          width={size}
          height={size}
          fit="cover"
        />
      </Mask>
    </Canvas>
  );
};
```

### Alternatif: Group Clip ile
```tsx
export const CircularCropAlt = ({ size = 200 }) => {
  const image = useImage(require("./photo.jpg"));
  const center = size / 2;
  
  // Circular path
  const circlePath = Skia.Path.Make();
  circlePath.addCircle(center, center, center);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group clip={circlePath}>
        <Image
          image={image}
          x={0}
          y={0}
          width={size}
          height={size}
          fit="cover"
        />
      </Group>
    </Canvas>
  );
};
```

---

## 7. Neumorphism / Shadows

Inner ve outer shadow efektleri.

```tsx
import { Canvas, Box, BoxShadow, Fill, rrect, rect } from "@shopify/react-native-skia";

export const NeumorphismBox = () => (
  <Canvas style={{ width: 256, height: 256 }}>
    <Fill color="#e0e5ec" />
    <Box box={rrect(rect(64, 64, 128, 128), 24, 24)} color="#e0e5ec">
      {/* Outer shadows */}
      <BoxShadow dx={10} dy={10} blur={15} color="rgba(163,177,198,0.6)" />
      <BoxShadow dx={-10} dy={-10} blur={15} color="rgba(255,255,255,0.8)" />
      
      {/* Inner shadows (pressed effect) */}
      <BoxShadow dx={5} dy={5} blur={10} color="rgba(163,177,198,0.5)" inner />
      <BoxShadow dx={-5} dy={-5} blur={10} color="rgba(255,255,255,0.7)" inner />
    </Box>
  </Canvas>
);
```

---

## 8. Gradient Overlay

Gradient efekti ile text okunabilirliği.

```tsx
import { Canvas, Image, Rect, LinearGradient, useImage, vec } from "@shopify/react-native-skia";

export const GradientOverlay = ({ width, height }) => {
  const image = useImage(require("./photo.jpg"));

  return (
    <Canvas style={{ width, height }}>
      <Image image={image} x={0} y={0} width={width} height={height} fit="cover" />
      
      {/* Bottom gradient for text readability */}
      <Rect x={0} y={height * 0.5} width={width} height={height * 0.5}>
        <LinearGradient
          start={vec(0, height * 0.5)}
          end={vec(0, height)}
          colors={["transparent", "rgba(0,0,0,0.8)"]}
        />
      </Rect>
    </Canvas>
  );
};
```

---

## 9. Tilt-Shift (Selective Blur)

Belirli alanları odakta tutup diğerlerini bulanıklaştırma.

```tsx
const tiltShiftShader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform shader blurred;
uniform float2 resolution;
uniform float focusY;      // Focus line Y position (0-1)
uniform float focusWidth;  // Width of focus area

half4 main(float2 xy) {
  float2 uv = xy / resolution;
  
  // Distance from focus line
  float dist = abs(uv.y - focusY);
  
  // Blend factor (0 = sharp, 1 = blurred)
  float blend = smoothstep(focusWidth * 0.5, focusWidth, dist);
  
  half4 sharp = image.eval(xy);
  half4 blur = blurred.eval(xy);
  
  return mix(sharp, blur, blend);
}
`)!;
```

---

## 10. Canvas Export (Görüntü Kaydetme)

Filtrelenmiş görüntüyü dosyaya kaydetme.

```tsx
import { useCanvasRef, Skia } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system";

export const useExportCanvas = () => {
  const canvasRef = useCanvasRef();

  const exportImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Make snapshot
    const image = canvas.makeImageSnapshot();
    if (!image) return null;

    // Encode to base64
    const base64 = image.encodeToBase64();
    
    // Save to file
    const filename = `${FileSystem.cacheDirectory}filtered_${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(filename, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filename;
  };

  return { canvasRef, exportImage };
};
```

---

## 📊 Performans Notları

| Efekt         | GPU Yükü | Önerilen Kullanım |
| ------------- | -------- | ----------------- |
| ColorMatrix   | Düşük    | Her zaman         |
| Blur          | Orta     | Dikkatli kullan   |
| BackdropBlur  | Yüksek   | Sınırlı alan      |
| Custom Shader | Değişken | Test et           |
| Mask          | Düşük    | Her zaman         |
| Shadow        | Orta     | Sınırlı sayıda    |

### Optimizasyon İpuçları:
1. **Blur sigma'yı düşük tut** - 10'un üzeri performansı etkiler
2. **Custom shader'larda uniform kullan** - Her frame'de yeniden compile etme
3. **Mask yerine clip tercih et** - Daha performanslı
4. **Canvas boyutunu optimize et** - Gereksiz büyük canvas kullanma

---

## 🎯 Uygulama Öncelikleri

### Yüksek Öncelik (Kolay)
1. ✅ Vignette efekti
2. ✅ Backdrop blur (story için)
3. ✅ Circular crop (profil için)

### Orta Öncelik
4. Gradient overlay
5. Neumorphism shadows
6. Tilt-shift

### Düşük Öncelik (Zor)
7. Wave/distortion animasyonları
8. Glitch efekti
9. Custom animated shaders

---

## 📚 Kaynaklar

- [React Native Skia Docs](https://shopify.github.io/react-native-skia/)
- [SKSL Shader Language](https://skia.org/docs/user/sksl/)
- [Skia Color Matrix Generator](https://kazzkiq.github.io/svg-color-filter/)
