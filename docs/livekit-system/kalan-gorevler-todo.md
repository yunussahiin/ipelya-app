# 📋 LiveKit System - Kalan Görevler TODO

> **Oluşturulma:** 2025-12-06 22:58 UTC+03:00  
> **Durum:** Faz 1-4 Tamamlandı, Kalan görevler aşağıda

---

## 🚨 KRİTİK ÖNCELİK (Hemen Yapılmalı)

### 1. iOS Background Audio Modes

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Kritik  
**Etki:** Uygulama arka plana alındığında ses kesilir

**Dosya:** `ios/ipelya/Info.plist`

**Yapılacak:** `UIBackgroundModes` key'i eklenmeli:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>voip</string>
    <string>fetch</string>
</array>
```

**Alternatif (Expo Config):** `app.config.ts` veya `app.json`'da:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio", "voip", "fetch"]
      }
    }
  }
}
```

**Test:**
1. Yayın başlat
2. Telefonu kilitle veya başka uygulamaya geç
3. Ses devam etmeli

---

### 2. Android Foreground Service

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Kritik  
**Etki:** Android'de arka planda ses kesilir

**Dosya:** `android/app/src/main/AndroidManifest.xml`

**Yapılacak:**

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

<service
    android:name=".AudioService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="false" />
```

**Not:** LiveKit React Native SDK bu servisi otomatik yönetebilir, ancak manifest izinleri gerekli.

---

### 3. VoIP Push + CallKeep Entegrasyonu

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Kritik  
**Etki:** Uygulama kapalıyken gelen çağrılar alınamaz

#### 3.1 iOS PushKit Entegrasyonu

**Gerekli Paketler:**
```bash
pnpm add react-native-voip-push-notification
```

**Yapılacaklar:**
- [ ] Apple Developer Console'da VoIP Push Certificate oluştur
- [ ] `AppDelegate.swift`'e PushKit delegate ekle
- [ ] Supabase'e VoIP device token kaydet

#### 3.2 CallKeep Entegrasyonu

**Gerekli Paketler:**
```bash
pnpm add react-native-callkeep
```

**Yapılacaklar:**
- [ ] iOS: `CXProvider` ve `CXCallController` setup
- [ ] Android: `ConnectionService` setup
- [ ] `useIncomingCall` hook oluştur

**Örnek Hook:**

```typescript
// apps/mobile/src/hooks/live/useIncomingCall.ts
import RNCallKeep from 'react-native-callkeep';

export function useIncomingCall() {
  useEffect(() => {
    RNCallKeep.setup({
      ios: {
        appName: 'İpelya',
        supportsVideo: true,
      },
      android: {
        alertTitle: 'Gelen Çağrı',
        alertDescription: 'Çağrıyı yanıtlamak için izin verin',
      },
    });

    RNCallKeep.addEventListener('answerCall', handleAnswerCall);
    RNCallKeep.addEventListener('endCall', handleEndCall);

    return () => {
      RNCallKeep.removeEventListener('answerCall');
      RNCallKeep.removeEventListener('endCall');
    };
  }, []);

  const displayIncomingCall = (callId: string, callerName: string) => {
    RNCallKeep.displayIncomingCall(callId, callerName, callerName, 'generic', true);
  };

  return { displayIncomingCall };
}
```

---

### 4. 1-1 Çağrı Edge Functions

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Kritik  
**Etki:** 1-1 çağrı sistemi çalışmaz

#### 4.1 `initiate-call` Function

**Dosya:** `supabase/functions/initiate-call/index.ts`

```typescript
// Yapılacaklar:
// 1. calls tablosuna kayıt ekle (status: 'ringing')
// 2. VoIP push notification gönder
// 3. LiveKit room oluştur
// 4. Token döndür

interface InitiateCallRequest {
  calleeId: string;
  callType: 'video' | 'audio';
}

interface InitiateCallResponse {
  callId: string;
  roomName: string;
  token: string;
}
```

#### 4.2 `answer-call` Function

**Dosya:** `supabase/functions/answer-call/index.ts`

```typescript
// Yapılacaklar:
// 1. calls tablosunda status: 'ringing' → 'accepted' güncelle
// 2. Callee için LiveKit token oluştur
// 3. Token döndür
```

#### 4.3 `reject-call` Function

**Dosya:** `supabase/functions/reject-call/index.ts`

```typescript
// Yapılacaklar:
// 1. calls tablosunda status: 'ringing' → 'rejected' güncelle
// 2. Caller'a bildirim gönder (realtime broadcast)
```

#### 4.4 `end-call` Function

**Dosya:** `supabase/functions/end-call/index.ts`

```typescript
// Yapılacaklar:
// 1. calls tablosunda status → 'ended' güncelle
// 2. ended_at ve duration hesapla
// 3. LiveKit room'u kapat (opsiyonel)
```

#### 4.5 `timeout-call` Cron Function

**Dosya:** `supabase/functions/timeout-call/index.ts`

```typescript
// Yapılacaklar:
// 1. 30 saniyeden fazla 'ringing' durumunda olan çağrıları bul
// 2. status → 'missed' güncelle
// 3. Missed call notification gönder
```

**Cron Schedule:** Her dakika çalışmalı

---

### 5. LiveKit Webhook Function

**Durum:** 🔴 YAPILMADI (Sadece docs'ta var)  
**Öncelik:** Kritik  
**Etki:** Room events (started, finished, participant joined/left) işlenmez

**Dosya:** `supabase/functions/livekit-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { WebhookReceiver } from 'livekit-server-sdk';

const receiver = new WebhookReceiver(
  Deno.env.get('LIVEKIT_API_KEY')!,
  Deno.env.get('LIVEKIT_API_SECRET')!
);

serve(async (req) => {
  const body = await req.text();
  const event = await receiver.receive(body, req.headers.get('Authorization'));

  switch (event.event) {
    case 'room_started':
      // Session status → live
      break;
    case 'room_finished':
      // Session status → ended, stats kaydet
      break;
    case 'participant_joined':
      // Peak viewers güncelle
      break;
    case 'participant_left':
      // Host left? → 30sn countdown başlat
      break;
  }

  return new Response('OK');
});
```

**LiveKit Dashboard'da Webhook URL:**
```
https://[PROJECT_REF].supabase.co/functions/v1/livekit-webhook
```

---

## 🟡 YÜKSEK ÖNCELİK

### 6. Eksik Veritabanı Tabloları

#### 6.1 `creator_bans` Tablosu

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek  
**Etki:** Creator bazlı kalıcı ban yapılamaz

**Migration:**

```sql
-- supabase/migrations/YYYYMMDD_create_creator_bans.sql

CREATE TABLE creator_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = kalıcı
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(creator_id, banned_user_id)
);

-- Indexes
CREATE INDEX idx_creator_bans_creator ON creator_bans(creator_id);
CREATE INDEX idx_creator_bans_banned_user ON creator_bans(banned_user_id);
CREATE INDEX idx_creator_bans_active ON creator_bans(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE creator_bans ENABLE ROW LEVEL SECURITY;

-- Creator kendi banlarını görebilir
CREATE POLICY "Creators can view their bans"
  ON creator_bans FOR SELECT
  USING (creator_id = (SELECT auth.uid()));

-- Creator ban ekleyebilir
CREATE POLICY "Creators can insert bans"
  ON creator_bans FOR INSERT
  WITH CHECK (creator_id = (SELECT auth.uid()));

-- Creator ban kaldırabilir
CREATE POLICY "Creators can update their bans"
  ON creator_bans FOR UPDATE
  USING (creator_id = (SELECT auth.uid()));
```

#### 6.2 `live_reports` Tablosu (Migration Kontrolü)

**Durum:** ⚠️ KONTROL EDİLMELİ  
**Öncelik:** Yüksek

```sql
-- Tablo var mı kontrol et, yoksa oluştur
CREATE TABLE IF NOT EXISTS live_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE live_reports ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar şikayet gönderebilir
CREATE POLICY "Users can insert reports"
  ON live_reports FOR INSERT
  WITH CHECK (reporter_id = (SELECT auth.uid()));

-- Kullanıcılar kendi şikayetlerini görebilir
CREATE POLICY "Users can view own reports"
  ON live_reports FOR SELECT
  USING (reporter_id = (SELECT auth.uid()));
```

---

### 7. Edge Functions - Eksikler

#### 7.1 `leave-live-session` Function

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek

**Dosya:** `supabase/functions/leave-live-session/index.ts`

```typescript
// Yapılacaklar:
// 1. live_participants tablosunda left_at güncelle
// 2. is_active = false yap
// 3. Viewer count güncelle
```

#### 7.2 `delete-live-message` Function

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek

**Dosya:** `supabase/functions/delete-live-message/index.ts`

```typescript
// Yapılacaklar:
// 1. Mesaj sahibi veya host kontrolü
// 2. is_deleted = true, deleted_by, deleted_at güncelle
// 3. Realtime broadcast ile diğer kullanıcılara bildir
```

---

### 8. Chat Moderasyon UI

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek

#### 8.1 Host: Delete Message

**Dosya:** `apps/mobile/app/(live)/broadcast/_components/LiveChat.tsx`

```typescript
// Yapılacaklar:
// 1. Mesaja long press → ActionSheet göster
// 2. "Mesajı Sil" seçeneği
// 3. delete-live-message API çağrısı
// 4. Optimistic UI update
```

#### 8.2 Mesaj Filtreleme

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Orta

```typescript
// Basit küfür filtresi
const BANNED_WORDS = ['küfür1', 'küfür2', ...];

function filterMessage(text: string): string {
  let filtered = text;
  BANNED_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}
```

---

## 🟢 ORTA ÖNCELİK

### 9. Scheduled Functions

#### 9.1 `check-quota-usage` Cron

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Orta

**Dosya:** `supabase/functions/check-quota-usage/index.ts`

```typescript
// Yapılacaklar:
// 1. LiveKit API'den kullanım istatistiklerini al
// 2. %75, %90 threshold kontrolü
// 3. Alert webhook'a bildirim gönder (Slack/Discord)
```

---

### 10. Production Checklist

#### 10.1 Rate Limiting Kontrolü

**Durum:** ⚠️ KONTROL EDİLMELİ  
**Öncelik:** Yüksek

`get-livekit-token` function'da rate limiting var mı kontrol et:

```typescript
// Beklenen: IP veya user bazlı rate limit
// Örnek: 10 request/dakika
```

#### 10.2 Webhook Signature Verification

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek

```typescript
// livekit-webhook function'da:
const isValid = await receiver.receive(body, authHeader);
// Bu zaten signature verification yapıyor
```

#### 10.3 Sentry Entegrasyonu

**Durum:** ⚠️ KONTROL EDİLMELİ  
**Öncelik:** Yüksek

Mobile'da Sentry kurulu mu? LiveKit hatalarını yakalıyor mu?

```typescript
// useLiveKitRoom.ts'de hata yakalama:
try {
  await room.connect(url, token);
} catch (error) {
  Sentry.captureException(error, {
    tags: { module: 'livekit', action: 'connect' }
  });
}
```

#### 10.4 Health Check Endpoint

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Orta

**Dosya:** `apps/web/app/api/health/livekit/route.ts`

```typescript
export async function GET() {
  try {
    // LiveKit API'ye ping at
    const response = await fetch(`${LIVEKIT_URL}/twirp/livekit.RoomService/ListRooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${generateToken()}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });

    if (response.ok) {
      return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
    }
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 503 });
  }
}
```

---

### 11. Test & QA

#### 11.1 Edge Function Unit Tests

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek

```bash
# Deno test
deno test supabase/functions/get-livekit-token/test.ts
```

#### 11.2 Mobile Hooks Tests

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek

```typescript
// __tests__/hooks/useLiveKitRoom.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useLiveKitRoom } from '@/hooks/live/useLiveKitRoom';

describe('useLiveKitRoom', () => {
  it('should connect to room', async () => {
    // Mock LiveKit SDK
    // Test connection
  });

  it('should handle disconnect reasons', () => {
    // Test PARTICIPANT_REMOVED
    // Test ROOM_DELETED
  });
});
```

#### 11.3 Load Test

**Durum:** 🔴 YAPILMADI  
**Öncelik:** Yüksek

```bash
# LiveKit CLI ile load test
lk load-test --room test-room --publishers 5 --subscribers 50 --duration 60s
```

---

## 🔵 DÜŞÜK ÖNCELİK (Gelecek Fazlar)

### 12. Gelişmiş Özellikler

| Görev                   | Durum | Açıklama                                |
| ----------------------- | ----- | --------------------------------------- |
| Kamera seçimi           | 🔴     | Birden fazla kamera varsa seçim         |
| Simulcast toggle        | 🔴     | Farklı kalite katmanları açma/kapama    |
| Text Streams            | 🔴     | LiveKit Data Channels ile chat          |
| Screen Sharing          | 🔴     | iOS ReplayKit + Android MediaProjection |
| Volume control          | 🔴     | `track.setVolume(0-1)`                  |
| Video quality selector  | 🔴     | İzleyici tarafı LOW/MEDIUM/HIGH         |
| Background voice cancel | 🔴     | LiveKit Cloud BVC model                 |
| Hi-Fi audio mode        | 🔴     | Müzik yayını için 510kbps stereo        |

### 13. Recording & VOD (Faz 7)

| Görev                      | Durum | Açıklama                |
| -------------------------- | ----- | ----------------------- |
| Egress SDK araştırma       | 🔴     | Room composite vs track |
| `start-recording` function | 🔴     | Manual trigger          |
| Auto-record config         | 🔴     | CreateRoom options      |
| Storage bucket (S3/R2)     | 🔴     | 30 gün retention        |
| VOD playback UI            | 🔴     | Video player            |
| "Recording" indicator      | 🔴     | Viewer bilgilendirme    |

### 14. Ops Dashboard (Faz 5)

| Görev                 | Durum | Açıklama                  |
| --------------------- | ----- | ------------------------- |
| Active sessions list  | 🔴     | Real-time + "Kill" button |
| Session detail page   | 🔴     | Participants, stats, chat |
| Quota usage widget    | 🔴     | % of monthly limit        |
| Alert configuration   | 🔴     | Slack/Discord webhook     |
| Pending reports queue | 🔴     | Review + action           |
| Ban management        | 🔴     | View, lift bans           |
| Daily/weekly charts   | 🔴     | Chart.js                  |
| Top creators          | 🔴     | Leaderboard               |
| Call logs             | 🔴     | Duration, outcome         |

### 15. Documentation

| Görev                  | Durum | Açıklama                |
| ---------------------- | ----- | ----------------------- |
| Runbook tamamla        | 🔴     | Operasyonel prosedürler |
| Ops training           | 🔴     | Dashboard kullanımı     |
| Incident response plan | 🔴     | Eskalasyon akışı        |

---

## 📊 ÖZET TABLO

| Kategori   | Tamamlanan | Kalan   | Toplam  |
| ---------- | ---------- | ------- | ------- |
| 🔴 Kritik   | 6          | 5       | 11      |
| 🟡 Yüksek   | 15         | 8       | 23      |
| 🟢 Orta     | 10         | 10      | 20      |
| 🔵 Düşük    | 5          | 25+     | 30+     |
| **TOPLAM** | **36**     | **48+** | **84+** |

---

## 🎯 ÖNCELİK SIRASI (Önerilen)

### Sprint 1 (Bu Hafta)
1. ✅ iOS Background Modes (`Info.plist`)
2. ✅ Android Foreground Service permissions
3. ✅ `livekit-webhook` function deploy
4. ✅ LiveKit Dashboard'da webhook URL config

### Sprint 2 (Gelecek Hafta)
1. `creator_bans` tablosu migration
2. `live_reports` tablosu kontrol/migration
3. `leave-live-session` function
4. `delete-live-message` function

### Sprint 3
1. 1-1 Çağrı functions (`initiate-call`, `answer-call`, `end-call`)
2. `timeout-call` cron function
3. VoIP Push + CallKeep araştırma

### Sprint 4
1. VoIP Push entegrasyonu (iOS + Android)
2. `useIncomingCall` hook
3. Background call handling

### Sprint 5+
1. Test & QA
2. Production checklist
3. Gelişmiş özellikler

---

## 📝 NOTLAR

1. **Expo Prebuild:** Background modes ve native kod değişiklikleri için `npx expo prebuild` gerekli
2. **EAS Build:** Development build oluşturmak için `eas build --profile development`
3. **LiveKit Free Plan:** 100 concurrent, 5000 min/ay limiti var - kota takibi önemli
4. **VoIP Push:** Apple Developer Program üyeliği gerekli (yıllık $99)

---

## 🔗 İLGİLİ DÖKÜMANLAR

- [TODO.md](./TODO.md) - Ana görev listesi
- [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md) - Edge function detayları
- [MOBILE-INTEGRATION.md](./MOBILE-INTEGRATION.md) - Mobil entegrasyon rehberi
- [ERROR_STATES.md](./ERROR_STATES.md) - Hata senaryoları
- [GUEST_COHOST.md](./GUEST_COHOST.md) - Konuk davet sistemi
- [mobile-verilen-gorev.md](./web-ops-yonetim/mobile-verilen-gorevler/mobile-verilen-gorev.md) - Mobile görev detayları
