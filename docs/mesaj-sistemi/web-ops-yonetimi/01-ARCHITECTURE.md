# Web Ops Mesajlaşma - Mimari

**Tarih:** 2025-11-28

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Web Ops Panel (Next.js)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Mesajlaşma Yönetimi                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │ DM Listesi  │  │ Broadcast   │  │ Mesaj Moderasyonu       │  │    │
│  │  │ Görüntüleme │  │ Kanalları   │  │ (hide/delete/flag)      │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Admin Realtime Chat                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │ Admin DM    │  │ Admin       │  │ Realtime Presence       │  │    │
│  │  │ Mesajlaşma  │  │ Grupları    │  │ (online/typing)         │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                         API Layer (Next.js Routes)                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ /api/ops/messaging/conversations    - DM listesi                │    │
│  │ /api/ops/messaging/messages         - Mesaj listesi             │    │
│  │ /api/ops/messaging/broadcast        - Broadcast kanalları       │    │
│  │ /api/ops/messaging/moderate         - Moderasyon işlemleri      │    │
│  │ /api/ops/admin-chat/conversations   - Admin sohbetleri          │    │
│  │ /api/ops/admin-chat/messages        - Admin mesajları           │    │
│  │ /api/ops/admin-chat/groups          - Admin grupları            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                         Supabase Backend                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐      │
│  │ PostgreSQL  │  │ Realtime    │  │ Edge Functions              │      │
│  │ (tables)    │  │ (channels)  │  │ (ops-* functions)           │      │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Veri Akışı

### 1. Kullanıcı Mesajlaşma Görüntüleme

```
Admin Panel → API Route → Supabase (service role) → Response
     │
     └── RLS bypass (admin erişimi)
```

### 2. Admin Realtime Chat

```
Admin A → Supabase Realtime Channel → Admin B
    │              │
    │              ├── Broadcast (typing)
    │              ├── Presence (online)
    │              └── Postgres Changes (messages)
    │
    └── ops_messages table (INSERT)
```

---

## 🔐 Güvenlik

### Yetkilendirme Katmanları

1. **Next.js Middleware**
   - Session kontrolü
   - Admin profil kontrolü

2. **API Route Handler**
   - `createAdminSupabaseClient()` kullanımı
   - Role kontrolü (`profiles.role = 'admin'`)

3. **Database RLS**
   - Admin-only policies
   - Service role bypass

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

---

## 📁 Dosya Yapısı

### Web Ops Sayfaları

```
apps/web/app/ops/(private)/
├── messaging/                    # Mesajlaşma Yönetimi
│   ├── page.tsx                  # Ana sayfa (overview)
│   ├── conversations/            # DM Sohbetleri
│   │   ├── page.tsx              # Sohbet listesi
│   │   └── [conversationId]/
│   │       └── page.tsx          # Sohbet detayı
│   ├── broadcast/                # Broadcast Kanalları
│   │   ├── page.tsx              # Kanal listesi
│   │   └── [channelId]/
│   │       └── page.tsx          # Kanal detayı
│   └── moderation/               # Moderasyon
│       └── page.tsx              # Moderasyon kuyruğu
│
├── admin-chat/                   # Admin Chat
│   ├── page.tsx                  # Chat ana sayfa
│   ├── [conversationId]/
│   │   └── page.tsx              # Sohbet ekranı
│   └── groups/
│       ├── page.tsx              # Grup listesi
│       └── [groupId]/
│           └── page.tsx          # Grup sohbeti
```

### API Routes

```
apps/web/app/api/ops/
├── messaging/
│   ├── conversations/
│   │   └── route.ts              # GET: sohbet listesi
│   ├── messages/
│   │   └── route.ts              # GET: mesaj listesi
│   ├── broadcast/
│   │   ├── channels/
│   │   │   └── route.ts          # GET: kanal listesi
│   │   └── messages/
│   │       └── route.ts          # GET: kanal mesajları
│   └── moderate/
│       └── route.ts              # POST: moderasyon işlemi
│
├── admin-chat/
│   ├── conversations/
│   │   └── route.ts              # GET/POST: admin sohbetleri
│   ├── messages/
│   │   └── route.ts              # GET/POST: admin mesajları
│   └── groups/
│       └── route.ts              # GET/POST: admin grupları
```

### Components

```
apps/web/components/messaging/
├── ConversationList.tsx          # DM listesi
├── ConversationDetail.tsx        # Sohbet detayı
├── MessageList.tsx               # Mesaj listesi
├── MessageItem.tsx               # Tek mesaj
├── BroadcastChannelList.tsx      # Kanal listesi
├── BroadcastChannelDetail.tsx    # Kanal detayı
├── ModerationQueue.tsx           # Moderasyon kuyruğu
└── ModerationActions.tsx         # Moderasyon butonları

apps/web/components/admin-chat/
├── AdminChatSidebar.tsx          # Sohbet listesi sidebar
├── AdminChatWindow.tsx           # Sohbet penceresi
├── AdminMessageInput.tsx         # Mesaj giriş
├── AdminMessageBubble.tsx        # Mesaj balonu
├── AdminGroupList.tsx            # Grup listesi
├── AdminGroupCreate.tsx          # Grup oluşturma
├── AdminOnlineIndicator.tsx      # Online göstergesi
└── AdminTypingIndicator.tsx      # Yazıyor göstergesi
```

---

## 🔄 Realtime Channels

### Admin Chat Channels

```typescript
// Admin presence (global)
const presenceChannel = supabase.channel('ops:presence')

// Admin conversation
const chatChannel = supabase.channel(`ops:chat:${conversationId}`)

// Admin group
const groupChannel = supabase.channel(`ops:group:${groupId}`)
```

### Event Types

| Event            | Channel    | Açıklama         |
| ---------------- | ---------- | ---------------- |
| `message:new`    | chat/group | Yeni mesaj       |
| `message:update` | chat/group | Mesaj güncelleme |
| `message:delete` | chat/group | Mesaj silme      |
| `typing:start`   | chat/group | Yazıyor başladı  |
| `typing:stop`    | chat/group | Yazıyor bitti    |
| `presence:sync`  | presence   | Online durumu    |

---

## 📊 State Management

### React Query Keys

```typescript
// Messaging Management
['ops', 'messaging', 'conversations']
['ops', 'messaging', 'messages', conversationId]
['ops', 'messaging', 'broadcast', 'channels']
['ops', 'messaging', 'broadcast', 'messages', channelId]

// Admin Chat
['ops', 'admin-chat', 'conversations']
['ops', 'admin-chat', 'messages', conversationId]
['ops', 'admin-chat', 'groups']
['ops', 'admin-chat', 'group-messages', groupId]
```

### Zustand Stores

```typescript
// Admin Chat Store
interface AdminChatStore {
  activeConversationId: string | null
  onlineAdmins: Record<string, boolean>
  typingAdmins: Record<string, string[]>
  unreadCounts: Record<string, number>
  
  setActiveConversation: (id: string) => void
  setOnlineAdmin: (adminId: string, online: boolean) => void
  setTyping: (conversationId: string, adminId: string, typing: boolean) => void
  incrementUnread: (conversationId: string) => void
  clearUnread: (conversationId: string) => void
}
```

---

**Son Güncelleme:** 2025-11-28
