# Web Ops Mesajlaşma - Database Schema

**Tarih:** 2025-11-28

---

## 📊 Mevcut Tablolar (Kullanıcı Mesajlaşma)

### conversations
Kullanıcı sohbetleri tablosu.

```sql
-- Mevcut tablo
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### messages
Kullanıcı mesajları tablosu.

```sql
-- Mevcut tablo
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_profile_id UUID REFERENCES profiles(id),
  content TEXT,
  content_type TEXT DEFAULT 'text',
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_metadata JSONB,
  reply_to_id UUID REFERENCES messages(id),
  status TEXT DEFAULT 'sent',
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_for JSONB DEFAULT '[]',
  is_shadow BOOLEAN DEFAULT FALSE,
  is_deleted_for_user BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### broadcast_channels
Creator yayın kanalları tablosu.

```sql
-- Mevcut tablo
CREATE TABLE broadcast_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  access_type TEXT DEFAULT 'public',
  required_tier_id UUID,
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  allowed_reactions TEXT[] DEFAULT ARRAY['❤️', '🔥', '👏', '😍', '🎉'],
  polls_enabled BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### broadcast_messages
Yayın mesajları tablosu.

```sql
-- Mevcut tablo
CREATE TABLE broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES broadcast_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT,
  content_type TEXT DEFAULT 'text',
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_metadata JSONB,
  poll_id UUID,
  view_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🆕 Yeni Tablolar (Admin Chat)

### ops_conversations
Admin sohbetleri tablosu.

```sql
CREATE TABLE ops_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT, -- Grup sohbetleri için
  avatar_url TEXT, -- Grup avatarı
  created_by UUID REFERENCES admin_profiles(id),
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ops_conversations IS 'Admin kullanıcılar arası sohbetler';

-- Indexes
CREATE INDEX idx_ops_conversations_last_message ON ops_conversations(last_message_at DESC);
CREATE INDEX idx_ops_conversations_created_by ON ops_conversations(created_by);
```

### ops_conversation_participants
Admin sohbet katılımcıları.

```sql
CREATE TABLE ops_conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ops_conversations(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  
  UNIQUE(conversation_id, admin_id)
);

COMMENT ON TABLE ops_conversation_participants IS 'Admin sohbet katılımcıları';

-- Indexes
CREATE INDEX idx_ops_participants_admin ON ops_conversation_participants(admin_id);
CREATE INDEX idx_ops_participants_conversation ON ops_conversation_participants(conversation_id);
```

### ops_messages
Admin mesajları tablosu.

```sql
CREATE TABLE ops_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ops_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES admin_profiles(id),
  
  -- İçerik
  content TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN (
    'text', 'image', 'file', 'link'
  )),
  
  -- Media
  media_url TEXT,
  media_metadata JSONB, -- filename, size, mime_type
  
  -- Reply
  reply_to_id UUID REFERENCES ops_messages(id),
  
  -- Mentions
  mentions JSONB DEFAULT '[]', -- [{admin_id, display_name}]
  
  -- Status
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ops_messages IS 'Admin mesajları';

-- Indexes
CREATE INDEX idx_ops_messages_conversation ON ops_messages(conversation_id, created_at DESC);
CREATE INDEX idx_ops_messages_sender ON ops_messages(sender_id);
CREATE INDEX idx_ops_messages_reply ON ops_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Realtime için
ALTER TABLE ops_messages REPLICA IDENTITY FULL;
```

### ops_message_reactions
Admin mesaj tepkileri.

```sql
CREATE TABLE ops_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES ops_messages(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, admin_id, emoji)
);

COMMENT ON TABLE ops_message_reactions IS 'Admin mesaj tepkileri';

-- Indexes
CREATE INDEX idx_ops_reactions_message ON ops_message_reactions(message_id);
```

### ops_message_read_receipts
Admin mesaj okundu bilgisi.

```sql
CREATE TABLE ops_message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES ops_messages(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_profiles(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, admin_id)
);

COMMENT ON TABLE ops_message_read_receipts IS 'Admin mesaj okundu bilgisi';

-- Indexes
CREATE INDEX idx_ops_receipts_message ON ops_message_read_receipts(message_id);
```

---

## 🔐 RLS Policies

### ops_conversations

```sql
-- Admin'ler sadece katıldıkları sohbetleri görebilir
CREATE POLICY "Admins can view their conversations"
ON ops_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ops_conversation_participants
    WHERE conversation_id = ops_conversations.id
    AND admin_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Admin'ler sohbet oluşturabilir
CREATE POLICY "Admins can create conversations"
ON ops_conversations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND is_active = true
  )
);
```

### ops_messages

```sql
-- Admin'ler katıldıkları sohbetlerdeki mesajları görebilir
CREATE POLICY "Admins can view messages in their conversations"
ON ops_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ops_conversation_participants
    WHERE conversation_id = ops_messages.conversation_id
    AND admin_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Admin'ler mesaj gönderebilir
CREATE POLICY "Admins can send messages"
ON ops_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM ops_conversation_participants
    WHERE conversation_id = ops_messages.conversation_id
    AND admin_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Admin'ler kendi mesajlarını düzenleyebilir
CREATE POLICY "Admins can edit their own messages"
ON ops_messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());
```

---

## 🔄 Triggers

### update_ops_conversation_last_message

```sql
CREATE OR REPLACE FUNCTION update_ops_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ops_conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ops_conversation_last_message
AFTER INSERT ON ops_messages
FOR EACH ROW
EXECUTE FUNCTION update_ops_conversation_last_message();
```

### increment_ops_unread_count

```sql
CREATE OR REPLACE FUNCTION increment_ops_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ops_conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
  AND admin_id != NEW.sender_id
  AND left_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_ops_unread_count
AFTER INSERT ON ops_messages
FOR EACH ROW
EXECUTE FUNCTION increment_ops_unread_count();
```

---

## 📡 Realtime Publication

```sql
-- ops_messages tablosunu realtime'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE ops_messages;
```

---

**Son Güncelleme:** 2025-11-28
