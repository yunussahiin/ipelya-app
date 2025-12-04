# 🔨 Shadow Auction (Gölge Müzayedesi)

## 1. Konsept
Creator'ın çok özel, tekil (unique) bir içerik veya deneyim için sınırlı süreli açık artırma başlatması. En yüksek teklifi veren kazanır.

**Örnekler:**
*   "Bu elbisemi kime kargolayayım?"
*   "1 saatlik özel görüntülü görüşme."
*   "Sıradaki dövmemi kim seçecek?"

## 2. Kullanıcı Deneyimi (UX)
1.  **Başlatma:** Creator ürünü koyar, başlangıç fiyatını (örn: 1000 Coin) ve süreyi (örn: 1 saat) belirler.
2.  **Teklif (Bid):** Fanlar "Teklif Ver" butonuyla artırır. Her teklifte süre 10 saniye uzar (Sniper engelleme).
3.  **Kilitlenme:** Teklif verilen Coin, kullanıcının bakiyesinden "Bloke" edilir (Escrow).
4.  **Sonuç:** Süre biter. Kazananın Coini Creator'a geçer. Kaybedenlerin blokesi kalkar.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  
  start_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  highest_bidder_id UUID REFERENCES auth.users(id),
  
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id),
  bidder_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Realtime & Concurrency
Açık artırma "Yarış Durumu" (Race Condition) riskinin en yüksek olduğu yerdir.
*   **Atomic Updates:** Teklif verme işlemi kesinlikle veritabanı seviyesinde (Stored Procedure) ve kilitli (Row Locking) yapılmalıdır.
*   **WebSocket:** Fiyat değişimi anlık olarak tüm ekranlara yansımalıdır.

## 4. Mobil Uygulama
*   **Countdown Timer:** Geri sayım sayacı. Son 1 dakikada kırmızı yanıp söner.
*   **Haptic:** Yeni teklif geldiğinde telefon titrer.

## 5. Riskler
*   **Ödeme Başarısızlığı:** Kullanıcının bakiyesi yetersizse teklif verememeli. Bu yüzden teklif anında bakiye kontrolü ve blokaj şarttır.
