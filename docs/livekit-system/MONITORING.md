# LiveKit Monitoring & Alerting

> Metrikler, dashboard'lar ve alarm yapılandırması

## 1. Takip Edilecek Metrikler

### LiveKit Cloud Metrikleri

| Metrik                      | Kaynak          | Kritik Eşik |
| --------------------------- | --------------- | ----------- |
| **Participant Minutes**     | Cloud Dashboard | %80 quota   |
| **Concurrent Participants** | Cloud Dashboard | %90 limit   |
| **Connection Failures**     | Cloud Analytics | >5%         |
| **Average Join Time**       | Cloud Analytics | >3 saniye   |
| **Egress Minutes**          | Cloud Dashboard | %80 quota   |

### Supabase Metrikleri

| Metrik                    | Kaynak    | Kritik Eşik     |
| ------------------------- | --------- | --------------- |
| **Edge Function Errors**  | Logs      | >1%             |
| **Edge Function Latency** | Logs      | >2 saniye (p95) |
| **Realtime Connections**  | Dashboard | %80 limit       |
| **Database CPU**          | Dashboard | >80%            |
| **RLS Policy Violations** | Logs      | Any             |

### Uygulama Metrikleri

| Metrik                       | Kaynak | Kritik Eşik       |
| ---------------------------- | ------ | ----------------- |
| **Active Sessions**          | DB     | Context-dependent |
| **Orphaned Sessions**        | DB     | >5                |
| **Failed Token Requests**    | Logs   | >10/dakika        |
| **Average Session Duration** | DB     | Trend analizi     |
| **Ban Rate**                 | DB     | Trend analizi     |

---

## 2. Dashboard Yapısı

### Ops Dashboard Sayfaları

#### 2.1 Live Overview
```
┌─────────────────────────────────────────────────────────┐
│  📊 Live Overview                                       │
├─────────────────┬─────────────────┬─────────────────────┤
│ Active Sessions │ Total Viewers   │ Participant Min     │
│      12         │      847        │   3,421 / 5,000     │
├─────────────────┴─────────────────┴─────────────────────┤
│  🔴 Active Sessions List                                │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Creator    │ Type      │ Viewers │ Duration │ Actions│
│  │ @user1     │ video     │ 234     │ 45 min   │ [Kill] │
│  │ @user2     │ audio     │ 89      │ 1h 20m   │ [Kill] │
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### 2.2 Usage & Billing
```
┌─────────────────────────────────────────────────────────┐
│  💰 Usage This Month                                    │
├─────────────────────────────────────────────────────────┤
│  [██████████░░░░░░░░░░] 68% of quota used              │
│                                                         │
│  Participant Minutes: 3,421 / 5,000                     │
│  Egress Minutes: 42 / 60                                │
│  Peak Concurrent: 156 / 100 ⚠️                          │
│                                                         │
│  Projected Month End: 5,100 min (OVER QUOTA)            │
└─────────────────────────────────────────────────────────┘
```

#### 2.3 Incidents
```
┌─────────────────────────────────────────────────────────┐
│  🚨 Pending Reports (8)                                 │
├─────────────────────────────────────────────────────────┤
│  │ Reporter  │ Reported │ Reason     │ Time   │ Actions│
│  │ @viewer1  │ @host1   │ Harassment │ 2h ago │ [View] │
│  │ @viewer2  │ @host1   │ Spam       │ 3h ago │ [View] │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Alarm Yapılandırması

### Slack/Discord Webhook Entegrasyonu

```typescript
// lib/alerts.ts
const ALERT_WEBHOOK = Deno.env.get('ALERT_WEBHOOK_URL');

interface Alert {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function sendAlert(alert: Alert) {
  const color = {
    INFO: '#2196F3',
    WARNING: '#FF9800',
    CRITICAL: '#F44336',
  }[alert.level];

  await fetch(ALERT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: `${alert.level}: ${alert.title}`,
        description: alert.message,
        color: parseInt(color.slice(1), 16),
        fields: alert.data ? Object.entries(alert.data).map(([k, v]) => ({
          name: k,
          value: String(v),
          inline: true,
        })) : [],
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}
```

### Alarm Kuralları

```typescript
// Scheduled function: Her 5 dakikada çalışır
async function checkAlerts() {
  // 1. Quota kontrolü
  const usage = await getMonthlyUsage();
  if (usage.participantMinutes / 5000 > 0.9) {
    await sendAlert({
      level: 'CRITICAL',
      title: 'LiveKit Quota Critical',
      message: `Participant minutes: ${usage.participantMinutes}/5000 (${Math.round(usage.participantMinutes/50)}%)`,
    });
  } else if (usage.participantMinutes / 5000 > 0.75) {
    await sendAlert({
      level: 'WARNING',
      title: 'LiveKit Quota Warning',
      message: `Participant minutes: ${usage.participantMinutes}/5000`,
    });
  }

  // 2. Orphaned session kontrolü
  const { count: orphanedCount } = await supabase
    .from('live_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'live')
    .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

  if (orphanedCount > 5) {
    await sendAlert({
      level: 'WARNING',
      title: 'Orphaned Sessions Detected',
      message: `${orphanedCount} sessions are live but not updated in 30 minutes`,
    });
  }

  // 3. Edge Function error rate
  // Supabase logs API ile kontrol (veya external monitoring)

  // 4. Pending reports
  const { count: reportCount } = await supabase
    .from('live_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (reportCount > 10) {
    await sendAlert({
      level: 'WARNING',
      title: 'High Pending Reports',
      message: `${reportCount} reports waiting for review`,
    });
  }
}
```

---

## 4. Logging Best Practices

### Edge Function Logging

```typescript
// Her Edge Function'da
function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    function: 'get-livekit-token', // Function adı
    message,
    ...data,
  }));
}

// Kullanım
log('INFO', 'Token generated', { userId, sessionId, role });
log('ERROR', 'Token generation failed', { userId, error: error.message });
```

### Structured Logging Query

```sql
-- Supabase Logs Explorer'da
SELECT 
  timestamp,
  JSON_EXTRACT(message, '$.level') as level,
  JSON_EXTRACT(message, '$.function') as function,
  JSON_EXTRACT(message, '$.message') as msg,
  JSON_EXTRACT(message, '$.userId') as user_id
FROM edge_logs
WHERE JSON_EXTRACT(message, '$.level') = 'ERROR'
ORDER BY timestamp DESC
LIMIT 100;
```

---

## 5. External Monitoring Entegrasyonu

### Sentry (Error Tracking)

```typescript
// Mobil tarafta
import * as Sentry from '@sentry/react-native';

// LiveKit error'ları yakala
room.on(RoomEvent.MediaDevicesError, (error) => {
  Sentry.captureException(error, {
    tags: { type: 'livekit_media_error' },
    extra: { roomName: room.name },
  });
});
```

### PostHog/Amplitude (Analytics)

```typescript
// Session başlangıcı
analytics.track('live_session_started', {
  sessionType: session.session_type,
  accessType: session.access_type,
  creatorId: session.creator_id,
});

// Session sonu
analytics.track('live_session_ended', {
  duration: session.total_duration_seconds,
  peakViewers: session.peak_viewers,
  totalMessages: session.total_messages,
});
```

---

## 6. Health Check Endpoints

### API Health Check

```typescript
// /api/health/livekit
export async function GET() {
  const checks = {
    database: false,
    livekit: false,
    edge_functions: false,
  };

  // DB check
  try {
    await supabase.from('live_sessions').select('id').limit(1);
    checks.database = true;
  } catch {}

  // LiveKit check
  try {
    const roomService = new RoomServiceClient(url, key, secret);
    await roomService.listRooms();
    checks.livekit = true;
  } catch {}

  // Edge function check
  try {
    const { error } = await supabase.functions.invoke('health-check');
    checks.edge_functions = !error;
  } catch {}

  const healthy = Object.values(checks).every(Boolean);

  return Response.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  }, { status: healthy ? 200 : 503 });
}
```

---

## 7. Uptime Monitoring

### Önerilen Servisler

| Servis            | Kullanım                    | Fiyat            |
| ----------------- | --------------------------- | ---------------- |
| **UptimeRobot**   | Health endpoint monitoring  | Free tier mevcut |
| **Better Uptime** | Status page + alerting      | $20/ay           |
| **Checkly**       | API monitoring + Playwright | $7/ay            |

### Status Page İçeriği

- LiveKit Cloud Status
- Supabase Status
- Edge Functions Status
- Mobile App Health
- Last Incident History
