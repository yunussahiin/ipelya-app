# LiveKit Test Stratejisi

> Test ortamları, test senaryoları ve QA prosedürleri - SADECE DÖKÜMASYON, BENDEN HABERSİZ UYGULAMA.

## 1. Ortam Stratejisi

### LiveKit Ortamları

| Ortam           | URL                               | Kullanım         |
| --------------- | --------------------------------- | ---------------- |
| **Development** | `wss://dev-xxx.livekit.cloud`     | Local geliştirme |
| **Staging**     | `wss://staging-xxx.livekit.cloud` | QA testleri      |
| **Production**  | `wss://xxx.livekit.cloud`         | Canlı ortam      |

> ⚠️ **Önemli:** LiveKit Cloud'da ayrı project oluşturarak ortamları izole et. Aynı project'i paylaşma!

### Supabase Ortamları

| Ortam              | Kullanım                      |
| ------------------ | ----------------------------- |
| **Local**          | `supabase start` ile local DB |
| **Staging Branch** | Supabase branching özelliği   |
| **Production**     | Ana veritabanı                |

### Environment Variables

```env
# .env.local (Development)
EXPO_PUBLIC_LIVEKIT_URL=wss://dev-xxx.livekit.cloud
SUPABASE_URL=http://localhost:54321

# .env.staging
EXPO_PUBLIC_LIVEKIT_URL=wss://staging-xxx.livekit.cloud
SUPABASE_URL=https://xxx-staging.supabase.co

# .env.production
EXPO_PUBLIC_LIVEKIT_URL=wss://xxx.livekit.cloud
SUPABASE_URL=https://xxx.supabase.co
```

---

## 2. Test Türleri

### 2.1 Unit Tests (Edge Functions)

```typescript
// supabase/functions/get-livekit-token/test.ts
import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.test('get-livekit-token: returns token for valid session', async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Mock user token
  const { data: { user } } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'test123',
    email_confirm: true,
  });

  // Create test session
  const { data: session } = await supabase.from('live_sessions').insert({
    creator_id: user.id,
    session_type: 'video_live',
    access_type: 'public',
    livekit_room_name: `test_${Date.now()}`,
    status: 'live',
  }).select().single();

  // Call function
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-livekit-token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: session.id }),
    }
  );

  const data = await response.json();
  assertEquals(response.status, 200);
  assertExists(data.token);
  assertExists(data.wsUrl);

  // Cleanup
  await supabase.from('live_sessions').delete().eq('id', session.id);
  await supabase.auth.admin.deleteUser(user.id);
});

Deno.test('get-livekit-token: rejects unauthorized user', async () => {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-livekit-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test' }),
    }
  );

  assertEquals(response.status, 401);
});
```

### Çalıştırma

```bash
# Local Supabase ile
supabase functions serve get-livekit-token --env-file .env.local

# Test çalıştır
deno test --allow-net --allow-env supabase/functions/get-livekit-token/test.ts
```

---

### 2.2 Integration Tests (Mobile)

```typescript
// __tests__/live/session.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLiveSession } from '@/hooks/useLiveSession';

// Mock LiveKit
jest.mock('livekit-client', () => ({
  Room: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    on: jest.fn(),
    localParticipant: { sid: 'local_123' },
    remoteParticipants: new Map(),
  })),
  RoomEvent: {
    Connected: 'connected',
    Disconnected: 'disconnected',
  },
  ConnectionState: {
    Connected: 'connected',
    Disconnected: 'disconnected',
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: {
          success: true,
          token: 'mock_token',
          wsUrl: 'wss://test.livekit.cloud',
        },
      }),
    },
  },
}));

describe('useLiveSession', () => {
  it('creates session and connects to room', async () => {
    const { result } = renderHook(() => useLiveSession());

    await act(async () => {
      await result.current.createSession({
        title: 'Test Session',
        sessionType: 'video_live',
        accessType: 'public',
      });
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.session).toBeDefined();
    });
  });
});
```

---

### 2.3 E2E Tests

```typescript
// e2e/live-session.spec.ts (Detox veya Maestro)

// Maestro YAML örneği
// e2e/flows/create-live-session.yaml
appId: com.ipelya.app
---
- launchApp
- tapOn: "Canlı Yayın"
- tapOn: "Yayın Başlat"
- inputText:
    id: "session-title"
    text: "Test Yayını"
- tapOn: "Başlat"
- assertVisible: "Yayın başladı"
- waitForAnimationToEnd
- assertVisible:
    id: "viewer-count"
    text: "0 izleyici"
```

---

## 3. Test Senaryoları

### 3.1 Canlı Yayın Senaryoları

| #   | Senaryo                                                | Beklenen Sonuç                       |
| --- | ------------------------------------------------------ | ------------------------------------ |
| 1   | Creator yayın başlatır                                 | Session oluşur, LiveKit odası açılır |
| 2   | Viewer yayına katılır                                  | Token alır, izlemeye başlar          |
| 3   | 10 viewer aynı anda katılır                            | Tümü başarılı bağlanır               |
| 4   | Creator yayını bitirir                                 | Tüm viewer'lar disconnect olur       |
| 5   | Creator internet kesilir                               | 30 sn sonra session paused           |
| 6   | Subscriber-only yayına abone olmayan katılmaya çalışır | 403 hatası                           |

### 3.2 Çağrı Senaryoları

| #   | Senaryo                     | Beklenen Sonuç                  |
| --- | --------------------------- | ------------------------------- |
| 1   | A, B'yi arar                | B'ye push notification gider    |
| 2   | B cevaplar                  | İkisi de odaya bağlanır         |
| 3   | B reddeder                  | A'ya "reddedildi" bilgisi       |
| 4   | 30 sn cevapsız              | Cevapsız çağrı kaydı            |
| 5   | A, meşgul B'yi arar         | "Meşgul" yanıtı                 |
| 6   | Görüşme sırasında A kapanır | B'ye bildirilir, çağrı sonlanır |

### 3.3 Moderasyon Senaryoları

| #   | Senaryo                     | Beklenen Sonuç                 |
| --- | --------------------------- | ------------------------------ |
| 1   | Host, viewer'ı kickler      | Viewer odadan çıkar            |
| 2   | Host, viewer'ı banlar       | Viewer tekrar katılamaz        |
| 3   | Moderator, mesaj siler      | Mesaj tüm client'larda silinir |
| 4   | Banlı kullanıcı token ister | 403 hatası                     |

---

## 4. Load Testing

### Araçlar

| Araç            | Kullanım                   |
| --------------- | -------------------------- |
| **k6**          | API load test              |
| **Artillery**   | WebSocket load test        |
| **livekit-cli** | LiveKit specific load test |

### Token Generation Load Test

```javascript
// k6-token-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up
    { duration: '1m', target: 100 },  // Stay at 100
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.post(
    `${__ENV.SUPABASE_URL}/functions/v1/get-livekit-token`,
    JSON.stringify({ sessionId: __ENV.TEST_SESSION_ID }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.TEST_USER_TOKEN}`,
      },
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### LiveKit Load Test

```bash
# 50 simulated participants
lk load-test \
  --url wss://xxx.livekit.cloud \
  --api-key <KEY> \
  --api-secret <SECRET> \
  --room test-load \
  --publishers 5 \
  --subscribers 45 \
  --duration 5m
```

---

## 5. Network Condition Tests

### iOS Simulator Network Link Conditioner

1. Xcode > Open Developer Tool > Accessibility Inspector
2. Settings > Developer > Network Link Conditioner
3. Profiller:
   - **3G**: 780 Kbps, 100ms latency
   - **Edge**: 240 Kbps, 400ms latency
   - **100% Loss**: Tam kesinti

### Android Emulator

```bash
# Yavaş ağ simülasyonu
adb shell settings put global wifi_speed_mode 1  # 2G
adb shell settings put global wifi_speed_mode 3  # 3G

# Network latency
emulator -netdelay gprs
```

### Test Senaryoları

| Koşul     | Test Edilecek               |
| --------- | --------------------------- |
| 3G        | Video kalitesi düşüyor mu?  |
| Edge      | Sadece audio'ya geçiyor mu? |
| 100% Loss | Reconnect deniyor mu?       |
| WiFi → 4G | Bağlantı korunuyor mu?      |

---

## 6. Mock & Stub

### LiveKit Mock Provider

```typescript
// __mocks__/livekit-client.ts
export class Room {
  localParticipant = {
    sid: 'local_test',
    identity: 'test_user',
    setCameraEnabled: jest.fn(),
    setMicrophoneEnabled: jest.fn(),
  };
  
  remoteParticipants = new Map();
  state = 'connected';

  connect = jest.fn().mockResolvedValue(this);
  disconnect = jest.fn();
  on = jest.fn();
  off = jest.fn();
}

export const RoomEvent = {
  Connected: 'connected',
  Disconnected: 'disconnected',
  ParticipantConnected: 'participantConnected',
  ParticipantDisconnected: 'participantDisconnected',
};

export const ConnectionState = {
  Connected: 'connected',
  Connecting: 'connecting',
  Disconnected: 'disconnected',
  Reconnecting: 'reconnecting',
};
```

### Edge Function Mock (Local Dev)

```typescript
// supabase/functions/get-livekit-token/index.ts
// DEV modunda mock token döndür
if (Deno.env.get('ENVIRONMENT') === 'development') {
  return new Response(JSON.stringify({
    success: true,
    token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MOCK_TOKEN',
    wsUrl: 'wss://dev.livekit.cloud',
  }));
}
```

---

## 7. CI/CD Pipeline

```yaml
# .github/workflows/test-livekit.yml
name: LiveKit Tests

on:
  pull_request:
    paths:
      - 'supabase/functions/**'
      - 'apps/mobile/src/hooks/useLive*.ts'
      - 'apps/mobile/src/components/live/**'

jobs:
  edge-function-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Start Supabase
        run: supabase start
      
      - name: Run Edge Function Tests
        run: |
          deno test --allow-net --allow-env \
            supabase/functions/*/test.ts

  mobile-unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: cd apps/mobile && npm ci
      
      - name: Run tests
        run: cd apps/mobile && npm test -- --coverage
```

---

## 8. QA Checklist

### Release Öncesi

- [ ] Tüm unit testler geçiyor
- [ ] E2E testler staging'de geçiyor
- [ ] Load test yapıldı (min 50 concurrent)
- [ ] 3G network testi yapıldı
- [ ] Reconnection senaryosu test edildi
- [ ] iOS + Android manuel test edildi
- [ ] Background audio test edildi
- [ ] Push notification test edildi (call)
