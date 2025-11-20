# Bildirim Tipleri ve Tetikleyiciler 🔔

## 1. Social Notifications (Sosyal Bildirimler)

### new_follower - Yeni Takipçi

**Tetikleyici:** Kullanıcı A, Kullanıcı B'yi takip ediyor

```typescript
{
  type: "new_follower",
  title: "Yeni takipçi!",
  body: "{actor_name} seni takip etmeye başladı",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    actor_avatar: "https://...",
    url: "/profile/user_a_id"
  }
}
```

**Deep Link:** `/profile/{actor_id}`

---

### follow_back - Takip Geri

**Tetikleyici:** Kullanıcı A, Kullanıcı B'yi takip ediyor ve B de A'yı takip ediyor

```typescript
{
  type: "follow_back",
  title: "Takip geri!",
  body: "{actor_name} seni takip etmeye başladı",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    mutual: true,
    url: "/profile/user_a_id"
  }
}
```

---

### profile_mention - Profil Mention

**Tetikleyici:** Kullanıcı A, mesajda Kullanıcı B'yi mention ediyor

```typescript
{
  type: "profile_mention",
  title: "Mention edildin!",
  body: "{actor_name} seni bir mesajda mention etti",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    message_id: "msg_id",
    url: "/messages/user_a_id"
  }
}
```

---

### user_blocked - Kullanıcı Engellendi

**Tetikleyici:** Kullanıcı A, Kullanıcı B'yi engelledi

```typescript
{
  type: "user_blocked",
  title: "Engellendi",
  body: "Bir kullanıcı seni engelledi",
  data: {
    actor_id: "user_a_id",
    reason: "optional_reason"
  }
}
```

---

## 2. Messaging Notifications (Mesajlaşma Bildirimleri)

### new_message - Yeni Mesaj

**Tetikleyici:** Kullanıcı A, Kullanıcı B'ye mesaj gönderiyor

```typescript
{
  type: "new_message",
  title: "Yeni mesaj",
  body: "{actor_name}: {message_preview}",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    message_id: "msg_id",
    message_preview: "Merhaba, nasılsın?",
    conversation_id: "conv_id",
    url: "/messages/user_a_id"
  }
}
```

**Deep Link:** `/messages/{actor_id}`

---

### message_like - Mesaj Beğeni

**Tetikleyici:** Kullanıcı A, Kullanıcı B'nin mesajını beğeniyor

```typescript
{
  type: "message_like",
  title: "Mesajın beğenildi",
  body: "{actor_name} mesajını beğendi",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    message_id: "msg_id",
    conversation_id: "conv_id",
    url: "/messages/user_a_id"
  }
}
```

---

### message_reply - Mesaj Yanıtı

**Tetikleyici:** Kullanıcı A, Kullanıcı B'nin mesajına yanıt veriyor

```typescript
{
  type: "message_reply",
  title: "Mesajına yanıt verildi",
  body: "{actor_name}: {reply_preview}",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    message_id: "original_msg_id",
    reply_id: "reply_msg_id",
    reply_preview: "Harika!",
    conversation_id: "conv_id",
    url: "/messages/user_a_id"
  }
}
```

---

### typing_indicator - Yazıyor Göstergesi

**Tetikleyici:** Kullanıcı A yazıyor

```typescript
{
  type: "typing_indicator",
  title: "",
  body: "{actor_name} yazıyor...",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    conversation_id: "conv_id"
  }
}
```

**Not:** Bu bildirim gösterilmez, sadece UI update için kullanılır.

---

## 3. Content Notifications (İçerik Bildirimleri)

### content_like - İçerik Beğeni

**Tetikleyici:** Kullanıcı A, Kullanıcı B'nin içeriğini beğeniyor

```typescript
{
  type: "content_like",
  title: "İçerik beğenildi",
  body: "{actor_name} içerini beğendi",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    content_id: "content_id",
    content_type: "post|video|audio",
    url: "/content/content_id"
  }
}
```

---

### content_comment - İçerik Yorum

**Tetikleyici:** Kullanıcı A, Kullanıcı B'nin içeriğine yorum yapıyor

```typescript
{
  type: "content_comment",
  title: "Yeni yorum",
  body: "{actor_name}: {comment_preview}",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    content_id: "content_id",
    comment_id: "comment_id",
    comment_preview: "Çok güzel!",
    url: "/content/content_id"
  }
}
```

---

### content_share - İçerik Paylaşım

**Tetikleyici:** Kullanıcı A, Kullanıcı B'nin içeriğini paylaşıyor

```typescript
{
  type: "content_share",
  title: "İçerik paylaşıldı",
  body: "{actor_name} içerini paylaştı",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    content_id: "content_id",
    shared_count: 5,
    url: "/content/content_id"
  }
}
```

---

### content_update - İçerik Güncelleme

**Tetikleyici:** Takip ettiğin kullanıcı yeni içerik yayınladı

```typescript
{
  type: "content_update",
  title: "Yeni içerik",
  body: "{actor_name} yeni içerik yayınladı",
  data: {
    actor_id: "user_a_id",
    actor_name: "Ahmet",
    content_id: "content_id",
    content_title: "Başlık",
    url: "/content/content_id"
  }
}
```

---

## 4. System Notifications (Sistem Bildirimleri)

### system_alert - Sistem Uyarısı

**Tetikleyici:** Admin tarafından manuel gönderilen bildirim

```typescript
{
  type: "system_alert",
  title: "Önemli Duyuru",
  body: "Sistem bakımı yapılacak",
  data: {
    alert_id: "alert_id",
    priority: "high|medium|low",
    action_url: "/announcements"
  }
}
```

---

### maintenance - Bakım Bildirimi

**Tetikleyici:** Sistem bakımı başlıyor

```typescript
{
  type: "maintenance",
  title: "Bakım Bildirimi",
  body: "Sistem {start_time} - {end_time} arasında bakımda olacak",
  data: {
    start_time: "2025-11-20T22:00:00Z",
    end_time: "2025-11-20T23:00:00Z",
    estimated_duration: 60
  }
}
```

---

### security_alert - Güvenlik Uyarısı

**Tetikleyici:** Şüpheli aktivite algılandı

```typescript
{
  type: "security_alert",
  title: "Güvenlik Uyarısı",
  body: "Hesabınıza yeni bir cihazdan giriş yapıldı",
  data: {
    alert_id: "alert_id",
    device_info: "iPhone 15, iOS 17.2",
    location: "Istanbul, Turkey",
    timestamp: "2025-11-20T10:30:00Z",
    action_url: "/settings/security"
  }
}
```

---

### account_activity - Hesap Aktivitesi

**Tetikleyici:** Önemli hesap aktivitesi

```typescript
{
  type: "account_activity",
  title: "Hesap Aktivitesi",
  body: "Şifren değiştirildi",
  data: {
    activity_type: "password_change|email_change|2fa_enabled",
    timestamp: "2025-11-20T10:30:00Z",
    action_url: "/settings/account"
  }
}
```

---

## Bildirim Tercihler (Notification Preferences)

```typescript
{
  push_enabled: true,
  email_enabled: false,
  notification_types: {
    new_follower: true,
    follow_back: true,
    profile_mention: true,
    user_blocked: false,
    new_message: true,
    message_like: false,
    message_reply: true,
    typing_indicator: false,
    content_like: false,
    content_comment: true,
    content_share: false,
    content_update: true,
    system_alert: true,
    maintenance: true,
    security_alert: true,
    account_activity: true
  },
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00"
}
```

---

## Bildirim Gönderm Akışı (Edge Function)

```typescript
// supabase/functions/send-notification/index.ts

export async function sendNotification(
  recipientId: string,
  type: NotificationType,
  data: NotificationData
) {
  // 1. Preferences kontrol et
  const prefs = await getNotificationPreferences(recipientId);
  if (!prefs.push_enabled || !prefs.notification_types[type]) {
    return; // Bildirim gönderme
  }

  // 2. Quiet hours kontrol et
  if (isInQuietHours(prefs)) {
    return; // Bildirim gönderme
  }

  // 3. Device token al
  const deviceToken = await getDeviceToken(recipientId);
  if (!deviceToken) return;

  // 4. Notification kaydı oluştur
  const notification = await createNotificationRecord(
    recipientId,
    type,
    data
  );

  // 5. Push notification gönder
  await sendPushNotification(deviceToken, notification);
}
```

---

## Sonraki Adımlar

1. ✅ Database schema oluştur
2. ✅ Edge Functions oluştur
3. ✅ Triggers setup et
4. ✅ Components oluştur
5. ✅ Messaging system entegre et
