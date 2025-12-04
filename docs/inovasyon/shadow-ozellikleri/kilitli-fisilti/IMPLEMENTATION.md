# 🤫 Locked "Whisper" Stories (Sesli Fısıltı)

## 1. Konsept
Görselin olmadığı, tamamen sese ve hayal gücüne dayalı, ücretli hikayeler. Creator'lar ASMR tadında, fısıltılı, hikaye anlatımlı veya flörtöz ses kayıtları paylaşır.

**Fark:** Standart Voice Story'den farkı, bunun **ücretli (Locked)** olması ve içeriğin daha "Intimate" (Samimi/Özel) olmasıdır.

## 2. Kullanıcı Deneyimi (UX)
1.  **Feed:** Story akışında üzerinde "Kilit" ikonu olan, dalga formu (waveform) görünen ama çalmayan bir kart.
2.  **Teaser:** İlk 3 saniyesi ücretsiz dinlenebilir (Hook).
3.  **Unlock:** "Dinlemek için 50 Coin" butonuna basılır. Kilit açılır ve ses çalmaya başlar.
4.  **Arka Plan:** Ses çalarken ekranda Creator'ın belirlediği loş, atmosferik bir görsel veya loop video döner.

## 3. Teknik Mimari

### Database
```sql
ALTER TABLE stories 
ADD COLUMN is_locked BOOLEAN DEFAULT false,
ADD COLUMN unlock_price INTEGER DEFAULT 0,
ADD COLUMN preview_duration INTEGER DEFAULT 3; -- Saniye
```

### Access Control (RLS)
Ses dosyasının URL'i, ödeme yapmayanlara asla tam olarak gönderilmemelidir (Güvenlik).
*   **Yöntem:** Supabase Storage'da `private` bucket kullanılır.
*   **Edge Function:** `get-whisper-url` fonksiyonu, kullanıcının ödemesini kontrol eder ve sadece o an geçerli olan bir `Signed URL` döndürür.

## 4. Mobil Uygulama
*   **Audio Player:** `expo-audio` ile gelişmiş kontroller (Hızlandırma yok, geri sarma var).
*   **Proximity Sensor:** Kullanıcı telefonu kulağına götürdüğünde sesin hoparlörden ahizeye geçmesi (Fısıltı hissi için kritik). `expo-sensors` ile yapılabilir.

## 5. Monetization
Bu özellik, prodüksiyon maliyeti düşük (sadece ses) ama duygusal değeri yüksek olduğu için Creatorlar için çok karlı bir modeldir.
