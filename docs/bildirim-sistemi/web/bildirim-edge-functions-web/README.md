# Web Bildirim Sistemi - Edge Functions Dokümantasyonu

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Edge Functions](#edge-functions)
3. [Webhook Trigger'ları](#webhook-triggerları)
4. [Cron Jobs](#cron-jobs)
5. [Hata Yönetimi](#hata-yönetimi)
6. [Monitoring](#monitoring)

---

## Genel Bakış

Web bildirim sistemi, Supabase Edge Functions kullanarak asenkron bildirim işlemlerini gerçekleştirir. Sistem 3 ana Edge Function'dan oluşur:

| Function                          | Tür     | Amaç                             | Tetikleyici                         |
| --------------------------------- | ------- | -------------------------------- | ----------------------------------- |
| `send-notification`               | Webhook | Mobil push notification gönderme | notifications table INSERT          |
| `send-bulk-notification`          | Webhook | Toplu bildirim gönderme          | notification_campaigns table INSERT |
| `process-scheduled-notifications` | Cron    | Zamanlanmış bildirimleri işleme  | Her dakika                          |
| `cleanup-notifications`           | Cron    | Eski bildirimleri temizleme      | Günlük                              |

---

## Edge Functions

### 1. send-notification (Mobile)

**Amaç:** Mobil cihazlara push notification göndermek

**Tetikleyici:** `notifications` table'ına INSERT event

**Workflow:**
```
notifications table INSERT
    ↓
Webhook trigger → send-notification function
    ↓
Device token lookup (device_tokens table)
    ↓
Notification preferences check
    ↓
Expo Push Service API çağrısı
    ↓
Push notification gönderilir
```

**Detaylı İşlem Akışı:**

1. **Event Alımı**
   - Supabase webhook, `notifications` table'ına INSERT event'i yakalar
   - Payload'da yeni notification record'u gelir

2. **Validasyon**
   - Event type kontrol edilir (sadece INSERT işlenir)
   - Notification ID, recipient_id, title, body kontrol edilir

3. **Device Token Lookup**
   ```sql
   SELECT token, device_type 
   FROM device_tokens 
   WHERE user_id = notification.recipient_id
   ```
   - Alıcının device token'ı bulunur
   - Device type (iOS/Android) belirlenir

4. **Preferences Check**
   ```sql
   SELECT push_enabled, notification_types 
   FROM notification_preferences 
   WHERE user_id = notification.recipient_id
   ```
   - Push notifications aktif mi kontrol edilir
   - Bildirim türü devre dışı mı kontrol edilir
   - Eğer devre dışıysa, işlem sonlandırılır

5. **Expo Push Service Çağrısı**
   ```typescript
   POST https://exp.host/--/api/v2/push/send
   {
     "to": "ExponentPushToken[...]",
     "sound": "default",
     "title": "Bildirim Başlığı",
     "body": "Bildirim İçeriği",
     "data": { ... },
     "badge": 1
   }
   ```

6. **Hata Yönetimi**
   - Başarısız token'lar log'lanır
   - Preferences devre dışıysa, uyarı log'lanır
   - Network hataları catch edilir

**Çıktı:**
```json
{
  "success": true,
  "result": {
    "id": "...",
    "status": "ok"
  }
}
```

**Hata Durumları:**
- ❌ Device token bulunamadı → 200 OK (uyarı log'lanır)
- ❌ Push notifications devre dışı → 200 OK (uyarı log'lanır)
- ❌ Expo API hatası → 200 OK (hata log'lanır)
- ❌ Genel hata → 500 Internal Server Error

---

### 2. send-bulk-notification (Web - Admin)

**Amaç:** Toplu bildirim göndermek (segment'e göre)

**Tetikleyici:** `notification_campaigns` table'ına INSERT event (type='bulk')

**Workflow:**
```
Admin panel "Gönder" butonu
    ↓
useSendNotification hook
    ↓
/api/notifications/send endpoint
    ↓
notification_campaigns table INSERT (status='draft')
    ↓
Webhook trigger → send-bulk-notification function
    ↓
Segment'e göre users bul
    ↓
Batch insert notifications
    ↓
Campaign status update (draft → sent)
```

**Detaylı İşlem Akışı:**

1. **Campaign Alımı**
   - Webhook, `notification_campaigns` table'ına INSERT event'i yakalar
   - Campaign record'u payload'da gelir

2. **Type Kontrol**
   - Sadece `type='bulk'` olan campaigns işlenir
   - Diğer types (single, scheduled) skip edilir

3. **Segment'e Göre Users Bulma**
   ```typescript
   // Segment türlerine göre query:
   
   // all: Tüm users
   SELECT id FROM profiles
   
   // creators: Sadece creators
   SELECT id FROM profiles WHERE is_creator = true
   
   // users: Sadece normal users
   SELECT id FROM profiles WHERE is_creator = false
   
   // inactive: 30+ gün login yapmayan users
   SELECT id FROM profiles 
   WHERE last_login_at < now() - interval '30 days'
   ```

4. **Notifications Batch Insert**
   ```typescript
   const notifications = users.map(user => ({
     recipient_id: user.id,
     actor_id: campaign.admin_id,
     type: 'admin_notification',
     title: campaign.title,
     body: campaign.body,
     data: {
       ...campaign.data,
       campaign_id: campaign.id
     }
   }));
   
   // Batch insert (1000'li chunks)
   await supabase
     .from('notifications')
     .insert(notifications);
   ```

5. **Campaign Status Update**
   ```typescript
   await supabase
     .from('notification_campaigns')
     .update({
       status: 'sent',
       sent_at: new Date().toISOString(),
       total_recipients: users.length,
       sent_count: users.length
     })
     .eq('id', campaign.id);
   ```

6. **Realtime Trigger**
   - Her notification INSERT, `send-notification` function'ı tetikler
   - Push notifications gönderilir

**Örnek Senaryo:**

Admin panel'de:
- Segment: "Sadece Creators"
- Title: "Yeni özellik!"
- Body: "Canlı yayın artık açık"

Function yapacakları:
1. `is_creator = true` olan 500 user bulunur
2. 500 notification record'u oluşturulur
3. Campaign status "sent" olur
4. Her notification, `send-notification` function'ı tetikler
5. 500 push notification gönderilir

**Çıktı:**
```json
{
  "success": true,
  "message": "Bulk notification sent to 500 users",
  "sent_count": 500
}
```

**Hata Durumları:**
- ❌ Segment'e uygun user yok → 200 OK (0 user gönderilir)
- ❌ Batch insert hatası → 500 Error (campaign status draft kalır)
- ❌ Campaign update hatası → 500 Error

---

### 3. process-scheduled-notifications (Web - Cron)

**Amaç:** Zamanlanmış bildirimleri otomatik gönder

**Tetikleyici:** Cron job (her dakika)

**Workflow:**
```
Cron job (her dakika çalışır)
    ↓
Zamanı gelmiş campaigns bul (scheduled_at <= now())
    ↓
Her campaign için:
  ├─ Segment'e göre users bul
  ├─ Batch insert notifications
  └─ Campaign status update
    ↓
Realtime trigger → send-notification
    ↓
Push notifications gönderilir
```

**Detaylı İşlem Akışı:**

1. **Zamanlanmış Campaigns Bulma**
   ```typescript
   const now = new Date().toISOString();
   
   const { data: campaigns } = await supabase
     .from('notification_campaigns')
     .select('*')
     .eq('type', 'scheduled')
     .eq('status', 'scheduled')
     .lte('scheduled_at', now);
   ```

2. **Her Campaign İçin İşlem**
   - `send-bulk-notification` ile aynı logic
   - Segment'e göre users bulunur
   - Notifications batch insert edilir
   - Campaign status update edilir

3. **Error Handling**
   - Başarısız campaigns log'lanır
   - Diğer campaigns işlenmeye devam eder
   - Başarı/hata sayıları döndürülür

4. **Örnek Cron Çalışması**

Zamanlanmış kampanyalar:
- Campaign A: 14:00 (geçti) → İşlenir
- Campaign B: 14:30 (geçti) → İşlenir
- Campaign C: 15:00 (gelmedi) → Skip edilir

**Çıktı:**
```json
{
  "success": true,
  "message": "Processed 2 campaigns",
  "processed": 2,
  "errors": 0
}
```

**Cron Konfigürasyonu:**

```bash
# Her dakika çalışır
* * * * *

# Supabase'de cron job oluşturma:
SELECT cron.schedule(
  'process-scheduled-notifications',
  '* * * * *',
  'SELECT http_post(
    ''https://your-project.supabase.co/functions/v1/process-scheduled-notifications'',
    json_build_object(),
    ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''
  )'
);
```

---

### 4. cleanup-notifications (Web - Cron)

**Amaç:** Eski bildirimleri ve kampanyaları temizle

**Tetikleyici:** Cron job (günlük, 02:00 UTC)

**Workflow:**
```
Cron job (günlük 02:00 UTC)
    ↓
30+ gün eski notifications sil
    ↓
30+ gün eski sent campaigns arşivle
    ↓
Database stats döndür
```

**Detaylı İşlem Akışı:**

1. **Eski Notifications Silme**
   ```typescript
   const thirtyDaysAgo = new Date(
     Date.now() - 30 * 24 * 60 * 60 * 1000
   ).toISOString();
   
   const { data: deleted } = await supabase
     .from('notifications')
     .delete()
     .lt('created_at', thirtyDaysAgo)
     .select('id');
   ```

2. **Eski Campaigns Arşivleme**
   ```typescript
   const { data: archived } = await supabase
     .from('notification_campaigns')
     .update({ status: 'archived' })
     .lt('created_at', thirtyDaysAgo)
     .eq('status', 'sent')
     .select('id');
   ```

3. **Database Stats Alma**
   ```typescript
   // Toplam notification sayısı
   const notifCount = await supabase
     .from('notifications')
     .select('id', { count: 'exact', head: true });
   
   // Toplam campaign sayısı
   const campaignCount = await supabase
     .from('notification_campaigns')
     .select('id', { count: 'exact', head: true });
   ```

4. **Örnek Çalışması**

Veritabanı durumu:
- Toplam notifications: 50,000
- 30+ gün eski: 15,000 → Silinir
- Kalan: 35,000

- Toplam campaigns: 1,000
- 30+ gün eski sent: 300 → Arşivlenir
- Kalan sent: 700

**Çıktı:**
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "stats": {
    "notifications_total": 35000,
    "campaigns_total": 1000,
    "notifications_deleted": 15000,
    "campaigns_archived": 300
  }
}
```

**Cron Konfigürasyonu:**

```bash
# Her gün 02:00 UTC
0 2 * * *

# Supabase'de cron job oluşturma:
SELECT cron.schedule(
  'cleanup-notifications',
  '0 2 * * *',
  'SELECT http_post(
    ''https://your-project.supabase.co/functions/v1/cleanup-notifications'',
    json_build_object(),
    ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''
  )'
);
```

---

## Webhook Trigger'ları

### Supabase Webhook Konfigürasyonu

**1. send-notification Webhook**

```
Event: notifications table INSERT
Function: send-notification
HTTP Method: POST
Retry Count: 3
```

**2. send-bulk-notification Webhook**

```
Event: notification_campaigns table INSERT
Function: send-bulk-notification
HTTP Method: POST
Retry Count: 3
```

### Webhook Payload Örneği

```json
{
  "type": "INSERT",
  "table": "notifications",
  "schema": "public",
  "record": {
    "id": "uuid",
    "recipient_id": "user-id",
    "actor_id": "admin-id",
    "type": "admin_notification",
    "title": "Bildirim Başlığı",
    "body": "Bildirim İçeriği",
    "data": {
      "campaign_id": "campaign-id"
    },
    "read": false,
    "created_at": "2025-11-20T18:00:00Z"
  }
}
```

---

## Cron Jobs

### Supabase pg_cron Konfigürasyonu

**Cron Job'ları Listeleme:**
```sql
SELECT * FROM cron.job;
```

**Cron Job'ları Silme:**
```sql
SELECT cron.unschedule('job-name');
```

**Cron Job Logs:**
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## Hata Yönetimi

### Error Handling Stratejisi

**1. Retry Logic**
- Webhook failures: 3 retry (exponential backoff)
- Cron failures: Log'lanır, sonraki cycle'da tekrar denenebilir

**2. Error Logging**
```typescript
try {
  // İşlem
} catch (error) {
  console.error('❌ Error:', error);
  // Log'a kaydedilir
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message
    }),
    { status: 500 }
  );
}
```

**3. Graceful Degradation**
- Device token bulunamadı → Uyarı log'lanır, işlem devam eder
- Preferences devre dışı → Uyarı log'lanır, işlem devam eder
- Batch insert hatası → Error log'lanır, campaign status draft kalır

### Hata Türleri

| Hata                   | Sebep                          | Çözüm                |
| ---------------------- | ------------------------------ | -------------------- |
| Device token not found | Kullanıcı app'ı sildi          | Uyarı log'lanır      |
| Push disabled          | Kullanıcı bildirimleri kapattı | Uyarı log'lanır      |
| Invalid token          | Token expired                  | Device token silinir |
| Network error          | Expo API down                  | Retry edilir         |
| Database error         | RLS policy hatası              | Admin kontrol eder   |

---

## Monitoring

### Logs Kontrol Etme

**Supabase Dashboard:**
```
Functions → Logs → Filter by function name
```

**CLI ile:**
```bash
supabase functions logs send-notification
supabase functions logs send-bulk-notification
supabase functions logs process-scheduled-notifications
supabase functions logs cleanup-notifications
```

### Key Metrics

**1. send-notification**
- Başarılı push notifications
- Failed deliveries
- Average response time

**2. send-bulk-notification**
- Toplam users
- Sent count
- Failed count
- Processing time

**3. process-scheduled-notifications**
- Processed campaigns
- Failed campaigns
- Total notifications sent
- Execution time

**4. cleanup-notifications**
- Deleted notifications
- Archived campaigns
- Database size reduction
- Execution time

### Monitoring Dashboard

Analytics sayfasında:
- Campaign statistics
- Delivery rates
- 7-day trends
- Recent campaigns

---

## Best Practices

### 1. Performance
- ✅ Batch insert'ler kullanın (1000'li chunks)
- ✅ Index'ler oluşturun (created_at, status)
- ✅ Cron job'ları yoğun saatlarda çalıştırmayın

### 2. Reliability
- ✅ Error handling'i düzgün yapın
- ✅ Retry logic'i implement edin
- ✅ Logs'ları düzenli kontrol edin

### 3. Security
- ✅ Service role key'i güvenli tutun
- ✅ RLS policies'i doğru yapılandırın
- ✅ Input validation yapın

### 4. Maintenance
- ✅ Eski bildirimleri düzenli temizleyin
- ✅ Campaigns'ı arşivleyin
- ✅ Database size'ı monitor edin

---

## Troubleshooting

### Bildirimler Gönderilmiyor

**Kontrol Listesi:**
1. ✅ Device token var mı? → `device_tokens` table'ı kontrol et
2. ✅ Push notifications aktif mi? → `notification_preferences` kontrol et
3. ✅ Expo API key var mı? → `EXPO_ACCESS_TOKEN` env var kontrol et
4. ✅ Logs'ta hata var mı? → Function logs'unu kontrol et

### Zamanlanmış Bildirimler Gönderilmiyor

**Kontrol Listesi:**
1. ✅ Cron job aktif mi? → `SELECT * FROM cron.job`
2. ✅ Scheduled_at doğru mu? → Campaign'ı kontrol et
3. ✅ Status 'scheduled' mi? → Campaign status'unu kontrol et
4. ✅ Cron logs'ta hata var mı? → Cron logs'unu kontrol et

### Temizlik İşlemi Çalışmıyor

**Kontrol Listesi:**
1. ✅ Cron job aktif mi? → `SELECT * FROM cron.job`
2. ✅ Cleanup sayfasından manuel çalıştır
3. ✅ Database permissions var mı? → RLS policies kontrol et
4. ✅ Logs'ta hata var mı? → Function logs'unu kontrol et

---

## İletişim & Destek

Sorularınız için:
- 📧 Email: support@ipelya.com
- 📱 Slack: #notifications-team
- 📚 Docs: https://docs.ipelya.com/notifications

---

**Last Updated:** Nov 20, 2025
**Version:** 1.0
**Status:** Production Ready ✅
