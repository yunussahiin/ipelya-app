# 🌫️ Interactive Tease (Soyunma Oyunu)

## 1. Konsept
Creator'ın yüklediği bir fotoğrafın başlangıçta tamamen "Shadow" (siyah duman/buzlu) ile kaplı olması. Kullanıcılar topluca (Crowdfunding) veya bireysel olarak Coin attıkça görselin üzerindeki dumanın yavaş yavaş kalkması.

**Motto:** "Merak kediyi... ödüllendirir."

## 2. Kullanıcı Deneyimi (UX)
1.  **Creator:** Fotoğrafı yükler ve "Hedef: 1000 Coin" der.
2.  **Fanlar:** Görseli tamamen bulanık görür. Altında bir "Progress Bar" vardır.
3.  **Aksiyon:**
    *   Fan A 100 Coin atar -> Görselin %10'u netleşir (Rastgele veya merkezden dışa doğru).
    *   Fan B 500 Coin atar -> Görselin %50'si daha netleşir.
4.  **Tamamlama:** Hedefe ulaşılınca görsel herkese (veya sadece katkıda bulunanlara) tamamen açılır.

## 3. Teknik Mimari

### Görüntü İşleme (Image Processing)
Bu işlem dinamik olmalıdır.
1.  **Client-Side (Önerilen):** Görsel aslında telefona tam iner ama üzerinde `BlurView` (expo-blur) veya `Canvas` maskesi vardır. Coin atıldıkça maskenin opacity'si veya blur miktarı kod ile azaltılır. Bu sunucu maliyetini sıfırlar.
2.  **Server-Side (Güvenli):** Eğer "Hacklenip açılmasın" deniyorsa, sunucuda `sharp` kütüphanesi ile görselin 10 farklı versiyonu (Blur %100, Blur %90...) tutulur. Coin seviyesine göre ilgili versiyon servis edilir.

### Database
```sql
CREATE TABLE tease_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  media_url TEXT NOT NULL,
  
  target_amount INTEGER NOT NULL,
  current_amount INTEGER DEFAULT 0,
  
  is_revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tease_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tease_id UUID NOT NULL REFERENCES tease_posts(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Realtime
Supabase Realtime ile `current_amount` değişimi anlık olarak tüm clientlara push edilir, böylece herkes aynı anda görselin açıldığını görür (Heyecan faktörü).

## 4. Mobil Uygulama
*   **Animasyon:** `react-native-reanimated` ile blur miktarını yumuşakça (interpolate) azaltmak.
*   **Efekt:** Coin atıldığında ekranda konfetiler veya duman efektleri uçuşmalı.
