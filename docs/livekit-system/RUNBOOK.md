# LiveKit Operasyonel Runbook

> Troubleshooting, acil müdahale prosedürleri ve operasyonel rehber

## 1. Sık Karşılaşılan Sorunlar

### 🔴 "Yayın var ama kimse bağlı değil"

**Belirtiler:**
- DB'de `status = 'live'`
- Viewer sayısı 0
- Creator şikayeti: "Kimse beni görmüyor"

**Teşhis:**
```sql
-- Session durumunu kontrol et
SELECT id, status, started_at, livekit_room_name, 
       NOW() - started_at as duration
FROM live_sessions
WHERE status = 'live' AND id = '<session_id>';

-- LiveKit'te oda var mı? (CLI ile)
lk room list --url <LIVEKIT_URL> --api-key <KEY> --api-secret <SECRET>
```

**Çözüm:**
1. LiveKit CLI ile odayı kontrol et
2. Oda yoksa veya boşsa:
   ```sql
   UPDATE live_sessions 
   SET status = 'ended', ended_at = NOW(), end_reason = 'orphaned'
   WHERE id = '<session_id>';
   ```
3. Creator'a "Yayını yeniden başlatın" mesajı gönder

---

### 🔴 "Token üretilemedi" hatası

**Belirtiler:**
- Kullanıcı yayına katılamıyor
- Edge Function 500 hatası

**Teşhis:**
```bash
# Edge Function loglarını kontrol et
supabase functions logs get-livekit-token --project-ref <project_id>
```

**Olası Nedenler:**
| Hata                        | Neden             | Çözüm                |
| --------------------------- | ----------------- | -------------------- |
| `LIVEKIT_API_KEY not found` | Env eksik         | Secrets'ı kontrol et |
| `Session not found`         | Yanlış session ID | Client debug         |
| `Rate limited`              | Çok fazla istek   | Retry logic          |
| `Invalid grant`             | Yetki sorunu      | VideoGrant ayarları  |

**Çözüm:**
1. Supabase Dashboard > Edge Functions > Secrets kontrol
2. Function'ı yeniden deploy et:
   ```bash
   supabase functions deploy get-livekit-token
   ```

---

### 🔴 "Bağlantı kopuyor" şikayetleri

**Belirtiler:**
- Sürekli reconnect
- Video donuyor
- "Yeniden bağlanılıyor" mesajı

**Teşhis:**
1. LiveKit Cloud Dashboard > Analytics > Connection Quality
2. Kullanıcının network tipini öğren (WiFi/4G)
3. Region latency kontrol

**Çözüm:**
1. **Kullanıcı tarafı:** 
   - WiFi'ye geç
   - Uygulamayı yeniden başlat
2. **Platform tarafı:**
   - Adaptive stream aktif mi kontrol et
   - Düşük kalite profili sun

---

### 🔴 Çağrı bağlanmıyor (1-1 Call)

**Belirtiler:**
- Çağrı "ringing" durumunda kalıyor
- Push notification gitmiyor

**Teşhis:**
```sql
-- Çağrı durumunu kontrol et
SELECT * FROM calls WHERE id = '<call_id>';

-- Push token var mı?
SELECT device_token FROM profiles WHERE user_id = '<callee_id>';
```

**Çözüm:**
1. Device token yoksa → Kullanıcı bildirim iznini kapatmış
2. Push gönderildi ama gelmedi → FCM/APNs logları kontrol
3. VoIP push kullanılmıyor → `react-native-callkeep` entegrasyonu gerekli

---

## 2. Manuel Müdahale Prosedürleri

### Session'ı Zorla Kapatma

```typescript
// Admin endpoint
POST /api/ops/sessions/{sessionId}/terminate

// Veya doğrudan:
import { RoomServiceClient } from 'livekit-server-sdk';

const roomService = new RoomServiceClient(url, apiKey, apiSecret);
await roomService.deleteRoom(roomName);

// DB güncelle
await supabase.from('live_sessions').update({
  status: 'ended',
  ended_at: new Date().toISOString(),
  end_reason: 'admin_terminated',
}).eq('id', sessionId);
```

### Kullanıcıyı Zorla Çıkarma

```typescript
// Admin endpoint
POST /api/ops/participants/{sessionId}/{userId}/kick

// Veya:
await roomService.removeParticipant(roomName, participantIdentity);
```

### Tüm Aktif Oturumları Listeleme

```sql
SELECT 
  ls.id,
  ls.title,
  p.username as creator,
  ls.session_type,
  ls.status,
  ls.started_at,
  COUNT(lp.id) as participant_count
FROM live_sessions ls
JOIN profiles p ON ls.creator_profile_id = p.id
LEFT JOIN live_participants lp ON ls.id = lp.session_id AND lp.is_active = true
WHERE ls.status = 'live'
GROUP BY ls.id, p.username
ORDER BY ls.started_at DESC;
```

---

## 3. Acil Durum Prosedürleri

### 🚨 Tüm Sistem Çöktü

**Adımlar:**
1. LiveKit Cloud Status: https://status.livekit.io
2. Supabase Status: https://status.supabase.com
3. Eğer provider sorunu değilse:
   - Edge Function loglarını kontrol et
   - En son deploy'u rollback et

### 🚨 DDoS / Abuse Saldırısı

**Belirtiler:**
- Anormal token request sayısı
- Yeni session oluşturma spike'ı

**Acil Aksiyon:**
```sql
-- Son 5 dakikada en çok session oluşturan kullanıcılar
SELECT creator_id, COUNT(*) as count
FROM live_sessions
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY creator_id
ORDER BY count DESC
LIMIT 10;

-- Şüpheli kullanıcıyı hemen banla
UPDATE profiles SET banned_until = NOW() + INTERVAL '24 hours'
WHERE user_id = '<suspicious_user_id>';
```

### 🚨 Kota Aşıldı

**Belirtiler:**
- Yeni bağlantılar reddediliyor
- `quota_exceeded` hataları

**Acil Aksiyon:**
1. LiveKit Cloud Dashboard > Billing > Usage kontrol
2. Gereksiz session'ları kapat
3. Plan upgrade değerlendir
4. Geçici olarak yeni session oluşturmayı engelle:
   ```sql
   INSERT INTO system_config (key, value) VALUES ('live_sessions_disabled', 'true')
   ON CONFLICT (key) DO UPDATE SET value = 'true';
   ```

---

## 4. Günlük Kontrol Listesi

### Sabah Kontrolü (09:00)

- [ ] LiveKit Cloud Dashboard > Dünün kullanımı
- [ ] Supabase Dashboard > Edge Function errors
- [ ] `live_sessions` tablosu > `status = 'live'` olan eski kayıtlar
- [ ] Şikayet kuyruğu > Pending reports

### Haftalık Kontrol

- [ ] Toplam participant minutes kullanımı
- [ ] Egress (recording) kullanımı
- [ ] En çok izlenen yayınlar analizi
- [ ] Ban/kick istatistikleri

---

## 5. Faydalı SQL Sorguları

### Günlük Özet

```sql
SELECT 
  DATE(started_at) as date,
  COUNT(*) as session_count,
  SUM(total_duration_seconds) / 3600.0 as total_hours,
  SUM(peak_viewers) as total_peak_viewers,
  SUM(total_messages) as total_messages,
  SUM(total_gifts_received) as total_gifts
FROM live_sessions
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### En Aktif Creator'lar

```sql
SELECT 
  p.username,
  COUNT(ls.id) as session_count,
  SUM(ls.total_duration_seconds) / 60 as total_minutes,
  AVG(ls.peak_viewers) as avg_viewers
FROM live_sessions ls
JOIN profiles p ON ls.creator_profile_id = p.id
WHERE ls.started_at > NOW() - INTERVAL '30 days'
GROUP BY p.username
ORDER BY session_count DESC
LIMIT 20;
```

### Sorunlu Session'lar

```sql
-- 1 saatten uzun süredir 'live' olan ama participant'ı olmayan
SELECT ls.*, p.username as creator
FROM live_sessions ls
JOIN profiles p ON ls.creator_profile_id = p.id
LEFT JOIN live_participants lp ON ls.id = lp.session_id AND lp.is_active = true
WHERE ls.status = 'live'
  AND ls.started_at < NOW() - INTERVAL '1 hour'
GROUP BY ls.id, p.username
HAVING COUNT(lp.id) = 0;
```

---

## 6. İletişim ve Eskalasyon

### Destek Kanalları

| Sorun Tipi         | İlk Müdahale | Eskalasyon |
| ------------------ | ------------ | ---------- |
| Kullanıcı şikayeti | Ops ekibi    | PM         |
| Teknik hata        | Backend dev  | Tech Lead  |
| Güvenlik ihlali    | Ops + Dev    | CTO        |
| Ödeme sorunu       | Ops          | Finance    |

### LiveKit Support

- **Docs:** https://docs.livekit.io
- **Discord:** https://livekit.io/community
- **Cloud Support:** Dashboard > Support (paid plans)
