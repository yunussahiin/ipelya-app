# LiveKit Limitler ve Kalite Profili

> Kotalar, bitrate ayarları, süre limitleri ve maliyet yönetimi

## 1. LiveKit Cloud Plan Limitleri

### Build Plan (Free)

| Kaynak                         | Limit            | Notlar                           |
| ------------------------------ | ---------------- | -------------------------------- |
| **WebRTC Participant Minutes** | 5,000/ay         | Tüm projeler arasında paylaşılır |
| **Concurrent Participants**    | 100 toplam       | Tüm odalarda toplam              |
| **Downstream Data Transfer**   | 50 GB/ay         | Video ağırlıklıysa hızla dolar   |
| **Egress (Recording)**         | 60 dakika/ay     | Composite + track dahil          |
| **Egress File Output**         | Max 3 saat       | Tek kayıt başına                 |
| **Egress Streaming**           | Max 12 saat      | HLS/RTMP                         |
| **Agent Sessions**             | 5 concurrent     | AI agent kullanıyorsan           |
| **Server API Rate**            | 1,000 req/dakika | Token üretimi dahil              |

### Ship Plan ($49/ay) - Önerilen

| Kaynak                     | Limit                 |
| -------------------------- | --------------------- |
| WebRTC Participant Minutes | 10,000/ay + $0.004/dk |
| Concurrent Participants    | 1,000                 |
| Egress                     | 500 dakika/ay         |

### ⚠️ Limit Aşıldığında

- **Free plan:** Yeni bağlantılar reddedilir
- **Paid plan:** Overage ücretlendirilir

---

## 2. Supabase Realtime Limitleri

| Kaynak               | Free  | Pro               |
| -------------------- | ----- | ----------------- |
| **Peak Connections** | 200   | 500 (+$10/1000)   |
| **Messages**         | 2M/ay | 5M/ay (+$2.50/1M) |
| **Database Changes** | ∞     | ∞                 |

### Realtime Kullanım Alanları

| Özellik               | Mesaj Hacmi |
| --------------------- | ----------- |
| Live chat             | Yüksek      |
| Participant list sync | Düşük       |
| Session status update | Düşük       |
| Gift animations       | Orta        |

---

## 3. Video Kalite Profilleri

### Canlı Video Yayını (Creator)

```typescript
const publishOptions = {
  videoEncoding: {
    maxBitrate: 2_500_000, // 2.5 Mbps
    maxFramerate: 30,
  },
  videoSimulcastLayers: [
    { width: 1280, height: 720, encoding: { maxBitrate: 2_500_000, maxFramerate: 30 } }, // High
    { width: 640, height: 360, encoding: { maxBitrate: 800_000, maxFramerate: 30 } },   // Medium
    { width: 320, height: 180, encoding: { maxBitrate: 200_000, maxFramerate: 15 } },   // Low
  ],
};
```

### 1-1 Görüntülü Çağrı

```typescript
const callPublishOptions = {
  videoEncoding: {
    maxBitrate: 1_500_000, // 1.5 Mbps
    maxFramerate: 30,
  },
  // Simulcast gereksiz, 2 kişi
  videoSimulcastLayers: undefined,
};
```

### Sesli Oda (Audio Only)

```typescript
const audioPublishOptions = {
  audioBitrate: 48_000, // 48 kbps Opus
  dtx: true, // Discontinuous Transmission (sessizlikte bandwidth tasarrufu)
};
```

---

## 4. Adaptive Quality (Zayıf Bağlantı)

### Otomatik Kalite Düşürme

```typescript
const room = new Room({
  adaptiveStream: true,  // Viewer bandwidth'e göre layer seç
  dynacast: true,        // İzlenmeyen track'leri gönderme
  videoCaptureDefaults: {
    resolution: { width: 1280, height: 720 },
  },
});
```

### Manuel Kalite Kontrolü

```typescript
// Viewer tarafında kalite seçimi
function setQualityPreference(quality: 'auto' | 'high' | 'medium' | 'low') {
  remoteParticipants.forEach(p => {
    p.videoTrackPublications.forEach(pub => {
      if (quality === 'auto') {
        pub.setVideoQuality(VideoQuality.HIGH);
        pub.setVideoDimensions({ width: 0, height: 0 }); // Auto
      } else {
        const dimensions = {
          high: { width: 1280, height: 720 },
          medium: { width: 640, height: 360 },
          low: { width: 320, height: 180 },
        }[quality];
        pub.setVideoDimensions(dimensions);
      }
    });
  });
}
```

### Mobil Veri Modu

```typescript
// Kullanıcı mobil verideyse otomatik düşük kalite
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  if (state.type === 'cellular') {
    setQualityPreference('low');
    showToast('Mobil veri algılandı, düşük kaliteye geçildi');
  } else if (state.type === 'wifi') {
    setQualityPreference('auto');
  }
});
```

---

## 5. Süre Limitleri

### Önerilen Limitler

| Tip                 | Max Süre | Uygulama                 |
| ------------------- | -------- | ------------------------ |
| Canlı Video Yayını  | 4 saat   | Soft limit, uyarı göster |
| Sesli Oda           | 8 saat   | Soft limit               |
| 1-1 Görüntülü Çağrı | 2 saat   | Hard limit               |
| 1-1 Sesli Çağrı     | 4 saat   | Hard limit               |
| Kayıt (Recording)   | 3 saat   | LiveKit hard limit       |

### Süre Kontrolü Implementation

```typescript
// Edge function'da session başlatırken
const MAX_DURATION_MS = {
  video_live: 4 * 60 * 60 * 1000,  // 4 saat
  audio_room: 8 * 60 * 60 * 1000,  // 8 saat
  video_call: 2 * 60 * 60 * 1000,  // 2 saat
  audio_call: 4 * 60 * 60 * 1000,  // 4 saat
};

// Scheduled check
async function checkSessionDurations() {
  const sessions = await supabase
    .from('live_sessions')
    .select('id, session_type, started_at, livekit_room_name')
    .eq('status', 'live');

  for (const session of sessions.data) {
    const duration = Date.now() - new Date(session.started_at).getTime();
    const maxDuration = MAX_DURATION_MS[session.session_type];

    if (duration >= maxDuration) {
      // Zorla sonlandır
      await endSession(session.id, 'max_duration_reached');
    } else if (duration >= maxDuration * 0.9) {
      // %90'a ulaştıysa uyarı gönder
      await sendDurationWarning(session, Math.floor((maxDuration - duration) / 60000));
    }
  }
}
```

---

## 6. Maliyet Takibi

### Webhook ile İstatistik Toplama

```typescript
// livekit-webhook handler
case 'room_finished':
  const { data: session } = await supabase
    .from('live_sessions')
    .select('started_at, peak_viewers')
    .eq('livekit_room_name', event.room.name)
    .single();

  const duration = Math.floor(
    (Date.now() - new Date(session.started_at).getTime()) / 1000
  );

  await supabase.from('live_sessions').update({
    total_duration_seconds: duration,
    // Her viewer'ın dakikası = maliyet
    estimated_participant_minutes: session.peak_viewers * Math.ceil(duration / 60),
  }).eq('livekit_room_name', event.room.name);
  break;
```

### Dashboard Metrikleri (Ops)

```sql
-- Aylık kullanım raporu
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(total_duration_seconds) / 60 as total_minutes,
  SUM(peak_viewers) as total_peak_viewers,
  SUM(estimated_participant_minutes) as estimated_livekit_minutes,
  COUNT(*) as session_count
FROM live_sessions
WHERE status = 'ended'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## 7. Kota Uyarı Sistemi Sadece bilgilendirme açısından, kota problem değil.

### Threshold'lar

| Kullanım | Aksiyon                                  |
| -------- | ---------------------------------------- |
| %50      | Ops dashboard'da göster                  |
| %75      | email alert öncelik değil.               |
| %90      | Kritik uyarı + yeni session'ları kısıtla |
| %100     | Yeni session oluşturmayı engelle         |

### Implementation

```typescript
async function checkQuotaUsage() {
  const { data: stats } = await supabase.rpc('get_monthly_livekit_usage');
  
  const MONTHLY_QUOTA = 5000; // dakika
  const usagePercent = (stats.total_minutes / MONTHLY_QUOTA) * 100;

  if (usagePercent >= 90) {
    await sendAlert('CRITICAL', `LiveKit quota %${usagePercent.toFixed(1)} kullanıldı`);
    // Yeni premium session'ları engelle
    await supabase.from('system_config').upsert({
      key: 'livekit_quota_exceeded',
      value: true,
    });
  } else if (usagePercent >= 75) {
    await sendAlert('WARNING', `LiveKit quota %${usagePercent.toFixed(1)} kullanıldı`);
  }
}
```

---

## 8. Plan Yükseltme Kriterleri - Plan yükseltilebilir, sadece bilgilendirme açısından.

### Free → Ship Geçiş Zamanı

- [ ] Aylık 4,000+ participant minute
- [ ] 50+ concurrent viewer
- [ ] Recording ihtiyacı > 30 dakika/ay
- [ ] Profesyonel SLA gereksinimi

### Maliyet Hesaplama

```
Ship Plan Base: $49/ay
+ Overage Minutes: (kullanım - 10,000) × $0.004
+ Egress Minutes: (kullanım - 500) × $0.05
= Toplam Aylık Maliyet
```

**Örnek:** 15,000 participant minute + 600 dakika egress
```
$49 + (5,000 × $0.004) + (100 × $0.05) = $49 + $20 + $5 = $74/ay
```
