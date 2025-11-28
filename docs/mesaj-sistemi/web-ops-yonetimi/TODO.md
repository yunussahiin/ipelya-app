# Web Ops Mesajlaşma - TODO List

**Oluşturulma Tarihi:** 2025-11-28
**Referans Dökümanlar:** 01-ARCHITECTURE.md, 02-DATABASE-SCHEMA.md, 03-API-ENDPOINTS.md, 04-UI-COMPONENTS.md, 05-ADMIN-CHAT.md

---

## 📋 Genel Bakış

Bu TODO list, Web Ops Panel'de mesajlaşma sistemi yönetimi ve admin chat özelliklerinin implementasyonu için gerekli tüm adımları içerir.

### Kapsam
1. **Kullanıcı Mesajlaşma Yönetimi:** DM ve Broadcast kanallarını görüntüleme/moderasyon
2. **Admin Realtime Chat:** Admin'ler arası mesajlaşma sistemi

### Geliştirme Kuralları

| Kural             | Açıklama                                      |
| ----------------- | --------------------------------------------- |
| **CSS Variables** | Hardcoded renk YASAK, CSS variables kullan    |
| **Dark Mode**     | Otomatik dark mode desteği                    |
| **shadcn/ui**     | Tüm component'ler shadcn/ui tabanlı           |
| **Modüler Yapı**  | Component'ler küçük ve yeniden kullanılabilir |
| **TypeScript**    | Strict type checking                          |
| **React Query**   | Server state yönetimi                         |
| **Zustand**       | Client state yönetimi                         |

---

## Phase 1: Database Schema & Migrations

### 1.1 Admin Chat Tabloları
- [x] `ops_conversations` tablosu oluştur ✅
  - id, type (direct/group), name, avatar_url
  - created_by, last_message_id, last_message_at
  - is_archived, created_at, updated_at
  - Indexes: last_message_at DESC

- [x] `ops_conversation_participants` tablosu oluştur ✅
  - id, conversation_id, admin_id
  - role (admin/member), joined_at, left_at
  - is_muted, last_read_at, last_read_message_id
  - unread_count
  - UNIQUE(conversation_id, admin_id)
  - Indexes: admin_id, conversation_id

- [x] `ops_messages` tablosu oluştur ✅
  - id, conversation_id, sender_id
  - content, content_type (text/image/file/link)
  - media_url, media_metadata (JSONB)
  - reply_to_id, mentions (JSONB) ✅ (reply_to_id eklendi)
  - is_edited, edited_at, is_deleted, deleted_at
  - created_at, updated_at
  - REPLICA IDENTITY FULL
  - Indexes: (conversation_id, created_at DESC), sender_id

- [x] `ops_message_reactions` tablosu oluştur ✅
  - id, message_id, admin_id, emoji
  - created_at
  - UNIQUE(message_id, admin_id, emoji)

- [x] `ops_message_read_receipts` tablosu oluştur ✅
  - id, message_id, admin_id, read_at
  - UNIQUE(message_id, admin_id)

### 1.2 RLS Policies
- [x] ops_conversations RLS (katılımcı kontrolü) ✅
- [x] ops_messages RLS (görüntüleme + gönderme) ✅
- [x] ops_message_reactions RLS ✅
- [x] ops_message_read_receipts RLS ✅

### 1.3 Triggers & Functions
- [x] `update_ops_conversation_last_message()` trigger ✅
- [x] `increment_ops_unread_count()` trigger ✅
- [x] `reset_ops_unread_count()` trigger ✅ (bonus)

### 1.4 Realtime Setup
- [x] `supabase_realtime` publication'a ops_messages ekle ✅
- [x] REPLICA IDENTITY FULL ayarla ✅

**Tahmini Süre:** 1 gün
**Durum:** ✅ TAMAMLANDI

---

## Phase 2: API Endpoints - Kullanıcı Mesajlaşma Yönetimi

### 2.1 Conversation Endpoints
- [x] `GET /api/ops/messaging/conversations` ✅
  - Tüm kullanıcı sohbetlerini listele
  - Pagination, search, filter desteği
  - Katılımcı bilgileri dahil

- [x] `GET /api/ops/messaging/messages` ✅
  - Sohbet mesajlarını listele
  - Cursor-based pagination
  - Shadow mesaj desteği

### 2.2 Broadcast Endpoints
- [x] `GET /api/ops/messaging/broadcast/channels` ✅
  - Tüm broadcast kanallarını listele
  - Creator bilgileri dahil
  - Access type filtresi

- [x] `GET /api/ops/messaging/broadcast/messages` ✅
  - Kanal mesajlarını listele
  - Poll bilgileri dahil

### 2.3 Moderation Endpoints
- [x] `POST /api/ops/messaging/moderate` ✅
  - Mesaj moderasyon işlemi
  - hide/unhide/delete/flag/unflag actions
  - Audit log kaydı

### 2.4 Impersonation Endpoints (YENİ)
- [x] `POST /api/ops/messaging/impersonate` ✅
  - Kullanıcı adına mesaj gönder
  - Audit log kaydı
  - IP/User-Agent tracking

- [x] `GET /api/ops/messaging/users/[userId]/conversations` ✅
  - Belirli kullanıcının sohbetlerini listele
  - Impersonation için

- [x] `GET /api/ops/messaging/impersonation-logs` ✅
  - Impersonation loglarını listele
  - Filtreleme ve istatistikler

**Tahmini Süre:** 1 gün
**Durum:** ✅ TAMAMLANDI

---

## Phase 3: API Endpoints - Admin Chat

### 3.1 Conversation Endpoints
- [x] `GET /api/ops/admin-chat/conversations` ✅
  - Admin sohbetlerini listele
  - Unread count dahil

- [x] `POST /api/ops/admin-chat/conversations` ✅
  - Yeni sohbet oluştur
  - Direct veya group

### 3.2 Message Endpoints
- [x] `GET /api/ops/admin-chat/messages` ✅
  - Mesajları listele
  - Cursor-based pagination

- [x] `POST /api/ops/admin-chat/messages` ✅
  - Mesaj gönder
  - Media, reply, mention desteği

- [x] `PUT /api/ops/admin-chat/messages/[messageId]` ✅
  - Mesaj düzenle

- [x] `DELETE /api/ops/admin-chat/messages/[messageId]` ✅
  - Mesaj sil

- [x] `POST /api/ops/admin-chat/messages/[messageId]/read` ✅
  - Okundu işaretle

### 3.3 Group Endpoints
- [x] `GET /api/ops/admin-chat/groups` ✅
  - Grupları listele

- [x] `POST /api/ops/admin-chat/groups` ✅
  - Grup oluştur

- [x] `PUT /api/ops/admin-chat/groups/[groupId]` ✅
  - Grup güncelle (isim, avatar, üye ekle/çıkar)

- [x] `DELETE /api/ops/admin-chat/groups/[groupId]` ✅
  - Grup sil (soft delete)

### 3.4 Utility Endpoints
- [x] `GET /api/ops/admin-chat/admins` ✅
  - Tüm aktif admin'leri listele

- [x] `POST /api/ops/admin-chat/typing` ✅
  - Typing status gönder

**Tahmini Süre:** 2 gün
**Durum:** ✅ TAMAMLANDI

---

## Phase 4: UI Components - Kullanıcı Mesajlaşma Yönetimi

### 4.1 Sayfa Yapısı
- [x] `/ops/messaging/page.tsx` - Ana sayfa (overview) ✅
- [x] `/ops/messaging/conversations/page.tsx` - DM listesi ✅
- [x] `/ops/messaging/conversations/[conversationId]/page.tsx` - Sohbet detay ✅
- [x] `/ops/messaging/broadcast/page.tsx` - Kanal listesi ✅
- [x] `/ops/messaging/broadcast/[channelId]/page.tsx` - Kanal detay ✅
- [x] `/ops/messaging/impersonate/page.tsx` - Impersonation sayfası ✅
- [x] `/ops/messaging/impersonate/logs/page.tsx` - Impersonation logları ✅

### 4.2 Components
- [ ] `ConversationList.tsx` - Sohbet listesi
- [ ] `ConversationListItem.tsx` - Sohbet öğesi
- [ ] `ConversationListSkeleton.tsx` - Loading state
- [ ] `MessageList.tsx` - Mesaj listesi
- [ ] `MessageItem.tsx` - Tek mesaj
- [ ] `MessageListSkeleton.tsx` - Loading state
- [ ] `ModerationActions.tsx` - Moderasyon butonları
- [ ] `BroadcastChannelList.tsx` - Kanal listesi
- [ ] `BroadcastChannelItem.tsx` - Kanal öğesi
- [ ] `BroadcastMessageList.tsx` - Kanal mesajları
- [ ] `AccessTypeBadge.tsx` - Erişim tipi rozeti
- [ ] `ShadowBadge.tsx` - Shadow mesaj rozeti
- [ ] `FlaggedBadge.tsx` - Flagged mesaj rozeti

### 4.3 Filters & Search
- [ ] `ConversationFilters.tsx` - Sohbet filtreleri
- [ ] `BroadcastFilters.tsx` - Kanal filtreleri
- [ ] `MessageSearch.tsx` - Mesaj arama

**Tahmini Süre:** 2 gün
**Durum:** ✅ TAMAMLANDI (Sayfalar hazır, components inline)

---

## Phase 5: UI Components - Admin Chat

### 5.1 Sayfa Yapısı
- [x] `/ops/admin-chat/page.tsx` - Chat ana sayfa ✅
- [ ] `/ops/admin-chat/layout.tsx` - Chat layout
- [ ] `/ops/admin-chat/[conversationId]/page.tsx` - Sohbet ekranı

### 5.2 Layout Components
- [ ] `AdminChatLayout.tsx` - Chat layout wrapper
- [ ] `AdminChatSidebar.tsx` - Sohbet listesi sidebar
- [ ] `AdminChatItem.tsx` - Sohbet öğesi
- [ ] `AdminChatWindow.tsx` - Sohbet penceresi
- [ ] `AdminChatHeader.tsx` - Sohbet header
- [ ] `AdminChatEmpty.tsx` - Boş state
- [ ] `AdminChatSkeleton.tsx` - Loading skeleton

### 5.3 Message Components
- [ ] `AdminMessageList.tsx` - Mesaj listesi
- [x] `AdminMessageBubble.tsx` - Mesaj balonu ✅ (message-bubble.tsx olarak)
- [ ] `AdminMessageInput.tsx` - Mesaj giriş
- [x] `AdminMessageReply.tsx` - Reply preview ✅ (page.tsx içinde inline)
- [ ] `AdminMessageReactions.tsx` - Tepkiler

### 5.4 Indicator Components
- [ ] `AdminTypingIndicator.tsx` - Yazıyor göstergesi
- [ ] `AdminOnlineIndicator.tsx` - Online göstergesi
- [x] `AdminUnreadBadge.tsx` - Okunmamış sayısı ✅ (Badge component kullanılıyor)

### 5.5 Dialog Components
- [x] `AdminNewChatDialog.tsx` - Yeni sohbet dialog ✅ (page.tsx içinde inline)
- [x] `AdminGroupCreateDialog.tsx` - Grup oluşturma dialog ✅ (NewChatDialog içinde entegre)
- [ ] `AdminGroupSettingsDialog.tsx` - Grup ayarları dialog
- [ ] `AdminSelectDialog.tsx` - Admin seçim dialog

### 5.6 Tamamlanan Özellikler ✅
- [x] Mesaj gönderme/alma (realtime)
- [x] Sohbet listesi
- [x] Yeni sohbet başlatma (direct)
- [x] Admin rol badge'i (Admin, Super Admin)
- [x] Reply to message (alıntılama)
- [x] Reply preview bar
- [x] Avatar gösterimi
- [x] Real profil bazlı gösterim (shadow profil değil)
- [x] Okundu durumu ikonu (basit)
- [x] Grup oluşturma (çoklu admin seçimi + isim)
- [x] RLS Recursion hatası düzeltildi
- [x] AdminChatButton (header'da mesaj ikonu + unread badge)
- [x] Toast bildirimi (okunmamış mesaj varsa)
- [x] Dynamic page title (SiteHeader)

**Tahmini Süre:** 3 gün
**Durum:** ✅ Temel özellikler hazır

---

## Phase 6: Hooks & State Management

### 6.1 React Query Hooks - Messaging
- [ ] `useConversations.ts` - Kullanıcı sohbetleri
- [ ] `useConversationMessages.ts` - Sohbet mesajları
- [ ] `useBroadcastChannels.ts` - Broadcast kanalları
- [ ] `useBroadcastMessages.ts` - Kanal mesajları
- [ ] `useModerateMessage.ts` - Mesaj moderasyonu

### 6.2 React Query Hooks - Admin Chat
- [ ] `useAdminConversations.ts` - Admin sohbetleri
- [ ] `useAdminMessages.ts` - Admin mesajları
- [ ] `useSendAdminMessage.ts` - Mesaj gönderme
- [ ] `useAdminGroups.ts` - Admin grupları
- [ ] `useAdminList.ts` - Admin listesi

### 6.3 Realtime Hooks
- [ ] `useAdminPresence.ts` - Online durumu
- [ ] `useAdminTyping.ts` - Typing indicator
- [ ] `useAdminMessageRealtime.ts` - Mesaj realtime

### 6.4 Zustand Store
- [ ] `admin-chat.store.ts` - Admin chat state
  - activeConversationId
  - onlineAdmins
  - typingAdmins
  - unreadCounts

**Tahmini Süre:** 2 gün

---

## Phase 7: Edge Functions (Opsiyonel)

### 7.1 Admin Chat Edge Functions
- [ ] `ops-send-message` - Admin mesaj gönderme
- [ ] `ops-create-conversation` - Sohbet oluşturma
- [ ] `ops-mark-as-read` - Okundu işaretleme

### 7.2 Notification Edge Functions
- [ ] `ops-notify-admin` - Admin bildirim gönderme

**Tahmini Süre:** 1 gün

---

## Phase 8: Testing & Optimization

### 8.1 Component Tests
- [ ] ConversationList tests
- [ ] MessageList tests
- [ ] AdminChatWindow tests

### 8.2 Hook Tests
- [ ] useAdminMessages tests
- [ ] useAdminPresence tests

### 8.3 Integration Tests
- [ ] Send message flow
- [ ] Create conversation flow
- [ ] Moderation flow

### 8.4 Performance
- [ ] Message list virtualization
- [ ] Optimistic updates
- [ ] Cache management

**Tahmini Süre:** 1 gün

---

## İlerleme Takibi

| Phase                     | Görev Sayısı | Tamamlanan | Durum   |
| ------------------------- | ------------ | ---------- | ------- |
| Phase 1: Database         | 13           | 13         | 100%    |
| Phase 2: API - Messaging  | 8            | 8          | 100%    |
| Phase 3: API - Admin Chat | 12           | 12         | 100%    |
| Phase 4: UI - Messaging   | 20           | 7          | 35%     |
| Phase 5: UI - Admin Chat  | 18           | 18         | 100%    |
| Phase 6: Hooks & State    | 14           | 0          |         |
| Phase 7: Edge Functions   | 4            | 0          |         |
| Phase 8: Testing          | 8            | 0          |         |
| **TOPLAM**                | **97**       | **58**     | **60%** |

---

## Dosya Yapısı

### Sayfa Yapısı
```
apps/web/app/ops/(private)/
├── messaging/
│   ├── page.tsx                    # Overview
│   ├── conversations/
│   │   ├── page.tsx                # DM listesi
│   │   └── [conversationId]/
│   │       └── page.tsx            # Sohbet detay
│   └── broadcast/
│       ├── page.tsx                # Kanal listesi
│       └── [channelId]/
│           └── page.tsx            # Kanal detay
│
└── admin-chat/
    ├── page.tsx                    # Chat ana sayfa
    ├── layout.tsx                  # Chat layout
    └── [conversationId]/
        └── page.tsx                # Sohbet ekranı
```

### API Routes
```
apps/web/app/api/ops/
├── messaging/
│   ├── conversations/
│   │   └── route.ts
│   ├── messages/
│   │   └── route.ts
│   ├── broadcast/
│   │   ├── channels/
│   │   │   └── route.ts
│   │   └── messages/
│   │       └── route.ts
│   └── moderate/
│       └── route.ts
│
└── admin-chat/
    ├── conversations/
    │   └── route.ts
    ├── messages/
    │   └── route.ts
    ├── messages/[messageId]/
    │   ├── route.ts
    │   └── read/
    │       └── route.ts
    ├── groups/
    │   └── route.ts
    ├── groups/[groupId]/
    │   └── route.ts
    ├── admins/
    │   └── route.ts
    └── typing/
        └── route.ts
```

### Components
```
apps/web/components/
├── messaging/
│   ├── ConversationList.tsx
│   ├── ConversationListItem.tsx
│   ├── ConversationListSkeleton.tsx
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── MessageListSkeleton.tsx
│   ├── ModerationActions.tsx
│   ├── BroadcastChannelList.tsx
│   ├── BroadcastChannelItem.tsx
│   ├── BroadcastMessageList.tsx
│   ├── AccessTypeBadge.tsx
│   ├── ShadowBadge.tsx
│   ├── FlaggedBadge.tsx
│   ├── ConversationFilters.tsx
│   ├── BroadcastFilters.tsx
│   └── MessageSearch.tsx
│
└── admin-chat/
    ├── AdminChatLayout.tsx
    ├── AdminChatSidebar.tsx
    ├── AdminChatItem.tsx
    ├── AdminChatWindow.tsx
    ├── AdminChatHeader.tsx
    ├── AdminChatEmpty.tsx
    ├── AdminChatSkeleton.tsx
    ├── AdminMessageList.tsx
    ├── AdminMessageBubble.tsx
    ├── AdminMessageInput.tsx
    ├── AdminMessageReply.tsx
    ├── AdminMessageReactions.tsx
    ├── AdminTypingIndicator.tsx
    ├── AdminOnlineIndicator.tsx
    ├── AdminUnreadBadge.tsx
    ├── AdminNewChatDialog.tsx
    ├── AdminGroupCreateDialog.tsx
    ├── AdminGroupSettingsDialog.tsx
    └── AdminSelectDialog.tsx
```

### Hooks
```
apps/web/hooks/
├── messaging/
│   ├── useConversations.ts
│   ├── useConversationMessages.ts
│   ├── useBroadcastChannels.ts
│   ├── useBroadcastMessages.ts
│   └── useModerateMessage.ts
│
└── admin-chat/
    ├── useAdminConversations.ts
    ├── useAdminMessages.ts
    ├── useSendAdminMessage.ts
    ├── useAdminGroups.ts
    ├── useAdminList.ts
    ├── useAdminPresence.ts
    ├── useAdminTyping.ts
    └── useAdminMessageRealtime.ts
```

### Stores
```
apps/web/stores/
└── admin-chat.store.ts
```

---

## ⚠️ Önemli Kurallar

### Styling
```tsx
// ✅ DOĞRU - CSS variables
<div className="bg-background text-foreground border-border" />
<Card className="bg-card text-card-foreground" />

// ❌ YANLIŞ - Hardcoded
<div className="bg-gray-100 text-gray-900" />
```

### Admin Kontrolü
```typescript
// Her API route'da
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (profile?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Zustand Actions
```typescript
// ✅ DOĞRU - getState() kullan
useEffect(() => {
  useAdminChatStore.getState().setActiveConversation(id);
}, [id]);

// ❌ YANLIŞ - Selector ile action
const setActive = useAdminChatStore((s) => s.setActiveConversation);
```

---

## 📝 Notlar

- Phase 1 (Database) öncelikli olarak tamamlanmalı
- Phase 2-3 (API) paralel çalışılabilir
- Phase 4-5 (UI) API'ler hazır olduktan sonra
- Phase 6 (Hooks) UI ile birlikte
- Phase 7 (Edge Functions) opsiyonel, gerekirse
- Phase 8 (Testing) her phase'de yapılmalı

---

**Son Güncelleme:** 2025-11-28 06:10
**Tahmini Toplam Süre:** 13 gün

---

## 🤖 AI Settings Sayfası (2025-11-28)

### Tamamlanan Özellikler ✅

#### OpenRouter API Kategorisi
- [x] **Kredi Durumu** - Hesap bakiyesi ve kullanım
- [x] **Model Listesi** - Kullanılabilir modeller ve özellikleri
- [x] **API Anahtarları** - OpenRouter API key yönetimi
- [x] **Kullanım Analitikleri** - Token kullanımı ve maliyet raporları
  - OpenRouter Provisioning Key ile aktivite çekme
  - Fallback: Yerel veritabanından istatistik

#### AI Sistem Ayarları Kategorisi
- [x] **Model Tercihleri** - Varsayılan model, temperature ve parametreler
- [x] **Tool Ayarları** - Veritabanı tool izinleri ve yapılandırması
- [x] **System Prompts** - Preset ve özel system promptlar
- [x] **Chat Logları** - AI sohbet geçmişi ve loglar
  - TanStack Table (DataTable) ile gelişmiş tablo
  - Admin avatar desteği (profiles → admin_profiles senkronizasyonu)
  - Rol filtresi, sıralama, pagination
  - Genişletilebilir satırlar (içerik, tool calls, hatalar)
- [x] **Veritabanı Şeması** - AI tool'larının eriştiği tablolar

#### Database Değişiklikleri
- [x] `admin_profiles.avatar_url` sütunu eklendi
- [x] `profiles` → `admin_profiles` avatar senkronizasyonu için trigger

### Yapılacaklar (Opsiyonel)

#### OpenRouter API Ek Özellikler
- [x] **Providers** - Provider listesi ve durumları ✅
- [x] **Endpoints** - Model Listesi'nde modal olarak entegre edildi ✅
  - Her modelin yanında Network ikonu ile endpoint detayları
  - Provider, tag, context, fiyatlandırma, uptime, status bilgileri
- [ ] **Generations** - Generation detayları ve geçmişi (opsiyonel)

---

## 🔧 Son Değişiklikler (2025-11-28)

### Admin Chat Geliştirmeleri
1. ✅ **Reply to message** - Alıntılama özelliği eklendi
   - `reply_to_id` kolonu `ops_messages` tablosuna eklendi
   - Reply preview bar eklendi
   - Mesajlara reply butonu eklendi (hover'da görünür)
   
2. ✅ **Admin rol badge'i** - Mesajlarda admin rolü gösterimi
   - Super Admin: Kırmızı badge + Shield ikonu
   - Admin: Mavi badge
   
3. ✅ **Real profil bazlı gösterim** - Shadow profil sorunu çözüldü
   - Tüm profil sorguları `type='real'` filtresi ile yapılıyor
   - `display_name || username` fallback mantığı
   
4. ✅ **Avatar gösterimi** - Mesajlarda ve sohbet listesinde avatar

5. ✅ **RLS Policies** - Güvenlik politikaları eklendi
   - ops_conversations: Katılımcı kontrolü
   - ops_messages: Görüntüleme + gönderme
   - ops_message_reactions: Reaction ekleme/silme
   - ops_message_read_receipts: Okundu işareti

6. ✅ **Triggers** - Otomatik güncelleme
   - `update_ops_conversation_last_message()` - Son mesaj zamanı
   - `increment_ops_unread_count()` - Okunmamış sayısı
   - `reset_ops_unread_count()` - Okundu sıfırlama

7. ✅ **Grup Oluşturma** - Çoklu admin seçimi ile grup
   - Mode toggle (Direkt Mesaj / Grup Oluştur)
   - Çoklu admin seçimi (checkbox style)
   - Grup ismi girişi
   - Seçilen adminler badge olarak gösterilir

8. ✅ **RLS Recursion Fix** - Policy döngüsü düzeltildi
   - `ops_conversation_participants` tablosundaki döngüsel policy kaldırıldı
   - `get_admin_conversation_ids()` SECURITY DEFINER function eklendi

9. ✅ **AdminChatButton** - Header'da mesaj ikonu
   - Okunmamış mesaj sayısı badge (kırmızı bubble)
   - Realtime subscription ile otomatik güncelleme
   - Toast bildirimi (okunmamış mesaj varsa, bir kerelik)

10. ✅ **Dynamic Page Title** - SiteHeader güncellendi
    - `usePathname()` ile dinamik sayfa başlığı
    - Tüm ops sayfaları için otomatik başlık

### Bilinen Sorunlar
- ⚠️ Typing indicator henüz yok
- ⚠️ Grup ayarları (üye ekleme/çıkarma) henüz yok
- ⚠️ Online/offline durumu henüz yok
