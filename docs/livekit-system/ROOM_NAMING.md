# LiveKit Room Naming Stratejisi

> Room isimlendirme kuralları, idempotency ve collision önleme

## Naming Convention

### 1. Canlı Video Yayını
```
Pattern: live_video_{session_uuid}
Örnek:   live_video_550e8400-e29b-41d4-a716-446655440000
```

### 2. Sesli Oda (Audio Room)
```
Pattern: audio_room_{session_uuid}
Örnek:   audio_room_6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

### 3. 1-1 Çağrı
```
Pattern: call_{call_uuid}_{timestamp_ms}
Örnek:   call_7c9e6679-7425-40de-944b-e07fc1f90ae7_1701792000000
```

> ⚠️ **Neden timestamp?** Aynı iki kullanıcı arasında birden fazla çağrı olabilir. Timestamp idempotency sağlar.

---

## Idempotency Kuralları

### Session Oluşturma
```typescript
// ❌ YANLIŞ - Her çağrıda yeni oda oluşur
const roomName = `live_${Date.now()}`;

// ✅ DOĞRU - Session UUID ile tek oda garantisi
const roomName = `live_video_${session.id}`;
```

### Veritabanı Constraint
```sql
-- live_sessions tablosunda
livekit_room_name text NOT NULL UNIQUE
```

Bu constraint sayesinde aynı session için iki farklı oda oluşturulamaz.

---

## Collision Önleme

### Live Session vs Call Çakışması

| Tip        | Prefix        | Örnek                          |
| ---------- | ------------- | ------------------------------ |
| Video Live | `live_video_` | `live_video_abc123`            |
| Audio Room | `audio_room_` | `audio_room_def456`            |
| Video Call | `call_video_` | `call_video_ghi789_1701792000` |
| Audio Call | `call_audio_` | `call_audio_jkl012_1701792000` |

### Regex Validation
```typescript
const ROOM_NAME_PATTERNS = {
  live_video: /^live_video_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  audio_room: /^audio_room_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  call: /^call_(video|audio)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d+$/,
};

function validateRoomName(roomName: string): boolean {
  return Object.values(ROOM_NAME_PATTERNS).some(pattern => pattern.test(roomName));
}
```

---

## Room Oluşturma Akışı

### Edge Function'da
```typescript
// create-live-session içinde
const sessionId = crypto.randomUUID();
const roomName = `live_video_${sessionId}`;

// Önce DB'ye yaz (unique constraint kontrolü)
const { data: session, error } = await supabase
  .from('live_sessions')
  .insert({
    id: sessionId,
    livekit_room_name: roomName,
    // ...
  })
  .select()
  .single();

if (error?.code === '23505') { // unique_violation
  // Room zaten var, mevcut olanı döndür
  const existing = await supabase
    .from('live_sessions')
    .select()
    .eq('id', sessionId)
    .single();
  return existing;
}

// Sonra LiveKit'e bağlan
```

---

## Room Lifecycle

### emptyTimeout
```typescript
// Room 10 dakika boş kalırsa otomatik kapanır
const roomOptions = {
  name: roomName,
  emptyTimeout: 10 * 60, // 600 saniye
  maxParticipants: 100,
};
```

### Cleanup Flow
1. Son katılımcı ayrılır
2. `emptyTimeout` süresi başlar
3. Süre dolunca LiveKit odayı kapatır
4. `room_finished` webhook tetiklenir
5. Edge function `live_sessions` tablosunu günceller

---

## Önemli Notlar

1. **Room name = Session/Call ID ile 1-1 eşleşmeli**
2. **Unique constraint DB'de zorunlu**
3. **Prefix'ler tip ayrımı için kritik**
4. **Timestamp sadece call'larda gerekli (idempotency)**
