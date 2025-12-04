# 🏰 The "Inner Circle" (Harem/Konsey)

## 1. Konsept
Her Creator'ın profilinde, o Creator'a **en çok Coin harcayan** (Lifetime veya Aylık) ilk 5-10 kişinin avatarının sergilendiği, altın çerçeveli prestijli bir alan.

**Psikoloji:** "Top Donor" listesi, rekabeti ve harcamayı körükleyen en güçlü mekanizmadır (Twitch/TikTok modeli).

## 2. Kullanıcı Deneyimi (UX)
1.  **Görünüm:** Profilin en üstünde "Inner Circle" başlığı altında 5 yuvarlak avatar. 1. sıradaki en büyük ve en süslü çerçeveye sahip.
2.  **Rekabet:** Bir kullanıcı profile girdiğinde "Inner Circle'a girmek için 500 Coin daha harca" uyarısını görür.
3.  **Ayrıcalıklar:**
    *   **Priority DM:** Bu listedekilerin mesajları Creator'ın kutusunda en üstte ve "Altın" renkli görünür.
    *   **Badge:** İsimlerinin yanında özel bir ikon (Taç) çıkar.
    *   **Exclusive Content:** Sadece bu gruba özel story atılabilir.

## 3. Teknik Mimari

### Database
Harcamaların anlık toplanması (Aggregation) maliyetlidir. Bu yüzden `user_spendings` tablosu tutulmalı ve her işlemde güncellenmelidir (Trigger veya Application Logic).

```sql
CREATE TABLE creator_top_spenders (
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  fan_id UUID NOT NULL REFERENCES auth.users(id),
  
  total_spent INTEGER DEFAULT 0,
  last_spent_at TIMESTAMPTZ DEFAULT now(),
  
  rank INTEGER, -- 1, 2, 3... (Hesaplanmış alan)
  
  PRIMARY KEY (creator_id, fan_id)
);

CREATE INDEX idx_top_spenders_rank ON creator_top_spenders(creator_id, total_spent DESC);
```

### Logic
*   **Transaction:** Her `spend_coin` işleminde bu tablo `ON CONFLICT DO UPDATE SET total_spent = total_spent + EXCLUDED.amount` ile güncellenir.
*   **Realtime:** Sıralama değiştiğinde (Örn: 2. sıradaki 1. sıraya geçtiğinde) `broadcast` ile bildirim gönderilir: "X seni tahtından indirdi!"

## 4. Mobil Uygulama
*   **Animasyon:** Sıralama değişimleri canlı ve animasyonlu olmalı.
*   **Profil UI:** `FlashList` yatay kaydırma ile avatarlar gösterilir.

## 5. Monetization
Bu özellik, "Balina" (Whale) olarak adlandırılan ve çok harcayan %1'lik kitleyi hedefler. Gelirin büyük kısmını bu kitle oluşturur.
