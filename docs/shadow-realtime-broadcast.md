# Shadow Profile - Realtime Broadcast System

## Overview

Web-Ops dashboard'dan mobile app'e gerçek zamanlı komut gönderme sistemi. Supabase Realtime Broadcast kullanarak ops ekibinin kullanıcı shadow session'larını yönetmesini sağlar.

## Architecture

```
Web-Ops Dashboard → API Route → Edge Function → Supabase Realtime → Mobile App
```

### Components

1. **Web-Ops Dashboard** (`/apps/web/app/ops/(private)/shadow/sessions`)
   - Session listesi ve yönetim UI
   - Terminate, lock, unlock butonları

2. **API Routes** (`/apps/web/app/api/ops/shadow/sessions/[sessionId]/terminate/route.ts`)
   - Session terminate endpoint
   - Broadcast service'i çağırır

3. **Broadcast Service** (`/packages/api/src/shadow-broadcast.ts`)
   - Edge Function'a HTTP request gönderir
   - Service role key ile authenticate eder

4. **Edge Function** (`/supabase/functions/broadcast-ops-event/index.ts`)
   - Supabase Realtime channel'a subscribe olur
   - Broadcast message gönderir
   - Channel'dan unsubscribe olur

5. **Mobile Listener** (`/apps/mobile/src/hooks/useOpsRealtime.ts`)
   - `ops:user:{userId}` channel'ını dinler
   - Broadcast event'leri handle eder
   - Session terminate, user lock, vb. işlemleri yapar

## Broadcast Events

### 1. session_terminated
**Amaç:** Aktif shadow session'ı sonlandır

**Payload:**
```typescript
{
  sessionId: string;
  reason: string;
}
```

**Mobile Action:**
- Session'ı database'de `invalidated` olarak işaretle
- Shadow mode'u kapat
- Audit log yaz
- Kullanıcıya alert göster

### 2. user_locked
**Amaç:** Kullanıcının shadow mode'a erişimini engelle

**Payload:**
```typescript
{
  reason: string;
  duration: number; // minutes
  locked_until: string; // ISO timestamp
}
```

**Mobile Action:**
- Shadow mode'u kapat
- Local store'da lock bilgisini sakla
- Kullanıcıya alert göster
- Shadow mode açma denemelerini engelle

### 3. user_unlocked
**Amaç:** Kullanıcının shadow mode erişimini geri ver

**Payload:**
```typescript
{}
```

**Mobile Action:**
- Local store'dan lock bilgisini temizle
- Kullanıcıya bildirim göster

### 4. rate_limit_config_updated
**Amaç:** PIN/Biometric rate limit ayarlarını güncelle

**Payload:**
```typescript
{
  type: 'pin' | 'biometric';
  config: {
    max_attempts?: number;
    window_minutes?: number;
    lockout_minutes?: number;
  };
}
```

**Mobile Action:**
- Local config'i güncelle
- Yeni limitleri uygula

### 5. anomaly_alert
**Amaç:** Kullanıcıya anomali uyarısı göster

**Payload:**
```typescript
{
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}
```

**Mobile Action:**
- Alert göster
- Audit log yaz

## Setup

### 1. Edge Function Deploy

```bash
# Deploy broadcast-ops-event function
supabase functions deploy broadcast-ops-event
```

**Environment Variables:**
- `SUPABASE_URL` - Otomatik set edilir
- `SUPABASE_SERVICE_ROLE_KEY` - Otomatik set edilir

**Important:** `verify_jwt` ayarı `false` olmalı (service role key kullanıyoruz)

### 2. Mobile App Setup

Shadow mode aktif olduğunda realtime listener otomatik başlar:

```typescript
// apps/mobile/app/(feed)/shadow.tsx
useOpsRealtime(shadowEnabled ? userId : undefined);
```

### 3. Web-Ops Setup

Broadcast service'i kullan:

```typescript
import { terminateSessionByOps } from '@ipelya/api';

await terminateSessionByOps(supabase, userId, sessionId, reason);
```

## Channel Naming

**Format:** `ops:user:{userId}`

**Example:** `ops:user:9143806b-1467-4a82-af7d-195239dc0a77`

**Important:** 
- Channel name mobile ve Edge Function'da aynı olmalı
- User ID doğru olmalı
- Channel her kullanıcı için unique

## Payload Format

Edge Function'dan gönderilen format:

```typescript
{
  type: 'broadcast',
  event: 'session_terminated', // Event type
  payload: {
    // Event-specific data
    sessionId: '...',
    reason: '...',
    timestamp: '2025-11-22T06:28:13.449Z'
  }
}
```

Mobile'da alınan format:

```typescript
{
  event: 'session_terminated',
  payload: {
    sessionId: '...',
    reason: '...',
    timestamp: '...'
  },
  type: 'broadcast'
}
```

## Error Handling

### Edge Function Errors

1. **Subscribe Timeout (3s)**
   - Channel'a subscribe olunamadı
   - Retry logic yok (tek deneme)
   - 500 error döner

2. **Channel Error**
   - CHANNEL_ERROR status
   - Otomatik reconnect dener
   - Başarılı olursa broadcast gönderilir

3. **Send Error**
   - Broadcast gönderilemedi
   - 500 error döner
   - Client retry yapmalı

### Mobile Errors

1. **userId undefined**
   - Listener başlatılmaz
   - Warning log: `⚠️ useOpsRealtime: userId not available`

2. **Connection Lost**
   - `CLOSED` status
   - Otomatik reconnect (Supabase client)

3. **Handler Error**
   - Try-catch ile yakalanır
   - Error log yazılır
   - User'a hata mesajı gösterilmez (silent fail)

## Testing

### 1. Manual Test (Supabase Dashboard)

**Edge Function Test:**
```json
{
  "userId": "9143806b-1467-4a82-af7d-195239dc0a77",
  "type": "session_terminated",
  "payload": {
    "sessionId": "52f5a49f-eae5-432c-8f65-1a876f63b6de",
    "reason": "Test from dashboard"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Broadcast sent: session_terminated"
}
```

### 2. Integration Test (Web-Ops)

1. Shadow mode aç (mobile)
2. Web-Ops'ta session'ı bul
3. Terminate butonuna bas
4. Mobile'da alert görmeli
5. Shadow mode kapanmalı

### 3. Logs

**Edge Function Logs:**
```
📡 Broadcasting session_terminated to user ...
Channel status: SUBSCRIBED
Sending broadcast...
✅ Broadcast sent: session_terminated to user ...
```

**Mobile Logs:**
```
🔗 Setting up realtime listener for ops commands...
✅ Realtime listener connected
📡 Received: session_terminated
⚠️ Session terminated by ops: ... (reason: ...)
🔴 Ending session: ...
🔴 Disabling shadow mode
✅ Session terminated successfully
```

## Performance

- **Edge Function Cold Start:** ~23ms
- **Broadcast Latency:** ~1-3s (subscribe + send + receive)
- **Channel Lifecycle:** Subscribe → Send → Unsubscribe (~10s total)

## Security

1. **Authentication:**
   - Edge Function: Service role key (server-side)
   - Mobile: User JWT (client-side)

2. **Authorization:**
   - Sadece ops ekibi broadcast gönderebilir
   - User sadece kendi channel'ını dinleyebilir

3. **Rate Limiting:**
   - Edge Function: Supabase default limits
   - Mobile: Client-side rate limit yok

## Troubleshooting

### Broadcast gönderiliyor ama mobile almıyor

**Kontrol Et:**
1. Channel name aynı mı? (`ops:user:{userId}`)
2. Event name aynı mı? (`session_terminated`)
3. Mobile listener aktif mi? (shadow mode açık olmalı)
4. userId doğru mu?

**Debug:**
```typescript
// Mobile console'da görmeli:
✅ Realtime listener connected
📡 Received: session_terminated
```

### Edge Function 401 Unauthorized

**Sorun:** `verify_jwt: true` ayarı açık

**Çözüm:** Supabase Dashboard → Functions → broadcast-ops-event → Settings → JWT Verification → Disable

### Mobile listener başlamıyor

**Sorun:** `userId` undefined veya shadow mode kapalı

**Çözüm:**
```typescript
// Shadow mode aktif olduğunda listener başlatılmalı
useOpsRealtime(shadowEnabled ? userId : undefined);
```

## Future Improvements

1. **Retry Logic:** Edge Function'da broadcast başarısız olursa retry
2. **Delivery Confirmation:** Mobile'dan ACK mesajı gönder
3. **Batch Broadcast:** Birden fazla user'a aynı anda gönder
4. **Message Queue:** Offline user'lar için queue sistemi
5. **Analytics:** Broadcast success rate, latency metrics

## Related Files

- `/apps/web/app/ops/(private)/shadow/sessions/page.tsx` - Sessions list UI
- `/apps/web/app/api/ops/shadow/sessions/[sessionId]/terminate/route.ts` - Terminate API
- `/packages/api/src/shadow-broadcast.ts` - Broadcast service
- `/supabase/functions/broadcast-ops-event/index.ts` - Edge Function
- `/apps/mobile/src/hooks/useOpsRealtime.ts` - Mobile listener
- `/apps/mobile/app/(feed)/shadow.tsx` - Shadow screen
