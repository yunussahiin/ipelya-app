# Web Ops - Admin Realtime Chat Sistemi

**Tarih:** 2025-11-28

---

## 📋 Genel Bakış

Admin kullanıcılar (profiles.role = 'admin') arasında gerçek zamanlı mesajlaşma sistemi.

### Özellikler

| Özellik              | Açıklama                                |
| -------------------- | --------------------------------------- |
| **1:1 Mesajlaşma**   | Admin'ler arası özel sohbet             |
| **Grup Sohbetleri**  | Birden fazla admin ile grup oluşturma   |
| **Realtime**         | Anlık mesaj iletimi (Supabase Realtime) |
| **Typing Indicator** | "Yazıyor..." göstergesi                 |
| **Online Status**    | Admin online/offline durumu             |
| **Dosya Paylaşımı**  | Resim ve dosya gönderme                 |
| **@Mention**         | Admin mention desteği                   |
| **Reply**            | Mesaja yanıt verme                      |
| **Read Receipts**    | Okundu bilgisi                          |

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                    Admin Chat UI (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ ChatSidebar │  │ ChatWindow  │  │ MessageInput            │  │
│  │ (list)      │  │ (messages)  │  │ (compose)               │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase Realtime                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Presence    │  │ Broadcast   │  │ Postgres Changes        │  │
│  │ (online)    │  │ (typing)    │  │ (messages)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Database (PostgreSQL)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ ops_convers │  │ ops_messages│  │ ops_participants        │  │
│  │ ations      │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### ops_conversations

```sql
CREATE TABLE ops_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT, -- Grup adı
  avatar_url TEXT, -- Grup avatarı
  created_by UUID REFERENCES admin_profiles(id),
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ops_conv_last_msg ON ops_conversations(last_message_at DESC);
```

### ops_conversation_participants

```sql
CREATE TABLE ops_conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ops_conversations(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  
  UNIQUE(conversation_id, admin_id)
);

-- Indexes
CREATE INDEX idx_ops_part_admin ON ops_conversation_participants(admin_id);
```

### ops_messages

```sql
CREATE TABLE ops_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ops_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES admin_profiles(id),
  content TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'link')),
  media_url TEXT,
  media_metadata JSONB,
  reply_to_id UUID REFERENCES ops_messages(id),
  mentions JSONB DEFAULT '[]',
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ops_msg_conv ON ops_messages(conversation_id, created_at DESC);

-- Realtime
ALTER TABLE ops_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE ops_messages;
```

---

## 🔄 Realtime Implementation

### Channel Yapısı

```typescript
// Presence Channel (Global)
const presenceChannel = supabase.channel('ops:presence')

// Conversation Channel
const chatChannel = supabase.channel(`ops:chat:${conversationId}`)
```

### Presence (Online Status)

```typescript
// hooks/admin-chat/useAdminPresence.ts
export function useAdminPresence() {
  const { user } = useAuth()
  const setOnlineAdmin = useAdminChatStore((s) => s.setOnlineAdmin)

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('ops:presence')

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        Object.entries(state).forEach(([adminId, presences]) => {
          setOnlineAdmin(adminId, presences.length > 0)
        })
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineAdmin(key, true)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineAdmin(key, false)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            admin_id: user.id,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [user])
}
```

### Typing Indicator

```typescript
// hooks/admin-chat/useAdminTyping.ts
export function useAdminTyping(conversationId: string) {
  const { user } = useAuth()
  const setTyping = useAdminChatStore((s) => s.setTyping)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!conversationId || !user) return

    const channel = supabase.channel(`ops:chat:${conversationId}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.admin_id !== user.id) {
          setTyping(conversationId, payload.admin_id, payload.is_typing)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, user])

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !user) return

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        admin_id: user.id,
        admin_name: user.email?.split('@')[0],
        is_typing: isTyping
      }
    })

    // Auto-stop after 3 seconds
    if (isTyping) {
      timeoutRef.current = setTimeout(() => {
        sendTyping(false)
      }, 3000)
    }
  }, [user])

  return { setTyping: sendTyping }
}
```

### Message Realtime

```typescript
// hooks/admin-chat/useAdminMessageRealtime.ts
export function useAdminMessageRealtime(conversationId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase.channel(`ops:messages:${conversationId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ops_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Optimistic update
          queryClient.setQueryData(
            ['ops', 'admin-chat', 'messages', conversationId],
            (old: AdminMessage[] = []) => [...old, payload.new as AdminMessage]
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ops_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          queryClient.setQueryData(
            ['ops', 'admin-chat', 'messages', conversationId],
            (old: AdminMessage[] = []) =>
              old.map((msg) =>
                msg.id === payload.new.id ? (payload.new as AdminMessage) : msg
              )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ops_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          queryClient.setQueryData(
            ['ops', 'admin-chat', 'messages', conversationId],
            (old: AdminMessage[] = []) =>
              old.filter((msg) => msg.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, queryClient])
}
```

---

## 📁 Dosya Yapısı

### Pages

```
apps/web/app/ops/(private)/admin-chat/
├── page.tsx                    # Ana chat sayfası
├── layout.tsx                  # Chat layout (sidebar + content)
└── [conversationId]/
    └── page.tsx                # Sohbet detay
```

### Components

```
apps/web/components/admin-chat/
├── AdminChatLayout.tsx         # Chat layout wrapper
├── AdminChatSidebar.tsx        # Sohbet listesi
├── AdminChatItem.tsx           # Sohbet öğesi
├── AdminChatWindow.tsx         # Sohbet penceresi
├── AdminChatHeader.tsx         # Sohbet header
├── AdminMessageList.tsx        # Mesaj listesi
├── AdminMessageBubble.tsx      # Mesaj balonu
├── AdminMessageInput.tsx       # Mesaj giriş
├── AdminTypingIndicator.tsx    # Yazıyor göstergesi
├── AdminOnlineIndicator.tsx    # Online göstergesi
├── AdminNewChatDialog.tsx      # Yeni sohbet dialog
├── AdminGroupCreateDialog.tsx  # Grup oluşturma dialog
├── AdminChatSkeleton.tsx       # Loading skeleton
└── AdminChatEmpty.tsx          # Boş state
```

### Hooks

```
apps/web/hooks/admin-chat/
├── useAdminConversations.ts    # Sohbet listesi
├── useAdminMessages.ts         # Mesaj listesi
├── useSendAdminMessage.ts      # Mesaj gönderme
├── useAdminPresence.ts         # Online durumu
├── useAdminTyping.ts           # Typing indicator
├── useAdminMessageRealtime.ts  # Mesaj realtime
├── useAdminChatStore.ts        # Zustand store
└── useAdminList.ts             # Admin listesi
```

### API Routes

```
apps/web/app/api/ops/admin-chat/
├── conversations/
│   └── route.ts                # GET/POST conversations
├── messages/
│   └── route.ts                # GET/POST messages
├── messages/[messageId]/
│   ├── route.ts                # PUT/DELETE message
│   └── read/
│       └── route.ts            # POST mark as read
├── groups/
│   └── route.ts                # GET/POST groups
├── groups/[groupId]/
│   └── route.ts                # PUT/DELETE group
├── admins/
│   └── route.ts                # GET admin list
└── typing/
    └── route.ts                # POST typing status
```

---

## 🔐 Güvenlik

### Authentication

```typescript
// Tüm API route'larda
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Admin kontrolü
const { data: adminProfile } = await supabase
  .from('admin_profiles')
  .select('id, is_active')
  .eq('id', user.id)
  .single()

if (!adminProfile?.is_active) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### RLS Policies

```sql
-- Admin'ler sadece kendi sohbetlerini görebilir
CREATE POLICY "Admins view own conversations"
ON ops_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ops_conversation_participants
    WHERE conversation_id = ops_conversations.id
    AND admin_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Admin'ler sadece kendi sohbetlerindeki mesajları görebilir
CREATE POLICY "Admins view messages in own conversations"
ON ops_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ops_conversation_participants
    WHERE conversation_id = ops_messages.conversation_id
    AND admin_id = auth.uid()
    AND left_at IS NULL
  )
);
```

---

## 📊 State Management

### Zustand Store

```typescript
// stores/admin-chat.store.ts
interface AdminChatState {
  // State
  activeConversationId: string | null
  onlineAdmins: Record<string, boolean>
  typingAdmins: Record<string, string[]> // conversationId -> admin names
  unreadCounts: Record<string, number>
  
  // Actions
  setActiveConversation: (id: string | null) => void
  setOnlineAdmin: (adminId: string, online: boolean) => void
  setTyping: (conversationId: string, adminId: string, typing: boolean) => void
  incrementUnread: (conversationId: string) => void
  clearUnread: (conversationId: string) => void
}

export const useAdminChatStore = create<AdminChatState>((set) => ({
  activeConversationId: null,
  onlineAdmins: {},
  typingAdmins: {},
  unreadCounts: {},
  
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  setOnlineAdmin: (adminId, online) => 
    set((state) => ({
      onlineAdmins: { ...state.onlineAdmins, [adminId]: online }
    })),
  
  setTyping: (conversationId, adminName, typing) =>
    set((state) => {
      const current = state.typingAdmins[conversationId] || []
      const updated = typing
        ? [...new Set([...current, adminName])]
        : current.filter((name) => name !== adminName)
      
      return {
        typingAdmins: { ...state.typingAdmins, [conversationId]: updated }
      }
    }),
  
  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1
      }
    })),
  
  clearUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 }
    }))
}))
```

---

## 🎨 UI/UX

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Ops Header                                                       │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  Sidebar     │  Chat Window                                      │
│  ┌────────┐  │  ┌─────────────────────────────────────────────┐ │
│  │ Search │  │  │ Header (name, online, actions)              │ │
│  ├────────┤  │  ├─────────────────────────────────────────────┤ │
│  │        │  │  │                                             │ │
│  │ Chats  │  │  │ Messages                                    │ │
│  │        │  │  │                                             │ │
│  │        │  │  │                                             │ │
│  │        │  │  │                                             │ │
│  │        │  │  ├─────────────────────────────────────────────┤ │
│  │        │  │  │ Typing indicator                            │ │
│  │        │  │  ├─────────────────────────────────────────────┤ │
│  │        │  │  │ Input                                       │ │
│  └────────┘  │  └─────────────────────────────────────────────┘ │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

### Responsive

- **Desktop:** Sidebar + Chat window yan yana
- **Tablet:** Sidebar daraltılabilir
- **Mobile:** Sidebar drawer olarak açılır

---

**Son Güncelleme:** 2025-11-28
