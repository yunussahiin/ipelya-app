# Cron Jobs

## media-worker-cron

Media worker'ı periyodik olarak tetikler.

### Yapılandırma (Supabase Dashboard)

| Alan         | Değer                  |
| ------------ | ---------------------- |
| **Name**     | `media-worker-cron`    |
| **Schedule** | Every 30 seconds       |
| **Type**     | Supabase Edge Function |
| **Function** | `media-worker`         |
| **Method**   | POST                   |
| **Timeout**  | 5000ms                 |

### Dashboard'dan Oluşturma

1. **Supabase Dashboard** → **Database** → **Cron Jobs**
2. **Create a new cron job**
3. Yukarıdaki ayarları gir
4. **Create** tıkla

### SQL ile Oluşturma (Alternatif)

```sql
-- pg_cron saniye desteklemez, minimum 1 dakika
SELECT cron.schedule(
  'media-worker-edge-cron',
  '*/1 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/media-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object()
    );
  $$
);
```

### Cron Job Durumu Kontrolü

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE '%media-worker%';
```

### Son Çalışmalar

```sql
SELECT runid, status, start_time, end_time, return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'media-worker-cron')
ORDER BY start_time DESC
LIMIT 10;
```

## Notlar

- **pg_cron** saniye desteklemez, minimum 1 dakika
- **Supabase Dashboard** 30 saniye seçeneği sunuyor (kendi cron sistemi)
- Edge Function timeout max 5 saniye (cron için)
- Worker her çalışmada max 2 mesaj işler (RAM için)
