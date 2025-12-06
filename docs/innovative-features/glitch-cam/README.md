# 📺 Glitch Cam (Görsel Kriptografi & Anti-SS) - Teknik Analiz ve Uygulama Rehberi

## 1. Vizyon ve Konsept
**"Göz görür, kamera kör olur."**

Glitch Cam, ekranın tamamını veya belirli bir fotoğrafı insan beyninin birleştirebileceği ama dijital sensörler ve sıkıştırma algoritmalarının (screenshot, video record) bozacağı bir görsel şifreleme yöntemidir.

**Temel Vaat:** Görüntülü görüşme yaparsınız, ancak biri ekran kaydı alırsa görüntüde sadece "karlı parazit" görür. Sadece canlı izleyen gözler (veya karşıdaki decode shader'ı) net görür.

---

## 2. Çalışma Prensibi
Bu özellik iki seviyede çalışabilir:

### A. Fiziksel Kriptografi (Analog Glitch)
Ekranın yenileme hızını (60/120Hz) kullanarak, görüntüyü hızlıca "Pozitif" ve "Negatif" (Inverted) olarak gönderir.
*   **İnsan Gözü:** Görüntülerin ortalamasını alır -> Net gri tonlamalı resim görür.
*   **Kamera/Screenshot:** Anlık kare yakalar -> Sadece simsiyah veya bembeyaz bir kare yakalar.

### B. Dijital Kriptografi (Shader Decoding)
Görüntü gönderilmeden önce "Encrypted Noise" haline getirilir. Karşı taraftaki uygulama, "Decoder Key" (Şifre Çözücü Shader) ile bu gürültüyü temizler ve görüntüyü oluşturur. Eğer key yoksa (ekran kaydı, man-in-the-middle) görüntü anlamsızdır.

---

## 3. Teknoloji Stack

| Bileşen | Paket | Amaç |
| :--- | :--- | :--- |
| **Graphics Engine** | `@shopify/react-native-skia` | Yüksek performanslı 2D grafik ve Shader işlemleri için. |
| **Camera** | `react-native-vision-camera` | Kamera akışını Frame Processor ile yakalayıp Skia'ya beslemek için. |
| **GLSL** | OpenGL Shading Language | Görüntüyü manipüle eden matematiksel kodlar (Pixel Shader). |
| **Screenshot** | `expo-screen-capture` | Ekran kaydı alındığını tespit edip görüntüyü tamamen karartmak için (Fail-safe). |

---

## 4. Uygulama Adımları (Implementation Guide)

Biz **"Dijital Şifreleme" (Shader)** yöntemine odaklanacağız.

### Adım 1: Skia Shader ile Görüntü Bozma (`GlitchShader.ts`)

Kameradan gelen görüntüyü (texture) alıp üzerine dinamik "Noise" ekleyen GLSL kodu.

```typescript
// apps/mobile/src/components/glitch/shaders.ts

export const chaosShader = `
uniform shader image;
uniform float time;
uniform float intensity; // 0.0 (Net) - 1.0 (Tamamen Karıncalı)

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec4 main(vec2 pos) {
    vec4 color = image.eval(pos);
    
    // Rastgele noise üret
    float noise = random(pos + time);
    
    // Görüntüyü kaydır (Displacement)
    vec2 offset = vec2(noise * 10.0 * intensity, 0.0);
    vec4 displaced = image.eval(pos + offset);
    
    // Renk kanallarını karıştır (Chromatic Aberration)
    float r = image.eval(pos + vec2(5.0 * intensity, 0)).r;
    float g = image.eval(pos).g;
    float b = image.eval(pos - vec2(5.0 * intensity, 0)).b;
    
    // Intensity'ye göre karıştır
    return mix(color, vec4(r, g, b, 1.0), intensity);
}
`;
```

### Adım 2: UI Component (`GlitchView.tsx`)

`Canvas` içinde kamerayı veya resmi gösterir.

```tsx
import { Canvas, Fill, Shader, useImage, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

export const GlitchView = ({ imageSource, isDecoded }) => {
  const image = useImage(imageSource);
  const clock = useClock();
  
  // Eğer decode edildiyse intensity 0 (net), edilmediyse 1 (bozuk)
  const intensity = useDerivedValue(() => {
    return isDecoded ? 0.05 : 1.0; // 0.05 hafif bir "cyber" hissi bırakır
  }, [isDecoded]);

  if (!image) return null;

  return (
    <Canvas style={{ flex: 1 }}>
      <Fill>
        <Shader source={chaosShader} uniforms={{ image, time: clock, intensity }} />
      </Fill>
    </Canvas>
  );
};
```

### Adım 3: Secure Flag (Android/iOS)

Yazılımsal encryption'a ek olarak, işletim sistemi seviyesinde "Secure View" kullanılmalıdır.

```typescript
import * as ScreenCapture from 'expo-screen-capture';

// Ekran açıldığında
useEffect(() => {
  ScreenCapture.preventScreenCaptureAsync(); // Android'de ekranı siyah yapar, iOS'ta uyarır.
  
  return () => {
    ScreenCapture.allowScreenCaptureAsync();
  };
}, []);
```

---

## 5. Kullanım Senaryoları (Use Cases)

1.  **Flash Photo:** Gönderilen fotoğraf sadece ekrana parmak basılı tutulduğunda (Touch-to-Reveal) decode edilir. Parmak çekildiği an tekrar Glitch haline döner.
2.  **Private Call:** Görüntülü görüşme sırasında, karşı taraf ekran kaydı almaya başlarsa (`ScreenCapture.addScreenshotListener`), shader anında `intensity = 1.0` moduna geçer ve kayıt sadece parazit çeker.

## 6. Roadmap

1.  **Faz 1:** Statik Fotoğraflar. (Fotoğrafı shader ile bozup gönderme).
2.  **Faz 2:** Vision Camera entegrasyonu. (Canlı kamera akışına efekt uygulama).
3.  **Faz 3:** "Optical Cryptography". Ekranın yenileme hızıyla oynayarak insan gözüne oyun oynama (Deneysel).
