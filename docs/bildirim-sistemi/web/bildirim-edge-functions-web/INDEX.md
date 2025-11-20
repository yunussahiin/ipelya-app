# Edge Functions - Dokümantasyon İndeksi

## 📚 Tüm Dokümantasyon Dosyaları

### 1. **README.md** - Detaylı Teknik Dokümantasyon
   - Genel bakış
   - 4 Edge Function'ın detaylı açıklaması
   - Webhook trigger'ları
   - Cron jobs
   - Hata yönetimi
   - Monitoring
   - Best practices
   - Troubleshooting

### 2. **KURULUM.md** - Setup & Konfigürasyon
   - Ön gereksinimler
   - Supabase kurulumu
   - Edge Functions deploy
   - Webhook konfigürasyonu
   - Cron jobs kurulumu
   - Environment variables
   - Testing
   - Production checklist

### 3. **INDEX.md** - Bu Dosya
   - Hızlı navigasyon
   - Dosya yapısı
   - Hızlı başlangıç

---

## 🚀 Hızlı Başlangıç

### 1. İlk Defa Kurulum

```bash
# 1. Supabase CLI login
supabase login

# 2. Project'i link et
supabase link --project-ref ojkyisyjsbgbfytrmmlz

# 3. Edge Functions deploy
supabase functions deploy send-notification
supabase functions deploy send-bulk-notification
supabase functions deploy process-scheduled-notifications
supabase functions deploy cleanup-notifications

# 4. Logs kontrol et
supabase functions list
```

### 2. Webhook & Cron Konfigürasyonu

```bash
# Supabase Dashboard'a git ve:
# 1. Webhooks oluştur (send-notification, send-bulk-notification)
# 2. Cron jobs oluştur (process-scheduled-notifications, cleanup-notifications)

# Veya SQL ile:
# KURULUM.md dosyasındaki SQL komutlarını çalıştır
```

### 3. Test Et

```bash
# Admin panel'den:
# 1. Bildirim Gönder → Tekil/Toplu/Zamanlanmış test et
# 2. Analytics → İstatistikleri kontrol et
# 3. Temizlik → Cleanup işlemini test et
```

---

## 📁 Dosya Yapısı

```
/docs/bildirim-sistemi/web/
├── WEB-TODO-NOTIFICATIONS.md (Ana TODO list)
├── bildirim-edge-functions-web/
│   ├── INDEX.md (Bu dosya)
│   ├── README.md (Detaylı dokümantasyon)
│   └── KURULUM.md (Setup & konfigürasyon)
```

---

## 🎯 Edge Functions Özeti

| Function                            | Tür     | Tetikleyici                   | Amaç                          |
| ----------------------------------- | ------- | ----------------------------- | ----------------------------- |
| **send-notification**               | Webhook | notifications INSERT          | Push notification gönder      |
| **send-bulk-notification**          | Webhook | notification_campaigns INSERT | Toplu bildirim gönder         |
| **process-scheduled-notifications** | Cron    | Her dakika                    | Zamanlanmış bildirimleri işle |
| **cleanup-notifications**           | Cron    | Günlük 02:00 UTC              | Eski bildirimleri temizle     |

---

## 📊 Workflow Diyagramları

### 1. Tekil Bildirim Workflow

```
Admin Panel
    ↓
SingleNotification Component
    ↓
useSendNotification hook
    ↓
/api/notifications/send endpoint
    ↓
notifications table INSERT
    ↓
send-notification webhook
    ↓
Device token lookup
    ↓
Expo Push Service
    ↓
Mobile cihaza push notification
```

### 2. Toplu Bildirim Workflow

```
Admin Panel
    ↓
BulkNotification Component
    ↓
useSendNotification hook
    ↓
/api/notifications/send endpoint
    ↓
notification_campaigns table INSERT (type='bulk')
    ↓
send-bulk-notification webhook
    ↓
Segment'e göre users bul
    ↓
Batch insert notifications
    ↓
send-notification webhook (her notification için)
    ↓
Push notifications gönderilir
```

### 3. Zamanlanmış Bildirim Workflow

```
Admin Panel
    ↓
ScheduledNotification Component
    ↓
useSendNotification hook
    ↓
/api/notifications/send endpoint
    ↓
notification_campaigns table INSERT (type='scheduled')
    ↓
[Zamanı gelene kadar bekleme]
    ↓
process-scheduled-notifications cron job (her dakika)
    ↓
Zamanı gelmiş campaigns bul
    ↓
send-bulk-notification logic (segment'e göre users bul)
    ↓
Batch insert notifications
    ↓
Push notifications gönderilir
```

### 4. Temizlik Workflow

```
cleanup-notifications cron job (günlük 02:00 UTC)
    ↓
30+ gün eski notifications sil
    ↓
30+ gün eski sent campaigns arşivle
    ↓
Database stats döndür
    ↓
Logs'a kaydedilir
```

---

## 🔧 Sık Kullanılan Komutlar

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

# Son 50 log satırı
supabase functions logs send-notification --limit 50
```

### Cron Jobs Kontrol

```bash
# Tüm cron jobs'ları listele
supabase db query "SELECT * FROM cron.job"

# Cron job logs
supabase db query "SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10"

# Başarısız jobs
supabase db query "SELECT * FROM cron.job_run_details WHERE status = 'failed'"
```

### Webhook Test

```bash
# send-notification test
curl -X POST \
  https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"notifications","record":{"id":"test","recipient_id":"user-id","title":"Test","body":"Test"}}'

# send-bulk-notification test
curl -X POST \
  https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/send-bulk-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"notification_campaigns","record":{"id":"test","type":"bulk","title":"Test","body":"Test","recipient_segment":"all"}}'
```

---

## 📖 Dokümantasyon Haritası

```
README.md
├── Genel Bakış
│   ├── Edge Functions tablosu
│   └── Workflow diyagramı
├── Edge Functions
│   ├── send-notification
│   │   ├── Amaç
│   │   ├── Tetikleyici
│   │   ├── Detaylı workflow
│   │   ├── Örnek senaryo
│   │   └── Hata durumları
│   ├── send-bulk-notification
│   │   ├── Amaç
│   │   ├── Tetikleyici
│   │   ├── Detaylı workflow
│   │   ├── Örnek senaryo
│   │   └── Hata durumları
│   ├── process-scheduled-notifications
│   │   ├── Amaç
│   │   ├── Tetikleyici
│   │   ├── Detaylı workflow
│   │   ├── Örnek senaryo
│   │   └── Hata durumları
│   └── cleanup-notifications
│       ├── Amaç
│       ├── Tetikleyici
│       ├── Detaylı workflow
│       ├── Örnek senaryo
│       └── Hata durumları
├── Webhook Trigger'ları
│   ├── Supabase webhook konfigürasyonu
│   └── Webhook payload örneği
├── Cron Jobs
│   ├── pg_cron konfigürasyonu
│   ├── Job listeleme
│   └── Job logs
├── Hata Yönetimi
│   ├── Error handling stratejisi
│   ├── Retry logic
│   ├── Error logging
│   ├── Graceful degradation
│   └── Hata türleri tablosu
├── Monitoring
│   ├── Logs kontrol etme
│   ├── Key metrics
│   └── Monitoring dashboard
├── Best Practices
│   ├── Performance
│   ├── Reliability
│   ├── Security
│   └── Maintenance
└── Troubleshooting
    ├── Bildirimler gönderilmiyor
    ├── Zamanlanmış bildirimler gönderilmiyor
    └── Temizlik işlemi çalışmıyor

KURULUM.md
├── Ön Gereksinimler
│   ├── Gerekli araçlar
│   └── Gerekli erişimler
├── Supabase Kurulumu
│   ├── CLI login
│   ├── Project link
│   └── Database kontrol
├── Edge Functions Deploy
│   ├── send-notification
│   ├── send-bulk-notification
│   ├── process-scheduled-notifications
│   ├── cleanup-notifications
│   └── Deploy kontrol
├── Webhook Konfigürasyonu
│   ├── send-notification webhook
│   ├── send-bulk-notification webhook
│   └── Webhook test
├── Cron Jobs Kurulumu
│   ├── pg_cron extension
│   ├── process-scheduled-notifications cron
│   ├── cleanup-notifications cron
│   ├── Cron jobs kontrol
│   ├── Cron job logs
│   └── Cron job silme
├── Environment Variables
│   ├── Supabase project settings
│   └── Edge functions environment
├── Testing
│   ├── send-notification test
│   ├── send-bulk-notification test
│   ├── process-scheduled-notifications test
│   └── cleanup-notifications test
├── Troubleshooting
│   ├── Edge function deploy hatası
│   ├── Webhook çalışmıyor
│   ├── Cron job çalışmıyor
│   └── Push notification gönderilmiyor
└── Production Checklist
```

---

## 🎓 Öğrenme Yolu

### Başlangıç Seviyesi
1. README.md → Genel Bakış
2. KURULUM.md → Ön Gereksinimler
3. KURULUM.md → Supabase Kurulumu

### Orta Seviye
1. README.md → Edge Functions (send-notification)
2. KURULUM.md → Edge Functions Deploy
3. KURULUM.md → Testing

### İleri Seviye
1. README.md → Tüm Edge Functions
2. README.md → Hata Yönetimi & Monitoring
3. KURULUM.md → Webhook & Cron Konfigürasyonu
4. KURULUM.md → Troubleshooting

---

## 🔗 İlgili Dokümantasyon

- **WEB-TODO-NOTIFICATIONS.md** - Ana TODO list ve status
- **Admin Panel** - `/ops/notifications/`
- **Analytics** - `/ops/notifications/analytics`
- **Cleanup** - `/ops/notifications/cleanup`

---

## 📞 Destek & İletişim

Sorularınız için:
- 📧 Email: support@ipelya.com
- 📱 Slack: #notifications-team
- 📚 Docs: https://docs.ipelya.com/notifications

---

**Last Updated:** Nov 20, 2025
**Version:** 1.0
**Status:** Production Ready ✅
