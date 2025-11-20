# Bildirim Sistemi - Genel Bakış 📱

## Sistem Mimarisi

İpelya'nın bildirim sistemi, **Supabase Realtime** + **Expo Push Notifications** + **Edge Functions** kombinasyonu ile kurgulanmıştır. Bu sistem, gerçek zamanlı, güvenilir ve ölçeklenebilir bildirim göndermesini sağlar.

### Teknoloji Stack

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React Native/Expo)                       │
│  ├─ expo-notifications (token + handler)           │
│  ├─ expo-device (physical device check)            │
│  ├─ expo-constants (projectId)                     │
│  └─ Realtime Listener (Supabase)                   │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  Backend (Supabase)                                 │
│  ├─ PostgreSQL (notifications table)               │
│  ├─ Realtime (event broadcasting)                  │
│  ├─ Edge Functions (trigger logic)                 │
│  └─ RLS Policies (security)                        │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  Expo Push Service (Wrapper)                        │
│  ├─ FCM (Android)                                  │
│  ├─ APNs (iOS)                                     │
│  └─ Token Management                               │
└─────────────────────────────────────────────────────┘
```

## Bildirim Tipleri

### 1. **Social Notifications** (Sosyal Bildirimler)
- `new_follower` - Yeni takipçi
- `follow_back` - Takip geri
- `profile_mention` - Profil mention
- `user_blocked` - Kullanıcı engellendi

### 2. **Messaging Notifications** (Mesajlaşma Bildirimleri)
- `new_message` - Yeni mesaj
- `message_like` - Mesaj beğeni
- `message_reply` - Mesaj yanıtı
- `typing_indicator` - Yazıyor göstergesi

### 3. **Content Notifications** (İçerik Bildirimleri)
- `content_like` - İçerik beğeni
- `content_comment` - İçerik yorum
- `content_share` - İçerik paylaşım
- `content_update` - İçerik güncelleme

### 4. **System Notifications** (Sistem Bildirimleri)
- `system_alert` - Sistem uyarısı
- `maintenance` - Bakım bildirimi
- `security_alert` - Güvenlik uyarısı
- `account_activity` - Hesap aktivitesi

## Bildirim Akışı

```
1. Event Tetikleme
   └─ Kullanıcı A, Kullanıcı B'yi takip ediyor
   
2. Database Trigger
   └─ followers tablosuna INSERT
   
3. Supabase Realtime Event
   └─ Event broadcast
   
4. Edge Function
   └─ Notification kaydı oluştur
   └─ Device token'ı bul
   
5. Notification Kaydı
   └─ notifications tablosuna INSERT
   
6. Realtime Listener (Frontend)
   └─ Yeni notification event'i al
   
7. Local Notification
   └─ expo-notifications.scheduleNotificationAsync()
   
8. Kullanıcı Etkileşimi
   └─ Bildirime tıkla
   
9. Deep Link
   └─ İlgili sayfaya git
```

## Database Schema

### notifications Tablosu
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  actor_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (recipient_id) REFERENCES auth.users(id),
  FOREIGN KEY (actor_id) REFERENCES auth.users(id)
);
```

### device_tokens Tablosu
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'ios' | 'android'
  device_name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

### notification_preferences Tablosu
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  notification_types JSONB DEFAULT '{}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

## Güvenlik (RLS Policies)

- ✅ Kullanıcılar sadece kendi bildirimlerini görebilir
- ✅ Bildirimler sadece recipient tarafından okunabilir
- ✅ Device tokenlar sadece sahibi tarafından güncellenebilir
- ✅ Notification preferences sadece sahibi tarafından değiştirilebilir

## Performance Optimizations

- 📊 Indexed queries (recipient_id, created_at)
- 🔄 Pagination (20 bildirim/sayfa)
- ⏱️ Notification expiry (30 gün)
- 🗑️ Automatic cleanup (eski bildirimler)

## Sonraki Adımlar

1. ✅ Database schema oluştur
2. ✅ RLS policies ekle
3. ✅ expo-notifications setup
4. ✅ Device token management
5. ✅ Realtime listener
6. ✅ Notification UI
7. ✅ Deep linking
8. ✅ Edge Functions
9. ✅ Messaging system integration

---

**Dokümantasyon Yapısı:**
- `/mobile` - React Native/Expo implementasyonu
- `/web` - Web implementasyonu (gelecek)
