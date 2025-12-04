# 🎙️ Voice-First "Blind" Stories

## 1. Konsept
Görselliğin ikinci planda olduğu, ses odaklı hikayeler. Kullanıcılar önce sesi dinler, eğer içerik ilgilerini çekerse görseli (varsa) açarlar.

**Motto:** "Önyargısız Dinle."

## 2. Kullanıcı Deneyimi (UX)
1.  **Oluşturma:**
    *   Kullanıcı "Sesli Story" modunu seçer.
    *   Kayıt butonuna basılı tutar ve konuşur (veya ortam sesi, şarkı mırıldanma).
    *   (Opsiyonel) Arka plana bulanık bir fotoğraf veya düz renk ekler.
2.  **Tüketim (Feed):**
    *   Story akışında bu hikayeler "Simsiyah" veya "Dalga Formu (Waveform)" animasyonu ile görünür.
    *   Otomatik çalmaya başlar.
    *   Kullanıcı ekrana dokunursa (Tap to Reveal) arka plandaki görsel netleşir.

## 3. Teknik Mimari (Supabase & Storage)

### Storage
Ses dosyaları optimize edilmelidir (M4A/AAC formatı).

*   Bucket: `stories/audio`
*   Bucket: `stories/images` (Cover image)

### Database
**Durum:** `stories` tablosu projede **MEVCUT**. Bu yüzden tabloyu yeniden oluşturmak yerine `ALTER TABLE` ile güncellemeliyiz.

```sql
-- Mevcut stories tablosuna ses alanlarını ekle
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS audio_url TEXT, -- Ses dosyası
ADD COLUMN IF NOT EXISTS waveform_data JSONB; -- Görselleştirme için ses dalga verisi (array of numbers)

-- İpucu: media_type check constraint'ini güncellemek gerekebilir
-- Mevcut constraint: CHECK (media_type IN ('image', 'video'))
-- Güncelleme:
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_media_type_check;
ALTER TABLE stories ADD CONSTRAINT stories_media_type_check 
  CHECK (media_type IN ('image', 'video', 'audio'));
```

## 4. Mobil Uygulama (Expo)

### Ses Kayıt & Oynatma
*   **Kütüphane:** `expo-audio` (Expo SDK 52+)
*   **Kayıt:**
    ```typescript
    import { useAudioRecorder } from 'expo-audio';

    const audioRecorder = useAudioRecorder();

    // Kaydı başlat
    await audioRecorder.record();
    
    // Kaydı durdur
    await audioRecorder.stop();
    ```
*   **Oynatma:** `useAudioPlayer` hook'u veya `AudioPlayer` sınıfı ile oynatma.

### Waveform Görselleştirme
Sesin dalga formunu (iniş çıkışlarını) göstermek estetik açıdan çok önemlidir.
1.  **Analiz:** Kayıt bittikten sonra ses dosyasını analiz edip (amplitude array) çıkarmak gerekir. Bunu mobilde yapmak zor olabilir, genelde sunucuda (Edge Function + ffmpeg) veya basitçe ses seviyesini kayıt esnasında örnekleyerek (`recording.setOnRecordingStatusUpdate`) yapabiliriz.
2.  **Çizim:** `react-native-reanimated` ve `react-native-svg` kullanarak bu array'i hareketli çubuklara dönüştürürüz.

## 5. Zorluklar & Çözümler
*   **Dosya Boyutu:** Ses dosyaları büyük olabilir.
    *   *Çözüm:* Maksimum süre 30-60 saniye ile sınırlandırılmalı. Sıkıştırma (AAC) kullanılmalı.
*   **Moderasyon:** Sesli içerikte küfür/hakaret tespiti zordur.
    *   *Çözüm:* OpenAI Whisper API (veya benzeri) ile sesi metne döküp (STT) metin üzerinden otomatik moderasyon yapılabilir.
