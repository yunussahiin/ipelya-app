# 🎭 Voice & Face Masking (Canlı Anonimlik)

## 1. Konsept
Görüntülü veya sesli görüşmelerde, kullanıcının kimliğini gizlemek için gerçek zamanlı "Maskeleme" teknolojilerinin kullanılması.

**Amaç:** Shadow modda bile canlı etkileşime (Live) izin vermek ama gizliliği korumak.

## 2. Kullanıcı Deneyimi (UX)
1.  **Arama:** Kullanıcı "Anonim Arama" başlatır.
2.  **Ayarlar:**
    *   **Ses:** "Robot", "Derin", "Helyum", "Canavar".
    *   **Yüz:** "Pixelated", "Low Poly", "Emoji Face" (Memoji gibi), "Shadow Silhouette".
3.  **Görüşme:** Karşı taraf sizi duyar ve görür ama kim olduğunuzu asla anlayamaz.

## 3. Teknik Mimari

### Ses İşleme (Audio Processing)
Mobilde gerçek zamanlı ses değiştirmek zordur.
*   **Kütüphane:** `react-native-webrtc` ile gelen ses stream'ini (AudioTrack) manipüle etmek gerekir.
*   **Yöntem:** Web Audio API (WebView içinde) veya Native Modül (C++ `SoundTouch` kütüphanesi) kullanılarak Pitch Shifting yapılır.

### Görüntü İşleme (Video Processing)
*   **Yüz Tespiti:** `react-native-vision-camera` veya `MediaPipe` ile yüz landmarkları bulunur.
*   **Maskeleme:**
    *   *Pixelate:* Yüz bölgesindeki pikselleri mozaikle.
    *   *Overlay:* Yüzün üzerine 3D bir maske (Three.js / Skia) yapıştır.

### LiveKit Entegrasyonu
LiveKit'in "E2EE" (Uçtan Uca Şifreleme) ve "Video Processor" özellikleri vardır.
*   Web tarafında `Insertable Streams` ile kolaydır.
*   React Native tarafında Native Modül yazmak gerekebilir.

## 4. Mobil Uygulama
*   **Performans:** Bu işlem CPU/GPU'yu zorlar. Pil tüketimi artar. Kullanıcı uyarılmalıdır.
*   **Gecikme:** İşleme süresi (Processing Latency) < 50ms olmalıdır, yoksa konuşma kopuk olur.

## 5. Güvenlik
Ses değiştirilse bile, "Konuşma Tarzı" (Şive, kelime seçimi) kişiyi ele verebilir. Kullanıcıya bu konuda uyarı verilmeli.
