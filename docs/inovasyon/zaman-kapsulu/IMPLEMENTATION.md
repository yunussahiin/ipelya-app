# 📍 Time Capsule (Zaman Kapsülü) & Location Drops

## 1. Konsept
Kullanıcıların belirli bir coğrafi konuma (latitude/longitude) dijital bir içerik (fotoğraf, video, not) bırakması ve bu içeriğin **sadece** o konuma fiziksel olarak giden diğer kullanıcılar tarafından açılabilmesi.

**Twist:** İçerik "kilitli" olabilir (örneğin: "Bu kapsül 2026'da açılacak").

## 2. Kullanıcı Deneyimi (UX)
1.  **Bırakma (Drop):**
    *   Kullanıcı story oluştururken "Konuma Bırak" seçeneğini seçer.
    *   Harita üzerinden tam konumu teyit eder.
    *   (Opsiyonel) Bir kilit süresi veya hedef kitle (Sadece Arkadaşlar) belirler.
2.  **Keşfetme (Discovery):**
    *   Harita modunda (Map View) etraftaki kapsüller ikon olarak görünür.
    *   Kullanıcı kapsüle yaklaştığında (örn: 50 metre) telefon titrer ve "Yakınında bir kapsül var!" bildirimi gelir.
3.  **Açma (Unlock):**
    *   Kullanıcı menzile girdiğinde (Geofence) "Aç" butonu aktif olur.
    *   İçerik görüntülenir ve (opsiyonel) envantere eklenir.

## 3. Teknik Mimari (Supabase)

### Database Schema
**Durum:** Projede `postgis` eklentisi şu an **KAPALI**. Aktif edilmelidir.

```sql
-- 1. PostGIS eklentisini aç (Zorunlu)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabloyu oluştur
CREATE TABLE time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Konum (PostGIS Point)
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  
  -- İçerik
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'text')),
  message TEXT,
  
  -- Kısıtlamalar
  unlock_radius_meters INTEGER DEFAULT 50, -- Kaç metre yakınına gelmeli
  unlock_at TIMESTAMPTZ DEFAULT now(), -- Ne zaman açılabilir (Time lock)
  expires_at TIMESTAMPTZ, -- Ne zaman kaybolur
  
  -- Erişim
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mekansal İndeks (Hızlı sorgu için kritik)
CREATE INDEX idx_time_capsules_location ON time_capsules USING GIST (location);
```

### Edge Functions (RPC)
Belirli bir yarıçaptaki kapsülleri getirmek için.

```sql
-- Yakındaki kapsülleri getir
CREATE OR REPLACE FUNCTION get_nearby_capsules(
  user_lat DOUBLE PRECISION,
  user_long DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION
)
RETURNS SETOF time_capsules
LANGUAGE sql
AS $$
  SELECT *
  FROM time_capsules
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(user_long, user_lat), 4326),
    radius_meters
  )
  AND (unlock_at <= now()) -- Zaman kilidi kontrolü
  AND (expires_at IS NULL OR expires_at > now());
$$;
```

## 4. Mobil Uygulama (Expo)

### Gerekli Kütüphaneler
*   `expo-location`: Konum takibi ve izinler.
*   `react-native-maps`: Harita arayüzü (Google Maps / Apple Maps).
*   `turf.js` (veya `geolib`): Client-side mesafe hesaplamaları (anlık UI güncellemeleri için).

### Implementasyon Adımları
1.  **İzinler:** `Location.requestForegroundPermissionsAsync()` ile izin al.
2.  **Konum Takibi:** `Location.watchPositionAsync` ile kullanıcının hareketini dinle.
3.  **Mesafe Kontrolü:**
    *   Kullanıcı hareket ettikçe, eldeki kapsül listesiyle arasındaki mesafeyi hesapla (`geolib.getDistance`).
    *   Mesafe < `unlock_radius_meters` ise UI'da "Aç" butonunu aktif et.
4.  **AR Modu (İleri Seviye):**
    *   `expo-camera` veya `ViroReact` kullanarak kapsülü kamera görüntüsü üzerinde (Pokemon GO gibi) gösterebiliriz.

## 5. Zorluklar & Çözümler
*   **GPS Sapması:** GPS bazen 10-20m sapabilir. `unlock_radius` çok küçük (örn: 5m) tutulmamalı, en az 30-50m olmalı.
*   **Pil Tüketimi:** Sürekli GPS takibi pili yer. Sadece "Harita Modu" açıkken veya uygulama ön plandayken aktif takip yapılmalı.
*   **Fake GPS:** Kullanıcılar sahte konum kullanabilir. Android'de `isMockProvider` kontrolü yapılabilir ama %100 engellemek zordur. Server-side check (IP konumu ile GPS karşılaştırma) eklenebilir.
