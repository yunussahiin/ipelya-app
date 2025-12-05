# LiveKit Moderasyon Politikası

> Ban, kick, moderator rolleri ve incident yönetimi

## 1. Rol Hiyerarşisi

```
ADMIN (Ops)
    │
    ├── Tüm odaları yönetebilir
    ├── Global ban verebilir
    └── Session'ları zorla kapatabilir
    
HOST (Creator)
    │
    ├── Kendi odasında tam yetki
    ├── Moderator atayabilir
    ├── Viewer/Speaker banleyebilir
    └── Chat mesajlarını silebilir
    
CO_HOST
    │
    ├── Host gibi yayın yapabilir
    └── Moderasyon yetkisi YOK
    
MODERATOR
    │
    ├── Viewer/Speaker kickleyebilir
    ├── Chat mesajlarını silebilir
    └── Ban veremez (sadece kick)
    
SPEAKER
    │
    └── Sadece konuşabilir
    
VIEWER / LISTENER
    │
    └── Sadece izleyebilir/dinleyebilir
```

---

## 2. Ban Türleri

### Session Ban (Oturum Bazlı)
- Kullanıcı sadece o canlı yayından banlanır
- Oturum bitince ban kalkar
- `live_session_bans` tablosunda tutulur

### Creator Ban (Creator Bazlı)
- Kullanıcı o creator'ın tüm yayınlarından banlanır
- Kalıcı veya süreli olabilir
- `creator_bans` tablosunda tutulur

### Global Ban (Platform Bazlı)
- Kullanıcı tüm canlı yayın özelliklerinden banlanır
- Sadece admin verebilir
- `profiles.banned_until` alanında tutulur

---

## 3. Ban Akışı (Implementation)

### Step 1: Veritabanı Kaydı

```sql
-- Session ban
INSERT INTO live_session_bans (session_id, banned_user_id, banned_by, reason, expires_at)
VALUES ($1, $2, $3, $4, $5);

-- Creator ban (yeni tablo gerekli)
INSERT INTO creator_bans (creator_id, banned_user_id, banned_by, reason, expires_at)
VALUES ($1, $2, $3, $4, $5);
```

### Step 2: LiveKit'ten Çıkar

```typescript
// ban-participant Edge Function
import { RoomServiceClient } from 'livekit-server-sdk';

async function banParticipant(sessionId: string, userId: string, reason: string) {
  const roomService = new RoomServiceClient(
    Deno.env.get('LIVEKIT_URL'),
    Deno.env.get('LIVEKIT_API_KEY'),
    Deno.env.get('LIVEKIT_API_SECRET')
  );

  // 1. DB'ye ban kaydı
  const { data: session } = await supabase
    .from('live_sessions')
    .select('livekit_room_name')
    .eq('id', sessionId)
    .single();

  await supabase.from('live_session_bans').insert({
    session_id: sessionId,
    banned_user_id: userId,
    banned_by: authUser.id,
    reason,
  });

  // 2. LiveKit'ten çıkar
  await roomService.removeParticipant(session.livekit_room_name, userId);

  // 3. Realtime ile bildir (opsiyonel)
  await supabase.channel(`user:${userId}`).send({
    type: 'broadcast',
    event: 'banned',
    payload: { sessionId, reason },
  });
}
```

### Step 3: Client Handling

```typescript
// Mobile'da
room.on(RoomEvent.Disconnected, (reason) => {
  if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
    // Ban kontrolü
    checkIfBanned(sessionId).then(banInfo => {
      if (banInfo) {
        showBanModal(banInfo.reason);
      }
    });
  }
});
```

---

## 4. Kick vs Ban

| Aksiyon         | Etki            | Yeniden Katılabilir        | Yetki           |
| --------------- | --------------- | -------------------------- | --------------- |
| **Kick**        | Anlık çıkarma   | Evet, hemen                | Host, Moderator |
| **Session Ban** | Oturum boyunca  | Hayır, oturum bitene kadar | Host            |
| **Creator Ban** | Tüm yayınlar    | Hayır, süre bitene kadar   | Host            |
| **Global Ban**  | Platform geneli | Admin kaldırana kadar      | Admin           |

### Kick Implementation

```typescript
// Kick = RemoveParticipant, DB kaydı YOK
async function kickParticipant(roomName: string, userId: string) {
  await roomService.removeParticipant(roomName, userId);
  // Kullanıcı isterse hemen tekrar katılabilir
}
```

---

## 5. Moderator Yetkileri

### Moderator Atama

```typescript
async function assignModerator(sessionId: string, userId: string) {
  // Katılımcı rolünü güncelle
  await supabase
    .from('live_participants')
    .update({ role: 'moderator' })
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  // LiveKit'te metadata güncelle (opsiyonel)
  await roomService.updateParticipant(roomName, userId, undefined, {
    role: 'moderator',
  });
}
```

### Moderator Aksiyonları

| Aksiyon        | Hedef                     | İzin |
| -------------- | ------------------------- | ---- |
| Kick           | viewer, listener, speaker | ✅    |
| Kick           | moderator                 | ❌    |
| Kick           | host, co_host             | ❌    |
| Delete message | Herkes                    | ✅    |
| Ban            | -                         | ❌    |
| Mute           | viewer, listener, speaker | ✅    |

---

## 6. Chat Moderasyonu

### Mesaj Silme

```typescript
async function deleteMessage(sessionId: string, messageId: string) {
  // Soft delete
  await supabase
    .from('live_messages')
    .update({ is_deleted: true })
    .eq('id', messageId)
    .eq('session_id', sessionId);

  // Realtime ile tüm client'lara bildir
  await supabase.channel(`session:${sessionId}`).send({
    type: 'broadcast',
    event: 'message_deleted',
    payload: { messageId },
  });
}
```

### Spam Koruması

```typescript
// Rate limiting: Kullanıcı başına 10 mesaj/dakika
const RATE_LIMIT = { count: 10, window: 60 }; // 60 saniye

async function canSendMessage(userId: string, sessionId: string): Promise<boolean> {
  const { count } = await supabase
    .from('live_messages')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('sender_id', userId)
    .gte('created_at', new Date(Date.now() - RATE_LIMIT.window * 1000).toISOString());

  return count < RATE_LIMIT.count;
}
```

---

## 7. Incident Flow (Şikayet Yönetimi)

### Şikayet Oluşturma

```sql
CREATE TABLE public.live_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES live_sessions(id),
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  reported_user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  evidence_urls text[], -- Screenshot, video clip
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  action_taken text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);
```

### Incident Workflow

```
┌──────────┐    auto-flag    ┌──────────┐
│ Şikayet  │───────────────►│ Pending  │
│ Geldi    │                 │ Review   │
└──────────┘                 └────┬─────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Dismiss  │ │ Warning  │ │   Ban    │
              └──────────┘ └──────────┘ └──────────┘
```

### Otomatik Flag Kuralları

| Durum                       | Aksiyon                |
| --------------------------- | ---------------------- |
| 3+ şikayet aynı kullanıcıya | Ops alert              |
| 5+ şikayet aynı session'da  | Session'ı incele       |
| Belirli kelimeler (regex)   | Otomatik mute + review |

---

## 8. Ops Dashboard Gereksinimleri

### Aktif Oturumlar Listesi
- Session ID, Creator, Viewer sayısı
- "Zorla Kapat" butonu
- "Tüm Katılımcıları Gör" linki

### Şikayet Kuyruğu
- Pending şikayetler listesi
- Evidence görüntüleme
- Aksiyon butonları (Dismiss, Warn, Ban)

### Ban Yönetimi
- Aktif banlar listesi
- Ban kaldırma
- Ban süresi uzatma

---

## 9. Checklist

- [ ] `live_session_bans` tablosu oluşturuldu
- [ ] `creator_bans` tablosu oluşturuldu
- [ ] `live_reports` tablosu oluşturuldu
- [ ] `ban-participant` Edge Function deploy edildi
- [ ] `kick-participant` Edge Function deploy edildi
- [ ] Client'ta ban/kick handling implement edildi
- [ ] Chat rate limiting aktif
- [ ] Ops dashboard'da moderasyon paneli var
- [ ] Spam kelime listesi tanımlandı
