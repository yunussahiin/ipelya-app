# Admin Impersonation - Kullanıcı Adına Mesaj Gönderme

**Oluşturulma Tarihi:** 2025-11-28
**Versiyon:** 1.0

---

## 📋 Genel Bakış

Admin'lerin kullanıcı adına mesaj göndermesine olanak tanıyan sistem. Bu özellik, müşteri desteği, hesap yönetimi ve kullanıcı deneyimi iyileştirme amaçlı kullanılır.

### Kullanım Senaryoları

1. **Müşteri Desteği:** Kullanıcı şikayetlerine yanıt verme
2. **Hesap Kurtarma:** Kullanıcı adına iletişim kurma
3. **Test/Debug:** Kullanıcı deneyimini test etme
4. **Moderasyon:** Uygunsuz içerik düzeltme

---

## 🏗️ Mimari

### Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB OPS PANEL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Admin kullanıcı seçer                                       │
│     └── User Search/Select Dialog                               │
│                                                                 │
│  2. Kullanıcının sohbetleri listelenir                          │
│     └── Conversations List (DM + Broadcast)                     │
│                                                                 │
│  3. Admin sohbete katılır (read-only veya write mode)           │
│     └── Conversation View + Message Input                       │
│                                                                 │
│  4. Admin mesaj gönderir (kullanıcı adına)                      │
│     └── POST /api/ops/messaging/impersonate                     │
│                                                                 │
│  5. Mesaj kaydedilir + Audit log oluşturulur                    │
│     └── messages table + audit_logs table                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Mevcut messages tablosuna eklenen kolonlar
ALTER TABLE messages ADD COLUMN IF NOT EXISTS 
  sent_by_admin_id UUID REFERENCES profiles(user_id);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS 
  is_impersonated BOOLEAN DEFAULT FALSE;

-- Audit log için
CREATE TABLE IF NOT EXISTS admin_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(user_id),
  target_user_id UUID NOT NULL REFERENCES profiles(user_id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  action TEXT NOT NULL, -- 'view', 'send_message', 'edit_message', 'delete_message'
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_impersonation_logs_admin ON admin_impersonation_logs(admin_id);
CREATE INDEX idx_impersonation_logs_target ON admin_impersonation_logs(target_user_id);
CREATE INDEX idx_impersonation_logs_created ON admin_impersonation_logs(created_at DESC);
```

---

## 🔐 Güvenlik

### Yetkilendirme Seviyeleri

| Seviye      | Rol          | Yetkiler                             |
| ----------- | ------------ | ------------------------------------ |
| **Level 1** | Admin        | Sadece görüntüleme (read-only)       |
| **Level 2** | Senior Admin | Görüntüleme + Mesaj gönderme         |
| **Level 3** | Super Admin  | Tüm yetkiler + Mesaj düzenleme/silme |

### Güvenlik Kuralları

1. **Audit Logging:** Her işlem kaydedilir
2. **Rate Limiting:** Dakikada max 10 impersonation işlemi
3. **Notification:** Hedef kullanıcıya bildirim (opsiyonel, config'den)
4. **IP Tracking:** Admin IP adresi kaydedilir
5. **Session Timeout:** 30 dakika inaktivite sonrası oturum sonlanır
6. **Two-Factor:** Hassas işlemler için 2FA gerekebilir

### RLS Policies

```sql
-- Admin'ler tüm mesajları görebilir
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admin'ler impersonate mesaj gönderebilir
CREATE POLICY "Admins can send impersonated messages" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    AND sent_by_admin_id = auth.uid()
    AND is_impersonated = TRUE
  );
```

---

## 📡 API Endpoints

### 1. Kullanıcı Sohbetlerini Listele

```typescript
GET /api/ops/messaging/users/[userId]/conversations

Response:
{
  success: true,
  data: [
    {
      id: "conv-uuid",
      type: "direct",
      other_participant: {
        user_id: "user-uuid",
        display_name: "John Doe",
        avatar_url: "..."
      },
      last_message: {
        content: "Merhaba",
        created_at: "2025-11-28T10:00:00Z"
      },
      unread_count: 5
    }
  ]
}
```

### 2. Sohbet Mesajlarını Getir

```typescript
GET /api/ops/messaging/users/[userId]/conversations/[conversationId]/messages

Query Params:
- cursor: string (pagination)
- limit: number (default: 50)

Response:
{
  success: true,
  data: [
    {
      id: "msg-uuid",
      content: "Mesaj içeriği",
      sender_id: "sender-uuid",
      sender_profile: {
        display_name: "Jane",
        avatar_url: "..."
      },
      is_impersonated: false,
      sent_by_admin_id: null,
      created_at: "2025-11-28T10:00:00Z"
    }
  ],
  nextCursor: "..."
}
```

### 3. Kullanıcı Adına Mesaj Gönder

```typescript
POST /api/ops/messaging/impersonate

Body:
{
  target_user_id: "user-uuid",      // Hangi kullanıcı adına
  conversation_id: "conv-uuid",     // Hangi sohbete
  content: "Mesaj içeriği",
  content_type: "text",             // text, image, file
  reply_to_id?: "msg-uuid"          // Opsiyonel: yanıtlanan mesaj
}

Response:
{
  success: true,
  data: {
    message_id: "new-msg-uuid",
    audit_log_id: "audit-uuid"
  }
}
```

### 4. Impersonation Loglarını Getir

```typescript
GET /api/ops/messaging/impersonation-logs

Query Params:
- admin_id: string (opsiyonel)
- target_user_id: string (opsiyonel)
- action: string (opsiyonel)
- from: string (ISO date)
- to: string (ISO date)
- limit: number

Response:
{
  success: true,
  data: [
    {
      id: "log-uuid",
      admin: {
        id: "admin-uuid",
        display_name: "Admin User"
      },
      target_user: {
        id: "user-uuid",
        display_name: "Target User"
      },
      action: "send_message",
      metadata: {
        message_content: "...",
        conversation_id: "..."
      },
      created_at: "2025-11-28T10:00:00Z"
    }
  ]
}
```

---

## 🎨 UI Components

### 1. UserSelectDialog

Kullanıcı seçim dialog'u:

```tsx
<UserSelectDialog
  open={open}
  onSelect={(user) => handleUserSelect(user)}
  onClose={() => setOpen(false)}
/>
```

**Özellikler:**
- Kullanıcı arama (username, email, display_name)
- Son aktif kullanıcılar
- Kullanıcı detayları (avatar, profil tipi, son aktivite)

### 2. ImpersonationBanner

Impersonation modunda gösterilen banner:

```tsx
<ImpersonationBanner
  targetUser={selectedUser}
  onExit={() => exitImpersonation()}
/>
```

**Görünüm:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ IMPERSONATION MODE                                       │
│ Şu anda @johndoe olarak mesaj gönderiyorsunuz              │
│                                          [Çıkış] [Loglar]   │
└─────────────────────────────────────────────────────────────┘
```

### 3. ImpersonatedMessageBadge

Impersonate edilmiş mesajlarda gösterilen badge:

```tsx
<ImpersonatedMessageBadge
  adminName="Admin User"
  timestamp="2025-11-28T10:00:00Z"
/>
```

**Görünüm:**
```
┌─────────────────────────────────────────┐
│ 👤 Admin tarafından gönderildi          │
│    Admin User • 28 Kas 10:00            │
└─────────────────────────────────────────┘
```

### 4. ConversationViewer

Kullanıcının sohbetlerini görüntüleme:

```tsx
<ConversationViewer
  userId={targetUserId}
  conversationId={selectedConversationId}
  mode="write" // 'read' | 'write'
  onSendMessage={handleImpersonatedMessage}
/>
```

---

## 📊 Audit Dashboard

### Impersonation Activity

Admin panel'de impersonation aktivitelerini gösteren dashboard:

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Impersonation Activity                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Son 24 Saat:                                                │
│ ├── Toplam İşlem: 45                                        │
│ ├── Mesaj Gönderme: 32                                      │
│ ├── Görüntüleme: 13                                         │
│ └── Aktif Admin: 3                                          │
│                                                             │
│ En Aktif Admin'ler:                                         │
│ 1. admin@example.com - 20 işlem                             │
│ 2. support@example.com - 15 işlem                           │
│ 3. moderator@example.com - 10 işlem                         │
│                                                             │
│ [Detaylı Loglar] [Export CSV]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Konfigürasyon

### Environment Variables

```env
# Impersonation özelliği aktif mi?
IMPERSONATION_ENABLED=true

# Hangi roller impersonate edebilir?
IMPERSONATION_ALLOWED_ROLES=admin,super_admin

# Rate limit (dakika başına)
IMPERSONATION_RATE_LIMIT=10

# Kullanıcıya bildirim gönderilsin mi?
IMPERSONATION_NOTIFY_USER=false

# Audit log retention (gün)
IMPERSONATION_LOG_RETENTION_DAYS=365
```

### Database Config

```sql
INSERT INTO ops_config (key, value, description) VALUES
  ('impersonation_enabled', 'true', 'Impersonation özelliği aktif mi'),
  ('impersonation_notify_user', 'false', 'Kullanıcıya bildirim gönder'),
  ('impersonation_rate_limit', '10', 'Dakika başına max işlem');
```

---

## 🔄 Workflow

### Admin Impersonation Flow

```
1. Admin "Kullanıcı Mesajları" sayfasına gider
   └── /ops/messaging/users

2. Kullanıcı arar ve seçer
   └── UserSelectDialog açılır

3. Kullanıcının sohbetleri listelenir
   └── /ops/messaging/users/[userId]/conversations

4. Admin bir sohbet seçer
   └── Mesajlar yüklenir

5. Admin mesaj yazar ve gönderir
   └── POST /api/ops/messaging/impersonate

6. Mesaj kaydedilir
   └── messages tablosuna is_impersonated=true ile

7. Audit log oluşturulur
   └── admin_impersonation_logs tablosuna

8. Karşı tarafa mesaj gider (realtime)
   └── Normal mesaj gibi görünür (opsiyonel: badge ile)
```

---

## 📝 Notlar

### Best Practices

1. **Minimal Kullanım:** Sadece gerekli durumlarda kullan
2. **Şeffaflık:** Tüm işlemler loglanmalı
3. **Yetki Kontrolü:** Sadece yetkili admin'ler kullanabilmeli
4. **Kullanıcı Gizliliği:** Gereksiz veri erişiminden kaçın
5. **Düzenli Audit:** Logları düzenli olarak incele

### Yasal Uyarılar

- Bu özellik KVKK/GDPR uyumlu olmalı
- Kullanıcı sözleşmesinde belirtilmeli
- Sadece meşru amaçlar için kullanılmalı
- Kötüye kullanım disiplin işlemi gerektirir

---

## 🚀 Implementasyon Planı

### Phase 1: Database (0.5 gün)
- [ ] `sent_by_admin_id` kolonu ekle
- [ ] `is_impersonated` kolonu ekle
- [ ] `admin_impersonation_logs` tablosu oluştur
- [ ] RLS policies ekle

### Phase 2: API (1 gün)
- [ ] `GET /api/ops/messaging/users/[userId]/conversations`
- [ ] `GET /api/ops/messaging/users/[userId]/conversations/[conversationId]/messages`
- [ ] `POST /api/ops/messaging/impersonate`
- [ ] `GET /api/ops/messaging/impersonation-logs`

### Phase 3: UI (1 gün)
- [ ] UserSelectDialog
- [ ] ImpersonationBanner
- [ ] ConversationViewer
- [ ] ImpersonatedMessageBadge
- [ ] Impersonation Logs sayfası

### Phase 4: Testing (0.5 gün)
- [ ] API tests
- [ ] UI tests
- [ ] Security tests

**Toplam Süre:** 3 gün

---

**Son Güncelleme:** 2025-11-28 04:05
