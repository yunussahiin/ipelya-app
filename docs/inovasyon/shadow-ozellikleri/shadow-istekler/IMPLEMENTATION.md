# 📝 Shadow Requests (Özel İstek)

## 1. Konsept
Kullanıcıların Creator'lardan kişiselleştirilmiş, özel içerikler talep etmesi. Bu talepler Shadow modda olduğu için tamamen anonimdir ve daha "cesur" olabilir.

**Örnekler:** "Adımı kağıda yazıp fotoğraf çek", "Benim için şu şarkıyı söyle", "Kırmızı elbiseni giy".

## 2. Kullanıcı Deneyimi (UX)
1.  **Talep (Request):** Fan, Creator profilindeki "Özel İstek" butonuna basar. İsteğini yazar ve teklif ettiği ücreti (örn: 5000 Coin) girer.
2.  **Onay (Review):** Creator gelen istekleri listeler. Kabul eder, reddeder veya fiyatı artırır (Pazarlık).
3.  **Teslim (Delivery):** Creator içeriği hazırlar ve sisteme yükler.
4.  **Tamamlama:** Fan içeriği alır, Coin Creator'a geçer.

## 3. Teknik Mimari

### Database
```sql
CREATE TABLE shadow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  
  description TEXT NOT NULL,
  offered_price INTEGER NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  
  delivery_url TEXT, -- Teslim edilen içerik
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Escrow (Emanet) Sistemi
Güven için Coin, talep oluşturulduğu an Fan'dan düşülmeli ve havuzda bekletilmelidir.
*   Creator reddederse -> İade.
*   Creator yapmazsa (Süre aşımı) -> İade.
*   Teslim edilirse -> Creator'a transfer.

## 4. Mobil Uygulama
*   **Form:** Basit ve net bir talep formu.
*   **Dashboard:** Creator için "Bekleyen İşler" paneli (To-Do list gibi).

## 5. Moderasyon
İstek metinleri otomatik filtreden geçmelidir. Yasadışı veya aşırı istekler engellenmelidir.
