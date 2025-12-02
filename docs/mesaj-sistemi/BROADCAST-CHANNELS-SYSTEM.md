# 📣 Broadcast Channels Sistemi - Kapsamlı Dokümantasyon

**Versiyon:** 2.0  
**Tarih:** 2025-12-02  
**Teknoloji:** Supabase + React Native (Expo)  
**Durum:** Aktif Geliştirme

---

## 📋 İçindekiler

1. [Temel Tanım ve Felsefe](#temel-tanım-ve-felsefe)
2. [Kanal Türleri & Erişim Modelleri](#kanal-türleri--erişim-modelleri)
3. [Roller ve Yetkiler](#roller-ve-yetkiler)
4. [Kanal İçerik Tipleri](#kanal-içerik-tipleri)
5. [Kullanıcı Akışları](#kullanıcı-akışları)
6. [Mesajlaşma Dinamikleri](#mesajlaşma-dinamikleri)
7. [Bildirim Stratejisi](#bildirim-stratejisi)
8. [Database Schema](#database-schema)
9. [API & Edge Functions](#api--edge-functions)
10. [Mobile Components](#mobile-components)
11. [Yapılacak İşler](#yapılacak-işler)

---

## 🎯 Temel Tanım ve Felsefe

Kanal, bir creator'ın kitlesiyle:
- **Tek yönlü iletişim** kurduğu,
- İçeriklerini **"yayın" mantığıyla** paylaştığı,
- Takipçilerinin ise **okuduğu, tepki verdiği ama yazamadığı** özel bir alan.

> Bu, bir sohbet (chat) ya da grup değil, bir **yayın hattı (broadcast feed)**.

### Kanalın Hedefi

| Kime          | Hedef                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| **Creator'a** | "Takipçilerime toplu duyuru yapayım, algoritma beni boğmasın, garanti erişimim olsun." |
| **Takipçiye** | "Bu creator'dan önemli bir şey olursa anında haberim olsun."                           |

### Diğer Özelliklerden Farkı

| Özellik   | Açıklama                                                    |
| --------- | ----------------------------------------------------------- |
| **Story** | Görsel ağırlıklı, timeline'da gezen, 24 saatlik içerik      |
| **Post**  | Keşfedilebilir, profil grid'inde duran kalıcı içerik        |
| **DM**    | Karşılıklı sohbet                                           |
| **Kanal** | Tek taraflı yayın; bildirim gücü yüksek, DM kutusunda yaşar |

### Temel Özellikler

| Özellik                  | Açıklama                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| **Tek Yönlü Mesajlaşma** | Sadece creator mesaj gönderebilir, takipçiler yazamaz            |
| **Emoji Tepkileri**      | Creator'ın belirlediği emojilerle tepki (cihaz emojileri değil!) |
| **Anketler**             | Creator anket oluşturabilir, takipçiler oy verebilir             |
| **Erişim Kontrolü**      | Herkese Açık / Sadece Aboneler / Belirli Tier                    |
| **Realtime Updates**     | Anlık mesaj, tepki ve oy güncellemeleri                          |
| **Bildirimler**          | Takipçilere push notification gönderimi                          |
| **View Tracking**        | Mesaj görüntüleme sayısı takibi                                  |

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ BroadcastList    │  │ BroadcastChannel │                 │
│  │ Screen           │  │ Screen           │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ CreateBroadcast  │  │ BroadcastSettings│                 │
│  │ Screen           │  │ Screen           │                 │
│  └──────────────────┘  └──────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ useBroadcast     │  │ useBroadcastMsg  │                 │
│  │ Channels         │  │ Messages         │                 │
│  └──────────────────┘  └──────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│              Supabase Realtime Layer                         │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Postgres Changes │  │ Broadcast Events │                 │
│  │ (messages)       │  │ (reactions)      │                 │
│  └──────────────────┘  └──────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│              Supabase Backend                                │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ PostgreSQL       │  │ Edge Functions   │                 │
│  │ (broadcast_*)    │  │ (create/send)    │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Kanal Türleri & Erişim Kontrolü

### 1. Public Channels (`public`)

**Erişim:** Tüm takipçiler  
**Açıklama:** Herkese açık yayın kanalı

```typescript
{
  access_type: 'public',
  required_tier_id: null
}
```

**Yetkiler:**
- Creator: Mesaj gönder, anket oluştur, tepki ver
- Takipçi: Mesaj görüntüle, tepki ver, oy ver

---

### 2. Subscribers Only (`subscribers_only`)

**Erişim:** Sadece ücretli aboneler  
**Açıklama:** Ücretli abonelere özel kanal

```typescript
{
  access_type: 'subscribers_only',
  required_tier_id: null
}
```

**Yetkiler:**
- Creator: Mesaj gönder, anket oluştur
- Abone: Mesaj görüntüle, tepki ver, oy ver
- Takipçi: Erişim yok

---

### 3. Tier Specific (`tier_specific`)

**Erişim:** Belirli abonelik seviyesi  
**Açıklama:** VIP, Premium vb. belirli tier'a özel kanal

```typescript
{
  access_type: 'tier_specific',
  required_tier_id: 'uuid-of-tier'
}
```

**Yetkiler:**
- Creator: Mesaj gönder, anket oluştur
- Tier Abone: Mesaj görüntüle, tepki ver, oy ver
- Diğer: Erişim yok

---

## 🗄️ Database Schema

### broadcast_channels

```sql
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
    'public', 'subscribers_only', 'tier_specific'
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

CREATE INDEX idx_broadcast_channels_creator ON broadcast_channels(creator_id);
```

**Kolonlar:**
- `id` - Kanal UUID
- `creator_id` - Creator user ID
- `name` - Kanal adı (max 50 karakter)
- `description` - Kanal açıklaması (max 200 karakter)
- `avatar_url` - Kanal avatarı
- `cover_url` - Kanal kapak fotoğrafı
- `access_type` - Erişim tipi (public/subscribers_only/tier_specific)
- `required_tier_id` - Tier specific için tier ID
- `member_count` - Üye sayısı (trigger ile otomatik güncellenir)
- `message_count` - Mesaj sayısı (trigger ile otomatik güncellenir)
- `allowed_reactions` - İzin verilen emojiler (TEXT array)
- `polls_enabled` - Anketler aktif mi?
- `is_active` - Kanal aktif mi?

---

### broadcast_channel_members

```sql
CREATE TABLE broadcast_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES broadcast_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'follower' CHECK (role IN (
    'owner', 'moderator', 'subscriber', 'follower'
  )),
  
  -- Bildirim ayarları
  notifications_enabled BOOLEAN DEFAULT TRUE,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_broadcast_members_channel ON broadcast_channel_members(channel_id);
CREATE INDEX idx_broadcast_members_user ON broadcast_channel_members(user_id);
```

**Kolonlar:**
- `id` - Üyelik UUID
- `channel_id` - Kanal ID
- `user_id` - Kullanıcı ID
- `role` - Rol (owner/moderator/subscriber/follower)
- `notifications_enabled` - Bildirimler aktif mi?
- `is_muted` - Kanal sessize alındı mı?
- `muted_until` - Sessize alma süresi
- `joined_at` - Katılma tarihi
- `left_at` - Ayrılma tarihi

---

### broadcast_messages

```sql
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
  
  -- Poll
  poll_id UUID REFERENCES broadcast_polls(id),
  
  -- İstatistikler
  view_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  
  -- Durum
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  REPLICA IDENTITY FULL
);

CREATE INDEX idx_broadcast_messages_channel ON broadcast_messages(channel_id, created_at DESC);
```

---

### broadcast_polls

```sql
CREATE TABLE broadcast_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES broadcast_channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES broadcast_messages(id),
  
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id, text, vote_count}]
  
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  is_closed BOOLEAN DEFAULT FALSE,
  
  total_votes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### broadcast_reactions

```sql
CREATE TABLE broadcast_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  emoji TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_broadcast_reactions_message ON broadcast_reactions(message_id);
```

---

## 👥 Rol & Yetkiler

### Owner (Creator)

```typescript
interface OwnerRole {
  role: 'owner'
  can_send_message: true
  can_send_poll: true
  can_delete_message: true
  can_react: false // Kendi mesajına tepki vermez
  can_vote_poll: false
  can_view: true
  can_manage_members: true
  can_edit_channel: true
}
```

**Yetkiler:**
- ✅ Mesaj gönder
- ✅ Anket oluştur
- ✅ Mesaj sil
- ✅ Kanal ayarlarını düzenle
- ✅ Üyeleri yönet

---

### Moderator

```typescript
interface ModeratorRole {
  role: 'moderator'
  can_send_message: false
  can_send_poll: false
  can_delete_message: true
  can_react: true
  can_vote_poll: true
  can_view: true
  can_manage_members: true
  can_edit_channel: false
}
```

**Yetkiler:**
- ✅ Mesaj sil
- ✅ Üyeleri yönet
- ✅ Tepki ver
- ✅ Oy ver

---

### Subscriber (Abone)

```typescript
interface SubscriberRole {
  role: 'subscriber'
  can_send_message: false
  can_send_poll: false
  can_delete_message: false
  can_react: true
  can_vote_poll: true
  can_view: true
  can_manage_members: false
  can_edit_channel: false
}
```

**Yetkiler:**
- ✅ Mesaj görüntüle
- ✅ Tepki ver
- ✅ Oy ver

---

### Follower (Takipçi)

```typescript
interface FollowerRole {
  role: 'follower'
  can_send_message: false
  can_send_poll: false
  can_delete_message: false
  can_react: true
  can_vote_poll: true
  can_view: true // Sadece public kanallarda
  can_manage_members: false
  can_edit_channel: false
}
```

**Yetkiler:**
- ✅ Mesaj görüntüle (public kanallarda)
- ✅ Tepki ver
- ✅ Oy ver

---

## 🔌 API & Edge Functions

### Edge Functions (Tamamlanan)

| Function                   | Durum | Açıklama          |
| -------------------------- | ----- | ----------------- |
| `create-broadcast-channel` | ✅     | Kanal oluştur     |
| `send-broadcast-message`   | ✅     | Mesaj gönder      |
| `join-broadcast-channel`   | ✅     | Kanala katıl      |
| `leave-broadcast-channel`  | ✅     | Kanaldan ayrıl    |
| `react-to-broadcast`       | ✅     | Tepki ekle/kaldır |
| `vote-broadcast-poll`      | ✅     | Ankete oy ver     |

### Edge Functions (Yapılacak)

| Function                 | Açıklama        | Öncelik |
| ------------------------ | --------------- | ------- |
| `get-broadcast-channels` | Kanal listesi   | 🔴 High  |
| `get-broadcast-messages` | Kanal mesajları | 🔴 High  |

---

## 📱 Mobile Components

### Screens (Tamamlanan)

| Screen                       | Durum | Açıklama                                      |
| ---------------------------- | ----- | --------------------------------------------- |
| `BroadcastChannelListScreen` | ✅     | Kanal listesi (Kanallarım / Takip Ettiklerim) |
| `BroadcastChannelScreen`     | ✅     | Kanal içi (mesajlar, tepkiler)                |
| `CreateBroadcastScreen`      | ✅     | Yeni kanal oluştur                            |
| `BroadcastSettingsScreen`    | ✅     | Kanal ayarları                                |
| `BroadcastMembersScreen`     | ✅     | Kanal üyeleri                                 |

### Components (Tamamlanan)

| Component              | Durum | Açıklama               |
| ---------------------- | ----- | ---------------------- |
| `BroadcastMessageCard` | ✅     | Mesaj kartı            |
| `BroadcastPollCard`    | ✅     | Anket kartı            |
| `BroadcastReactionBar` | ✅     | Tepki çubuğu           |
| `BroadcastMemberCount` | ✅     | Üye sayısı             |
| `SubscriberBadge`      | ✅     | Abone rozeti           |
| `ChannelAccessBadge`   | ✅     | Erişim tipi rozeti     |
| `BroadcastComposer`    | ✅     | Creator mesaj gönderme |

---

## 🔄 Realtime Sistemi

### Channel Yapısı

```typescript
// Kanal adlandırması
const channelName = `broadcast:${channelId}`

// Örnek
const channel = supabase.channel('broadcast:550e8400-e29b-41d4-a716-446655440000')
```

### Postgres Changes (Mesajlar)

```typescript
channel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'broadcast_messages',
  filter: `channel_id=eq.${channelId}`
}, handleNewMessage)

channel.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'broadcast_messages',
  filter: `channel_id=eq.${channelId}`
}, handleMessageUpdate)
```

### Broadcast Events (Tepkiler)

```typescript
channel.on('broadcast', {
  event: 'reaction_added'
}, handleReactionAdded)

channel.on('broadcast', {
  event: 'poll_voted'
}, handlePollVoted)
```

---

## 🚀 Yapılmayan İşlemler

### Phase 3: Edge Functions (2/13 Eksik)

**Yapılacak:**

1. **`get-broadcast-channels/index.ts`**
   - Creator'ın kanallarını getir
   - Kullanıcının üye olduğu kanalları getir
   - Pagination desteği
   - Search/filter

2. **`get-broadcast-messages/index.ts`**
   - Kanal mesajlarını getir
   - Cursor-based pagination
   - Erişim kontrolü (access_type)
   - Message count, view count

### Phase 9: Testing & Optimization (9 Görev)

**Yapılacak:**

1. **Unit Tests**
   - `useBroadcastChannels` hook testi
   - `useBroadcastMessages` hook testi
   - `useBroadcastReactions` hook testi
   - `useBroadcastPolls` hook testi

2. **Component Tests**
   - `BroadcastMessageCard` rendering
   - `BroadcastPollCard` voting
   - `BroadcastReactionBar` reactions

3. **Integration Tests**
   - Kanal oluşturma flow
   - Mesaj gönderme flow
   - Tepki ekleme flow
   - Anket oy verme flow

4. **Performance Tests**
   - Message list scrolling
   - Realtime latency
   - Memory usage

5. **Optimizations**
   - Message virtualization (FlashList)
   - Image caching (expo-image)
   - Lazy loading media
   - Optimistic updates

---

## 📋 Implementasyon Sırası

### Haftası 1: Edge Functions & API

**Gün 1-2: get-broadcast-channels**
```typescript
// Endpoint: GET /broadcast/channels
// Query params: type (created|subscribed), search, limit, offset
// Response: { channels: BroadcastChannel[], total: number }

// Kullanım:
const { data: channels } = await getBroadcastChannels({
  type: 'created', // Creator'ın kanalları
  limit: 20,
  offset: 0
})
```

**Gün 3-4: get-broadcast-messages**
```typescript
// Endpoint: GET /broadcast/{channelId}/messages
// Query params: limit, cursor, include_reactions
// Response: { messages: BroadcastMessage[], nextCursor: string }

// Kullanım:
const { data: messages } = await getBroadcastMessages(channelId, {
  limit: 20,
  cursor: lastMessageId
})
```

### Haftası 2-3: Testing

**Gün 1-2: Unit Tests**
- Hook'ları test et
- API client'ı test et
- Store'ları test et

**Gün 3-4: Component Tests**
- Component rendering
- User interactions
- State updates

**Gün 5: Integration Tests**
- Full flow testing
- Error handling
- Edge cases

**Gün 6-7: Performance & Optimization**
- Memory profiling
- Render optimization
- Caching strategies

---

## 📊 İlerleme Takibi

| Phase                   | Görev   | Tamamlanan | Durum   |
| ----------------------- | ------- | ---------- | ------- |
| Phase 1: Database       | 20      | 19         | ✅ 95%   |
| Phase 2: Types & API    | 10      | 10         | ✅ 100%  |
| Phase 3: Edge Functions | 13      | 11         | 🟡 85%   |
| Phase 4: Hooks & Stores | 14      | 14         | ✅ 100%  |
| Phase 5: DM UI          | 10      | 10         | ✅ 100%  |
| Phase 6: Broadcast UI   | 12      | 12         | ✅ 100%  |
| Phase 7: Realtime       | 11      | 11         | ✅ 100%  |
| Phase 8: Notifications  | 10      | 10         | ✅ 100%  |
| Phase 9: Testing        | 9       | 0          | ⏳ 0%    |
| **TOPLAM**              | **109** | **97**     | **89%** |

---

## 🔐 RLS Policies

### Broadcast Channels

```sql
-- Public channels: Herkes görüntüleyebilir
CREATE POLICY "public_channels_select" ON broadcast_channels
  FOR SELECT USING (
    access_type = 'public' OR
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM broadcast_channel_members
      WHERE channel_id = broadcast_channels.id
      AND user_id = auth.uid()
    )
  );

-- Sadece creator düzenleyebilir
CREATE POLICY "creator_update" ON broadcast_channels
  FOR UPDATE USING (creator_id = auth.uid());
```

### Broadcast Messages

```sql
-- Erişim kontrolü
CREATE POLICY "broadcast_messages_select" ON broadcast_messages
  FOR SELECT USING (
    -- Public kanal
    (SELECT access_type FROM broadcast_channels WHERE id = channel_id) = 'public'
    OR
    -- Creator
    sender_id = auth.uid()
    OR
    -- Üye
    EXISTS (
      SELECT 1 FROM broadcast_channel_members
      WHERE channel_id = broadcast_messages.channel_id
      AND user_id = auth.uid()
    )
  );
```

---

## 📝 Notlar

- **Realtime Test:** Realtime sistemi Phase 7'de test edildi
- **SafeArea Fix:** CreateBroadcastScreen'de SafeArea düzeltildi (2025-12-01)
- **Component Modülerliği:** Tüm component'ler 200 satır altında tutuldu
- **Theme System:** Tüm component'lerde `useTheme()` kullanıldı

---

**Son Güncelleme:** 2025-12-01 23:15 UTC+03:00  
**Tahmini Tamamlanma:** 2025-12-08 (1 hafta)  
**Toplam Tahmini Süre:** 20 gün (Phase 1-9)
