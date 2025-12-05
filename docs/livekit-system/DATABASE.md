# LiveKit Veritabanı Şeması

> Supabase PostgreSQL tabloları ve ilişkileri

## Mevcut İlgili Tablolar

### profiles (Mevcut)
Kullanıcı profilleri - LiveKit için önemli alanlar:

| Alan           | Tip     | Açıklama                   |
| -------------- | ------- | -------------------------- |
| `id`           | uuid    | Profil ID (PK)             |
| `user_id`      | uuid    | Auth user referansı        |
| `type`         | text    | `real` veya `shadow`       |
| `role`         | text    | `user`, `creator`, `admin` |
| `is_creator`   | boolean | Onaylı creator mı?         |
| `username`     | text    | Benzersiz kullanıcı adı    |
| `display_name` | text    | Görünen isim               |
| `avatar_url`   | text    | Profil fotoğrafı           |

### creator_subscriptions (Mevcut)
User → Creator abonelikleri:

| Alan            | Tip     | Açıklama                        |
| --------------- | ------- | ------------------------------- |
| `id`            | uuid    | PK                              |
| `subscriber_id` | uuid    | Abone user_id                   |
| `creator_id`    | uuid    | Creator user_id                 |
| `tier_id`       | uuid    | Abonelik tier'ı                 |
| `status`        | text    | `active`, `cancelled`, `paused` |
| `coin_price`    | integer | Ödenen coin miktarı             |

---

## Oluşturulacak Tablolar

### 1. live_sessions
Canlı yayın ve sesli oda oturumları:

```sql
CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Creator bilgisi
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Oturum bilgileri
  title text,
  description text,
  thumbnail_url text,
  
  -- Tip ve erişim
  session_type text NOT NULL CHECK (session_type IN ('video_live', 'audio_room')),
  access_type text NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'subscribers_only', 'pay_per_view')),
  ppv_coin_price integer DEFAULT 0,
  
  -- LiveKit bilgileri
  livekit_room_name text NOT NULL UNIQUE,
  livekit_room_sid text, -- LiveKit tarafından atanan SID
  
  -- Durum
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  
  -- İstatistikler
  peak_viewers integer DEFAULT 0,
  total_viewers integer DEFAULT 0,
  total_duration_seconds integer DEFAULT 0,
  total_gifts_received integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  
  -- Ayarlar
  chat_enabled boolean DEFAULT true,
  gifts_enabled boolean DEFAULT true,
  recording_enabled boolean DEFAULT false,
  
  -- Zaman damgaları
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_live_sessions_creator_id ON public.live_sessions(creator_id);
CREATE INDEX idx_live_sessions_status ON public.live_sessions(status);
CREATE INDEX idx_live_sessions_session_type ON public.live_sessions(session_type);
CREATE INDEX idx_live_sessions_livekit_room_name ON public.live_sessions(livekit_room_name);

-- RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER set_live_sessions_updated_at
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2. live_participants
Oturum katılımcıları ve rolleri:

```sql
CREATE TABLE public.live_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişkiler
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Rol ve durum
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('host', 'co_host', 'invited_guest', 'moderator', 'speaker', 'viewer', 'listener')),
  is_active boolean DEFAULT true,
  is_muted boolean DEFAULT false,
  is_video_enabled boolean DEFAULT true,
  
  -- Guest invitation bilgileri (GUEST_COHOST.md)
  invited_at timestamptz,
  invitation_expires_at timestamptz,
  invitation_response text CHECK (invitation_response IN ('pending', 'accepted', 'rejected', 'expired')),
  
  -- LiveKit bilgileri
  livekit_participant_sid text,
  livekit_identity text,
  
  -- Zaman bilgileri
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  total_watch_time_seconds integer DEFAULT 0,
  
  -- Ödeme (PPV için)
  paid_amount integer DEFAULT 0,
  payment_id uuid,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Her kullanıcı bir oturumda tek kayıt
  UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX idx_live_participants_session_id ON public.live_participants(session_id);
CREATE INDEX idx_live_participants_user_id ON public.live_participants(user_id);
CREATE INDEX idx_live_participants_is_active ON public.live_participants(is_active);
CREATE INDEX idx_live_participants_role ON public.live_participants(role);

-- RLS
ALTER TABLE public.live_participants ENABLE ROW LEVEL SECURITY;
```

### 3. live_messages
Canlı oturum mesajları (chat, hediye bildirimi, sistem):

```sql
CREATE TABLE public.live_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişkiler
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Mesaj bilgileri
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'gift', 'system', 'pinned')),
  content text,
  
  -- Gift bilgileri (message_type = 'gift' ise)
  gift_id uuid REFERENCES public.gifts(id),
  gift_quantity integer DEFAULT 1,
  gift_coin_value integer DEFAULT 0,
  
  -- Durum
  is_deleted boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_live_messages_session_id ON public.live_messages(session_id);
CREATE INDEX idx_live_messages_sender_id ON public.live_messages(sender_id);
CREATE INDEX idx_live_messages_message_type ON public.live_messages(message_type);
CREATE INDEX idx_live_messages_created_at ON public.live_messages(created_at);

-- RLS
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;
```

### 4. live_gifts
Canlı oturum hediye kayıtları:

```sql
CREATE TABLE public.live_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişkiler
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hediye bilgileri
  gift_id uuid NOT NULL REFERENCES public.gifts(id),
  quantity integer NOT NULL DEFAULT 1,
  coin_amount integer NOT NULL,
  
  -- Ödeme referansı
  transaction_id uuid REFERENCES public.coin_transactions(id),
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_live_gifts_session_id ON public.live_gifts(session_id);
CREATE INDEX idx_live_gifts_sender_id ON public.live_gifts(sender_id);
CREATE INDEX idx_live_gifts_receiver_id ON public.live_gifts(receiver_id);

-- RLS
ALTER TABLE public.live_gifts ENABLE ROW LEVEL SECURITY;
```

### 5. calls
1-1 sesli ve görüntülü çağrılar:

```sql
CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Katılımcılar
  caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Çağrı bilgileri
  call_type text NOT NULL CHECK (call_type IN ('audio_call', 'video_call')),
  
  -- LiveKit bilgileri
  livekit_room_name text NOT NULL UNIQUE,
  livekit_room_sid text,
  
  -- Durum
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated',    -- Çağrı başlatıldı
    'ringing',      -- Aranan kişiye bildirim gönderildi
    'accepted',     -- Çağrı kabul edildi
    'rejected',     -- Çağrı reddedildi
    'missed',       -- Cevapsız çağrı
    'busy',         -- Meşgul
    'ended',        -- Normal sonlandı
    'failed'        -- Teknik hata
  )),
  
  -- Zaman bilgileri
  initiated_at timestamptz DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  
  -- Sonlandırma bilgisi
  ended_by uuid REFERENCES auth.users(id),
  end_reason text,
  
  -- Ücretlendirme (opsiyonel)
  is_paid boolean DEFAULT false,
  coin_per_minute integer DEFAULT 0,
  total_coin_spent integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX idx_calls_callee_id ON public.calls(callee_id);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_livekit_room_name ON public.calls(livekit_room_name);

-- RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
```

### 6. live_session_bans
Oturumdan uzaklaştırılan kullanıcılar:

```sql
CREATE TABLE public.live_session_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  banned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reason text,
  expires_at timestamptz, -- NULL = kalıcı ban
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(session_id, banned_user_id)
);

-- Indexes
CREATE INDEX idx_live_session_bans_session_id ON public.live_session_bans(session_id);
CREATE INDEX idx_live_session_bans_banned_user_id ON public.live_session_bans(banned_user_id);

-- RLS
ALTER TABLE public.live_session_bans ENABLE ROW LEVEL SECURITY;
```

---

## RLS Policies

### live_sessions Policies

```sql
-- Herkes aktif oturumları görebilir
CREATE POLICY "Anyone can view live sessions"
  ON public.live_sessions FOR SELECT
  USING (status IN ('scheduled', 'live'));

-- Creator kendi oturumlarını yönetebilir
CREATE POLICY "Creators can manage own sessions"
  ON public.live_sessions FOR ALL
  USING (creator_id = (SELECT auth.uid()))
  WITH CHECK (creator_id = (SELECT auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access on live_sessions"
  ON public.live_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### live_participants Policies

```sql
-- Katılımcılar kendi katılım kayıtlarını görebilir
CREATE POLICY "Users can view own participation"
  ON public.live_participants FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Host oturumun tüm katılımcılarını görebilir
CREATE POLICY "Host can view session participants"
  ON public.live_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions ls
      WHERE ls.id = session_id AND ls.creator_id = (SELECT auth.uid())
    )
  );

-- Service role full access
CREATE POLICY "Service role full access on live_participants"
  ON public.live_participants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### live_messages Policies

```sql
-- Oturumdaki herkes mesajları görebilir
CREATE POLICY "Participants can view session messages"
  ON public.live_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_participants lp
      WHERE lp.session_id = live_messages.session_id
        AND lp.user_id = (SELECT auth.uid())
        AND lp.is_active = true
    )
  );

-- Kullanıcılar mesaj gönderebilir
CREATE POLICY "Users can send messages"
  ON public.live_messages FOR INSERT
  WITH CHECK (sender_id = (SELECT auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access on live_messages"
  ON public.live_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### calls Policies

```sql
-- Kullanıcılar kendi çağrılarını görebilir
CREATE POLICY "Users can view own calls"
  ON public.calls FOR SELECT
  USING (
    caller_id = (SELECT auth.uid()) OR callee_id = (SELECT auth.uid())
  );

-- Kullanıcılar çağrı başlatabilir
CREATE POLICY "Users can initiate calls"
  ON public.calls FOR INSERT
  WITH CHECK (caller_id = (SELECT auth.uid()));

-- Kullanıcılar kendi çağrılarını güncelleyebilir
CREATE POLICY "Users can update own calls"
  ON public.calls FOR UPDATE
  USING (
    caller_id = (SELECT auth.uid()) OR callee_id = (SELECT auth.uid())
  );

-- Service role full access
CREATE POLICY "Service role full access on calls"
  ON public.calls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## Realtime Subscription

Aşağıdaki tablolar Realtime için publication'a eklenmelidir:

```sql
-- Realtime publication'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

-- REPLICA IDENTITY FULL (tüm değişiklikleri görmek için)
ALTER TABLE public.live_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.live_participants REPLICA IDENTITY FULL;
ALTER TABLE public.live_messages REPLICA IDENTITY FULL;
ALTER TABLE public.calls REPLICA IDENTITY FULL;
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│    profiles     │
│  (mevcut)       │
└────────┬────────┘
         │
         │ creator_id / user_id
         ▼
┌─────────────────┐         ┌─────────────────┐
│  live_sessions  │◄────────│live_participants│
│                 │ 1     N │                 │
└────────┬────────┘         └─────────────────┘
         │
         │ 1
         ▼ N
┌─────────────────┐         ┌─────────────────┐
│  live_messages  │         │   live_gifts    │
└─────────────────┘         └─────────────────┘

┌─────────────────┐
│     calls       │
│ caller ↔ callee │
└─────────────────┘
```

---

## Migration Uygulama Sırası

1. `live_sessions` tablosu
2. `live_participants` tablosu
3. `live_messages` tablosu (gifts FK için önce gifts tablosu kontrol et)
4. `live_gifts` tablosu
5. `calls` tablosu
6. `live_session_bans` tablosu
7. `live_guest_requests` tablosu
8. RLS Policies

---

## Guest/Co-Host Tabloları

> Detaylar için: [GUEST_COHOST.md](./GUEST_COHOST.md)

### 7. live_guest_requests

İzleyicilerin yayına katılma talepleri (Request to Join):

```sql
CREATE TABLE public.live_guest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişkiler
  session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  requester_profile_id uuid NOT NULL REFERENCES profiles(id),
  
  -- Durum
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  message text,                    -- İsteğe bağlı mesaj
  
  -- Response
  responded_at timestamptz,
  responded_by uuid REFERENCES auth.users(id),
  
  -- Timeout
  expires_at timestamptz DEFAULT (now() + interval '60 seconds'),
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_guest_requests_session ON live_guest_requests(session_id) WHERE status = 'pending';
CREATE INDEX idx_guest_requests_requester ON live_guest_requests(requester_id);

-- RLS
ALTER TABLE live_guest_requests ENABLE ROW LEVEL SECURITY;

-- Host tüm istekleri görebilir
CREATE POLICY "host_view_requests" ON live_guest_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls 
      WHERE ls.id = session_id AND ls.creator_id = (SELECT auth.uid())
    )
  );

-- Requester kendi isteğini görebilir
CREATE POLICY "requester_view_own" ON live_guest_requests
  FOR SELECT USING (requester_id = (SELECT auth.uid()));

-- Authenticated users request oluşturabilir
CREATE POLICY "create_request" ON live_guest_requests
  FOR INSERT WITH CHECK (requester_id = (SELECT auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access on guest_requests"
  ON live_guest_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Realtime için ek

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_guest_requests;
ALTER TABLE public.live_guest_requests REPLICA IDENTITY FULL;
```
8. Realtime publication
9. Indexes (eğer ayrı migration ise)
