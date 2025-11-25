# Android Notification Channels - Kanal Sistemi 📢

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Android Notification Channels Nedir?](#android-notification-channels-nedir)
3. [Mevcut Implementasyon](#mevcut-implementasyon)
4. [Kullanıcı Tercihleri Sistemi](#kullanıcı-tercihleri-sistemi)
5. [Database Schema](#database-schema)
6. [Tek Kanal vs Çoklu Kanal](#tek-kanal-vs-çoklu-kanal)
7. [Gelecek Geliştirmeler](#gelecek-geliştirmeler)

---

## Genel Bakış

İpelya'da bildirim kanalları iki seviyede yönetilir:

1. **Android OS Seviyesi** - Android Notification Channels (cihaz ayarları)
2. **Uygulama Seviyesi** - `notification_preferences` tablosu (uygulama içi ayarlar)

```
┌─────────────────────────────────────────────────────────────┐
│                    Kullanıcı Tercihleri                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │  Android OS Level   │    │  App Level (DB)     │        │
│  │  ─────────────────  │    │  ─────────────────  │        │
│  │  Notification       │    │  notification_      │        │
│  │  Channels           │    │  preferences        │        │
│  │                     │    │                     │        │
│  │  • Ses açık/kapalı  │    │  • Tip bazlı        │        │
│  │  • Titreşim         │    │    açık/kapalı      │        │
│  │  • Öncelik          │    │  • Sessiz saatler   │        │
│  │  • Kilit ekranı     │    │  • Push/Email       │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                              │
│  Cihaz Ayarları'ndan        Uygulama İçi Ayarlar'dan        │
│  kontrol edilir             kontrol edilir                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Android Notification Channels Nedir?

### Tanım

Android 8.0 (API 26) ve üzeri sürümlerde, her bildirim bir **kanal** üzerinden gönderilmek zorundadır. Kanal, Android'in bildirimleri kategorilere ayırmasını sağlayan bir sistemdir.

### Neden Zorunlu?

| Sebep                  | Açıklama                                                   |
| ---------------------- | ---------------------------------------------------------- |
| **Kullanıcı Kontrolü** | Kullanıcı kanal bazında tercihlerini değiştirebilir        |
| **Sistem Gereksinimi** | Kanal olmadan bildirim görünmez veya sessize alınır        |
| **Kategorilendirme**   | Farklı bildirim türleri farklı davranışlara sahip olabilir |

### Kanal Özellikleri

```typescript
interface NotificationChannel {
  id: string;           // Benzersiz kanal ID'si
  name: string;         // Kullanıcıya görünen ad
  description?: string; // Kanal açıklaması
  importance: AndroidImportance; // Öncelik seviyesi
  sound?: string;       // Özel ses dosyası
  vibrationPattern?: number[]; // Titreşim deseni
  lightColor?: string;  // LED rengi
  lockscreenVisibility?: AndroidNotificationVisibility;
  bypassDnd?: boolean;  // Rahatsız Etme modunu atla
  showBadge?: boolean;  // Uygulama badge'i göster
}
```

### Importance Seviyeleri

| Seviye    | Değer | Davranış                             |
| --------- | ----- | ------------------------------------ |
| `MAX`     | 5     | Heads-up notification, ses, titreşim |
| `HIGH`    | 4     | Ses ve titreşim                      |
| `DEFAULT` | 3     | Ses, titreşim yok                    |
| `LOW`     | 2     | Sessiz, status bar'da görünür        |
| `MIN`     | 1     | Sessiz, gizli                        |
| `NONE`    | 0     | Kanal kapalı                         |

---

## Mevcut Implementasyon

### Konum

```
apps/mobile/src/hooks/useDeviceToken.ts
```

### Kod

```typescript
// 3. Android notification channel oluştur
if (Device.osName === 'Android') {
  console.log('🤖 Setting up Android notification channel...');
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B35', // İpelya turuncu
  });
  console.log('✅ Android notification channel created');
}
```

### Mevcut Konfigürasyon

| Özellik            | Değer                | Açıklama               |
| ------------------ | -------------------- | ---------------------- |
| `id`               | `default`            | Tek kanal ID'si        |
| `name`             | `Default`            | Kullanıcıya görünen ad |
| `importance`       | `MAX`                | En yüksek öncelik      |
| `vibrationPattern` | `[0, 250, 250, 250]` | Kısa titreşim deseni   |
| `lightColor`       | `#FF6B35`            | İpelya turuncu LED     |

### Ne Zaman Çalışır?

1. Uygulama ilk açıldığında
2. `useDeviceToken` hook'u mount olduğunda
3. Sadece Android cihazlarda

---

## Kullanıcı Tercihleri Sistemi

### Uygulama İçi Tercihler

Android kanalları OS seviyesinde kontrol sağlarken, İpelya **uygulama içi** tercih sistemi ile daha granüler kontrol sunar.

### Database: `notification_preferences`

```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
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
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Bildirim Tipleri ve Varsayılan Değerler

#### Sosyal Bildirimler
| Tip               | Varsayılan | Açıklama                   |
| ----------------- | ---------- | -------------------------- |
| `new_follower`    | ✅ Açık     | Yeni takipçi bildirimi     |
| `follow_back`     | ✅ Açık     | Karşılıklı takip bildirimi |
| `profile_mention` | ✅ Açık     | Profil mention bildirimi   |
| `user_blocked`    | ❌ Kapalı   | Engelleme bildirimi        |

#### Mesajlaşma Bildirimleri
| Tip                | Varsayılan | Açıklama               |
| ------------------ | ---------- | ---------------------- |
| `new_message`      | ✅ Açık     | Yeni mesaj bildirimi   |
| `message_like`     | ❌ Kapalı   | Mesaj beğeni bildirimi |
| `message_reply`    | ✅ Açık     | Mesaj yanıtı bildirimi |
| `typing_indicator` | ❌ Kapalı   | Yazıyor göstergesi     |

#### İçerik Bildirimleri
| Tip               | Varsayılan | Açıklama                    |
| ----------------- | ---------- | --------------------------- |
| `content_like`    | ❌ Kapalı   | İçerik beğeni bildirimi     |
| `content_comment` | ✅ Açık     | İçerik yorum bildirimi      |
| `content_share`   | ❌ Kapalı   | İçerik paylaşım bildirimi   |
| `content_update`  | ✅ Açık     | İçerik güncelleme bildirimi |

#### Sistem Bildirimleri
| Tip                | Varsayılan | Açıklama         |
| ------------------ | ---------- | ---------------- |
| `system_alert`     | ✅ Açık     | Sistem uyarısı   |
| `maintenance`      | ✅ Açık     | Bakım bildirimi  |
| `security_alert`   | ✅ Açık     | Güvenlik uyarısı |
| `account_activity` | ✅ Açık     | Hesap aktivitesi |

### Tercih Akışı

```
┌─────────────────────────────────────────────────────────────┐
│                  Bildirim Gönderme Akışı                     │
└─────────────────────────────────────────────────────────────┘

1. Event Tetiklenir (örn: yeni mesaj)
         │
         ▼
2. notification_preferences Kontrol
   ├─ push_enabled = true?
   ├─ notification_types.new_message = true?
   └─ quiet_hours içinde mi?
         │
         ▼
3. Tercihler Uygunsa
   ├─ notifications tablosuna INSERT
   ├─ device_tokens'dan token al
   └─ Expo Push Service'e gönder
         │
         ▼
4. Android Cihazda
   ├─ 'default' kanalına yönlendir
   └─ Kullanıcının kanal ayarlarına göre göster
```

---

## Database Schema

### Tam Schema Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                    notification_preferences                  │
├─────────────────────────────────────────────────────────────┤
│ user_id (PK, FK)        │ UUID      │ auth.users.id         │
│ push_enabled            │ BOOLEAN   │ default: true         │
│ email_enabled           │ BOOLEAN   │ default: false        │
│ notification_types      │ JSONB     │ tip bazlı tercihler   │
│ quiet_hours_start       │ TIME      │ sessiz saat başlangıç │
│ quiet_hours_end         │ TIME      │ sessiz saat bitiş     │
│ created_at              │ TIMESTAMPTZ │                     │
│ updated_at              │ TIMESTAMPTZ │                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ user_id
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       device_tokens                          │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                 │ UUID      │                       │
│ user_id (FK, UNIQUE)    │ UUID      │ auth.users.id         │
│ token                   │ TEXT      │ Expo Push Token       │
│ device_type             │ TEXT      │ 'ios' | 'android'     │
│ device_name             │ TEXT      │ cihaz modeli          │
│ created_at              │ TIMESTAMPTZ │                     │
│ updated_at              │ TIMESTAMPTZ │                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ recipient_id
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       notifications                          │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                 │ UUID      │                       │
│ recipient_id (FK)       │ UUID      │ auth.users.id         │
│ actor_id (FK)           │ UUID      │ auth.users.id         │
│ type                    │ TEXT      │ bildirim tipi         │
│ title                   │ TEXT      │ başlık                │
│ body                    │ TEXT      │ içerik                │
│ data                    │ JSONB     │ ek veri               │
│ read                    │ BOOLEAN   │ okundu mu?            │
│ read_at                 │ TIMESTAMPTZ │ okunma zamanı       │
│ created_at              │ TIMESTAMPTZ │                     │
└─────────────────────────────────────────────────────────────┘
```

### RLS Policies

```sql
-- notification_preferences: Sadece kendi tercihlerini görebilir/değiştirebilir
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Tek Kanal vs Çoklu Kanal

### Karşılaştırma

| Özellik                | Tek `default` Kanal  | Çoklu Kanal          |
| ---------------------- | -------------------- | -------------------- |
| **Implementasyon**     | ✅ Basit              | ⚠️ Orta karmaşıklık   |
| **Kullanıcı Deneyimi** | Tüm bildirimler aynı | Kanal bazlı kontrol  |
| **OS Ayarları**        | Tek seçenek          | Birden fazla seçenek |
| **Bakım**              | Kolay                | Daha fazla kod       |

### Tek Kanal (Mevcut Durum)

```
Android Ayarları → Uygulamalar → İpelya → Bildirimler
└── Default: Açık/Kapalı (tüm bildirimler)
```

**Avantajları:**
- Basit implementasyon
- Daha az bakım
- Kullanıcı için anlaşılır

**Dezavantajları:**
- Granüler kontrol yok (OS seviyesinde)
- Ya hep ya hiç

### Çoklu Kanal (Opsiyonel Gelecek)

```
Android Ayarları → Uygulamalar → İpelya → Bildirimler
├── Mesajlar: Açık, Sesli
├── Eşleşmeler: Açık, Sessiz
├── Sosyal: Açık, Titreşimli
└── Sistem: Kapalı
```

**Örnek Implementasyon:**

```typescript
// Çoklu kanal oluşturma (gelecekte)
if (Device.osName === 'Android') {
  // Mesaj kanalı
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Mesajlar',
    description: 'Yeni mesaj bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'message_sound.wav',
    vibrationPattern: [0, 250, 250, 250],
  });

  // Sosyal kanal
  await Notifications.setNotificationChannelAsync('social', {
    name: 'Sosyal',
    description: 'Takipçi ve etkileşim bildirimleri',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  // Sistem kanalı
  await Notifications.setNotificationChannelAsync('system', {
    name: 'Sistem',
    description: 'Güvenlik ve bakım bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    bypassDnd: true, // Önemli sistem bildirimleri
  });
}
```

### Neden Şu An Tek Kanal Yeterli?

1. **Uygulama içi tercihler zaten var** - `notification_preferences` tablosu ile kullanıcı istediği bildirimi kapatabilir
2. **Karmaşıklık artırır** - Her bildirimde `channelId` belirtmek gerekir
3. **Kullanıcı geri bildirimi yok** - Henüz talep gelmedi
4. **İleride eklenebilir** - Kanal sistemi geriye dönük uyumlu

---

## Gelecek Geliştirmeler

### Kısa Vadeli (Öncelikli)

1. **Ayarlar Ekranı UI** - Kullanıcının bildirim tercihlerini değiştirebileceği ekran
2. **Sessiz Saatler** - `quiet_hours_start` ve `quiet_hours_end` implementasyonu
3. **Tercih Senkronizasyonu** - Cihazlar arası tercih senkronizasyonu

### Orta Vadeli

1. **Çoklu Kanal Desteği** - Kullanıcı talebi olursa
2. **Özel Sesler** - Bildirim tiplerine göre farklı sesler
3. **Bildirim Gruplandırma** - Aynı türden bildirimleri gruplama

### Uzun Vadeli

1. **AI Tabanlı Tercihler** - Kullanıcı davranışına göre otomatik tercih önerisi
2. **Bildirim Özeti** - Günlük/haftalık bildirim özeti
3. **Smart Notifications** - Kullanıcının aktif olduğu saatlerde bildirim gönderme

---

## Özet

| Konu                         | Durum          | Açıklama                           |
| ---------------------------- | -------------- | ---------------------------------- |
| Android Notification Channel | ✅ Tamamlandı   | Tek `default` kanal                |
| Database Schema              | ✅ Tamamlandı   | `notification_preferences` tablosu |
| Tip Bazlı Tercihler          | ✅ Tamamlandı   | 16 farklı bildirim tipi            |
| Sessiz Saatler               | ⏳ Schema hazır | UI implementasyonu bekliyor        |
| Ayarlar Ekranı               | ⏳ Planlandı    | Mobile UI gerekli                  |
| Çoklu Kanal                  | 📋 Backlog      | Talep olursa                       |

---

**İlgili Dosyalar:**
- `apps/mobile/src/hooks/useDeviceToken.ts` - Kanal oluşturma
- `supabase/migrations/` - Database schema
- `docs/bildirim-sistemi/mobile/` - Mobile implementasyon detayları
