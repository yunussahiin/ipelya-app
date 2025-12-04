# 🕵️ Invisible Ink (Görünmez Mürekkep)

## 1. Konsept
Mesajlaşma veya Story paylaşımında, metnin veya görselin üzerinin "Simli/Bulanık" bir tabakayla kapalı olması. Alıcının içeriği görmek için fiziksel bir etkileşimde (Sallama, Kazıma, Isıtma) bulunması.

**Amaç:** Okuma eylemini sıradanlıktan çıkarıp bir "Oyun" ve "Sürpriz" haline getirmek.

## 2. Kullanıcı Deneyimi (UX)
1.  **Gönderim:** Kullanıcı mesajı yazar ve efekt menüsünden "Görünmez Mürekkep"i seçer.
2.  **Görünüm:** Alıcı mesaj balonunu görür ama içi hareketli, simli bir toz bulutu gibidir. Metin okunmaz.
3.  **Etkileşim:**
    *   **Kazıma (Scratch):** Parmağıyla üzerini kazıdıkça metin ortaya çıkar.
    *   **Sallama (Shake):** Telefonu salladığında tozlar dökülür ve metin görünür.
4.  **Gizlenme:** Bir süre sonra (örn: 5 saniye) efekt tekrar kapanır (Opsiyonel).

## 3. Teknik Mimari

### Database
Veritabanında ekstra bir alan tutmaya gerek yoktur, sadece mesajın `metadata` veya `effects` JSON alanında belirtilir.

```json
{
  "content": "Seni seviyorum!",
  "effect": "invisible_ink",
  "interaction_type": "scratch"
}
```

## 4. Mobil Uygulama (Expo & Reanimated)
Bu özellik tamamen Client-side (Frontend) büyüsüdür.

### Skia / Canvas
`@shopify/react-native-skia` veya `react-native-canvas` kullanılarak "Kazıma" efekti yapılır.
*   **Masking:** Üstte bir "Noise Texture" (Gürültü dokusu) katmanı olur. Kullanıcının parmak hareketleri (PanGesture) bu katmanı "Siler" (Masking).

### Sensors
`expo-sensors` (Accelerometer) kullanılarak "Sallama" hareketi algılanır.
*   Hız ivmesi belli bir eşiği (Threshold) geçerse, metnin üzerindeki `BlurView` veya `Opacity` animasyonla kaldırılır.

### Haptics
Her kazıma hareketinde veya sallama başarılı olduğunda `expo-haptics` ile hafif titreşimler verilir.

## 5. Kullanım Alanları
*   Sürpriz doğum günü mesajları.
*   Spoiler içeren metinler.
*   Flörtöz/Gizemli mesajlar.
