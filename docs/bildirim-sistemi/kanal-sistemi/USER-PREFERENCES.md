# Kullanıcı Bildirim Tercihleri - Detaylı Rehber ⚙️

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Database Yapısı](#database-yapısı)
3. [Tercih Kategorileri](#tercih-kategorileri)
4. [API Kullanımı](#api-kullanımı)
5. [Mobile UI Tasarımı](#mobile-ui-tasarımı)
6. [Edge Function Entegrasyonu](#edge-function-entegrasyonu)
7. [Best Practices](#best-practices)

---

## Genel Bakış

İpelya'da kullanıcılar, uygulama içi ayarlardan hangi bildirimleri almak istediklerini kontrol edebilir. Bu sistem, Android Notification Channels'dan bağımsız olarak çalışır ve daha granüler kontrol sağlar.

### İki Seviyeli Kontrol

```
┌─────────────────────────────────────────────────────────────┐
│                    Bildirim Kontrol Seviyeleri               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Seviye 1: Android OS (Cihaz Ayarları)                      │
│  ─────────────────────────────────────                      │
│  • Ses açık/kapalı                                          │
│  • Titreşim açık/kapalı                                     │
│  • Kilit ekranında göster/gizle                             │
│  • Heads-up notification açık/kapalı                        │
│                                                              │
│  Seviye 2: İpelya App (Uygulama İçi Ayarlar)                │
│  ─────────────────────────────────────────                  │
│  • Bildirim tipi bazlı açık/kapalı                          │
│  • Sessiz saatler                                           │
│  • Push/Email tercihi                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Neden İki Seviye?

| Seviye         | Kontrol Eden               | Avantaj                                    |
| -------------- | -------------------------- | ------------------------------------------ |
| **Android OS** | Kullanıcı (Cihaz Ayarları) | Sistem genelinde tutarlılık                |
| **İpelya App** | Kullanıcı (Uygulama İçi)   | Granüler kontrol, sunucu tarafı filtreleme |

---

## Database Yapısı

### `notification_preferences` Tablosu

```sql
CREATE TABLE notification_preferences (
  -- Primary Key
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  
  -- Genel Tercihler
  push_enabled BOOLEAN DEFAULT true,      -- Push bildirimleri genel açık/kapalı
  email_enabled BOOLEAN DEFAULT false,    -- Email bildirimleri genel açık/kapalı
  
  -- Tip Bazlı Tercihler (JSONB)
  notification_types JSONB DEFAULT '{
    "new_follower": true,
    "follow_back": true,
    "profile_mention": true,
    "user_blocked": false,
    "new_message": true,
    "message_like": false,
    "message_reply": true,
    "typing_indicator": false,
    "content_like": false,
    "content_comment": true,
    "content_share": false,
    "content_update": true,
    "system_alert": true,
    "maintenance": true,
    "security_alert": true,
    "account_activity": true
  }',
  
  -- Sessiz Saatler
  quiet_hours_start TIME,    -- Örn: '23:00:00'
  quiet_hours_end TIME,      -- Örn: '07:00:00'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### JSONB Yapısı: `notification_types`

```typescript
interface NotificationTypes {
  // Sosyal
  new_follower: boolean;      // Yeni takipçi
  follow_back: boolean;       // Karşılıklı takip
  profile_mention: boolean;   // Profil mention
  user_blocked: boolean;      // Engelleme
  
  // Mesajlaşma
  new_message: boolean;       // Yeni mesaj
  message_like: boolean;      // Mesaj beğeni
  message_reply: boolean;     // Mesaj yanıtı
  typing_indicator: boolean;  // Yazıyor göstergesi
  
  // İçerik
  content_like: boolean;      // İçerik beğeni
  content_comment: boolean;   // İçerik yorum
  content_share: boolean;     // İçerik paylaşım
  content_update: boolean;    // İçerik güncelleme
  
  // Sistem
  system_alert: boolean;      // Sistem uyarısı
  maintenance: boolean;       // Bakım bildirimi
  security_alert: boolean;    // Güvenlik uyarısı
  account_activity: boolean;  // Hesap aktivitesi
}
```

---

## Tercih Kategorileri

### 1. Sosyal Bildirimler

| Tip               | Varsayılan | Açıklama                                | Örnek                               |
| ----------------- | ---------- | --------------------------------------- | ----------------------------------- |
| `new_follower`    | ✅ Açık     | Biri seni takip ettiğinde               | "Ayşe seni takip etmeye başladı"    |
| `follow_back`     | ✅ Açık     | Takip ettiğin kişi seni takip ettiğinde | "Mehmet seni geri takip etti"       |
| `profile_mention` | ✅ Açık     | Biri senden bahsettiğinde               | "Ali bir gönderide senden bahsetti" |
| `user_blocked`    | ❌ Kapalı   | Biri seni engellediğinde                | (Genellikle kapalı tutulur)         |

### 2. Mesajlaşma Bildirimleri

| Tip                | Varsayılan | Açıklama                  | Örnek                             |
| ------------------ | ---------- | ------------------------- | --------------------------------- |
| `new_message`      | ✅ Açık     | Yeni mesaj aldığında      | "Zeynep: Merhaba, nasılsın?"      |
| `message_like`     | ❌ Kapalı   | Mesajın beğenildiğinde    | "Ahmet mesajını beğendi"          |
| `message_reply`    | ✅ Açık     | Mesajına yanıt geldiğinde | "Fatma mesajına yanıt verdi"      |
| `typing_indicator` | ❌ Kapalı   | Biri yazıyorken           | (Genellikle kapalı - spam önleme) |

### 3. İçerik Bildirimleri

| Tip               | Varsayılan | Açıklama                              | Örnek                         |
| ----------------- | ---------- | ------------------------------------- | ----------------------------- |
| `content_like`    | ❌ Kapalı   | İçeriğin beğenildiğinde               | "Emre gönderini beğendi"      |
| `content_comment` | ✅ Açık     | İçeriğine yorum yapıldığında          | "Selin gönderine yorum yaptı" |
| `content_share`   | ❌ Kapalı   | İçeriğin paylaşıldığında              | "Burak gönderini paylaştı"    |
| `content_update`  | ✅ Açık     | Takip ettiğin içerik güncellendiğinde | "Favori içeriğin güncellendi" |

### 4. Sistem Bildirimleri

| Tip                | Varsayılan | Açıklama                   | Örnek                         |
| ------------------ | ---------- | -------------------------- | ----------------------------- |
| `system_alert`     | ✅ Açık     | Önemli sistem bildirimleri | "Yeni özellik: Hikayeler!"    |
| `maintenance`      | ✅ Açık     | Planlı bakım bildirimleri  | "Yarın 03:00-05:00 bakım"     |
| `security_alert`   | ✅ Açık     | Güvenlik uyarıları         | "Yeni cihazdan giriş yapıldı" |
| `account_activity` | ✅ Açık     | Hesap aktivitesi           | "Şifren değiştirildi"         |

---

## API Kullanımı

### Tercihleri Okuma

```typescript
// Supabase Client
const { data, error } = await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// Sonuç
{
  user_id: "uuid",
  push_enabled: true,
  email_enabled: false,
  notification_types: {
    new_follower: true,
    new_message: true,
    // ...
  },
  quiet_hours_start: "23:00:00",
  quiet_hours_end: "07:00:00"
}
```

### Tercihleri Güncelleme

```typescript
// Tek bir tipi güncelle
const { error } = await supabase
  .from('notification_preferences')
  .update({
    notification_types: {
      ...currentTypes,
      new_message: false // Mesaj bildirimlerini kapat
    },
    updated_at: new Date().toISOString()
  })
  .eq('user_id', userId);

// Sessiz saatleri güncelle
const { error } = await supabase
  .from('notification_preferences')
  .update({
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00',
    updated_at: new Date().toISOString()
  })
  .eq('user_id', userId);
```

### Yeni Kullanıcı İçin Tercih Oluşturma

```typescript
// Varsayılan tercihlerle oluştur
const { error } = await supabase
  .from('notification_preferences')
  .upsert({
    user_id: userId,
    push_enabled: true,
    email_enabled: false,
    // notification_types varsayılan değerleri kullanır
  });
```

---

## Mobile UI Tasarımı

### Ayarlar Ekranı Wireframe

```
┌─────────────────────────────────────────┐
│  ←  Bildirim Ayarları                   │
├─────────────────────────────────────────┤
│                                         │
│  GENEL                                  │
│  ─────────────────────────────────────  │
│  Push Bildirimleri              [ON]    │
│  Email Bildirimleri             [OFF]   │
│                                         │
│  SESSİZ SAATLER                         │
│  ─────────────────────────────────────  │
│  Başlangıç                    23:00 >   │
│  Bitiş                        07:00 >   │
│                                         │
│  SOSYAL                                 │
│  ─────────────────────────────────────  │
│  Yeni Takipçi                   [ON]    │
│  Karşılıklı Takip               [ON]    │
│  Mention                        [ON]    │
│  Engelleme                      [OFF]   │
│                                         │
│  MESAJLAŞMA                             │
│  ─────────────────────────────────────  │
│  Yeni Mesaj                     [ON]    │
│  Mesaj Beğeni                   [OFF]   │
│  Mesaj Yanıtı                   [ON]    │
│  Yazıyor Göstergesi             [OFF]   │
│                                         │
│  İÇERİK                                 │
│  ─────────────────────────────────────  │
│  Beğeni                         [OFF]   │
│  Yorum                          [ON]    │
│  Paylaşım                       [OFF]   │
│  Güncelleme                     [ON]    │
│                                         │
│  SİSTEM                                 │
│  ─────────────────────────────────────  │
│  Sistem Uyarıları               [ON]    │
│  Bakım Bildirimleri             [ON]    │
│  Güvenlik Uyarıları             [ON]    │
│  Hesap Aktivitesi               [ON]    │
│                                         │
└─────────────────────────────────────────┘
```

### React Native Component Örneği

```typescript
// apps/mobile/src/screens/settings/NotificationSettings.tsx

import { View, Text, Switch, ScrollView } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export function NotificationSettings() {
  const { colors } = useTheme();
  const { preferences, updatePreference, loading } = useNotificationPreferences();

  const sections = [
    {
      title: 'Sosyal',
      items: [
        { key: 'new_follower', label: 'Yeni Takipçi' },
        { key: 'follow_back', label: 'Karşılıklı Takip' },
        { key: 'profile_mention', label: 'Mention' },
        { key: 'user_blocked', label: 'Engelleme' },
      ],
    },
    {
      title: 'Mesajlaşma',
      items: [
        { key: 'new_message', label: 'Yeni Mesaj' },
        { key: 'message_like', label: 'Mesaj Beğeni' },
        { key: 'message_reply', label: 'Mesaj Yanıtı' },
        { key: 'typing_indicator', label: 'Yazıyor Göstergesi' },
      ],
    },
    // ... diğer kategoriler
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      {/* Genel Tercihler */}
      <Section title="Genel">
        <SettingRow
          label="Push Bildirimleri"
          value={preferences.push_enabled}
          onValueChange={(value) => updatePreference('push_enabled', value)}
        />
        <SettingRow
          label="Email Bildirimleri"
          value={preferences.email_enabled}
          onValueChange={(value) => updatePreference('email_enabled', value)}
        />
      </Section>

      {/* Tip Bazlı Tercihler */}
      {sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.items.map((item) => (
            <SettingRow
              key={item.key}
              label={item.label}
              value={preferences.notification_types[item.key]}
              onValueChange={(value) => updatePreference(`notification_types.${item.key}`, value)}
            />
          ))}
        </Section>
      ))}
    </ScrollView>
  );
}
```

---

## Edge Function Entegrasyonu

### Bildirim Gönderme Öncesi Kontrol

```typescript
// supabase/functions/send-notification/index.ts

import { createClient } from '@supabase/supabase-js';

interface NotificationPayload {
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function shouldSendNotification(
  supabase: SupabaseClient,
  recipientId: string,
  notificationType: string
): Promise<boolean> {
  // 1. Kullanıcı tercihlerini al
  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled, notification_types, quiet_hours_start, quiet_hours_end')
    .eq('user_id', recipientId)
    .single();

  if (error || !prefs) {
    // Tercih yoksa varsayılan olarak gönder
    return true;
  }

  // 2. Push genel olarak kapalı mı?
  if (!prefs.push_enabled) {
    console.log(`Push disabled for user ${recipientId}`);
    return false;
  }

  // 3. Bu tip için tercih kapalı mı?
  if (prefs.notification_types && prefs.notification_types[notificationType] === false) {
    console.log(`Notification type ${notificationType} disabled for user ${recipientId}`);
    return false;
  }

  // 4. Sessiz saatler içinde mi?
  if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // "HH:MM:SS"
    
    const start = prefs.quiet_hours_start;
    const end = prefs.quiet_hours_end;
    
    // Gece yarısını geçen sessiz saatler (örn: 23:00 - 07:00)
    if (start > end) {
      if (currentTime >= start || currentTime <= end) {
        console.log(`Quiet hours active for user ${recipientId}`);
        return false;
      }
    } else {
      // Normal aralık (örn: 14:00 - 16:00)
      if (currentTime >= start && currentTime <= end) {
        console.log(`Quiet hours active for user ${recipientId}`);
        return false;
      }
    }
  }

  return true;
}

// Ana fonksiyon
Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const payload: NotificationPayload = await req.json();

  // Tercih kontrolü
  const shouldSend = await shouldSendNotification(
    supabase,
    payload.recipient_id,
    payload.type
  );

  if (!shouldSend) {
    return new Response(
      JSON.stringify({ success: false, reason: 'User preferences' }),
      { status: 200 }
    );
  }

  // Bildirimi gönder...
  // ...
});
```

---

## Best Practices

### 1. Varsayılan Değerler

```typescript
// Spam önleme için bazı tipler varsayılan kapalı
const DEFAULT_PREFERENCES = {
  // Yüksek değerli bildirimler - AÇIK
  new_follower: true,
  new_message: true,
  security_alert: true,
  
  // Düşük değerli bildirimler - KAPALI
  content_like: false,      // Çok fazla olabilir
  message_like: false,      // Spam hissi verebilir
  typing_indicator: false,  // Gereksiz
};
```

### 2. Güvenlik Bildirimleri

```typescript
// Güvenlik bildirimleri her zaman gönderilmeli
const FORCE_SEND_TYPES = ['security_alert', 'account_activity'];

if (FORCE_SEND_TYPES.includes(notificationType)) {
  // Kullanıcı tercihini atla, her zaman gönder
  return true;
}
```

### 3. Rate Limiting

```typescript
// Aynı tipten çok fazla bildirim gönderme
const RATE_LIMITS = {
  content_like: { max: 10, period: '1 hour' },
  new_follower: { max: 20, period: '1 hour' },
  // ...
};
```

### 4. Batch Notifications

```typescript
// Çok fazla bildirim varsa grupla
// "Ayşe ve 5 kişi daha gönderini beğendi"
if (pendingNotifications.length > 3) {
  return createBatchNotification(pendingNotifications);
}
```

---

## Özet

| Özellik                | Durum          | Açıklama                            |
| ---------------------- | -------------- | ----------------------------------- |
| Database Schema        | ✅ Tamamlandı   | `notification_preferences` tablosu  |
| 16 Bildirim Tipi       | ✅ Tamamlandı   | Varsayılan değerlerle               |
| Sessiz Saatler         | ✅ Schema hazır | UI implementasyonu bekliyor         |
| Edge Function Kontrolü | ⏳ Planlandı    | `shouldSendNotification` fonksiyonu |
| Mobile UI              | ⏳ Planlandı    | Ayarlar ekranı                      |
| Rate Limiting          | 📋 Backlog      | Spam önleme                         |
| Batch Notifications    | 📋 Backlog      | Gruplama                            |

---

**İlgili Dosyalar:**
- `supabase/migrations/` - Database schema
- `supabase/functions/send-notification/` - Edge function
- `apps/mobile/src/hooks/useNotificationPreferences.ts` - Mobile hook (planlandı)
- `apps/mobile/src/screens/settings/NotificationSettings.tsx` - UI (planlandı)
