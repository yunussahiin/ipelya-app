# Web Ops Mesajlaşma - API Endpoints

**Tarih:** 2025-11-28

---

## 📋 Genel Kurallar

### Authentication
Tüm endpoint'ler admin authentication gerektirir:

```typescript
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createAdminSupabaseClient();
  
  // Auth kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... işlemler
}
```

### Response Format

```typescript
// Başarılı
{ success: true, data: T }

// Hata
{ error: string, code?: string }

// Pagination
{ success: true, data: T[], nextCursor: string | null, total?: number }
```

---

## 🔍 Kullanıcı Mesajlaşma Yönetimi

### GET /api/ops/messaging/conversations

Tüm kullanıcı sohbetlerini listeler.

**Query Parameters:**
| Param       | Type    | Default | Açıklama                  |
| ----------- | ------- | ------- | ------------------------- |
| `page`      | number  | 1       | Sayfa numarası            |
| `limit`     | number  | 20      | Sayfa başına kayıt        |
| `search`    | string  | -       | Kullanıcı adı/email arama |
| `type`      | string  | -       | 'direct' veya 'group'     |
| `hasUnread` | boolean | -       | Okunmamış mesaj filtresi  |

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    type: 'direct' | 'group'
    name: string | null
    participants: {
      user_id: string
      display_name: string
      avatar_url: string
      username: string
    }[]
    last_message: {
      content: string
      content_type: string
      created_at: string
      sender_name: string
    } | null
    message_count: number
    created_at: string
    last_message_at: string
  }[],
  nextCursor: string | null,
  total: number
}
```

---

### GET /api/ops/messaging/messages

Bir sohbetin mesajlarını listeler.

**Query Parameters:**
| Param            | Type    | Default  | Açıklama                  |
| ---------------- | ------- | -------- | ------------------------- |
| `conversationId` | string  | required | Sohbet ID                 |
| `cursor`         | string  | -        | Pagination cursor         |
| `limit`          | number  | 50       | Mesaj sayısı              |
| `includeShadow`  | boolean | true     | Shadow mesajları dahil et |

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    conversation_id: string
    sender: {
      user_id: string
      display_name: string
      avatar_url: string
      username: string
    }
    content: string
    content_type: string
    media_url: string | null
    reply_to: {
      id: string
      content: string
      sender_name: string
    } | null
    is_shadow: boolean
    is_deleted: boolean
    is_flagged: boolean
    moderation_status: string
    created_at: string
  }[],
  nextCursor: string | null
}
```

---

### GET /api/ops/messaging/broadcast/channels

Tüm broadcast kanallarını listeler.

**Query Parameters:**
| Param        | Type   | Default | Açıklama                                      |
| ------------ | ------ | ------- | --------------------------------------------- |
| `page`       | number | 1       | Sayfa numarası                                |
| `limit`      | number | 20      | Sayfa başına kayıt                            |
| `search`     | string | -       | Kanal adı arama                               |
| `accessType` | string | -       | 'public', 'subscribers_only', 'tier_specific' |
| `creatorId`  | string | -       | Creator ID filtresi                           |

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    name: string
    description: string | null
    avatar_url: string | null
    creator: {
      user_id: string
      display_name: string
      username: string
    }
    access_type: string
    member_count: number
    message_count: number
    is_active: boolean
    created_at: string
  }[],
  nextCursor: string | null,
  total: number
}
```

---

### GET /api/ops/messaging/broadcast/messages

Bir kanalın mesajlarını listeler.

**Query Parameters:**
| Param       | Type   | Default  | Açıklama          |
| ----------- | ------ | -------- | ----------------- |
| `channelId` | string | required | Kanal ID          |
| `cursor`    | string | -        | Pagination cursor |
| `limit`     | number | 50       | Mesaj sayısı      |

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    channel_id: string
    content: string
    content_type: string
    media_url: string | null
    poll: {
      id: string
      question: string
      options: { id: string, text: string, vote_count: number }[]
      total_votes: number
      is_closed: boolean
    } | null
    view_count: number
    reaction_count: number
    is_pinned: boolean
    is_deleted: boolean
    created_at: string
  }[],
  nextCursor: string | null
}
```

---

### POST /api/ops/messaging/moderate

Mesaj moderasyon işlemi.

**Request Body:**
```typescript
{
  messageId: string
  messageType: 'dm' | 'broadcast'
  action: 'hide' | 'unhide' | 'delete' | 'flag' | 'unflag'
  reason?: string
  adminNote?: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    action: string
    performed_at: string
    performed_by: string
  }
}
```

---

## 💬 Admin Chat API

### GET /api/ops/admin-chat/conversations

Admin sohbetlerini listeler.

**Query Parameters:**
| Param      | Type    | Default | Açıklama              |
| ---------- | ------- | ------- | --------------------- |
| `type`     | string  | -       | 'direct' veya 'group' |
| `archived` | boolean | false   | Arşivlenmiş sohbetler |

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    type: 'direct' | 'group'
    name: string | null
    avatar_url: string | null
    other_participant: {
      admin_id: string
      full_name: string
      email: string
    } | null
    participants: {
      admin_id: string
      full_name: string
      email: string
    }[]
    last_message: {
      content: string
      sender_name: string
      created_at: string
    } | null
    unread_count: number
    is_muted: boolean
    created_at: string
    last_message_at: string
  }[]
}
```

---

### POST /api/ops/admin-chat/conversations

Yeni admin sohbeti oluşturur.

**Request Body:**
```typescript
{
  type: 'direct' | 'group'
  participantIds: string[] // admin_profile IDs
  name?: string // Grup için
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    type: string
    name: string | null
    created_at: string
  }
}
```

---

### GET /api/ops/admin-chat/messages

Admin mesajlarını listeler.

**Query Parameters:**
| Param            | Type   | Default  | Açıklama          |
| ---------------- | ------ | -------- | ----------------- |
| `conversationId` | string | required | Sohbet ID         |
| `cursor`         | string | -        | Pagination cursor |
| `limit`          | number | 50       | Mesaj sayısı      |

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    conversation_id: string
    sender: {
      admin_id: string
      full_name: string
      email: string
    }
    content: string
    content_type: string
    media_url: string | null
    media_metadata: {
      filename: string
      size: number
      mime_type: string
    } | null
    reply_to: {
      id: string
      content: string
      sender_name: string
    } | null
    mentions: {
      admin_id: string
      display_name: string
    }[]
    is_edited: boolean
    created_at: string
  }[],
  nextCursor: string | null
}
```

---

### POST /api/ops/admin-chat/messages

Yeni admin mesajı gönderir.

**Request Body:**
```typescript
{
  conversationId: string
  content: string
  contentType?: 'text' | 'image' | 'file' | 'link'
  mediaUrl?: string
  mediaMetadata?: {
    filename: string
    size: number
    mime_type: string
  }
  replyToId?: string
  mentions?: string[] // admin_profile IDs
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    conversation_id: string
    content: string
    created_at: string
  }
}
```

---

### POST /api/ops/admin-chat/messages/[messageId]/read

Mesajı okundu olarak işaretler.

**Response:**
```typescript
{
  success: true
}
```

---

### DELETE /api/ops/admin-chat/messages/[messageId]

Mesajı siler.

**Response:**
```typescript
{
  success: true
}
```

---

### GET /api/ops/admin-chat/admins

Tüm aktif admin'leri listeler (sohbet başlatmak için).

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    full_name: string
    email: string
    is_online: boolean
    last_seen_at: string | null
  }[]
}
```

---

### POST /api/ops/admin-chat/groups

Yeni admin grubu oluşturur.

**Request Body:**
```typescript
{
  name: string
  participantIds: string[] // admin_profile IDs
  avatarUrl?: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    name: string
    created_at: string
  }
}
```

---

### PUT /api/ops/admin-chat/groups/[groupId]

Grup bilgilerini günceller.

**Request Body:**
```typescript
{
  name?: string
  avatarUrl?: string
  addParticipants?: string[]
  removeParticipants?: string[]
}
```

---

### DELETE /api/ops/admin-chat/groups/[groupId]

Grubu siler (sadece oluşturan admin).

---

## 🔔 Realtime Events

### Typing Indicator

```typescript
// POST /api/ops/admin-chat/typing
{
  conversationId: string
  isTyping: boolean
}
```

### Online Status

Supabase Presence kullanılır, API endpoint yok.

---

**Son Güncelleme:** 2025-11-28
