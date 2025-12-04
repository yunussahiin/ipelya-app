# 👁️ Pay-to-Reveal DM (Sansürlü Mesaj)

## 1. Konsept
Creator'ın hayranına özel mesaj (DM) yoluyla gönderdiği, ancak içeriği "buzlu" (blurred) olan fotoğraf veya videolar. Hayran içeriği net görmek için ödeme yapar.

**Kullanım Alanı:** Özel selfie'ler, "Günaydın" fotoları, özel kostüm provaları.

## 2. Kullanıcı Deneyimi (UX)
1.  **Creator:** Mesajlaşma ekranında fotoğraf seçer ve "Ücretli Gönder" der. Fiyatı belirler (örn: 200 Coin).
2.  **Fan:** Mesaj kutusunda bulanık bir fotoğraf görür. Üzerinde "200 Coin ile Aç" yazar.
3.  **Aksiyon:** Butona basar, Coin düşer, fotoğraf anında netleşir.
4.  **Kalıcılık:** Fotoğraf satın alındıktan sonra o sohbet içinde hep açık kalır (veya Creator süreli yapabilir).

## 3. Teknik Mimari

### Database
Mesajlar tablosuna (veya `direct_messages`) ek alanlar:

```sql
ALTER TABLE messages
ADD COLUMN is_paid BOOLEAN DEFAULT false,
ADD COLUMN price INTEGER DEFAULT 0,
ADD COLUMN is_purchased_by_receiver BOOLEAN DEFAULT false; -- Basit model
```
*Not: Grup sohbeti yoksa bu basit model yeterli. Varsa `message_purchases` tablosu gerekir.*

### Görsel Güvenliği
Interactive Tease'deki gibi, görselin orijinali (net hali) client'a hemen gönderilmemelidir.
1.  **Thumbnail:** Bulanıklaştırılmış küçük versiyon herkese gönderilir.
2.  **Orijinal:** Ödeme yapıldığında Edge Function üzerinden orijinal URL (`Signed URL`) teslim edilir.

## 4. Mobil Uygulama
*   **Blur Effect:** `expo-blur` ile estetik bir buzlanma.
*   **Purchase Flow:** Tek tıkla satın alma (Apple Pay gibi hızlı). "Emin misin?" pop-up'ı opsiyonel olabilir (Sürtünmeyi azaltmak için).

## 5. Farklılaşma
OnlyFans'teki PPV (Pay Per View) mesaj mantığının aynısıdır, ancak "Shadow" modda olduğu için daha anonim ve oyunlaştırılmış hissettirir.
