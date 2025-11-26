# İpelya Mesaj Sistemi - Mimari Dökümanı

**Versiyon:** 1.0
**Tarih:** 2025-11-26
**Teknoloji:** Supabase Realtime + React Native

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Supabase Realtime Özellikleri](#supabase-realtime-özellikleri)
4. [Database Schema](#database-schema)
5. [Mesaj Türleri](#mesaj-türleri)
6. [Realtime Channels](#realtime-channels)
7. [Presence Sistemi](#presence-sistemi)
8. [Shadow Mode Mesaj Yönetimi](#shadow-mode-mesaj-yönetimi)
9. [Shadow Mode Mesaj Yönetimi](#shadow-mode-mesaj-yönetimi)
10. [Creator Broadcast Channels](#creator-broadcast-channels)
11. [Güvenlik & RLS](#güvenlik--rls)
12. [Edge Functions](#edge-functions)
13. [Mobile Components](#mobile-components)
14. [Performance & Scaling](#performance--scaling)
15. [Creator Broadcast Channels](#creator-broadcast-channels)

---

## 🎯 Genel Bakış

İpelya mesaj sistemi, kullanıcılar arasında gerçek zamanlı iletişim sağlayan bir DM (Direct Message) sistemidir.

### Temel Özellikler

| Özellik                | Açıklama                                      |
| ---------------------- | --------------------------------------------- |
| **1:1 Mesajlaşma**     | İki kullanıcı arasında özel sohbet            |
| **Grup Mesajlaşma**    | Birden fazla kullanıcı ile sohbet (opsiyonel) |
| **Realtime Delivery**  | Anlık mesaj iletimi (6-28ms latency)          |
| **Typing Indicators**  | "Yazıyor..." göstergesi                       |
| **Online Status**      | Kullanıcı çevrimiçi durumu                    |
| **Read Receipts**      | Okundu bilgisi                                |
| **Media Sharing**      | Fotoğraf, video, ses paylaşımı                |
| **Message Reactions**  | Mesaja emoji tepkisi                          |
| **Reply/Quote**        | Mesaja yanıt verme                            |
| **Delete/Edit**        | Mesaj silme/düzenleme                         |
| **Push Notifications** | Bildirim sistemi entegrasyonu                 |

### Mevcut Sistemlerle Entegrasyon

- **Shadow Profile:** Shadow modda mesajlaşma desteği
- **Notification System:** Push notification entegrasyonu
- **Block System:** Engellenen kullanıcılarla mesajlaşma engeli
- **Content Moderation:** AI moderasyon entegrasyonu

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ ChatScreen  │  │ ChatList    │  │ MessageInput            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ useMessages │  │ usePresence │  │ useTypingIndicator      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase Realtime Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Broadcast   │  │ Presence    │  │ Postgres Changes        │  │
│  │ (typing)    │  │ (online)    │  │ (messages)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase Backend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │ Edge Funcs  │  │ Storage                 │  │
│  │ (messages)  │  │ (send-msg)  │  │ (media)                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Supabase Realtime Özellikleri

### 1. Broadcast (Ephemeral Messages)
Typing indicators, cursor positions gibi geçici mesajlar için.

```typescript
// Typing indicator gönderme
const channel = supabase.channel(`chat:${conversationId}`)

channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { userId, isTyping: true }
})
```

### 2. Presence (User State)
Online/offline durumu ve aktif kullanıcı takibi.

```typescript
// Online durumu takibi
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  console.log('Online users:', Object.keys(state))
})

// Kendi durumunu track et
channel.track({ 
  user_id: userId,
  online_at: new Date().toISOString()
})
```

### 3. Postgres Changes (Database Events)
Mesaj INSERT/UPDATE/DELETE olaylarını dinleme.

```typescript
// Yeni mesajları dinle
channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  },
  (payload) => {
    console.log('New message:', payload.new)
  }
)
```

---

## 🗄️ Database Schema

### conversations (Sohbetler)

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT, -- Grup sohbetleri için
  avatar_url TEXT, -- Grup avatarı
  created_by UUID REFERENCES auth.users(id),
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

### conversation_participants (Katılımcılar)

```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id), -- Real veya Shadow profile
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  
  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
```

### messages (Mesajlar)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_profile_id UUID REFERENCES profiles(id), -- Real veya Shadow
  
  -- İçerik
  content TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN (
    'text', 'image', 'video', 'audio', 'file', 'gif', 'sticker', 'location'
  )),
  
  -- Media
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_metadata JSONB, -- width, height, duration, size
  
  -- Reply/Forward
  reply_to_id UUID REFERENCES messages(id),
  forwarded_from_id UUID REFERENCES messages(id),
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_for JSONB DEFAULT '[]', -- Sadece belirli kullanıcılar için silindi
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'approved',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_reply ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Realtime için REPLICA IDENTITY
ALTER TABLE messages REPLICA IDENTITY FULL;
```

### message_reactions (Tepkiler)

```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);
```

### message_read_receipts (Okundu Bilgisi)

```sql
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_receipts_message ON message_read_receipts(message_id);
```

---

## 📨 Mesaj Türleri

| Tür        | Açıklama        | Örnek                  |
| ---------- | --------------- | ---------------------- |
| `text`     | Düz metin       | "Merhaba!"             |
| `image`    | Fotoğraf        | JPEG, PNG, WebP        |
| `video`    | Video           | MP4, MOV               |
| `audio`    | Ses mesajı      | M4A, AAC               |
| `file`     | Dosya           | PDF, DOC               |
| `gif`      | Animasyonlu GIF | GIPHY entegrasyonu     |
| `sticker`  | Sticker         | Özel sticker paketleri |
| `location` | Konum           | Lat/Lng koordinatları  |

---

## 📡 Realtime Channels

### Channel Yapısı

```typescript
// 1. Conversation Channel (mesajlar + typing)
const conversationChannel = supabase.channel(`conversation:${conversationId}`)

// 2. User Presence Channel (online status)
const presenceChannel = supabase.channel('presence:global')

// 3. User Notifications Channel (yeni mesaj bildirimi)
const notificationChannel = supabase.channel(`notifications:${userId}`)
```

### Event Types

| Event            | Channel      | Açıklama               |
| ---------------- | ------------ | ---------------------- |
| `message:new`    | conversation | Yeni mesaj             |
| `message:update` | conversation | Mesaj düzenlendi       |
| `message:delete` | conversation | Mesaj silindi          |
| `typing:start`   | conversation | Yazıyor başladı        |
| `typing:stop`    | conversation | Yazıyor bitti          |
| `presence:sync`  | presence     | Online durumu sync     |
| `presence:join`  | presence     | Kullanıcı online oldu  |
| `presence:leave` | presence     | Kullanıcı offline oldu |

---

## 👥 Presence Sistemi

### Online Status Tracking

```typescript
interface UserPresence {
  user_id: string
  profile_id: string
  online_at: string
  last_seen_at: string
  status: 'online' | 'away' | 'busy' | 'offline'
  device: 'mobile' | 'web'
}
```

### Typing Indicator

```typescript
interface TypingEvent {
  user_id: string
  conversation_id: string
  is_typing: boolean
  timestamp: number
}

// Debounce: 3 saniye sonra otomatik stop
```

---

## 🔐 Shadow Mode Mesaj Yönetimi

### Konsept

Shadow modda gönderilen mesajlar özel kurallara tabidir:
- **Kullanıcı tarafında:** Belirli gün sonra otomatik silinir (görünmez olur)
- **Backend'de:** Güvenlik ve hukuki nedenlerle saklanmaya devam eder
- **Soft Delete:** `is_deleted_for_user = true`, `deleted_at` timestamp

### Shadow Mesaj Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Shadow Mesaj Akışı                        │
├─────────────────────────────────────────────────────────────┤
│  1. Mesaj Gönderilir (shadow_profile_id ile)                │
│     ↓                                                        │
│  2. Mesaj DB'ye kaydedilir (is_shadow = true)               │
│     ↓                                                        │
│  3. X gün sonra (örn: 7 gün) → Cron job çalışır             │
│     ↓                                                        │
│  4. Kullanıcı tarafında silinir:                            │
│     - is_deleted_for_user = true                            │
│     - user_deleted_at = NOW()                               │
│     ↓                                                        │
│  5. Backend'de kalır:                                        │
│     - is_deleted = false (hala mevcut)                      │
│     - Sadece admin/ops erişebilir                           │
│     - Hukuki talep durumunda erişilebilir                   │
└─────────────────────────────────────────────────────────────┘
```

### Database Eklentileri

```sql
-- messages tablosuna ek kolonlar
ALTER TABLE messages ADD COLUMN is_shadow BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN shadow_retention_days INTEGER DEFAULT 7;
ALTER TABLE messages ADD COLUMN is_deleted_for_user BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN user_deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN admin_notes TEXT; -- Hukuki notlar için

-- Shadow mesaj silme indexi
CREATE INDEX idx_messages_shadow_cleanup 
ON messages(is_shadow, created_at, is_deleted_for_user) 
WHERE is_shadow = TRUE AND is_deleted_for_user = FALSE;
```

### Cleanup Edge Function

```typescript
// cleanup-shadow-messages (Cron: Her gün 03:00)
const retentionDays = 7; // Varsayılan 7 gün

const { data, error } = await supabase
  .from('messages')
  .update({ 
    is_deleted_for_user: true,
    user_deleted_at: new Date().toISOString()
  })
  .eq('is_shadow', true)
  .eq('is_deleted_for_user', false)
  .lt('created_at', new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString());
```

### RLS Policy (Shadow Mesajlar)

```sql
-- Kullanıcılar sadece silinmemiş shadow mesajları görebilir
CREATE POLICY "Users can view non-deleted shadow messages"
ON messages FOR SELECT
USING (
  CASE 
    WHEN is_shadow = TRUE THEN is_deleted_for_user = FALSE
    ELSE TRUE
  END
);

-- Admin/Ops tüm mesajları görebilir (hukuki erişim)
CREATE POLICY "Admins can view all messages including deleted"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

---

## 📣 Creator Broadcast Channels

### Konsept

Instagram tarzı tek yönlü yayın kanalları:
- **Sadece creator mesaj gönderebilir**
- **Takipçiler sadece okuyabilir**
- **Takipçiler emoji tepki verebilir**
- **Takipçiler ankete katılabilir**
- **Abone özel kanallar** (ücretli abonelere özel)

### Kanal Türleri

| Tür                | Erişim                 | Açıklama                         |
| ------------------ | ---------------------- | -------------------------------- |
| `public`           | Tüm takipçiler         | Herkese açık yayın kanalı        |
| `subscribers_only` | Sadece aboneler        | Ücretli abonelere özel kanal     |
| `tier_specific`    | Belirli tier aboneleri | Belirli abonelik seviyesine özel |

### Rol & Yetkiler

```typescript
interface BroadcastChannelRole {
  role: 'owner' | 'moderator' | 'subscriber' | 'follower'
  
  // Yetkiler
  can_send_message: boolean
  can_send_poll: boolean
  can_delete_message: boolean
  can_react: boolean
  can_vote_poll: boolean
  can_view: boolean
}

// Owner (Creator)
const ownerRole: BroadcastChannelRole = {
  role: 'owner',
  can_send_message: true,
  can_send_poll: true,
  can_delete_message: true,
  can_react: false, // Kendi mesajına tepki vermez
  can_vote_poll: false,
  can_view: true
}

// Subscriber (Abone)
const subscriberRole: BroadcastChannelRole = {
  role: 'subscriber',
  can_send_message: false,
  can_send_poll: false,
  can_delete_message: false,
  can_react: true,
  can_vote_poll: true,
  can_view: true
}

// Follower (Takipçi - sadece public kanallarda)
const followerRole: BroadcastChannelRole = {
  role: 'follower',
  can_send_message: false,
  can_send_poll: false,
  can_delete_message: false,
  can_react: true,
  can_vote_poll: true,
  can_view: true // Sadece public kanallarda
}
```

### Database Schema

```sql
-- broadcast_channels (Yayın Kanalları)
CREATE TABLE broadcast_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Kanal bilgileri
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  
  -- Erişim kontrolü
  access_type TEXT DEFAULT 'public' CHECK (access_type IN (
    'public',           -- Tüm takipçiler
    'subscribers_only', -- Sadece aboneler
    'tier_specific'     -- Belirli tier
  )),
  required_tier_id UUID REFERENCES creator_subscription_tiers(id),
  
  -- İstatistikler
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  
  -- Ayarlar
  allowed_reactions TEXT[] DEFAULT ARRAY['❤️', '🔥', '👏', '😍', '🎉'],
  polls_enabled BOOLEAN DEFAULT TRUE,
  
  -- Durum
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- broadcast_channel_members (Kanal Üyeleri)
CREATE TABLE broadcast_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES broadcast_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'follower' CHECK (role IN ('owner', 'moderator', 'subscriber', 'follower')),
  
  -- Bildirim ayarları
  notifications_enabled BOOLEAN DEFAULT TRUE,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  UNIQUE(channel_id, user_id)
);

-- broadcast_messages (Yayın Mesajları)
CREATE TABLE broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES broadcast_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id), -- Her zaman creator
  
  -- İçerik
  content TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN (
    'text', 'image', 'video', 'poll', 'announcement'
  )),
  
  -- Media
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_metadata JSONB,
  
  -- Poll (anket)
  poll_id UUID REFERENCES broadcast_polls(id),
  
  -- İstatistikler
  view_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  
  -- Durum
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- broadcast_polls (Anketler)
CREATE TABLE broadcast_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES broadcast_channels(id) ON DELETE CASCADE,
  message_id UUID, -- broadcast_messages'a referans (circular, sonra set edilir)
  
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id, text, vote_count}]
  
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  is_closed BOOLEAN DEFAULT FALSE,
  
  total_votes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- broadcast_poll_votes (Anket Oyları)
CREATE TABLE broadcast_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES broadcast_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  option_ids TEXT[] NOT NULL, -- Seçilen seçenekler
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(poll_id, user_id)
);

-- broadcast_reactions (Tepkiler)
CREATE TABLE broadcast_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  emoji TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_broadcast_channels_creator ON broadcast_channels(creator_id);
CREATE INDEX idx_broadcast_members_channel ON broadcast_channel_members(channel_id);
CREATE INDEX idx_broadcast_members_user ON broadcast_channel_members(user_id);
CREATE INDEX idx_broadcast_messages_channel ON broadcast_messages(channel_id, created_at DESC);
CREATE INDEX idx_broadcast_reactions_message ON broadcast_reactions(message_id);

-- Realtime için
ALTER TABLE broadcast_messages REPLICA IDENTITY FULL;
```

### Erişim Kontrolü (RLS)

```sql
-- Kanal görüntüleme: Public veya üye ise
CREATE POLICY "View broadcast channels"
ON broadcast_channels FOR SELECT
USING (
  access_type = 'public'
  OR EXISTS (
    SELECT 1 FROM broadcast_channel_members
    WHERE channel_id = broadcast_channels.id
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Mesaj görüntüleme: Üye ise + erişim kontrolü
CREATE POLICY "View broadcast messages"
ON broadcast_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broadcast_channel_members bcm
    JOIN broadcast_channels bc ON bc.id = bcm.channel_id
    WHERE bcm.channel_id = broadcast_messages.channel_id
    AND bcm.user_id = auth.uid()
    AND bcm.left_at IS NULL
    AND (
      bc.access_type = 'public'
      OR bcm.role IN ('owner', 'moderator', 'subscriber')
      OR (
        bc.access_type = 'subscribers_only'
        AND EXISTS (
          SELECT 1 FROM creator_subscriptions
          WHERE subscriber_id = auth.uid()
          AND creator_id = bc.creator_id
          AND status = 'active'
        )
      )
    )
  )
);

-- Mesaj gönderme: Sadece owner
CREATE POLICY "Only owner can send broadcast messages"
ON broadcast_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM broadcast_channels
    WHERE id = broadcast_messages.channel_id
    AND creator_id = auth.uid()
  )
);

-- Tepki verme: Üye ise + izin verilen emojiler
CREATE POLICY "Members can react to broadcast messages"
ON broadcast_reactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM broadcast_channel_members bcm
    JOIN broadcast_channels bc ON bc.id = bcm.channel_id
    JOIN broadcast_messages bm ON bm.channel_id = bc.id
    WHERE bm.id = broadcast_reactions.message_id
    AND bcm.user_id = auth.uid()
    AND bcm.left_at IS NULL
    AND broadcast_reactions.emoji = ANY(bc.allowed_reactions)
  )
);
```

### Realtime Channel Yapısı

```typescript
// Broadcast channel subscription
const broadcastChannel = supabase.channel(`broadcast:${channelId}`)

// Yeni mesaj dinle
broadcastChannel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'broadcast_messages',
    filter: `channel_id=eq.${channelId}`
  },
  (payload) => {
    console.log('New broadcast message:', payload.new)
  }
)

// Tepki sayısı güncellemesi
broadcastChannel.on(
  'broadcast',
  { event: 'reaction_update' },
  (payload) => {
    console.log('Reaction updated:', payload)
  }
)

broadcastChannel.subscribe()
```

### Edge Functions

```typescript
// 1. create-broadcast-channel
// POST /functions/v1/create-broadcast-channel
{
  name: string
  description?: string
  access_type: 'public' | 'subscribers_only' | 'tier_specific'
  required_tier_id?: string
  allowed_reactions?: string[]
}

// 2. send-broadcast-message
// POST /functions/v1/send-broadcast-message
{
  channel_id: string
  content: string
  content_type: 'text' | 'image' | 'video' | 'poll'
  media_url?: string
  poll?: {
    question: string
    options: string[]
    is_multiple_choice: boolean
    expires_in_hours?: number
  }
}

// 3. join-broadcast-channel
// POST /functions/v1/join-broadcast-channel
{
  channel_id: string
}

// 4. react-to-broadcast
// POST /functions/v1/react-to-broadcast
{
  message_id: string
  emoji: string
}

// 5. vote-broadcast-poll
// POST /functions/v1/vote-broadcast-poll
{
  poll_id: string
  option_ids: string[]
}
```

### Bildirim Sistemi

```typescript
// Creator mesaj gönderdiğinde tüm üyelere bildirim
async function notifyBroadcastMembers(channelId: string, messageId: string) {
  // Tüm aktif üyeleri al
  const { data: members } = await supabase
    .from('broadcast_channel_members')
    .select('user_id, notifications_enabled')
    .eq('channel_id', channelId)
    .eq('notifications_enabled', true)
    .is('left_at', null)
    .neq('role', 'owner')
  
  // Bulk notification gönder
  await supabase.functions.invoke('send-bulk-notification', {
    body: {
      user_ids: members.map(m => m.user_id),
      title: 'Yeni Yayın Mesajı',
      body: 'Creator yeni bir mesaj paylaştı',
      data: { channel_id: channelId, message_id: messageId }
    }
  })
}
```

### Mobile UI Components

```typescript
// Broadcast Channel Screens
- BroadcastChannelListScreen   // Creator'ın kanalları
- BroadcastChannelScreen       // Kanal içi mesajlar
- CreateBroadcastScreen        // Yeni kanal oluştur
- BroadcastSettingsScreen      // Kanal ayarları

// Components
- BroadcastMessageCard         // Mesaj kartı (büyük, dikkat çekici)
- BroadcastPollCard            // Anket kartı
- BroadcastReactionBar         // Tepki çubuğu (izin verilen emojiler)
- BroadcastMemberCount         // Üye sayısı göstergesi
- SubscriberBadge              // Abone rozeti
```

---

## 🔒 Güvenlik & RLS

### RLS Policies

```sql
-- Conversations: Sadece katılımcılar görebilir
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Messages: Sadece conversation katılımcıları görebilir
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Messages: Sadece kendi mesajını gönderebilir
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Block kontrolü
CREATE POLICY "Blocked users cannot send messages"
ON messages FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = messages.sender_id)
    OR (blocker_id = messages.sender_id AND blocked_id = auth.uid())
  )
);
```

---

## ⚡ Edge Functions

### 1. send-message

```typescript
// POST /functions/v1/send-message
{
  conversation_id: string
  content: string
  content_type: 'text' | 'image' | ...
  media_url?: string
  reply_to_id?: string
}
```

### 2. create-conversation

```typescript
// POST /functions/v1/create-conversation
{
  type: 'direct' | 'group'
  participant_ids: string[]
  name?: string // Grup için
}
```

### 3. mark-as-read

```typescript
// POST /functions/v1/mark-as-read
{
  conversation_id: string
  message_id: string
}
```

### 4. delete-message

```typescript
// POST /functions/v1/delete-message
{
  message_id: string
  delete_for: 'me' | 'everyone'
}
```

### 5. cleanup-shadow-messages (Cron Job)

```typescript
// Cron: Her gün 03:00 UTC
// Shadow mesajları kullanıcı tarafında siler (backend'de kalır)
{
  retention_days: number // Varsayılan: 7
}
```

### Broadcast Channel Edge Functions

```typescript
// 6. create-broadcast-channel
// 7. send-broadcast-message
// 8. join-broadcast-channel
// 9. leave-broadcast-channel
// 10. react-to-broadcast
// 11. vote-broadcast-poll
// 12. get-broadcast-channels (creator'ın kanalları)
// 13. get-broadcast-messages (kanal mesajları)
```

---

## 📱 Mobile Components

### DM Screens
- `ChatListScreen` - Sohbet listesi
- `ChatScreen` - Mesajlaşma ekranı
- `NewChatScreen` - Yeni sohbet başlatma
- `ChatSettingsScreen` - Sohbet ayarları

### Broadcast Screens
- `BroadcastChannelListScreen` - Creator'ın yayın kanalları
- `BroadcastChannelScreen` - Kanal içi mesajlar
- `CreateBroadcastScreen` - Yeni kanal oluştur
- `BroadcastSettingsScreen` - Kanal ayarları
- `BroadcastMembersScreen` - Kanal üyeleri

### DM Components
- `MessageBubble` - Mesaj balonu
- `MessageInput` - Mesaj giriş alanı
- `TypingIndicator` - Yazıyor göstergesi
- `OnlineIndicator` - Online durumu
- `MediaPicker` - Medya seçici
- `VoiceRecorder` - Ses kaydedici
- `ReplyPreview` - Yanıt önizleme
- `ShadowMessageBadge` - Shadow mesaj göstergesi

### Broadcast Components
- `BroadcastMessageCard` - Yayın mesaj kartı (büyük, dikkat çekici)
- `BroadcastPollCard` - Anket kartı
- `BroadcastReactionBar` - Tepki çubuğu (izin verilen emojiler)
- `BroadcastMemberCount` - Üye sayısı göstergesi
- `SubscriberBadge` - Abone rozeti
- `ChannelAccessBadge` - Kanal erişim tipi rozeti

### Hooks
- `useMessages` - Mesaj listesi
- `useConversations` - Sohbet listesi
- `usePresence` - Online durumu
- `useTyping` - Typing indicator
- `useSendMessage` - Mesaj gönderme
- `useBroadcastChannels` - Yayın kanalları
- `useBroadcastMessages` - Kanal mesajları
- `useBroadcastReactions` - Tepkiler
- `useBroadcastPolls` - Anketler

---

## 📊 Performance & Scaling

### Optimizasyonlar

| Strateji               | Açıklama                     |
| ---------------------- | ---------------------------- |
| **Pagination**         | Cursor-based, 50 mesaj/sayfa |
| **Caching**            | React Query ile local cache  |
| **Optimistic Updates** | Anında UI güncellemesi       |
| **Message Batching**   | Toplu mesaj yükleme          |
| **Image Compression**  | Gönderim öncesi sıkıştırma   |
| **Lazy Loading**       | Medya lazy load              |

### Supabase Limits

| Metrik                 | Limit    |
| ---------------------- | -------- |
| Concurrent connections | 250,000+ |
| Messages/sec           | 800,000+ |
| Latency (median)       | 19ms     |
| Latency (p95)          | 58ms     |
| Payload size           | 1MB max  |

---

## 📝 Sonraki Adımlar

### Phase 1: Database Migrations
- [ ] `conversations` tablosu
- [ ] `conversation_participants` tablosu
- [ ] `messages` tablosu (shadow kolonları dahil)
- [ ] `message_reactions` tablosu
- [ ] `message_read_receipts` tablosu
- [ ] Broadcast tabloları (5 tablo)
- [ ] RLS policies
- [ ] Indexes
- [ ] Realtime publication

### Phase 2: Edge Functions
- [ ] `send-message`
- [ ] `create-conversation`
- [ ] `mark-as-read`
- [ ] `delete-message`
- [ ] `cleanup-shadow-messages` (Cron)
- [ ] Broadcast functions (8 adet)

### Phase 3: Mobile Hooks & Stores
- [ ] `useMessages` hook
- [ ] `useConversations` hook
- [ ] `usePresence` hook
- [ ] `useTyping` hook
- [ ] `useBroadcast*` hooks
- [ ] Zustand stores

### Phase 4: UI Components
- [ ] DM screens (4 adet)
- [ ] Broadcast screens (5 adet)
- [ ] DM components (8 adet)
- [ ] Broadcast components (6 adet)

### Phase 5: Realtime Entegrasyonu
- [ ] Postgres Changes subscription
- [ ] Broadcast events (typing)
- [ ] Presence tracking
- [ ] Connection management

### Phase 6: Push Notifications
- [ ] Yeni mesaj bildirimi
- [ ] Broadcast mesaj bildirimi
- [ ] Mention bildirimi
- [ ] Bildirim ayarları

### Phase 7: Testing & Optimization
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] Load tests

---

## 📊 Özet Tablo

| Kategori           | Sayı |
| ------------------ | ---- |
| Database Tabloları | 10   |
| Edge Functions     | 13   |
| Mobile Screens     | 9    |
| Mobile Components  | 14   |
| Hooks              | 9    |

---

**Son Güncelleme:** 2025-11-26 01:37 UTC+03:00
