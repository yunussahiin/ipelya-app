# 🎲 Mystery Box (Gizemli Kutu)

## 1. Konsept
"Gacha" (Loot Box) mekaniğinin Creator içeriklerine uyarlanması. Creator bir kutu hazırlar, içine farklı nadirlik seviyelerinde içerikler koyar. Fanlar sabit bir ücret ödeyip kutuyu açar ve şanslarına ne çıkarsa onu kazanırlar.

**Örnek Kutu (Fiyat: 100 Coin):**
*   %1 İhtimal: Özel Video (Değeri 1000 Coin) - **Legendary**
*   %10 İhtimal: Ses Kaydı (Değeri 200 Coin) - **Epic**
*   %40 İhtimal: Özel Fotoğraf (Değeri 50 Coin) - **Rare**
*   %49 İhtimal: "Teşekkürler" mesajı veya komik bir meme - **Common**

## 2. Kullanıcı Deneyimi (UX)
1.  **Satın Alma:** Fan kutuyu seçer ve "100 Coin ile Aç" der.
2.  **Animasyon:** Kutu sallanır, ışıklar saçar (Slot makinesi hissi).
3.  **Sonuç:** Kutu patlar ve içinden çıkan içerik (Kart şeklinde) ekrana gelir.
4.  **Koleksiyon:** Kazanılan içerik kullanıcının "Koleksiyon" sekmesine eklenir.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE mystery_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE mystery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES mystery_boxes(id),
  media_url TEXT NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  drop_rate DOUBLE PRECISION NOT NULL, -- Örn: 0.01 (%1)
  stock INTEGER -- Opsiyonel: Sınırlı stok
);
```

### Logic (RNG - Random Number Generator)
Şans faktörü **kesinlikle sunucuda** (Edge Function) hesaplanmalıdır. Client'a güvenilmez.
*   `open-mystery-box`:
    1.  Bakiye düş.
    2.  0-1 arası rastgele sayı üret.
    3.  Olasılık tablosuna göre hangi item'ın çıktığını belirle.
    4.  Item'ı kullanıcıya ata (`user_inventory`).
    5.  Sonucu döndür.

## 4. Mobil Uygulama
*   **Lottie:** Kutunun açılma animasyonu çok tatmin edici olmalı.
*   **Sound:** Kazanma sesi (Win Sound) dopamin salgılatmalı.

## 5. Yasal Uyarı
Bazı ülkelerde (ve App Store kurallarında) Loot Box'lar "Kumar" sayılabilir.
*   **Kural:** Kutunun içinden çıkabileceklerin oranları (Drop Rates) kullanıcıya şeffaf bir şekilde gösterilmelidir.
