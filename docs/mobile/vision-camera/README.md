# React Native Vision Camera - İpelya Dokümantasyonu

## Genel Bakış

React Native Vision Camera, React Native için yüksek performanslı, özelleştirilebilir bir kamera kütüphanesidir. Fotoğraf/video çekimi, QR kod tarama, frame processor'lar ve GPU hızlandırmalı video pipeline'ları destekler.

**GitHub:** https://github.com/mrousavy/react-native-vision-camera
**Docs:** https://react-native-vision-camera.com/docs/guides

## Mevcut İpelya VisionCamera Component'i

**Lokasyon:** `apps/mobile/src/components/camera/VisionCamera/index.tsx`

### Mevcut Özellikler ✅
- Fotoğraf çekme
- Video kayıt (başlat/durdur)
- Ön/arka kamera geçişi
- Flash/Torch kontrolü
- Pinch-to-zoom (Reanimated)
- Tap-to-focus
- HDR desteği
- Photo/Video mod seçimi
- Kayıt süresi göstergesi
- Max video duration limiti

### Eksik/Geliştirilebilir Özellikler ⏳
- [ ] Türkçe UI metinleri ("Photo" → "Fotoğraf")
- [ ] Pause/Resume recording
- [ ] Cancel recording
- [ ] Snapshot (hızlı çekim)
- [ ] Exposure kontrolü
- [ ] Video stabilization seçimi
- [ ] QR/Barcode tarama (Bize lazım değil.)
- [ ] Frame processor desteği
- [ ] Location metadata
- [ ] Photo quality balance
- [ ] Video bit rate kontrolü
- [ ] Orientation kontrolü
- [ ] Mirror mode
- [ ] Preview resize mode

## Dosya Yapısı

```
docs/mobile/vision-camera/
├── README.md                    # Bu dosya
├── FEATURES.md                  # Tüm özellikler detaylı
├── IMPLEMENTATION.md            # Mevcut implementasyon analizi
├── IMPROVEMENTS.md              # Yapılacak geliştirmeler
└── API-REFERENCE.md             # API referansı
```

## Hızlı Başlangıç

```tsx
import { VisionCamera, CapturedMedia } from "@/components/camera";

function MyScreen() {
  const handleCapture = (media: CapturedMedia) => {
    console.log("Captured:", media.path);
  };

  return (
    <VisionCamera
      mode="photo"
      initialPosition="back"
      enableAudio={true}
      showControls={true}
      onCapture={handleCapture}
      onClose={() => navigation.goBack()}
      maxVideoDuration={60}
    />
  );
}
```

## Kullanım Alanları

1. **Story Creator** - Fotoğraf/video story oluşturma
2. **Reels Creator** - Video reels çekimi (max 90 saniye)
3. **Profile Avatar** - Profil fotoğrafı çekme
4. **Message Media** - Mesaj için medya çekme
5. **Content Creator** - İçerik oluşturma

## Sonraki Adımlar

1. `FEATURES.md` - Tüm Vision Camera özelliklerini incele
2. `IMPLEMENTATION.md` - Mevcut kodu analiz et
3. `IMPROVEMENTS.md` - Geliştirme planını gör
