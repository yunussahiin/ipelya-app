# İpelya - Görsel İşleme Pipeline

> VisionCamera + Skia + expo-image-manipulator + **PGMQ** entegrasyonu

**Son Güncelleme:** 2025-11-27

---

## 🔬 Skia vs expo-image-manipulator Karşılaştırması

### Detaylı Analiz

| Özellik                 | **Skia**                     | **expo-image-manipulator**                    |
| ----------------------- | ---------------------------- | --------------------------------------------- |
| **Resize**              | ✅ `fit` prop ile             | ✅ `resize({ width, height })`                 |
| **Crop**                | ⚠️ Manuel (clip/mask)         | ✅ `crop({ originX, originY, width, height })` |
| **Rotate**              | ✅ `transform` ile            | ✅ `rotate(degrees)`                           |
| **Flip**                | ✅ `transform` ile            | ✅ `flip(FlipType)`                            |
| **Compress**            | ❌ Yok                        | ✅ `saveAsync({ compress: 0.8 })`              |
| **Format Convert**      | ⚠️ `encodeToBytes()`          | ✅ `SaveFormat.JPEG/PNG/WEBP`                  |
| **Blur**                | ✅ `<Blur blur={10} />`       | ❌ Yok                                         |
| **Color Filters**       | ✅ `<ColorMatrix />`          | ❌ Yok                                         |
| **Brightness/Contrast** | ✅ ColorMatrix ile            | ❌ Yok                                         |
| **Live Preview**        | ✅ GPU hızlı                  | ❌ Her işlem async                             |
| **Circular Crop**       | ✅ `<Circle />` clip          | ❌ Sadece rectangular                          |
| **Custom Shapes**       | ✅ Path, bezier, etc.         | ❌ Yok                                         |
| **Performance**         | 🚀 GPU (10x hızlı)            | 🐢 CPU                                         |
| **File Export**         | ⚠️ `encodeToBytes()` → manuel | ✅ `saveAsync()` direkt URI                    |

### Sonuç: **Kombinasyon Kullan!**

```
┌─────────────────────────────────────────────────────────────┐
│                    GÖRSEL İŞLEME AKIŞI                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VisionCamera                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    SKIA                              │   │
│  │  • Live Preview (GPU hızlı)                         │   │
│  │  • Circular Crop (profil foto)                      │   │
│  │  • Filtreler (brightness, contrast, warm)           │   │
│  │  • Blur efekti                                      │   │
│  │  • Zoom/Pan gesture                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼ (makeImageSnapshot → encodeToBytes)                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              expo-image-manipulator                  │   │
│  │  • Final resize (1080px)                            │   │
│  │  • Compression (quality: 0.8)                       │   │
│  │  • Format conversion (JPEG)                         │   │
│  │  • File export (URI)                                │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  Upload to Supabase                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Hangi Aracı Ne İçin Kullanacağız?

| İşlem                      | Araç                   | Neden                |
| -------------------------- | ---------------------- | -------------------- |
| **Preview gösterme**       | Skia                   | GPU hızlı, smooth    |
| **Circular crop (profil)** | Skia                   | Native circular mask |
| **Filtreler**              | Skia                   | ColorMatrix, blur    |
| **Zoom/Pan**               | Skia                   | Gesture + transform  |
| **Final resize**           | expo-image-manipulator | Kolay API            |
| **Compression**            | expo-image-manipulator | `compress` param     |
| **File save**              | expo-image-manipulator | `saveAsync()`        |
| **Aspect ratio crop**      | expo-image-manipulator | `crop()` kolay       |

## 📐 Platform Boyut Standartları

### Fotoğraf Boyutları
| Tip                   | Boyut          | Oran   | Kullanım                      |
| --------------------- | -------------- | ------ | ----------------------------- |
| **Kare**              | 1080 × 1080 px | 1:1    | En güvenli, en çok kullanılan |
| **Dikey (Portrait)**  | 1080 × 1350 px | 4:5    | Profil fotoğrafları           |
| **Yatay (Landscape)** | 1080 × 566 px  | 1.91:1 | Geniş açılı fotoğraflar       |

### Story & Reels Boyutları
| Tip       | Boyut          | Oran |
| --------- | -------------- | ---- |
| **Story** | 1080 × 1920 px | 9:16 |
| **Reels** | 1080 × 1920 px | 9:16 |

---

## 🔄 İşleme Pipeline

```
VisionCamera → RAW Image (frame) → Skia Canvas → İşleme → Export → Upload
```

### Detaylı Akış:
1. **Capture**: VisionCamera ile fotoğraf/video çek
2. **Preview**: Kullanıcıya önizleme göster
3. **Edit (Opsiyonel)**: Skia ile düzenleme
4. **Process**: Boyutlandırma + Sıkıştırma
5. **Upload**: Supabase Storage'a yükle

---

## 📸 Preview Sistemi

### Fotoğraf Preview
```tsx
// Fotoğraf çekildikten sonra preview göster
const [previewUri, setPreviewUri] = useState<string | null>(null);

const onCapture = (media: CapturedMedia) => {
  if (media.type === "photo") {
    setPreviewUri(`file://${media.path}`);
    // Preview ekranına yönlendir
  }
};
```

### Video Preview
```tsx
// Video kaydı bittikten sonra preview göster
import { Video } from 'expo-av';

<Video
  source={{ uri: videoPath }}
  style={{ width: '100%', aspectRatio: 9/16 }}
  useNativeControls
  resizeMode="contain"
/>
```

---

## 🎨 Skia Kullanım Alanları

### 1. Profil Fotoğrafı Cropper (Instagram tarzı)
```tsx
import { Canvas, Image, useImage, Circle, Group } from "@shopify/react-native-skia";

const ProfileCropper = ({ imageUri, onCrop }) => {
  const image = useImage(imageUri);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <Canvas style={{ width: 300, height: 300 }}>
      {/* Circular mask for profile photo */}
      <Group clip={<Circle cx={150} cy={150} r={150} />}>
        <Image
          image={image}
          x={offset.x}
          y={offset.y}
          width={300 * scale}
          height={300 * scale}
          fit="cover"
        />
      </Group>
    </Canvas>
  );
};
```

### 2. Güzelleştirme / Beautify Filtreleri
```tsx
import { Canvas, Image, ColorMatrix, useImage } from "@shopify/react-native-skia";

// Brightness artırma
const BRIGHTNESS_MATRIX = [
  1.2, 0, 0, 0, 0,
  0, 1.2, 0, 0, 0,
  0, 0, 1.2, 0, 0,
  0, 0, 0, 1, 0,
];

// Warm filter (ten tonu iyileştirme)
const WARM_MATRIX = [
  1.2, 0, 0, 0, 0,
  0, 1.0, 0, 0, 0,
  0, 0, 0.8, 0, 0,
  0, 0, 0, 1, 0,
];

// Contrast artırma
const CONTRAST_MATRIX = [
  1.5, 0, 0, 0, -0.25,
  0, 1.5, 0, 0, -0.25,
  0, 0, 1.5, 0, -0.25,
  0, 0, 0, 1, 0,
];

const BeautifyFilter = ({ imageUri, filter }) => {
  const image = useImage(imageUri);
  
  return (
    <Canvas style={{ flex: 1 }}>
      <Image image={image} x={0} y={0} width={256} height={256} fit="cover">
        <ColorMatrix matrix={filter} />
      </Image>
    </Canvas>
  );
};
```

### 3. Arka Plan Blur (Bokeh efekti)
```tsx
import { Canvas, Image, BackdropBlur, Fill, useImage } from "@shopify/react-native-skia";

const BackgroundBlur = ({ imageUri }) => {
  const image = useImage(imageUri);

  return (
    <Canvas style={{ width: 256, height: 256 }}>
      <Image image={image} x={0} y={0} width={256} height={256} fit="cover" />
      {/* Alt yarıyı blur yap */}
      <BackdropBlur blur={10} clip={{ x: 0, y: 128, width: 256, height: 128 }}>
        <Fill color="rgba(0, 0, 0, 0.1)" />
      </BackdropBlur>
    </Canvas>
  );
};
```

### 4. Canvas Snapshot Export
```tsx
import { Canvas, useCanvasRef, Image, useImage } from "@shopify/react-native-skia";

const ImageEditor = ({ imageUri, onExport }) => {
  const canvasRef = useCanvasRef();
  const image = useImage(imageUri);

  const exportImage = async () => {
    const snapshot = canvasRef.current?.makeImageSnapshot();
    if (snapshot) {
      // Uint8Array olarak al
      const bytes = snapshot.encodeToBytes();
      
      // Base64'e çevir
      const base64 = btoa(String.fromCharCode(...bytes));
      
      // Dosyaya kaydet veya upload et
      onExport(base64);
    }
  };

  return (
    <Canvas ref={canvasRef} style={{ width: 1080, height: 1080 }}>
      <Image image={image} x={0} y={0} width={1080} height={1080} fit="cover" />
    </Canvas>
  );
};
```

---

## 📦 expo-image-manipulator Kullanımı

### Temel Manipülasyonlar
```tsx
import { useImageManipulator, SaveFormat, FlipType } from 'expo-image-manipulator';

const processImage = async (uri: string) => {
  const context = useImageManipulator(uri);
  
  // Resize (1080px genişlik)
  context.resize({ width: 1080 });
  
  // Rotate
  context.rotate(90);
  
  // Flip
  context.flip(FlipType.Vertical);
  
  // Render ve kaydet
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8, // %80 kalite
  });
  
  return result.uri;
};
```

### Boyutlandırma Fonksiyonları
```tsx
// Kare crop (1:1)
const cropSquare = async (uri: string) => {
  const context = useImageManipulator(uri);
  
  // Merkeze göre kare crop
  context.crop({
    originX: 0,
    originY: 0,
    width: 1080,
    height: 1080,
  });
  
  const image = await context.renderAsync();
  return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
};

// Portrait crop (4:5)
const cropPortrait = async (uri: string) => {
  const context = useImageManipulator(uri);
  
  context.resize({ width: 1080 });
  context.crop({
    originX: 0,
    originY: 0,
    width: 1080,
    height: 1350,
  });
  
  const image = await context.renderAsync();
  return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
};

// Story/Reels crop (9:16)
const cropStory = async (uri: string) => {
  const context = useImageManipulator(uri);
  
  context.resize({ width: 1080 });
  context.crop({
    originX: 0,
    originY: 0,
    width: 1080,
    height: 1920,
  });
  
  const image = await context.renderAsync();
  return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
};
```

---

## 🎬 VisionCamera + Skia Live Filter

### Canlı Filtre (Frame Processor)
```tsx
import { useSkiaFrameProcessor } from 'react-native-vision-camera';
import { Skia } from '@shopify/react-native-skia';

// Renk inversiyon filtresi
const invertColorsFilter = Skia.RuntimeEffect.Make(`
  uniform shader image;
  half4 main(vec2 pos) {
    vec4 color = image.eval(pos);
    return vec4((1.0 - color).rgb, 1.0);
  }
`);

const LiveFilterCamera = () => {
  const device = useCameraDevice('back');
  
  const frameProcessor = useSkiaFrameProcessor((frame) => {
    'worklet';
    
    // Kamera frame'ini render et
    frame.render();
    
    // Overlay çiz (örn: grid)
    const paint = Skia.Paint();
    paint.setColor(Skia.Color('rgba(255, 255, 255, 0.3)'));
    paint.setStrokeWidth(1);
    
    // Grid çizgileri
    for (let i = 0; i < 3; i++) {
      const x = (frame.width / 3) * i;
      const y = (frame.height / 3) * i;
      frame.drawLine(x, 0, x, frame.height, paint);
      frame.drawLine(0, y, frame.width, y, paint);
    }
  }, []);

  return (
    <Camera
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
    />
  );
};
```

---

## 🔧 Önerilen İpelya Özellikleri

| Özellik                   | Neden İpelya'ya Uyuyor?                    | Öncelik     |
| ------------------------- | ------------------------------------------ | ----------- |
| **Cropper**               | Profil fotoğrafı için şart                 | 🔴 Yüksek    |
| **Resize + Compress**     | Upload için hız ve kalite dengesi          | 🔴 Yüksek    |
| **Brightness / Contrast** | Kötü ışıkta çekilen fotoğrafları düzeltir  | 🟡 Orta      |
| **Warm Filter**           | Teni daha iyi gösterir                     | 🟡 Orta      |
| **Blur Background**       | Selfie'lere profesyonellik katar           | 🟢 Düşük     |
| **Sharpen Light**         | Hafif netlik artırıcı                      | 🟢 Düşük     |
| **Canvas Drawing**        | Profil çerçevesi, sınır çizgisi vb.        | 🟢 Düşük     |
| **Live Filter**           | Kamera önizlemesinde filtre (ileri seviye) | ⚪ Opsiyonel |

---

## 📊 Performans Karşılaştırması

| Yöntem                     | Hız             | Kalite     | Kullanım            |
| -------------------------- | --------------- | ---------- | ------------------- |
| **expo-image-manipulator** | Orta            | Yüksek     | Basit resize/crop   |
| **Skia**                   | Çok Hızlı (GPU) | Çok Yüksek | Filtreler, efektler |
| **Native (ImageManip)**    | Yavaş           | Orta       | Eski yöntem         |

### Skia Avantajları:
- ✅ GPU hızlandırmalı (10x daha hızlı)
- ✅ Canlı preview
- ✅ Zoom & pan rendering
- ✅ High-res export
- ✅ Custom shader desteği

---

## 🚀 Uygulama Planı

### Faz 1: Temel ✅
- [x] VisionCamera entegrasyonu
- [x] Fotoğraf/Video çekme
- [x] Format optimizasyonu (1080p)
- [x] Preview ekranı (MediaPreview)
- [x] expo-video entegrasyonu
- [x] Video thumbnail (generateThumbnailsAsync)

### Faz 2: İşleme + PGMQ 🔄 (Aktif)
- [ ] expo-image-manipulator entegrasyonu
- [ ] Otomatik resize (upload öncesi)
- [ ] Sıkıştırma (quality: 0.8)
- [ ] Video compression
- [ ] **PGMQ ile async işleme** (opsiyonel, scale için)

### Faz 3: Düzenleme (Skia)
- [ ] Profil fotoğrafı cropper
- [ ] Temel filtreler (brightness, contrast, warm)
- [ ] Canvas export
- [ ] Filter preview (live)

### Faz 4: Gelişmiş (Opsiyonel)
- [ ] Arka plan blur
- [ ] Live filter preview
- [ ] Custom shader efektleri

---

## 📬 PGMQ Entegrasyonu (Async Media Processing)

> **Not:** PGMQ Supabase'de aktif edildi. Detaylı dokümantasyon: `Supabase-Queuses.md`

### Neden PGMQ?

| Senkron (Şu an)         | Async (PGMQ ile)           |
| ----------------------- | -------------------------- |
| Kullanıcı 5-10sn bekler | Kullanıcı hemen devam eder |
| Timeout riski           | Retry mekanizması          |
| Tek işlem               | Paralel worker'lar         |
| Scale sorunu            | Kolay ölçekleme            |

### Media Processing Queue Akışı

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASYNC MEDIA PROCESSING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 Mobile App                                                   │
│       │                                                          │
│       │ 1. Capture (VisionCamera)                               │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MediaPreview (Skia)                                     │    │
│  │  • Live preview                                          │    │
│  │  • Filtreler (opsiyonel)                                │    │
│  │  • Onay/Tekrar çek                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       │ 2. Quick Upload (raw file)                              │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Supabase Storage                                        │    │
│  │  • temp/user_id/filename.jpg                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       │ 3. Queue Message                                        │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PGMQ: media_processing_queue                            │    │
│  │  {                                                       │    │
│  │    "job_type": "image_optimize",                        │    │
│  │    "user_id": "xxx",                                    │    │
│  │    "source_path": "temp/xxx/photo.jpg",                 │    │
│  │    "target_path": "optimized/xxx/photo.jpg",            │    │
│  │    "options": { "width": 1080, "quality": 0.8 }         │    │
│  │  }                                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       │ 4. Worker Process (Edge Function)                       │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Media Worker                                            │    │
│  │  • Read from queue                                       │    │
│  │  • Download temp file                                    │    │
│  │  • Resize + Compress                                     │    │
│  │  • Upload optimized                                      │    │
│  │  • Update DB record                                      │    │
│  │  • Delete temp file                                      │    │
│  │  • Delete queue message                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Önerilen Queue'lar

```sql
-- Media işleme queue'ları
SELECT pgmq.create('media_processing_queue');      -- Fotoğraf/video optimize
SELECT pgmq.create('video_transcoding_queue');     -- Video dönüştürme (ağır)
SELECT pgmq.create('thumbnail_generation_queue');  -- Thumbnail oluşturma
```

### Edge Function: Media Worker Örneği

```typescript
// supabase/functions/media-worker/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async () => {
  // Queue'dan mesaj oku
  const { data: messages } = await supabase
    .schema('pgmq_public')
    .rpc('read', {
      queue_name: 'media_processing_queue',
      sleep_seconds: 30, // visibility timeout
      n: 5 // batch size
    });

  if (!messages?.length) {
    return new Response(JSON.stringify({ processed: 0 }));
  }

  for (const msg of messages) {
    try {
      const job = msg.message;
      
      // İşleme yap
      if (job.job_type === 'image_optimize') {
        await processImage(job);
      } else if (job.job_type === 'video_transcode') {
        await processVideo(job);
      }
      
      // Başarılı - mesajı sil
      await supabase.schema('pgmq_public').rpc('delete', {
        queue_name: 'media_processing_queue',
        message_id: msg.msg_id
      });
      
    } catch (error) {
      console.error('Job failed:', msg.msg_id, error);
      // Mesaj visibility timeout sonrası tekrar görünür olur (retry)
    }
  }

  return new Response(JSON.stringify({ processed: messages.length }));
});

async function processImage(job: any) {
  // 1. Temp dosyayı indir
  const { data: file } = await supabase.storage
    .from('message-media')
    .download(job.source_path);
  
  // 2. Resize & compress (Sharp veya benzeri)
  // Not: Edge Function'da sınırlı, harici servis kullanılabilir
  
  // 3. Optimized dosyayı yükle
  await supabase.storage
    .from('message-media')
    .upload(job.target_path, processedFile);
  
  // 4. DB'yi güncelle
  await supabase
    .from('messages')
    .update({ media_url: job.target_path, is_optimized: true })
    .eq('id', job.message_id);
  
  // 5. Temp dosyayı sil
  await supabase.storage
    .from('message-media')
    .remove([job.source_path]);
}
```

### Client-Side: Queue'ya Mesaj Gönderme

```typescript
// Mobile app'ten queue'ya mesaj gönder
const queueMediaProcessing = async (
  userId: string,
  sourcePath: string,
  options: { width?: number; quality?: number }
) => {
  const { data, error } = await supabase
    .schema('pgmq_public')
    .rpc('send', {
      queue_name: 'media_processing_queue',
      message: {
        job_type: 'image_optimize',
        user_id: userId,
        source_path: sourcePath,
        target_path: sourcePath.replace('temp/', 'optimized/'),
        options: {
          width: options.width || 1080,
          quality: options.quality || 0.8
        },
        created_at: new Date().toISOString()
      }
    });
  
  return data; // message_id
};
```

### PGMQ Kullanım Stratejisi

> **Kural:** Tüm medya upload'ları PGMQ üzerinden optimize edilmeli!

#### Akış: Raw Upload → Instant Display → Background Optimize

```
Kullanıcı medya seçer
    ↓
Raw dosya Supabase'e yüklenir (hızlı)
    ↓
Mesaj/Post HEMEN görünür (raw URL ile)
    ↓
PGMQ'ya optimize job gönderilir
    ↓
Worker arka planda:
  • Resize (1080px)
  • Compress (quality: 0.8)
  • Aynı URL'i günceller VEYA yeni URL oluşturur
    ↓
Kullanıcı fark etmez, dosya optimize olur
```

#### Tüm Senaryolar PGMQ Kullanmalı

| Senaryo             | Raw Upload | PGMQ Optimize | Neden                   |
| ------------------- | ---------- | ------------- | ----------------------- |
| Chat mesajı (foto)  | ✅ Hemen    | ✅ Arka plan   | Kullanıcı beklemez      |
| Chat mesajı (video) | ✅ Hemen    | ✅ Transcode   | Video işleme uzun sürer |
| Post paylaşımı      | ✅ Hemen    | ✅ Arka plan   | Aynı mantık             |
| Story/Reels         | ✅ Hemen    | ✅ Transcode   | Video optimizasyonu     |
| Profil fotoğrafı    | ✅ Hemen    | ✅ Arka plan   | Crop sonrası optimize   |
| Çoklu medya         | ✅ Hemen    | ✅ Batch job   | Paralel işleme          |

#### Neden Her Zaman PGMQ?

| Senkron Yaklaşım                 | PGMQ Yaklaşım                    |
| -------------------------------- | -------------------------------- |
| ❌ Kullanıcı 5-10sn bekler        | ✅ Kullanıcı hemen devam eder     |
| ❌ Timeout riski (büyük dosyalar) | ✅ Retry mekanizması              |
| ❌ UI donabilir                   | ✅ Smooth UX                      |
| ❌ Her yerde ayrı kod             | ✅ Tek pipeline, her yerde kullan |
| ❌ Scale sorunu                   | ✅ Worker ekleyerek ölçekle       |

---

## 📚 Kaynaklar

- [React Native Skia Docs](https://shopify.github.io/react-native-skia/)
- [expo-image-manipulator Docs](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [VisionCamera Skia Frame Processors](https://react-native-vision-camera.com/docs/guides/frame-processors-skia)
- [Supabase PGMQ Docs](https://supabase.com/docs/guides/queues/pgmq)
- [İpelya PGMQ Sistem Docs](../pgmq-system/pgmq-system-docs.md)
- [Supabase Queues API](./Supabase-Queuses.md)
