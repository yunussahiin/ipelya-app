# 🕯️ The "Dark Room" (VIP Canlı Yayın)

## 1. Konsept
Creator'ın açtığı, çok kısıtlı sayıda (örn: 10 kişi) izleyicinin katılabildiği, giriş ücreti çok yüksek (örn: 1000 Coin) olan özel canlı yayın odası.

**Atmosfer:** Standart yayından farklı olarak, burada izleyiciler de (isterlerse) sesli veya görüntülü katılabilir. Bir "Sohbet Odası" havasındadır.

## 2. Kullanıcı Deneyimi (UX)
1.  **Duyuru:** Creator "Bu akşam 23:00'te Dark Room açıyorum, sadece 10 bilet" der.
2.  **Biletleme:** Fanlar önceden veya anlık olarak bilet alır.
3.  **Yayın:**
    *   Ekran karanlık temalıdır.
    *   Gecikme (Latency) çok düşüktür (Real-time interaction).
    *   Creator izleyicileri sahneye alabilir.

## 3. Teknik Mimari (LiveKit)
Mevcut LiveKit altyapısı buna çok uygundur.

### Oda Yapısı
*   `room_type`: 'dark_room'
*   `max_participants`: 11 (1 Creator + 10 Fan)
*   `audio_only`: Opsiyonel (Sadece sesli Dark Room).

### Database
```sql
CREATE TABLE dark_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  
  title TEXT,
  ticket_price INTEGER NOT NULL,
  max_viewers INTEGER DEFAULT 10,
  
  starts_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  
  livekit_room_name TEXT
);

CREATE TABLE dark_room_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES dark_rooms(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 4. Mobil Uygulama
*   **Video:** `livekit-client` ile entegrasyon.
*   **Sahne Kontrolü:** Creator'ın kimin konuşacağını yönettiği bir admin paneli.

## 5. Monetization
Az kişi * Yüksek Fiyat = Yüksek Gelir + Düşük Efor. Creatorlar için çok cazip bir modeldir.
