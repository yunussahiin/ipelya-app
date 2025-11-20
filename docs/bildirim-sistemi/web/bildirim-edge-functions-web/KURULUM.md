# Edge Functions - Kurulum & Konfigürasyon

## 📋 İçindekiler
1. [Ön Gereksinimler](#ön-gereksinimler)
2. [Supabase Kurulumu](#supabase-kurulumu)
3. [Edge Functions Deploy](#edge-functions-deploy)
4. [Webhook Konfigürasyonu](#webhook-konfigürasyonu)
5. [Cron Jobs Kurulumu](#cron-jobs-kurulumu)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)

---

## Ön Gereksinimler

### Gerekli Araçlar
- ✅ Supabase CLI (`npm install -g supabase`)
- ✅ Node.js 18+ 
- ✅ Deno (Supabase Edge Functions için)
- ✅ Git

### Gerekli Erişimler
- ✅ Supabase project admin access
- ✅ Service role key
- ✅ Expo access token (push notifications için)

---

## Supabase Kurulumu

### 1. Supabase CLI Login

```bash
supabase login
```

Tarayıcı açılacak, Supabase hesabınıza giriş yapın.

### 2. Project'i Link Et

```bash
cd /Users/yunussahin/ipelya-app
supabase link --project-ref ojkyisyjsbgbfytrmmlz
```

### 3. Database Tablolarını Kontrol Et

```bash
# Notifications table
supabase db pull

# Veya manuel kontrol:
supabase db query "SELECT * FROM information_schema.tables WHERE table_name LIKE 'notification%'"
```

---

## Edge Functions Deploy

### 1. send-notification (Mobile)

**Zaten deployed, kontrol et:**

```bash
supabase functions list
```

**Eğer yoksa deploy et:**

```bash
supabase functions deploy send-notification
```

### 2. send-bulk-notification (NEW)

```bash
supabase functions deploy send-bulk-notification
```

### 3. process-scheduled-notifications (NEW)

```bash
supabase functions deploy process-scheduled-notifications
```

### 4. cleanup-notifications (NEW)

```bash
supabase functions deploy cleanup-notifications
```

### Deploy Kontrol

```bash
# Tüm functions'ları listele
supabase functions list

# Çıktı:
# send-notification (ACTIVE)
# send-bulk-notification (ACTIVE)
# process-scheduled-notifications (ACTIVE)
# cleanup-notifications (ACTIVE)
```

### Logs Kontrol

```bash
# send-notification logs
supabase functions logs send-notification

# send-bulk-notification logs
supabase functions logs send-bulk-notification

# process-scheduled-notifications logs
supabase functions logs process-scheduled-notifications

# cleanup-notifications logs
supabase functions logs cleanup-notifications
```

---

## Webhook Konfigürasyonu

### 1. Supabase Dashboard'a Git

```
https://app.supabase.com/project/ojkyisyjsbgbfytrmmlz/webhooks
```

### 2. send-notification Webhook Oluştur

**Settings:**
- Event: `notifications` table → `INSERT`
- Function: `send-notification`
- HTTP Method: `POST`
- Retry Count: `3`

**SQL:**
```sql
-- Webhook otomatik oluşturulur
-- Veya manuel:
SELECT
  pg_net.http_post(
    'https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/send-notification',
    jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'record', row_to_json(NEW)
    ),
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
```

### 3. send-bulk-notification Webhook Oluştur

**Settings:**
- Event: `notification_campaigns` table → `INSERT`
- Function: `send-bulk-notification`
- HTTP Method: `POST`
- Retry Count: `3`
- Filter: `type = 'bulk'` (opsiyonel)

**SQL:**
```sql
SELECT
  pg_net.http_post(
    'https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/send-bulk-notification',
    jsonb_build_object(
      'type', 'INSERT',
      'table', 'notification_campaigns',
      'record', row_to_json(NEW)
    ),
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
```

### Webhook Test

```bash
# send-notification test
curl -X POST \
  https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "notifications",
    "record": {
      "id": "test-id",
      "recipient_id": "user-id",
      "title": "Test",
      "body": "Test notification"
    }
  }'
```

---

## Cron Jobs Kurulumu

### 1. pg_cron Extension Aktif Et

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. process-scheduled-notifications Cron Job

```sql
-- Her dakika çalışır
SELECT cron.schedule(
  'process-scheduled-notifications',
  '* * * * *',
  $$
  SELECT
    pg_net.http_post(
      'https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/process-scheduled-notifications',
      jsonb_build_object(),
      jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    )
  $$
);
```

### 3. cleanup-notifications Cron Job

```sql
-- Her gün 02:00 UTC
SELECT cron.schedule(
  'cleanup-notifications',
  '0 2 * * *',
  $$
  SELECT
    pg_net.http_post(
      'https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/cleanup-notifications',
      jsonb_build_object(),
      jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    )
  $$
);
```

### Cron Jobs Kontrol

```sql
-- Tüm cron jobs'ları listele
SELECT * FROM cron.job;

-- Çıktı:
-- jobid | schedule | command | nodename | nodeport | database | username | active
-- 1     | * * * * * | SELECT pg_net.http_post(...) | localhost | 5432 | postgres | postgres | t
-- 2     | 0 2 * * * | SELECT pg_net.http_post(...) | localhost | 5432 | postgres | postgres | t
```

### Cron Job Logs

```sql
-- Son 10 cron job çalışmasını göster
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Başarısız jobs
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Cron Job Silme

```sql
-- process-scheduled-notifications'ı sil
SELECT cron.unschedule('process-scheduled-notifications');

-- cleanup-notifications'ı sil
SELECT cron.unschedule('cleanup-notifications');
```

---

## Environment Variables

### Supabase Project Settings

```bash
# .env.local dosyasına ekle:

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ojkyisyjsbgbfytrmmlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Expo Push Service
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

### Edge Functions Environment

Supabase Dashboard → Settings → Edge Functions:

```
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

---

## Testing

### 1. send-notification Test

**Adım 1: Test notification oluştur**

```typescript
// Browser console'da çalıştır:
const { data, error } = await supabase
  .from('notifications')
  .insert({
    recipient_id: 'your-user-id',
    actor_id: 'admin-id',
    type: 'admin_notification',
    title: 'Test Notification',
    body: 'This is a test'
  });
```

**Adım 2: Logs kontrol et**

```bash
supabase functions logs send-notification
```

**Beklenen çıktı:**
```
📨 Webhook payload received
🔍 Fetching device token for user: your-user-id
✅ Device token found
📤 Sending push notification to Expo
✅ Push notification sent successfully
```

### 2. send-bulk-notification Test

**Adım 1: Test campaign oluştur**

```typescript
const { data, error } = await supabase
  .from('notification_campaigns')
  .insert({
    admin_id: 'admin-id',
    type: 'bulk',
    title: 'Test Bulk',
    body: 'Test bulk notification',
    recipient_segment: 'all',
    status: 'draft'
  });
```

**Adım 2: Logs kontrol et**

```bash
supabase functions logs send-bulk-notification
```

**Beklenen çıktı:**
```
🔍 Finding campaigns scheduled before: 2025-11-20T18:00:00Z
✅ Found 500 users for segment: all
📝 Inserting 500 notifications
✅ Successfully inserted 500 notifications
✅ Campaign status updated to sent
```

### 3. process-scheduled-notifications Test

**Adım 1: Zamanlanmış campaign oluştur**

```typescript
const { data, error } = await supabase
  .from('notification_campaigns')
  .insert({
    admin_id: 'admin-id',
    type: 'scheduled',
    title: 'Test Scheduled',
    body: 'Test scheduled notification',
    recipient_segment: 'all',
    scheduled_at: new Date().toISOString(), // Şimdi
    status: 'scheduled'
  });
```

**Adım 2: Function'ı manuel çalıştır**

```bash
curl -X POST \
  https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/process-scheduled-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Adım 3: Logs kontrol et**

```bash
supabase functions logs process-scheduled-notifications
```

### 4. cleanup-notifications Test

**Adım 1: Function'ı manuel çalıştır**

```bash
curl -X POST \
  https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/cleanup-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Adım 2: Logs kontrol et**

```bash
supabase functions logs cleanup-notifications
```

**Beklenen çıktı:**
```
🧹 Starting cleanup process
🔍 Deleting notifications older than: 2025-10-21T18:00:00Z
✅ Deleted 1500 old notifications
📄 Archiving old campaigns
✅ Archived 50 old campaigns
🏁 Cleanup complete
```

---

## Troubleshooting

### Edge Function Deploy Hatası

```bash
# Error: "Function not found"
# Çözüm:
supabase functions deploy send-notification --force

# Logs kontrol et
supabase functions logs send-notification
```

### Webhook Çalışmıyor

```sql
-- Webhook status kontrol et
SELECT * FROM pg_net.http_request_queue;

-- Webhook logs
SELECT * FROM pg_net.http_request_queue 
WHERE status = 'failed';
```

### Cron Job Çalışmıyor

```sql
-- Cron job status
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-notifications';

-- Cron job logs
SELECT * FROM cron.job_run_details 
WHERE jobid = 1 
ORDER BY start_time DESC;
```

### Push Notification Gönderilmiyor

```bash
# Kontrol listesi:
1. EXPO_ACCESS_TOKEN set mi?
   echo $EXPO_ACCESS_TOKEN

2. Device token var mı?
   SELECT * FROM device_tokens WHERE user_id = 'user-id'

3. Preferences aktif mi?
   SELECT * FROM notification_preferences WHERE user_id = 'user-id'

4. Logs'ta hata var mı?
   supabase functions logs send-notification
```

---

## Production Checklist

- [ ] Tüm Edge Functions deployed
- [ ] Webhooks konfigüre edildi
- [ ] Cron jobs aktif
- [ ] EXPO_ACCESS_TOKEN set
- [ ] RLS policies doğru
- [ ] Logs monitoring aktif
- [ ] Error handling test edildi
- [ ] Performance test edildi
- [ ] Backup stratejisi hazır

---

**Last Updated:** Nov 20, 2025
**Version:** 1.0
