# Image Optimization Settings

> **Son Güncelleme:** 27 Kasım 2025  
> **Worker Versiyon:** v12

## ImageMagick WASM

Edge Function'da `@imagemagick/magick-wasm@0.0.30` kullanılıyor.

### WASM Yükleme

```typescript
// Edge Functions'da Deno.readFile çalışmaz, fetch kullan
const wasmResponse = await fetch(
  "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.30/dist/magick.wasm"
);
const wasmBytes = new Uint8Array(await wasmResponse.arrayBuffer());
await initializeImageMagick(wasmBytes);
```

## Desteklenen Formatlar

| Format        | Okuma | Yazma | Not                           |
| ------------- | ----- | ----- | ----------------------------- |
| **JPEG/JPG**  | ✅     | ✅     | Ana format                    |
| **PNG**       | ✅     | ✅     | Şeffaflık destekli            |
| **WebP**      | ✅     | ✅     | Modern, küçük boyut           |
| **HEIC/HEIF** | ✅     | ❌     | iPhone formatı (sadece okuma) |
| **GIF**       | ✅     | ✅     | Animasyonlu                   |
| **AVIF**      | ✅     | ✅     | En yeni, en küçük             |
| **TIFF**      | ✅     | ✅     | Profesyonel                   |
| **BMP**       | ✅     | ✅     | Eski format                   |

## Kalite Preset'leri (v12)

| Preset    | Max Width | Quality | Kullanım                            |
| --------- | --------- | ------- | ----------------------------------- |
| `chat`    | **1920**  | 85      | Mesajlaşma (Full HD, yüksek kalite) |
| `post`    | 1080      | 88      | Feed post                           |
| `story`   | 1080      | 85      | Story                               |
| `profile` | 500       | 90      | Profil fotoğrafı (küçük ama keskin) |
| `default` | 1920      | 85      | Varsayılan (chat ile aynı)          |

## Oran Algılama

| Oran          | Koşul (height/width) | Örnek     | Açıklama    |
| ------------- | -------------------- | --------- | ----------- |
| **story**     | ratio >= 1.7         | 1188×2112 | 9:16 dikey  |
| **portrait**  | ratio >= 1.2         | 1080×1350 | 4:5 dikey   |
| **square**    | ratio >= 0.9         | 1080×1080 | 1:1 kare    |
| **landscape** | ratio >= 0.5         | 2112×1188 | 16:9 yatay  |
| **ultrawide** | ratio < 0.5          | 2560×1080 | 21:9 sinema |

## Akıllı Boyutlandırma (v12)

```typescript
function smartResize(origWidth: number, origHeight: number, maxWidth: number) {
  const ratio = origHeight / origWidth;
  
  // Oran adını belirle
  let ratioName = 'custom';
  if (ratio >= 1.7) ratioName = 'story';
  else if (ratio >= 1.2) ratioName = 'portrait';
  else if (ratio >= 0.9) ratioName = 'square';
  else if (ratio >= 0.5) ratioName = 'landscape';
  else ratioName = 'ultrawide';
  
  // Zaten küçükse dokunma
  if (origWidth <= maxWidth) {
    return { width: origWidth, height: origHeight, ratioName };
  }
  
  // Oranı koru, genişliği maxWidth'e düşür
  const newWidth = maxWidth;
  const newHeight = Math.round(maxWidth * ratio);
  
  return { width: newWidth, height: newHeight, ratioName };
}
```

## Optimizasyon Kuralları

### Skip Koşulları
- **100KB altı** → Zaten küçük, skip
- **%5 altı tasarruf** → Kalite kaybına değmez, orijinali koru

### İşlem Adımları (v12)
1. **Auto-Orient** - EXIF rotation'a göre pikselleri döndür ← **YENİ!**
2. **Smart Resize** - Oranı koru, maxWidth'e sığdır
3. **Strip** - EXIF metadata temizle (konum, cihaz bilgisi)
4. **Quality** - Preset'e göre kalite ayarla
5. **Write** - JPEG olarak yaz

### Kod Örneği (v12)

```typescript
ImageMagick.read(inputData, (img) => {
  // 1. ÖNCE Auto-Orient - EXIF rotation fix
  // iPhone dikey çektiğinde sensör yatay kaydeder + EXIF'e rotation yazar
  // Bu, pikselleri fiziksel olarak döndürür
  img.autoOrient();
  
  // 2. Smart Resize - oranı koru
  const target = smartResize(img.width, img.height, maxWidth);
  if (img.width > target.width) {
    img.resize(target.width, target.height);
  }
  
  // 3. SONRA Strip - Artık orientation uygulandı, EXIF silinebilir
  img.strip();
  
  // 4. Quality
  img.quality = quality;
  
  // 5. Write JPEG
  img.write(MagickFormat.Jpeg, (data) => {
    resolve(data);
  });
});
```

## Performans

| Metrik             | Değer            |
| ------------------ | ---------------- |
| **RAM Kullanımı**  | ~30MB (WASM)     |
| **İşlem Süresi**   | 1-2 saniye       |
| **Batch Size**     | Max 2 (RAM için) |
| **Tipik Tasarruf** | %50-70           |

## Test Sonuçları (v12)

### Dikey Fotoğraf (iPhone)
```json
{
  "original_dimensions": "1188x2112",
  "optimized_dimensions": "1188x2112",
  "aspect_ratio": "story",
  "savings_percent": 56,
  "quality": 85
}
```

### Yatay Fotoğraf (iPhone)
```json
{
  "original_dimensions": "2112x1188",
  "optimized_dimensions": "1920x1080",
  "aspect_ratio": "landscape",
  "savings_percent": 63,
  "quality": 85
}
```

## Auto-Orient Açıklaması

iPhone dikey fotoğraf çektiğinde:
1. Sensör **yatay** olarak kaydeder (2112×1188)
2. EXIF'e **"rotate 90°"** yazar
3. Görüntüleyiciler EXIF'i okuyup döndürür

**Sorun:** `strip()` EXIF'i silince rotation bilgisi kaybolur → Fotoğraf yatay görünür

**Çözüm (v12):**
1. `autoOrient()` → EXIF'e göre pikselleri fiziksel olarak döndür
2. `strip()` → Artık güvenle silinebilir (rotation uygulandı)
