# LiveKit Error Handling & State Machine

> Hata senaryoları, state geçişleri ve edge-case yönetimi

## 1. Connection State Machine

### Room Connection States
```
                    ┌─────────────┐
                    │ Disconnected│
                    └──────┬──────┘
                           │ connect()
                           ▼
                    ┌─────────────┐
            ┌───────│ Connecting  │───────┐
            │       └──────┬──────┘       │
            │              │ success      │ failure
            │              ▼              │
            │       ┌─────────────┐       │
            │       │  Connected  │       │
            │       └──────┬──────┘       │
            │              │              │
     network│              │ network      │
        drop│              │ change       │
            │              ▼              │
            │       ┌─────────────┐       │
            └──────►│ Reconnecting│◄──────┘
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │ success    │ timeout    │ max retries
              ▼            ▼            ▼
        ┌───────────┐ ┌─────────┐ ┌─────────────┐
        │ Connected │ │ Retry   │ │Disconnected │
        └───────────┘ └─────────┘ └─────────────┘
```

### Event'ler ve Aksiyonlar

| Event          | Aksiyon                 | UI Feedback             |
| -------------- | ----------------------- | ----------------------- |
| `Connecting`   | Loading göster          | "Bağlanıyor..."         |
| `Connected`    | Normal UI               | -                       |
| `Reconnecting` | Toast göster            | "Yeniden bağlanıyor..." |
| `Reconnected`  | Toast kapat             | "Bağlantı sağlandı"     |
| `Disconnected` | Ekranı kapat veya retry | "Bağlantı koptu"        |

---

## 2. Call State Machine

### 1-1 Çağrı States
```
┌──────────┐    initiate    ┌──────────┐
│   IDLE   │───────────────►│INITIATED │
└──────────┘                └────┬─────┘
                                 │ push sent
                                 ▼
┌──────────┐    timeout     ┌──────────┐
│  MISSED  │◄───────────────│ RINGING  │
└──────────┘   (30 sec)     └────┬─────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼ reject           ▼ accept           ▼ busy
        ┌──────────┐       ┌──────────┐       ┌──────────┐
        │ REJECTED │       │ ACCEPTED │       │   BUSY   │
        └──────────┘       └────┬─────┘       └──────────┘
                                │
                                ▼
                          ┌──────────┐
                          │   LIVE   │
                          └────┬─────┘
                                │
              ┌─────────────────┼─────────────────┐
              │ user ends       │ network fail    │ timeout
              ▼                 ▼                 ▼
        ┌──────────┐       ┌──────────┐       ┌──────────┐
        │  ENDED   │       │  FAILED  │       │  ENDED   │
        └──────────┘       └──────────┘       └──────────┘
```

### Timeout Değerleri

| State               | Timeout   | Aksiyon                   |
| ------------------- | --------- | ------------------------- |
| INITIATED → RINGING | 5 saniye  | Push gönderilmezse FAILED |
| RINGING → MISSED    | 30 saniye | Cevapsız çağrı kaydı      |
| LIVE (idle)         | 5 dakika  | Ses/video yoksa uyarı     |
| LIVE (max)          | 4 saat    | Zorla sonlandır           |

### Eşzamanlı Çağrı Kontrolü
```typescript
// Kullanıcı zaten bir çağrıda mı?
const { data: activeCall } = await supabase
  .from('calls')
  .select('id')
  .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
  .in('status', ['initiated', 'ringing', 'accepted'])
  .single();

if (activeCall) {
  return { error: 'User is busy', status: 'BUSY' };
}
```

---

## 3. Host Disconnection Senaryoları

### Host Düşerse Ne Olur?

| Senaryo                   | Bekleme   | Aksiyon                      |
| ------------------------- | --------- | ---------------------------- |
| Host network drop         | 30 saniye | Auto-reconnect dene          |
| Host app crash            | 30 saniye | Auto-reconnect dene          |
| Host telefonu kapattı     | 0         | Session `paused` durumuna al |
| 30 saniye geçti, host yok | -         | Session `ended` yap          |

### Implementation
```typescript
// Webhook handler'da
case 'participant_left':
  const { data: session } = await supabase
    .from('live_sessions')
    .select('creator_id, status')
    .eq('livekit_room_name', event.room.name)
    .single();

  // Host mu ayrıldı?
  if (event.participant.identity === session.creator_id) {
    // 30 saniye bekle, geri gelmezse kapat
    await supabase.from('live_sessions').update({
      status: 'host_disconnected',
      host_left_at: new Date().toISOString(),
    }).eq('livekit_room_name', event.room.name);

    // Cron job veya delayed function ile kontrol
    // 30 saniye sonra hala host yoksa → ended
  }
  break;
```

### Viewer'a Gösterilecek UI
```typescript
if (session.status === 'host_disconnected') {
  return (
    <View style={styles.overlay}>
      <Text>Yayıncı bağlantısı koptu</Text>
      <Text>Yeniden bağlanması bekleniyor...</Text>
      <ActivityIndicator />
    </View>
  );
}
```

---

## 4. Orphaned Session Cleanup

### Sorun
Session "live" görünüyor ama kimse bağlı değil.

### Çözüm: Cron Job
```typescript
// Supabase scheduled function veya external cron
async function cleanupOrphanedSessions() {
  const STALE_THRESHOLD = 30 * 60 * 1000; // 30 dakika
  
  const { data: staleSessions } = await supabase
    .from('live_sessions')
    .select('id, livekit_room_name')
    .eq('status', 'live')
    .lt('updated_at', new Date(Date.now() - STALE_THRESHOLD).toISOString());

  for (const session of staleSessions) {
    // LiveKit'ten oda durumunu kontrol et
    const room = await livekitApi.getRoom(session.livekit_room_name);
    
    if (!room || room.numParticipants === 0) {
      await supabase.from('live_sessions').update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason: 'orphaned_cleanup',
      }).eq('id', session.id);
    }
  }
}
```

---

## 5. Token & Edge Function Hataları

### Token Generation Errors

| Error                   | Kullanıcıya Mesaj                         | Retry?         |
| ----------------------- | ----------------------------------------- | -------------- |
| `UNAUTHORIZED`          | "Oturum süresi doldu, tekrar giriş yapın" | Hayır          |
| `SESSION_NOT_FOUND`     | "Yayın bulunamadı"                        | Hayır          |
| `SUBSCRIPTION_REQUIRED` | "Bu yayın sadece abonelere özel"          | Hayır          |
| `PAYMENT_REQUIRED`      | "Bu yayını izlemek için X coin gerekli"   | Hayır          |
| `RATE_LIMITED`          | "Çok fazla istek, biraz bekleyin"         | 5 saniye sonra |
| `INTERNAL_ERROR`        | "Bir hata oluştu, tekrar deneyin"         | 3 kez          |

### Error Handling Pattern
```typescript
async function getToken(sessionId: string): Promise<TokenResult> {
  try {
    const { data, error } = await supabase.functions.invoke('get-livekit-token', {
      body: { sessionId },
    });

    if (error) {
      // Edge function HTTP error
      throw new LiveKitError(error.message, 'FUNCTION_ERROR');
    }

    if (!data.success) {
      // Business logic error
      throw new LiveKitError(data.error, data.errorCode);
    }

    return { token: data.token, wsUrl: data.wsUrl };
  } catch (e) {
    if (e instanceof LiveKitError) {
      return { error: e };
    }
    // Network error
    return { error: new LiveKitError('Bağlantı hatası', 'NETWORK_ERROR') };
  }
}
```

---

## 6. Network Quality Handling

### ConnectionQuality Events
```typescript
room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
  if (participant.isLocal) {
    switch (quality) {
      case ConnectionQuality.Excellent:
        // Normal
        break;
      case ConnectionQuality.Good:
        // Normal
        break;
      case ConnectionQuality.Poor:
        showToast('Bağlantı kalitesi düşük');
        // Otomatik olarak sadece audio'ya geç
        if (session.type === 'video_live') {
          room.localParticipant.setCameraEnabled(false);
        }
        break;
      case ConnectionQuality.Lost:
        showToast('Bağlantı kaybedildi, yeniden bağlanılıyor...');
        break;
    }
  }
});
```

### Adaptive Bitrate
LiveKit otomatik olarak adaptive bitrate kullanır. Ek config:
```typescript
const room = new Room({
  adaptiveStream: true,  // Otomatik kalite ayarı
  dynacast: true,        // Sadece izlenen track'leri gönder
});
```

---

## 7. Error Recovery Checklist

- [ ] Tüm Edge Function'lar try-catch ile sarılı
- [ ] Network timeout'ları tanımlı (15 saniye default)
- [ ] Retry logic (exponential backoff) implement edildi
- [ ] Orphaned session cleanup cron'u aktif
- [ ] Host disconnect handling implement edildi
- [ ] Poor connection UI feedback'i var
- [ ] Error logging (Sentry/benzeri) entegre
