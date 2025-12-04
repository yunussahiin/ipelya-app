# 🎁 Virtual Gifts (Naughty Edition)

## 1. Konsept
Standart sosyal medya hediyeleri (Gül, Ayıcık) yerine, Shadow modun atmosferine uygun, daha cüretkar ve oyunlaştırılmış hediye ikonları.

**Örnekler:**
*   🍷 Şampanya Kadehi (50 Coin)
*   💋 Dudak İzi (100 Coin)
*   🎭 Maske (200 Coin)
*   ⛓️ Kelepçe (500 Coin)
*   👑 Taç (1000 Coin)

## 2. Kullanıcı Deneyimi (UX)
1.  **Gönderim:** Canlı yayında, Story'de veya DM'de hediye menüsü açılır.
2.  **Efekt:** Hediye gönderildiğinde ekranda o hediyeye özel bir animasyon (Lottie) oynar.
    *   Örn: Dudak izi ekrana yapışır ve öpücük sesi gelir.
    *   Örn: Kelepçe sesi gelir ve ekran kısa süre titrer.
3.  **Leaderboard:** Creator'ın profilinde "En Çok Hediye Gönderenler" listesi.

## 3. Teknik Mimari

### Database
Mevcut `gifts` tablosuna `category` ve `animation_url` eklenmeli.

```sql
CREATE TABLE gift_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  animation_url TEXT, -- Lottie JSON URL
  sound_url TEXT, -- MP3 URL
  
  price INTEGER NOT NULL,
  category TEXT DEFAULT 'standard' CHECK (category IN ('standard', 'shadow', 'kink')),
  
  is_active BOOLEAN DEFAULT true
);
```

## 4. Mobil Uygulama
*   **Lottie:** `lottie-react-native` ile yüksek kaliteli vektör animasyonlar.
*   **Sound:** `expo-audio` ile kısa ses efektleri (SFX).

## 5. Gelir
Sanal hediyeler, sosyal statü göstergesi olduğu için en yüksek kar marjına sahip üründür. Shadow temalı olması, kullanıcıların "Flört" etmek için bunları kullanmasını teşvik eder.
