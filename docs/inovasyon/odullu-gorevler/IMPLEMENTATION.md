# 🎯 Bounty System (Ödüllü Görevler)

## 1. Konsept
Kullanıcıların Coin karşılığında diğer kullanıcılardan belirli içerikler (fotoğraf, video, bilgi) talep etmesi. "Freelancer" modelinin sosyal medyaya uyarlanmış hali.

**Örnekler:**
*   "Şu an Kadıköy vapur iskelesinde sıra var mı? Foto atana 50 Coin."
*   "En komik kedi videosunu atana 100 Coin."
*   "Bana doğum günüm için şarkı söyleyene 500 Coin."

## 2. Kullanıcı Deneyimi (UX)
1.  **Görev Açma (Create Bounty):**
    *   Başlık, Açıklama, Ödül Miktarı (Coin), Süre (örn: 1 saat) girilir.
    *   Lokasyon bazlı ise haritadan yer seçilir.
    *   Coin kullanıcının hesabından "Emanet" (Escrow) hesabına geçer.
2.  **Katılım (Submission):**
    *   Diğer kullanıcılar görevi görür (Listede veya Haritada).
    *   "Yanıtla" diyerek fotoğraf/video çeker ve yükler.
3.  **Ödül Dağıtımı (Reward):**
    *   Görev sahibi gelen yanıtları görür.
    *   Birini (veya birkaçını) "Kazanan" seçer.
    *   Coin kazananın hesabına geçer.
    *   Süre dolarsa ve kazanan seçilmezse Coin iade edilir (veya sistem otomatik en çok like alanı seçer).

## 3. Teknik Mimari (Supabase)

### Database Schema

```sql
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  
  title TEXT NOT NULL,
  description TEXT,
  reward_amount INTEGER NOT NULL CHECK (reward_amount > 0),
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  
  location GEOGRAPHY(POINT, 4326), -- Opsiyonel lokasyon
  
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bounty_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coin Transactions (Mevcut ekonomi tablosuna ek)
-- transaction_type: 'bounty_create', 'bounty_reward', 'bounty_refund'
```

### Edge Functions (Logic)
Bu sistemde "Güven" kritiktir, bu yüzden işlemler sunucu tarafında (Edge Function) yapılmalıdır.

*   `create-bounty`:
    1.  Kullanıcının bakiyesini kontrol et.
    2.  Yeterliyse bakiyeden düş.
    3.  Bounty kaydını oluştur.
*   `select-winner`:
    1.  Bounty'nin sahibi mi kontrol et.
    2.  Bounty aktif mi kontrol et.
    3.  Submission'ı `is_winner=true` yap.
    4.  Ödülü kazanan kullanıcıya transfer et.
    5.  Bounty status'u `completed` yap.

## 4. Mobil Uygulama (Expo)

### UI Bileşenleri
*   **BountyCard:** Ödül miktarını büyük fontla gösteren, dikkat çekici kart tasarımı.
*   **SubmissionGallery:** Gelen yanıtların grid görünümü.
*   **Camera Interface:** Yanıt verirken hızlıca kamera açılması (VisionCamera).

### Bildirimler
*   "Civarında 500 Coin ödüllü yeni bir görev var!" (Geofence trigger).
*   "Görevine yeni bir yanıt geldi."
*   "Tebrikler! Yanıtın seçildi ve 100 Coin kazandın."

## 5. Zorluklar & Çözümler
*   **Spam/Troll:** Kullanıcılar alakasız fotoğraflar atabilir.
    *   *Çözüm:* Görev sahibine "Raporla" butonu koyulmalı. Çok raporlanan kullanıcılar geçici banlanır.
*   **Ödeme Güvenliği:** Görev sahibi yanıtı alıp "Beğenmedim" diyerek parayı geri almaya çalışabilir.
    *   *Çözüm:* "Otomatik Kabul" süresi (örn: yanıt geldikten 24 saat sonra itiraz edilmezse otomatik onay). Veya "En çok like alan kazanır" modu.
