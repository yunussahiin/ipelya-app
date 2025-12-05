# LiveKit Edge Functions

> Supabase Edge Functions ile LiveKit token üretimi ve oturum yönetimi

## Genel Bakış

LiveKit entegrasyonu için aşağıdaki Edge Functions oluşturulacaktır:

| Function                  | Açıklama                       | Öncelik  |
| ------------------------- | ------------------------------ | -------- |
| `get-livekit-token`       | LiveKit erişim token'ı üretimi | 🔴 Kritik |
| `create-live-session`     | Yeni canlı oturum oluşturma    | 🔴 Kritik |
| `join-live-session`       | Oturuma katılma                | 🔴 Kritik |
| `end-live-session`        | Oturumu sonlandırma            | 🔴 Kritik |
| `initiate-call`           | 1-1 çağrı başlatma             | 🟡 Yüksek |
| `answer-call`             | Çağrıyı cevaplama              | 🟡 Yüksek |
| `end-call`                | Çağrıyı sonlandırma            | 🟡 Yüksek |
| `update-participant-role` | Katılımcı rolü güncelleme      | 🟢 Orta   |
| `send-live-message`       | Canlı mesaj gönderme           | 🟢 Orta   |
| `send-live-gift`          | Canlı hediye gönderme          | 🟢 Orta   |
| `livekit-webhook`         | LiveKit webhook handler        | 🟢 Orta   |

---

## 1. get-livekit-token

LiveKit odasına bağlanmak için JWT token üretir.

### Endpoint
```
POST /functions/v1/get-livekit-token
```

### Request Body
```typescript
interface GetTokenRequest {
  roomName: string;          // LiveKit oda adı
  sessionId?: string;        // live_sessions.id (canlı oturum için)
  callId?: string;           // calls.id (1-1 çağrı için)
  participantRole?: string;  // Katılımcı rolü (opsiyonel, varsayılan: viewer)
}
```

### Response
```typescript
interface GetTokenResponse {
  success: boolean;
  token?: string;
  wsUrl?: string;
  error?: string;
}
```

### Implementation

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken, VideoGrant } from "npm:livekit-server-sdk@2";

const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY")!;
const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET")!;
const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL")!;

serve(async (req) => {
  try {
    // Auth kontrolü
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // User bilgisi al
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const { roomName, sessionId, callId, participantRole } = await req.json();

    if (!roomName) {
      return new Response(JSON.stringify({ error: "roomName required" }), { status: 400 });
    }

    // Profil bilgisi al
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_creator, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    // Erişim kontrolü (session veya call bazlı)
    let canPublish = false;
    let canSubscribe = true;
    let role = participantRole || "viewer";

    if (sessionId) {
      // Canlı oturum için erişim kontrolü
      const { data: session } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
      }

      // Creator mı kontrol et
      if (session.creator_id === user.id) {
        role = "host";
        canPublish = true;
      } else {
        // Erişim türüne göre kontrol
        if (session.access_type === "subscribers_only") {
          const { data: subscription } = await supabase
            .from("creator_subscriptions")
            .select("id")
            .eq("subscriber_id", user.id)
            .eq("creator_id", session.creator_id)
            .eq("status", "active")
            .single();

          if (!subscription) {
            return new Response(JSON.stringify({ error: "Subscription required" }), { status: 403 });
          }
        } else if (session.access_type === "pay_per_view") {
          // PPV kontrolü - ödeme yapılmış mı?
          const { data: participant } = await supabase
            .from("live_participants")
            .select("paid_amount")
            .eq("session_id", sessionId)
            .eq("user_id", user.id)
            .single();

          if (!participant || participant.paid_amount < session.ppv_coin_price) {
            return new Response(JSON.stringify({ 
              error: "Payment required",
              required_coins: session.ppv_coin_price 
            }), { status: 402 });
          }
        }

        // Audio room ise speaker olabilir
        if (session.session_type === "audio_room" && role === "speaker") {
          canPublish = true;
        }
      }
    } else if (callId) {
      // 1-1 çağrı için - her iki taraf da publish yapabilir
      const { data: call } = await supabase
        .from("calls")
        .select("*")
        .eq("id", callId)
        .single();

      if (!call) {
        return new Response(JSON.stringify({ error: "Call not found" }), { status: 404 });
      }

      if (call.caller_id !== user.id && call.callee_id !== user.id) {
        return new Response(JSON.stringify({ error: "Not a participant" }), { status: 403 });
      }

      canPublish = true;
      role = "caller";
    }

    // LiveKit token oluştur
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: profile.display_name || profile.username || "User",
      metadata: JSON.stringify({
        profileId: profile.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        role: role,
        isCreator: profile.is_creator
      }),
      ttl: "2h", // 2 saat geçerli
    });

    const videoGrant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: canPublish,
      canSubscribe: canSubscribe,
      canPublishData: true, // Data channel için
    };

    // Role göre publish kaynakları sınırla
    if (canPublish) {
      if (role === "speaker") {
        // Sadece mikrofon
        videoGrant.canPublishSources = ["microphone"];
      } else if (role === "host" || role === "co_host" || role === "caller") {
        // Kamera ve mikrofon
        videoGrant.canPublishSources = ["camera", "microphone", "screen_share"];
      }
    }

    at.addGrant(videoGrant);

    const jwtToken = await at.toJwt();

    return new Response(
      JSON.stringify({
        success: true,
        token: jwtToken,
        wsUrl: LIVEKIT_URL,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

---

## 2. create-live-session

Yeni canlı yayın veya sesli oda oluşturur.

### Endpoint
```
POST /functions/v1/create-live-session
```

### Request Body
```typescript
interface CreateSessionRequest {
  title: string;
  description?: string;
  sessionType: "video_live" | "audio_room";
  accessType: "public" | "subscribers_only" | "pay_per_view";
  ppvCoinPrice?: number;        // PPV için coin fiyatı
  scheduledAt?: string;         // ISO timestamp (opsiyonel, hemen başlatmak için boş bırak)
  thumbnailUrl?: string;
  chatEnabled?: boolean;
  giftsEnabled?: boolean;
}
```

### Response
```typescript
interface CreateSessionResponse {
  success: boolean;
  session?: {
    id: string;
    livekitRoomName: string;
    token: string;
    wsUrl: string;
  };
  error?: string;
}
```

### Implementation

```typescript
serve(async (req) => {
  try {
    // Auth ve creator kontrolü
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    // Creator kontrolü
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_creator, username, display_name")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (!profile?.is_creator) {
      return new Response(JSON.stringify({ error: "Only creators can start sessions" }), { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      sessionType,
      accessType,
      ppvCoinPrice,
      scheduledAt,
      thumbnailUrl,
      chatEnabled = true,
      giftsEnabled = true,
    } = body;

    // Validasyon
    if (!title || !sessionType || !accessType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Benzersiz room adı oluştur
    const roomName = `ipelya_${sessionType}_${user.id}_${Date.now()}`;

    // Oturum kaydı oluştur
    const sessionData = {
      creator_id: user.id,
      creator_profile_id: profile.id,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      session_type: sessionType,
      access_type: accessType,
      ppv_coin_price: accessType === "pay_per_view" ? (ppvCoinPrice || 0) : 0,
      livekit_room_name: roomName,
      status: scheduledAt ? "scheduled" : "live",
      scheduled_at: scheduledAt || null,
      started_at: scheduledAt ? null : new Date().toISOString(),
      chat_enabled: chatEnabled,
      gifts_enabled: giftsEnabled,
    };

    const { data: session, error: insertError } = await supabase
      .from("live_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Host olarak katılımcı kaydı oluştur
    await supabase.from("live_participants").insert({
      session_id: session.id,
      user_id: user.id,
      profile_id: profile.id,
      role: "host",
      is_active: true,
    });

    // LiveKit token oluştur
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: profile.display_name || profile.username,
      ttl: "4h",
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources: ["camera", "microphone", "screen_share"],
    });

    const jwtToken = await at.toJwt();

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          id: session.id,
          livekitRoomName: roomName,
          token: jwtToken,
          wsUrl: LIVEKIT_URL,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

---

## 3. join-live-session

Mevcut canlı oturuma katılır.

### Endpoint
```
POST /functions/v1/join-live-session
```

### Request Body
```typescript
interface JoinSessionRequest {
  sessionId: string;
  requestedRole?: "viewer" | "listener" | "speaker"; // Varsayılan: viewer/listener
}
```

### Implementation Özeti

1. Auth kontrolü
2. Oturum varlık ve durum kontrolü (`status = 'live'`)
3. Ban kontrolü (`live_session_bans`)
4. Erişim türü kontrolü:
   - `public`: Herkes katılabilir
   - `subscribers_only`: `creator_subscriptions` kontrolü
   - `pay_per_view`: Ödeme kontrolü veya ödeme al
5. Katılımcı kaydı oluştur/güncelle
6. Token üret ve döndür

---

## 4. initiate-call

1-1 çağrı başlatır.

### Endpoint
```
POST /functions/v1/initiate-call
```

### Request Body
```typescript
interface InitiateCallRequest {
  calleeId: string;            // Aranan kişinin user_id'si
  callType: "audio_call" | "video_call";
}
```

### Response
```typescript
interface InitiateCallResponse {
  success: boolean;
  call?: {
    id: string;
    roomName: string;
    token: string;
    wsUrl: string;
  };
  error?: string;
}
```

### Implementation Özeti

1. Auth kontrolü
2. Callee varlık kontrolü
3. Aktif çağrı kontrolü (aynı kişiler arası)
4. Block kontrolü (`blocked_users` tablosu)
5. `calls` tablosuna kayıt (`status: 'initiated'`)
6. Callee'ye push notification gönder
7. Caller için token üret ve döndür

---

## 5. answer-call

Gelen çağrıyı cevaplar veya reddeder.

### Endpoint
```
POST /functions/v1/answer-call
```

### Request Body
```typescript
interface AnswerCallRequest {
  callId: string;
  accept: boolean;           // true: kabul, false: reddet
  rejectReason?: string;     // Reddetme nedeni (opsiyonel)
}
```

### Implementation Özeti

1. Auth kontrolü
2. Çağrı varlık ve callee kontrolü
3. Durum güncelleme:
   - `accept: true` → `status: 'accepted'`, `answered_at: now()`
   - `accept: false` → `status: 'rejected'`
4. Kabul edildiyse token üret ve döndür

---

## 6. livekit-webhook

LiveKit webhook event'lerini işler.

### Endpoint
```
POST /functions/v1/livekit-webhook
```

### Desteklenen Event'ler

| Event                | Açıklama          | İşlem                                     |
| -------------------- | ----------------- | ----------------------------------------- |
| `room_started`       | Oda oluşturuldu   | `livekit_room_sid` güncelle               |
| `room_finished`      | Oda kapandı       | Oturumu `ended` yap                       |
| `participant_joined` | Katılımcı katıldı | Katılımcı kaydı güncelle                  |
| `participant_left`   | Katılımcı ayrıldı | `left_at` güncelle, izleme süresi hesapla |
| `track_published`    | Track yayınlandı  | Log (opsiyonel)                           |

### Implementation

```typescript
import { WebhookReceiver } from "npm:livekit-server-sdk@2";

serve(async (req) => {
  try {
    const receiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    
    const body = await req.text();
    const authHeader = req.headers.get("Authorization") || "";
    
    // Webhook doğrulama
    const event = await receiver.receive(body, authHeader);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Webhook event:", event.event, event.room?.name);

    switch (event.event) {
      case "room_started":
        // LiveKit room SID güncelle
        await supabase
          .from("live_sessions")
          .update({ livekit_room_sid: event.room?.sid })
          .eq("livekit_room_name", event.room?.name);
        break;

      case "room_finished":
        // Oturumu sonlandır
        await supabase
          .from("live_sessions")
          .update({ 
            status: "ended",
            ended_at: new Date().toISOString()
          })
          .eq("livekit_room_name", event.room?.name);

        // Tüm katılımcıları pasif yap
        const { data: session } = await supabase
          .from("live_sessions")
          .select("id")
          .eq("livekit_room_name", event.room?.name)
          .single();

        if (session) {
          await supabase
            .from("live_participants")
            .update({ 
              is_active: false,
              left_at: new Date().toISOString()
            })
            .eq("session_id", session.id)
            .is("left_at", null);
        }
        break;

      case "participant_joined":
        // Katılımcı SID güncelle
        if (event.participant?.identity) {
          await supabase
            .from("live_participants")
            .update({ 
              livekit_participant_sid: event.participant.sid,
              livekit_identity: event.participant.identity,
              is_active: true
            })
            .eq("user_id", event.participant.identity)
            .eq("livekit_room_name", event.room?.name);
        }
        break;

      case "participant_left":
        // Ayrılma zamanı ve izleme süresini güncelle
        if (event.participant?.identity) {
          const { data: participant } = await supabase
            .from("live_participants")
            .select("joined_at")
            .eq("user_id", event.participant.identity)
            .single();

          if (participant) {
            const joinedAt = new Date(participant.joined_at);
            const watchTime = Math.floor((Date.now() - joinedAt.getTime()) / 1000);

            await supabase
              .from("live_participants")
              .update({ 
                is_active: false,
                left_at: new Date().toISOString(),
                total_watch_time_seconds: watchTime
              })
              .eq("user_id", event.participant.identity);
          }
        }
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
```

---

## Environment Variables

Edge Functions için gerekli env değişkenleri:

```env
# LiveKit Cloud
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_URL=wss://your-project.livekit.cloud

# Supabase (otomatik sağlanır)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Deploy Sırası

1. `get-livekit-token` - Token üretimi (ilk deploy)
2. `create-live-session` - Oturum oluşturma
3. `join-live-session` - Oturuma katılma
4. `end-live-session` - Oturum sonlandırma
5. `livekit-webhook` - Webhook handler (LiveKit Cloud'da URL ayarla)
6. `initiate-call` - Çağrı başlatma
7. `answer-call` - Çağrı cevaplama
8. `end-call` - Çağrı sonlandırma
9. Yardımcı fonksiyonlar (`send-live-message`, `send-live-gift`, vb.)

---

## Notlar

- Tüm Edge Functions `verify_jwt: false` olmalı (auth fonksiyon içinde yapılıyor)
- Token TTL: 2-4 saat (reconnection için yeterli süre)
- Webhook URL: LiveKit Cloud Dashboard → Project Settings → Webhooks
