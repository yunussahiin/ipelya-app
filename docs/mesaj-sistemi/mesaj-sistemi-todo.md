# İpelya Mesaj Sistemi - Implementation Todo List

**Oluşturulma Tarihi:** 2025-11-26
**Referans Döküman:** 01-MESSAGING-SYSTEM-ARCHITECTURE.md
**Teknoloji:** Supabase Realtime + React Native (Expo)

---

## 📋 Genel Bakış

Bu todo-list, İpelya Mesaj Sistemi'nin tam implementasyonu için gerekli tüm adımları içerir.

### Kapsam
- **DM (Direct Messages):** 1:1 ve grup mesajlaşma
- **Broadcast Channels:** Creator yayın kanalları
- **Shadow Mode:** Güvenli mesaj yönetimi
- **Realtime:** Anlık mesaj iletimi

### Geliştirme Kuralları

| Kural                | Açıklama                                                             |
| -------------------- | -------------------------------------------------------------------- |
| **Theme System**     | `useTheme()` hook ile `colors` kullan, hardcoded renk YASAK          |
| **Component Bazlı**  | Her component kendi klasöründe: `index.tsx`, `types.ts`, `styles.ts` |
| **Modüler Yapı**     | 300+ satır component'ler parçalanmalı                                |
| **Skeleton Loading** | ActivityIndicator YASAK, Skeleton kullan                             |
| **Türkçe Comment**   | Her component'te detaylı Türkçe açıklama                             |
| **FlashList**        | FlatList yerine FlashList kullan                                     |

---

## Phase 1: Database Schema & Migrations

### 1.1 DM Tabloları
- [x] `conversations` tablosu oluştur <!-- ✅ 2025-11-26 - Supabase MCP ile oluşturuldu -->
  - id, type (direct/group), name, avatar_url
  - created_by, last_message_id, last_message_at
  - is_archived, created_at, updated_at
  - Indexes: last_message_at DESC

- [x] `conversation_participants` tablosu oluştur <!-- ✅ 2025-11-26 - Supabase MCP ile oluşturuldu -->
  - id, conversation_id, user_id, profile_id
  - role (admin/member), joined_at, left_at
  - is_muted, muted_until, last_read_at
  - last_read_message_id, unread_count
  - UNIQUE(conversation_id, user_id)
  - Indexes: user_id, conversation_id

- [x] `messages` tablosu oluştur <!-- ✅ 2025-11-26 - Shadow mode kolonları dahil -->
  - id, conversation_id, sender_id, sender_profile_id
  - content, content_type (text/image/video/audio/file/gif/sticker/location)
  - media_url, media_thumbnail_url, media_metadata (JSONB)
  - reply_to_id, forwarded_from_id
  - status (sending/sent/delivered/read/failed)
  - is_edited, edited_at, is_deleted, deleted_at
  - deleted_for (JSONB), is_flagged, moderation_status
  - **Shadow Mode:** is_shadow, shadow_retention_days, is_deleted_for_user, user_deleted_at, admin_notes
  - created_at, updated_at
  - REPLICA IDENTITY FULL
  - Indexes: (conversation_id, created_at DESC), sender_id, reply_to_id

- [x] `message_reactions` tablosu oluştur <!-- ✅ 2025-11-26 -->
  - id, message_id, user_id, emoji
  - created_at
  - UNIQUE(message_id, user_id, emoji)
  - Indexes: message_id

- [x] `message_read_receipts` tablosu oluştur <!-- ✅ 2025-11-26 -->
  - id, message_id, user_id, read_at
  - UNIQUE(message_id, user_id)
  - Indexes: message_id

### 1.2 Broadcast Channel Tabloları
- [x] `broadcast_channels` tablosu oluştur <!-- ✅ 2025-11-26 - access_type, allowed_reactions dahil -->
  - id, creator_id, name, description, avatar_url, cover_url
  - access_type (public/subscribers_only/tier_specific)
  - required_tier_id (FK: creator_subscription_tiers)
  - member_count, message_count
  - allowed_reactions (TEXT[]), polls_enabled
  - is_active, created_at, updated_at
  - Indexes: creator_id

- [x] `broadcast_channel_members` tablosu oluştur <!-- ✅ 2025-11-26 -->
  - id, channel_id, user_id
  - role (owner/moderator/subscriber/follower)
  - notifications_enabled, is_muted, muted_until
  - joined_at, left_at
  - UNIQUE(channel_id, user_id)
  - Indexes: channel_id, user_id

- [x] `broadcast_messages` tablosu oluştur <!-- ✅ 2025-11-26 - REPLICA IDENTITY FULL -->
  - id, channel_id, sender_id
  - content, content_type (text/image/video/poll/announcement)
  - media_url, media_thumbnail_url, media_metadata
  - poll_id, view_count, reaction_count
  - is_pinned, is_deleted
  - created_at, updated_at
  - REPLICA IDENTITY FULL
  - Indexes: (channel_id, created_at DESC)

- [x] `broadcast_polls` tablosu oluştur <!-- ✅ 2025-11-26 -->
  - id, channel_id, message_id
  - question, options (JSONB: [{id, text, vote_count}])
  - is_multiple_choice, expires_at, is_closed
  - total_votes, created_at

- [x] `broadcast_poll_votes` tablosu oluştur <!-- ✅ 2025-11-26 -->
  - id, poll_id, user_id, option_ids (TEXT[])
  - created_at
  - UNIQUE(poll_id, user_id)

- [x] `broadcast_reactions` tablosu oluştur <!-- ✅ 2025-11-26 -->
  - id, message_id, user_id, emoji
  - created_at
  - UNIQUE(message_id, user_id, emoji)
  - Indexes: message_id

### 1.3 RLS Policies
- [x] DM conversations RLS (katılımcı kontrolü) <!-- ✅ 2025-11-26 -->
- [x] DM messages RLS (görüntüleme + gönderme) <!-- ✅ 2025-11-26 -->
- [x] Block kontrolü RLS <!-- ✅ 2025-11-26 -->
- [x] Shadow mesaj RLS (is_deleted_for_user kontrolü) <!-- ✅ 2025-11-26 -->
- [x] Admin erişim RLS (hukuki erişim) <!-- ✅ 2025-11-26 -->
- [x] Broadcast channels RLS (public + üye kontrolü) <!-- ✅ 2025-11-26 -->
- [x] Broadcast messages RLS (erişim tipi kontrolü) <!-- ✅ 2025-11-26 -->
- [x] Broadcast reactions RLS (izin verilen emojiler) <!-- ✅ 2025-11-26 -->

### 1.4 Realtime Setup
- [x] `supabase_realtime` publication'a tablolar ekle <!-- ✅ 2025-11-26 -->
  - messages, broadcast_messages
- [x] REPLICA IDENTITY FULL ayarla <!-- ✅ 2025-11-26 -->
- [ ] Realtime test et

### 1.5 Triggers & Functions
- [x] `update_conversation_last_message()` trigger <!-- ✅ 2025-11-26 -->
- [x] `increment_unread_count()` trigger <!-- ✅ 2025-11-26 -->
- [x] `update_broadcast_member_count()` trigger <!-- ✅ 2025-11-26 -->
- [x] `update_broadcast_message_count()` trigger <!-- ✅ 2025-11-26 -->
- [x] `update_broadcast_reaction_count()` trigger <!-- ✅ 2025-11-26 -->

**Durum:** ✅ Tamamlandı (2025-11-26)
**Tahmini Süre:** 2 gün

---

## Phase 2: Shared Types & API Client

### 2.1 Type Definitions
**Lokasyon:** `packages/types/src/messaging.ts` <!-- Tüm tipler tek dosyada birleştirildi -->

- [x] `conversation.ts` - Conversation types <!-- ✅ 2025-11-26 - messaging.ts içinde -->
  ```typescript
  Conversation, ConversationParticipant, ConversationType
  CreateConversationRequest, ConversationListItem
  ```

- [x] `message.ts` - Message types <!-- ✅ 2025-11-26 - messaging.ts içinde -->
  ```typescript
  Message, MessageContentType, MessageStatus
  MessageReaction, MessageReadReceipt
  CreateMessageRequest, UpdateMessageRequest
  ```

- [x] `broadcast.ts` - Broadcast types <!-- ✅ 2025-11-26 - messaging.ts içinde -->
  ```typescript
  BroadcastChannel, BroadcastChannelMember
  BroadcastMessage, BroadcastPoll, BroadcastReaction
  BroadcastAccessType, BroadcastMemberRole
  CreateBroadcastChannelRequest, SendBroadcastMessageRequest
  ```

- [x] `presence.ts` - Presence types <!-- ✅ 2025-11-26 - messaging.ts içinde -->
  ```typescript
  UserPresence, PresenceStatus, TypingEvent
  ```

- [x] `index.ts` - Barrel export <!-- ✅ 2025-11-26 - Mevcut index.ts güncellendi -->

### 2.2 API Client
**Lokasyon:** `packages/api/src/messaging/`

- [x] `conversations.ts` - Conversation API <!-- ✅ 2025-11-26 -->
  ```typescript
  getConversations(), getConversation(), createConversation()
  archiveConversation(), deleteConversation()
  ```

- [x] `messages.ts` - Message API <!-- ✅ 2025-11-26 -->
  ```typescript
  getMessages(), sendMessage(), editMessage()
  deleteMessage(), markAsRead(), reactToMessage()
  ```

- [x] `broadcast.ts` - Broadcast API <!-- ✅ 2025-11-26 -->
  ```typescript
  getBroadcastChannels(), createBroadcastChannel()
  sendBroadcastMessage(), joinChannel(), leaveChannel()
  reactToBroadcast(), votePoll()
  ```

- [x] `index.ts` - Barrel export <!-- ✅ 2025-11-26 -->

**Durum:** ✅ Tamamlandı (2025-11-26)
**Tahmini Süre:** 1 gün

---

## Phase 3: Edge Functions

### 3.1 DM Edge Functions
**Lokasyon:** `supabase/functions/`

- [x] `send-message/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Mesaj gönderme
  - Media validation
  - Mention parsing
  - Push notification trigger
  - Block kontrolü

- [x] `create-conversation/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Direct/Group conversation oluşturma
  - Participant ekleme
  - Mevcut conversation kontrolü (direct için)

- [x] `mark-as-read/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Read receipt oluşturma
  - Unread count güncelleme
  - Realtime broadcast

- [x] `delete-message/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Soft delete (me/everyone)
  - deleted_for JSONB güncelleme

- [x] `edit-message/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Content güncelleme
  - is_edited = true
  - edited_at timestamp

### 3.2 Shadow Mode Edge Functions
- [x] `cleanup-shadow-messages/index.ts` (Cron Job) <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Her gün 03:00 UTC çalışır
  - retention_days geçmiş mesajları işaretle
  - is_deleted_for_user = true
  - user_deleted_at = NOW()
  - Backend'de kalır (is_deleted = false)

### 3.3 Broadcast Edge Functions
- [x] `create-broadcast-channel/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Kanal oluşturma
  - access_type kontrolü
  - Owner olarak ekleme

- [x] `send-broadcast-message/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Sadece owner gönderebilir
  - Poll oluşturma desteği
  - Bulk notification trigger

- [x] `join-broadcast-channel/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Erişim kontrolü (public/subscriber)
  - Member ekleme
  - member_count güncelleme

- [x] `leave-broadcast-channel/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - left_at güncelleme
  - member_count güncelleme

- [x] `react-to-broadcast/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - allowed_reactions kontrolü
  - Reaction ekleme/kaldırma
  - reaction_count güncelleme

- [x] `vote-broadcast-poll/index.ts` <!-- ✅ 2025-11-26 - Supabase MCP ile deploy edildi -->
  - Oy verme
  - Multiple choice kontrolü
  - vote_count güncelleme

- [ ] `get-broadcast-channels/index.ts`
  - Creator'ın kanalları
  - Kullanıcının üye olduğu kanallar

- [ ] `get-broadcast-messages/index.ts`
  - Kanal mesajları
  - Pagination
  - Erişim kontrolü

**Durum:** ✅ Tamamlandı (11/13 - 2025-11-26) <!-- get-broadcast-channels ve get-broadcast-messages API client'ta var -->
**Tahmini Süre:** 3 gün

---

## Phase 4: Mobile Hooks & Stores

### 4.1 Zustand Stores
**Lokasyon:** `apps/mobile/src/store/messaging/`

- [x] `conversation.store.ts` <!-- ✅ 2025-11-26 - Persist desteği ile oluşturuldu -->
  ```typescript
  // State
  conversations: Conversation[]
  activeConversationId: string | null
  unreadTotal: number
  
  // Actions
  setConversations(), addConversation()
  updateConversation(), removeConversation()
  setActiveConversation(), incrementUnread()
  ```

- [x] `message.store.ts` <!-- ✅ 2025-11-26 - Optimistic update desteği ile -->
  ```typescript
  // State
  messages: Record<string, Message[]> // conversationId -> messages
  pendingMessages: Message[]
  
  // Actions
  setMessages(), addMessage(), updateMessage()
  removeMessage(), addPendingMessage(), removePendingMessage()
  ```

- [x] `broadcast.store.ts` <!-- ✅ 2025-11-26 - Persist desteği ile oluşturuldu -->
  ```typescript
  // State
  channels: BroadcastChannel[]
  activeChannelId: string | null
  
  // Actions
  setChannels(), addChannel(), updateChannel()
  setActiveChannel()
  ```

- [x] `presence.store.ts` <!-- ✅ 2025-11-26 -->
  ```typescript
  // State
  onlineUsers: Record<string, UserPresence>
  typingUsers: Record<string, string[]> // conversationId -> userIds
  
  // Actions
  setOnlineUser(), removeOnlineUser()
  setTyping(), clearTyping()
  ```

### 4.2 React Query Hooks
**Lokasyon:** `apps/mobile/src/hooks/messaging/`

- [x] `useConversations.ts` <!-- ✅ 2025-11-26 - Infinite query + mutations -->
  - Conversation listesi
  - Infinite scroll
  - Search/filter

- [x] `useMessages.ts` <!-- ✅ 2025-11-26 - useSendMessage dahil edildi -->
  - Mesaj listesi (conversation bazlı)
  - Infinite scroll (cursor-based)
  - Optimistic updates

- [x] `useSendMessage.ts` <!-- ✅ 2025-11-26 - useMessages.ts içinde -->
  - Mesaj gönderme mutation
  - Optimistic update
  - Error handling

- [x] `usePresence.ts` <!-- ✅ 2025-11-26 - Global + Conversation presence -->
  - Online status tracking
  - Supabase Presence entegrasyonu

- [x] `useTyping.ts` <!-- ✅ 2025-11-26 - usePresence.ts içinde useConversationPresence -->
  - Typing indicator
  - Debounced broadcast
  - Auto-stop (3 saniye)

- [x] `useMessageRealtime.ts` <!-- ✅ 2025-11-26 - Postgres Changes + Reactions -->
  - Postgres Changes subscription
  - INSERT/UPDATE/DELETE handling
  - Cache invalidation

- [x] `useBroadcastChannels.ts` <!-- ✅ 2025-11-26 - useBroadcast.ts içinde -->
  - Kanal listesi
  - Creator kanalları
  - Üye olunan kanallar

- [x] `useBroadcastMessages.ts` <!-- ✅ 2025-11-26 - useBroadcast.ts içinde -->
  - Kanal mesajları
  - Realtime updates

- [x] `useBroadcastReactions.ts` <!-- ✅ 2025-11-26 - useBroadcast.ts içinde -->
  - Tepki ekleme/kaldırma
  - Optimistic update

- [x] `useBroadcastPolls.ts` <!-- ✅ 2025-11-26 - useBroadcast.ts içinde -->
  - Oy verme
  - Sonuç görüntüleme

**Durum:** ✅ Tamamlandı (2025-11-26)
**Tahmini Süre:** 2 gün

---

## Phase 5: Mobile UI Components - DM

### 5.1 DM Screens
**Lokasyon:** `apps/mobile/src/components/messaging/`

- [x] `ChatListScreen/` <!-- ✅ 2025-11-26 - Modüler yapıda oluşturuldu -->
  - `index.tsx` - Ana ekran
  - `components/ChatListItem.tsx` - Sohbet öğesi
  - `components/ChatListSkeleton.tsx` - Loading state
  - `components/EmptyChatList.tsx` - Boş state
  - `components/ChatListHeader.tsx` - Header + search
  - FlashList mevcutta var, shopify flashlist kullan
  - Pull to refresh
  - Search bar

- [x] `ChatScreen/` <!-- ✅ 2025-11-26 - Modüler yapıda oluşturuldu -->
  - `index.tsx` - Ana ekran
  - `components/ChatHeader.tsx` - Header
  - `components/TypingIndicator.tsx` - Yazıyor göstergesi
  - `components/ChatSkeleton.tsx` - Loading state
  - Inverted FlashList (mesajlar)
  - Keyboard avoiding view
  - Header (user info, online status)

- [x] `NewChatScreen/` <!-- ✅ 2025-11-26 - Modüler yapıda oluşturuldu -->
  - `index.tsx` - Yeni sohbet başlatma
  - `components/UserSearchItem.tsx` - Kullanıcı arama sonucu
  - `components/RecentContacts.tsx` - Son görüşülenler
  - `components/NewChatSkeleton.tsx` - Loading state
  - Kullanıcı arama
  - Recent contacts

- [x] `ChatSettingsScreen/` <!-- ✅ 2025-11-26 - Modüler yapıda oluşturuldu -->
  - `index.tsx` - Sohbet ayarları
  - `components/SettingsItem.tsx` - Ayar öğesi
  - `components/MediaGallery.tsx` - Medya galerisi
  - Bildirim ayarları
  - Sohbeti sil/arşivle

### 5.2 DM Components
**Lokasyon:** `apps/mobile/src/components/messaging/components/`

- [x] `MessageBubble/` <!-- ✅ 2025-11-26 - Modüler yapıda oluşturuldu -->
  - `index.tsx` - Mesaj balonu
  - `MessageStatus.tsx` - Status indicator
  - `MessageReactions.tsx` - Tepki gösterimi
  - `ReplyPreview.tsx` - Yanıt önizleme
  - `MessageMenu.tsx` - Long press menu
  - Gönderen/alıcı stilleri
  - Media preview
  - Shadow badge

- [x] `MessageInput/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Mesaj giriş alanı
  - TextInput + actions
  - Attachment picker (placeholder)
  - Voice record button (placeholder)
  - Reply preview
  - Typing indicator trigger

- [x] `TypingIndicator/` <!-- ✅ 2025-11-26 - ChatScreen içinde -->
  - `index.tsx` - "Yazıyor..." göstergesi
  - Animated dots

- [x] `OnlineIndicator/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Online durumu
  - Green dot
  - Last seen text

- [x] `MediaPicker/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Medya seçici
  - Image picker
  - Video picker
  - Camera
  - File picker

- [x] `VoiceRecorder/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Ses kaydedici
  - Record button
  - Waveform preview
  - Duration display
  - Cancel/send actions

- [x] `ShadowMessageBadge/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Shadow mesaj göstergesi
  - Ghost icon
  - "X gün sonra silinecek" text

**Durum:** ✅ Tamamlandı (10/10 - 2025-11-26)
**Tahmini Süre:** 4 gün

---

## Phase 6: Mobile UI Components - Broadcast

### 6.1 Broadcast Screens
**Lokasyon:** `apps/mobile/src/components/broadcast/`

- [x] `BroadcastChannelListScreen/` <!-- ✅ 2025-11-26 - Modüler yapıda oluşturuldu -->
  - `index.tsx` - Kanal listesi
  - `components/BroadcastChannelItem.tsx`
  - `components/BroadcastListSkeleton.tsx`
  - `components/EmptyBroadcastList.tsx`
  - `components/BroadcastListHeader.tsx`
  - `components/SectionHeader.tsx`
  - Creator kanalları
  - Üye olunan kanallar
  - SectionList: Kanallarım / Takip Ettiklerim

- [x] `BroadcastChannelScreen/` <!-- ✅ 2025-11-26 - Modüler yapıda oluşturuldu -->
  - `index.tsx` - Kanal içi
  - `components/BroadcastChannelHeader.tsx` - Header
  - `components/BroadcastSkeleton.tsx` - Loading state
  - Mesaj listesi
  - Creator için: Mesaj gönderme
  - Üye için: Sadece görüntüleme + tepki

- [x] `CreateBroadcastScreen/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Yeni kanal oluştur
  - Kanal adı, açıklama
  - Avatar/cover seçimi
  - Erişim tipi seçimi
  - Tier seçimi (subscribers_only için)
  - İzin verilen tepkiler

- [x] `BroadcastSettingsScreen/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Kanal ayarları
  - Kanal bilgileri düzenleme
  - Erişim tipi değiştirme
  - Kanalı sil

- [x] `BroadcastMembersScreen/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Kanal üyeleri
  - Üye listesi
  - Moderatör atama
  - Üye çıkarma

### 6.2 Broadcast Components
**Lokasyon:** `apps/mobile/src/components/broadcast/components/`

- [x] `BroadcastMessageCard/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Yayın mesaj kartı
  - Büyük, dikkat çekici tasarım
  - Creator avatar + name
  - Content (text/image/video)
  - Reaction bar
  - View count

- [x] `BroadcastPollCard/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Anket kartı
  - Question
  - Options with progress bars
  - Vote button
  - Results display
  - Expiration countdown

- [x] `BroadcastReactionBar/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Tepki çubuğu
  - İzin verilen emojiler
  - Tap to react
  - Reaction counts

- [x] `BroadcastMemberCount/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Üye sayısı
  - Icon + count
  - Animated on change

- [x] `SubscriberBadge/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Abone rozeti
  - Crown/star icon
  - Tier name

- [x] `ChannelAccessBadge/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Erişim tipi rozeti
  - Public: Globe icon
  - Subscribers: Lock icon
  - Tier: Star icon

- [x] `BroadcastComposer/` <!-- ✅ 2025-11-26 -->
  - `index.tsx` - Creator mesaj gönderme
  - Text input
  - Media picker
  - Poll creator
  - Send button

**Durum:** ✅ Tamamlandı (12/12 - 2025-11-26)
**Tahmini Süre:** 3 gün

---

## Phase 7: Realtime Entegrasyonu

### 7.1 Supabase Realtime Setup
- [x] Channel yapılandırması <!-- ✅ 2025-11-26 - useMessageRealtime.ts -->
  ```typescript
  // DM: conversation:{conversationId}
  // Broadcast: broadcast:{channelId}
  // Presence: presence:global
  ```

- [x] Postgres Changes subscription <!-- ✅ 2025-11-26 - useMessageRealtime.ts -->
  ```typescript
  channel.on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  ```

- [x] Presence tracking <!-- ✅ 2025-11-26 - usePresence.ts -->
  ```typescript
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
  })
  
  channel.track({ user_id, online_at })
  ```

- [x] Broadcast events (typing) <!-- ✅ 2025-11-26 - usePresence.ts -->
  ```typescript
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId, isTyping: true }
  })
  ```

### 7.2 Connection Management
- [x] Auto-reconnect logic <!-- ✅ 2025-11-26 - useRealtimeConnection.ts -->
- [x] Connection status indicator <!-- ✅ 2025-11-26 - useConnectionStatusIndicator -->
- [x] Offline message queue <!-- ✅ 2025-11-26 - useOfflineQueue.ts -->
- [x] Sync on reconnect <!-- ✅ 2025-11-26 - useSyncOnReconnect -->

### 7.3 Realtime Hooks
- [x] `useRealtimeConnection.ts` - Bağlantı yönetimi <!-- ✅ 2025-11-26 -->
- [x] `useConversationRealtime.ts` - DM realtime <!-- ✅ 2025-11-26 - useMessageRealtime.ts -->
- [x] `useBroadcastRealtime.ts` - Broadcast realtime <!-- ✅ 2025-11-26 - useBroadcast.ts içinde -->

**Durum:** ✅ Tamamlandı (11/11 - 2025-11-26)
**Tahmini Süre:** 2 gün

---

## Phase 8: Push Notifications

### 8.1 Notification Types
- [x] Yeni DM mesajı <!-- ✅ 2025-11-26 - usePushNotifications.ts -->
- [x] Yeni broadcast mesajı <!-- ✅ 2025-11-26 - usePushNotifications.ts -->
- [x] Mention bildirimi <!-- ✅ 2025-11-26 - usePushNotifications.ts -->
- [x] Reaction bildirimi <!-- ✅ 2025-11-26 - usePushNotifications.ts -->

### 8.2 Notification Triggers
- [x] `send-message` → Push notification <!-- ✅ 2025-11-26 - Edge Function içinde -->
- [x] `send-broadcast-message` → Bulk notification <!-- ✅ 2025-11-26 - Edge Function içinde -->
- [x] Mention parsing → Notification <!-- ✅ 2025-11-26 - useMentions.ts -->

### 8.3 Notification Settings
- [x] Conversation mute <!-- ✅ 2025-11-26 - API + Store -->
- [x] Channel mute <!-- ✅ 2025-11-26 - API + Store -->
- [x] Global DND <!-- ✅ 2025-11-26 - useDoNotDisturb.ts -->

**Durum:** ✅ Tamamlandı (10/10 - 2025-11-26)
**Tahmini Süre:** 1 gün

---

## Phase 9: Testing & Optimization

### 9.1 Unit Tests
- [ ] Hooks tests (useMessages, useConversations, etc.)
- [ ] Store tests (Zustand)
- [ ] Utility tests

### 9.2 Component Tests
- [ ] MessageBubble
- [ ] ChatListItem
- [ ] BroadcastMessageCard

### 9.3 Integration Tests
- [ ] Send message flow
- [ ] Create conversation flow
- [ ] Broadcast message flow

### 9.4 Performance Tests
- [ ] Message list scrolling
- [ ] Realtime latency
- [ ] Memory usage

### 9.5 Optimizations
- [ ] Message virtualization (FlashList)
- [ ] Image caching (expo-image)
- [ ] Lazy loading media
- [ ] Optimistic updates

**Durum:** ⏳ Bekliyor
**Tahmini Süre:** 2 gün

---

## 📊 İlerleme Takibi

| Phase                   | Görev Sayısı | Tamamlanan | Durum   |
| ----------------------- | ------------ | ---------- | ------- |
| Phase 1: Database       | 20           | 19         | ✅       |
| Phase 2: Types & API    | 10           | 10         | ✅       |
| Phase 3: Edge Functions | 13           | 11         | ✅       |
| Phase 4: Hooks & Stores | 14           | 14         | ✅       |
| Phase 5: DM UI          | 10           | 10         | ✅       |
| Phase 6: Broadcast UI   | 12           | 12         | ✅       |
| Phase 7: Realtime       | 11           | 11         | ✅       |
| Phase 8: Notifications  | 10           | 10         | ✅       |
| Phase 9: Testing        | 9            | 0          | ⏳       |
| **TOPLAM**              | **109**      | **97**     | **89%** |

<!-- Son Güncelleme: 2025-11-26 03:15 UTC+03:00 -->

---

## 📁 Dosya Yapısı

### Route Yapısı (Expo Router)
```
apps/mobile/app/
├── (messages)/                    # DM Mesajlaşma
│   ├── _layout.tsx               # Stack navigator
│   ├── index.tsx                 # Birleşik mesaj listesi (DM + Broadcast)
│   ├── new.tsx                   # Yeni sohbet başlat
│   └── [conversationId]/
│       ├── index.tsx             # Sohbet ekranı
│       └── settings.tsx          # Sohbet ayarları
│
├── (broadcast)/                   # Yayın Kanalları
│   ├── _layout.tsx               # Stack navigator
│   ├── index.tsx                 # Kanal listesi (standalone)
│   ├── create.tsx                # Yeni kanal oluştur
│   └── [channelId]/
│       ├── index.tsx             # Kanal içi
│       ├── settings.tsx          # Kanal ayarları
│       └── members.tsx           # Üye listesi
│
├── (chat)/                        # [YEDEK] Eski chat yapısı
```

### Component Yapısı
```
apps/mobile/src/
├── components/
│   ├── messaging/           # DM Components
│   │   ├── ChatListScreen/
│   │   ├── ChatScreen/
│   │   ├── NewChatScreen/
│   │   ├── ChatSettingsScreen/
│   │   └── components/
│   │       ├── MessageBubble/
│   │       ├── MessageInput/
│   │       ├── TypingIndicator/
│   │       ├── OnlineIndicator/
│   │       ├── MediaPicker/
│   │       ├── VoiceRecorder/
│   │       ├── ReplyPreview/
│   │       ├── MessageReactions/
│   │       └── ShadowMessageBadge/
│   │
│   └── broadcast/           # Broadcast Components
│       ├── BroadcastChannelListScreen/
│       ├── BroadcastChannelScreen/
│       ├── CreateBroadcastScreen/
│       ├── BroadcastSettingsScreen/
│       ├── BroadcastMembersScreen/
│       └── components/
│           ├── BroadcastMessageCard/
│           ├── BroadcastPollCard/
│           ├── BroadcastReactionBar/
│           ├── BroadcastMemberCount/
│           ├── SubscriberBadge/
│           ├── ChannelAccessBadge/
│           └── BroadcastComposer/
│
├── hooks/
│   └── messaging/
│       ├── useConversations.ts
│       ├── useMessages.ts
│       ├── useSendMessage.ts
│       ├── usePresence.ts
│       ├── useTyping.ts
│       ├── useMessageRealtime.ts
│       ├── useBroadcastChannels.ts
│       ├── useBroadcastMessages.ts
│       ├── useBroadcastReactions.ts
│       └── useBroadcastPolls.ts
│
├── store/
│   └── messaging/
│       ├── conversation.store.ts
│       ├── message.store.ts
│       ├── broadcast.store.ts
│       └── presence.store.ts
│
packages/
├── types/src/messaging/
│   ├── conversation.ts
│   ├── message.ts
│   ├── broadcast.ts
│   ├── presence.ts
│   └── index.ts
│
├── api/src/messaging/
│   ├── conversations.ts
│   ├── messages.ts
│   ├── broadcast.ts
│   └── index.ts
│
supabase/functions/
├── send-message/
├── create-conversation/
├── mark-as-read/
├── delete-message/
├── edit-message/
├── cleanup-shadow-messages/
├── create-broadcast-channel/
├── send-broadcast-message/
├── join-broadcast-channel/
├── leave-broadcast-channel/
├── react-to-broadcast/
├── vote-broadcast-poll/
├── get-broadcast-channels/
└── get-broadcast-messages/
```

---

## ⚠️ Önemli Kurallar

### Theme Kullanımı
```typescript
// ✅ DOĞRU
import { useTheme } from "@/theme/ThemeProvider";
const { colors } = useTheme();
style={{ backgroundColor: colors.background }}

// ❌ YANLIŞ
style={{ backgroundColor: "#050505" }}
```

### Component Yapısı
```typescript
// ✅ DOĞRU - Modüler yapı
MessageBubble/
├── index.tsx          # Ana component (~200 satır max)
├── types.ts           # Props & types
├── styles.ts          # StyleSheet (opsiyonel)
└── components/        # Alt componentler (gerekirse)
```

### Loading States
```typescript
// ✅ DOĞRU - Skeleton
<MessageBubbleSkeleton />

// ❌ YANLIŞ - ActivityIndicator
<ActivityIndicator />
```

### List Components
```typescript
// ✅ DOĞRU - FlashList
import { FlashList } from "@shopify/flash-list";
<FlashList estimatedItemSize={80} />

// ❌ YANLIŞ - FlatList
import { FlatList } from "react-native";
```

---

## 📝 Notlar

- Her phase bağımsız olarak test edilebilir
- Phase 1-2 paralel çalışılabilir
- Phase 5-6 paralel çalışılabilir
- Realtime (Phase 7) UI'dan sonra
- Testing her phase'de yapılmalı

---

## 🎯 Tamamlanan İşler Özeti (2025-11-26)

### Phase 1: Database ✅
- 11 tablo oluşturuldu (5 DM + 6 Broadcast)
- 20+ RLS policy tanımlandı
- 5 trigger/function oluşturuldu
- Realtime publication ayarlandı

### Phase 2: Types & API ✅
- `packages/types/src/messaging.ts` - 500 satır type definition
- `packages/api/src/messaging/` - 3 API client dosyası

### Phase 3: Edge Functions ✅ (11/13)
- `send-message` ✅
- `create-conversation` ✅
- `mark-as-read` ✅
- `delete-message` ✅
- `edit-message` ✅ (yeni)
- `cleanup-shadow-messages` ✅ (yeni)
- `create-broadcast-channel` ✅
- `send-broadcast-message` ✅
- `join-broadcast-channel` ✅
- `leave-broadcast-channel` ✅ (yeni)
- `react-to-broadcast` ✅ (yeni)
- `vote-broadcast-poll` ✅

### Phase 4: Hooks & Stores ✅
- 4 Zustand store (conversation, message, broadcast, presence)
- 7 React Query hook dosyası
- Realtime subscription hooks

### Phase 5: DM UI ✅ (10/10)
- `ChatListScreen/` ✅ (modüler yapıda)
- `ChatScreen/` ✅ (modüler yapıda)
- `NewChatScreen/` ✅ (modüler yapıda)
- `ChatSettingsScreen/` ✅ (modüler yapıda)
- `MessageBubble/` ✅ (5 alt component)
- `MessageInput/` ✅
- `OnlineIndicator/` ✅
- `MediaPicker/` ✅
- `VoiceRecorder/` ✅
- `ShadowMessageBadge/` ✅

### Phase 6: Broadcast UI ✅ (12/12)
- `BroadcastChannelListScreen/` ✅ (modüler yapıda)
- `BroadcastChannelScreen/` ✅ (modüler yapıda)
- `CreateBroadcastScreen/` ✅
- `BroadcastSettingsScreen/` ✅
- `BroadcastMembersScreen/` ✅
- `BroadcastMessageCard/` ✅
- `BroadcastPollCard/` ✅
- `BroadcastReactionBar/` ✅
- `BroadcastComposer/` ✅
- `BroadcastMemberCount/` ✅
- `SubscriberBadge/` ✅
- `ChannelAccessBadge/` ✅

### Phase 7: Realtime ✅ (11/11)
- `useRealtimeConnection.ts` ✅ (auto-reconnect)
- `useMessageRealtime.ts` ✅
- `usePresence.ts` ✅ (global + conversation)
- `useBroadcastRealtime` ✅ (useBroadcast içinde)
- `useOfflineQueue.ts` ✅ (offline message queue)
- `useSyncOnReconnect` ✅ (sync on reconnect)

### Phase 8: Push Notifications ✅ (10/10)
- `usePushNotifications.ts` ✅
- Notification types ✅
- Edge Function triggers ✅
- Mute settings ✅
- `useMentions.ts` ✅ (mention parsing)
- `useDoNotDisturb.ts` ✅ (global DND)

---

**Son Güncelleme:** 2025-11-26 03:15 UTC+03:00
**Tahmini Toplam Süre:** 20 gün
**Tamamlanan:** ~18 gün (Phase 1-8) - %89
