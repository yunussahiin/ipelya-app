# 👻 Ghost Mode & "Who's Nearby"

## 1. Konsept
Kullanıcıların fiziksel olarak yakınlarındaki (örn: aynı kafe, aynı konser) diğer İpelya kullanıcılarını **anonim** veya **bulanık** (Shadow) şekilde görmesi.

**Amaç:** "Acaba şu an etrafımda kimler var?" merakını gidermek ve dijitalden tanışmaya kapı aralamak.

## 2. Kullanıcı Deneyimi (UX)
1.  **Radar Ekranı:**
    *   Ekranda merkezde kullanıcı, etrafında halkalar şeklinde diğer kullanıcılar (Avatar yerine Shadow silüetleri).
    *   Mesafeye göre (5m, 10m, 50m) konumlanırlar.
2.  **Etkileşim (Poke/Vibe):**
    *   Bir silüete tıklandığında profilin "Shadow" versiyonu (ilgi alanları, mood, çalan şarkı) görünür.
    *   Kullanıcı "Vibe" gönderebilir (Coin ile veya ücretsiz).
    *   Karşı taraf kabul ederse profiller netleşir (Reveal).
3.  **Gizlilik (Ghost Mode):**
    *   Kullanıcı istediği an "Ghost Mode"u açıp radardan kaybolabilir.

## 3. Teknik Mimari (Supabase & Realtime)

Bu özellik için veritabanına sürekli yazmak (polling) yerine **Redis** veya **Supabase Realtime (Broadcast)** kullanmak daha performanslıdır. Ancak kalıcılık gerekmediği için "Ephemeral State" mantığı uygundur.

### Database (Presence Tracking)
Eğer geçmişi tutmak istemiyorsak, sadece son konumu tutan bir tablo yeterli.

```sql
CREATE TABLE user_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  location GEOGRAPHY(POINT, 4326),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_ghost_mode BOOLEAN DEFAULT false,
  
  -- Metadata (O an dinlediği şarkı, mood vs.)
  status_message TEXT,
  current_vibe TEXT
);

-- Eski verileri temizlemek için Cron Job gerekir (örn: 1 saatten eski verileri sil/null yap)
```

### API (Konum Güncelleme)
Kullanıcı uygulama açıkken her 1-5 dakikada bir (veya önemli yer değiştirmede) konumunu günceller.

```typescript
// Edge Function veya RPC
update_location(lat, long, is_ghost)
```

### Sorgu (Yakındakileri Bul)
```sql
SELECT * FROM user_locations
WHERE ST_DWithin(location, my_location, 100) -- 100 metre
AND is_ghost_mode = false
AND last_seen_at > now() - INTERVAL '10 minutes';
```

## 4. Mobil Uygulama (Expo)

### Konum Stratejisi
*   **Foreground:** Uygulama açıkken hassas konum alınır.
*   **Background:** Bu özellik genelde "o an" bakmak için olduğu için background takibi şart değildir (pil tasarrufu için). Kullanıcı "Radar" sayfasına girdiğinde tarama başlar.

### Bluetooth Low Energy (BLE) - Opsiyonel
GPS kapalı alanlarda (AVM, Kafe) iyi çalışmaz. BLE ile cihazlar birbirini "görebilir".
*   *Kütüphane:* `react-native-ble-plx` (Config Plugin gerektirir, Development Build şart).
*   *Mantık:* Her cihaz benzersiz bir UUID yayınlar (Advertise). Diğer cihazlar tarar (Scan). Eşleşen UUID sunucudan sorgulanır.

## 5. Zorluklar & Çözümler
*   **Gizlilik (Stalking):** Birinin konumunu sürekli takip etmek için kullanılabilir.
    *   *Çözüm:* Tam konum asla gösterilmez. Sadece "Yakında" veya "50m uzakta" denir. Haritada nokta olarak gösterilmez, liste veya radar (yön belirtmeden) olarak gösterilir.
    *   *Çözüm:* "Block"lanan kullanıcılar asla görünmez.
*   **Pil:** Sürekli tarama pili bitirir.
    *   *Çözüm:* Sadece Radar ekranı açıkken tarama yap.
