# LiveKit React Integration - Web Ops Panel

> Web ops panelinde canlı yayınları izlemek için LiveKit React SDK ve Components kullanımı, livekit mcp server ile tüm dökümasyonlara eriş, gerekirse context7 mcp kullan. Tüm veritabanı ve edge functions yapımız ve işlemler için supabase mcp server kullan. Shadcn light dark mod'a uyumlu ve modüler olarak componentlerle geliştir, ana dosyaları çok uzun yazma, componentleri import ederek oluştur ve ana dosyaya ve oluşturacağın componentlere comment eklemeyi unutma, veritabanında oluşturdugun yapılara description ve comment eklemeyi unutma, bunlar türkçe olarak eklenmeli.

**Son Güncelleme:** 2025-12-05  
**Referans:** 
- https://docs.livekit.io/home/quickstarts/react/
- https://docs.livekit.io/reference/components/react/

---

## 📋 Genel Bakış

Web ops panelinde admin/moderatörler canlı yayınları **gerçek zamanlı izleyebilir**. Bunun için LiveKit React SDK ve Components kullanılacak.

### Nasıl Çalışır?

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEB OPS PANEL (React)                        │
│                                                                  │
│  1. Admin session'ı seçer                                        │
│  2. Backend'den "viewer" token alır (admin rolüyle)              │
│  3. LiveKitRoom ile odaya bağlanır                               │
│  4. VideoTrack/AudioTrack ile yayını izler                       │
│  5. Gerekirse kick/ban işlemi yapar                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LIVEKIT CLOUD                                │
│                                                                  │
│  Admin "silent viewer" olarak odaya katılır                      │
│  - canPublish: false (yayın yapmaz)                              │
│  - canSubscribe: true (izler)                                    │
│  - canPublishData: false                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Gerekli Paketler

```bash
# npm
npm install @livekit/components-react @livekit/components-styles livekit-client

# pnpm
pnpm add @livekit/components-react @livekit/components-styles livekit-client

# yarn
yarn add @livekit/components-react @livekit/components-styles livekit-client
```

---

## 🧩 Kullanılacak Components

### Temel Components

| Component           | Açıklama                   | Kullanım                    |
| ------------------- | -------------------------- | --------------------------- |
| `LiveKitRoom`       | Odaya bağlanma container'ı | Her izleme için ana wrapper |
| `VideoTrack`        | Video stream gösterme      | Host/speaker videosu        |
| `AudioTrack`        | Audio stream çalma         | Ses oynatma                 |
| `RoomAudioRenderer` | Oda geneli ses             | Tüm sesleri otomatik çal    |
| `ParticipantTile`   | Katılımcı görünümü         | Video + bilgi kartı         |
| `GridLayout`        | Çoklu katılımcı grid       | Sesli oda için              |

### Hooks

| Hook                    | Açıklama              | Kullanım                       |
| ----------------------- | --------------------- | ------------------------------ |
| `useParticipants`       | Tüm katılımcıları al  | Katılımcı listesi              |
| `useRemoteParticipants` | Uzak katılımcıları al | Host hariç diğerleri           |
| `useTracks`             | Track'leri al         | Video/audio trackler           |
| `useConnectionState`    | Bağlantı durumu       | Loading/connected/disconnected |
| `useRoomInfo`           | Oda bilgisi           | Katılımcı sayısı vs.           |

---

## 💻 Örnek Implementasyon

### 1. Session Preview Component

```tsx
// components/admin/SessionPreview.tsx
import { 
  LiveKitRoom, 
  VideoTrack, 
  RoomAudioRenderer,
  useParticipants,
  useTracks,
  useConnectionState
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import '@livekit/components-styles';

interface SessionPreviewProps {
  sessionId: string;
  livekitRoomName: string;
  onClose: () => void;
}

export function SessionPreview({ sessionId, livekitRoomName, onClose }: SessionPreviewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin token al
  useEffect(() => {
    async function fetchToken() {
      const response = await fetch('/api/admin/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomName: livekitRoomName,
          role: 'admin_viewer' // Silent viewer
        })
      });
      const data = await response.json();
      setToken(data.token);
      setLoading(false);
    }
    fetchToken();
  }, [livekitRoomName]);

  if (loading) {
    return <div>Token alınıyor...</div>;
  }

  if (!token) {
    return <div>Token alınamadı</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      audio={false}  // Admin mikrofon kullanmaz
      video={false}  // Admin kamera kullanmaz
      onDisconnected={(reason) => {
        console.log('Disconnected:', reason);
      }}
    >
      <SessionPreviewContent sessionId={sessionId} onClose={onClose} />
      <RoomAudioRenderer volume={0.5} /> {/* Sesi 50% ile çal */}
    </LiveKitRoom>
  );
}

function SessionPreviewContent({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  // Host'un video track'ini bul
  const hostVideoTrack = tracks.find(
    (track) => track.source === Track.Source.Camera && 
    track.participant.metadata?.includes('"role":"host"')
  );

  if (connectionState === ConnectionState.Connecting) {
    return <div>Bağlanılıyor...</div>;
  }

  return (
    <div className="session-preview">
      {/* Header */}
      <div className="preview-header">
        <h3>Canlı İzleme - Session #{sessionId.slice(0, 8)}</h3>
        <div className="preview-stats">
          <span>👥 {participants.length} katılımcı</span>
          <span className="live-indicator">🔴 CANLI</span>
        </div>
        <button onClick={onClose}>✕ Kapat</button>
      </div>

      {/* Video Görünümü */}
      <div className="preview-video">
        {hostVideoTrack ? (
          <VideoTrack 
            trackRef={hostVideoTrack} 
            style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
          />
        ) : (
          <div className="no-video">
            <span>🎙️ Sesli Yayın (Video yok)</span>
          </div>
        )}
      </div>

      {/* Katılımcı Listesi */}
      <div className="preview-participants">
        <h4>Katılımcılar</h4>
        <ul>
          {participants.map((participant) => {
            const meta = JSON.parse(participant.metadata || '{}');
            return (
              <li key={participant.identity}>
                <span className="participant-name">
                  {participant.name || 'Anonim'}
                </span>
                <span className="participant-role">
                  {meta.role || 'viewer'}
                </span>
                {participant.isSpeaking && <span className="speaking">🔊</span>}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Admin Aksiyonları */}
      <div className="preview-actions">
        <button className="btn-warn">⚠️ Uyar</button>
        <button className="btn-danger">🔴 Yayını Kapat</button>
      </div>
    </div>
  );
}
```

### 2. Audio Room Preview (Sesli Oda)

```tsx
// components/admin/AudioRoomPreview.tsx
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  useParticipants,
  useTracks,
  AudioTrack
} from '@livekit/components-react';
import { Track } from 'livekit-client';

interface AudioRoomPreviewProps {
  sessionId: string;
  livekitRoomName: string;
  token: string;
}

export function AudioRoomPreview({ sessionId, livekitRoomName, token }: AudioRoomPreviewProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      audio={false}
      video={false}
    >
      <AudioRoomContent sessionId={sessionId} />
      <RoomAudioRenderer volume={0.7} />
    </LiveKitRoom>
  );
}

function AudioRoomContent({ sessionId }: { sessionId: string }) {
  const participants = useParticipants();
  const audioTracks = useTracks([Track.Source.Microphone]);

  // Konuşanları ve dinleyicileri ayır
  const speakers = participants.filter(p => {
    const meta = JSON.parse(p.metadata || '{}');
    return ['host', 'speaker', 'co_host'].includes(meta.role);
  });

  const listeners = participants.filter(p => {
    const meta = JSON.parse(p.metadata || '{}');
    return ['viewer', 'listener'].includes(meta.role);
  });

  return (
    <div className="audio-room-preview">
      <div className="room-header">
        <h3>🎙️ Sesli Oda İzleme</h3>
        <div className="stats">
          <span>🎤 {speakers.length} konuşmacı</span>
          <span>👂 {listeners.length} dinleyici</span>
        </div>
      </div>

      {/* Konuşmacılar Grid */}
      <div className="speakers-grid">
        {speakers.map((speaker) => {
          const meta = JSON.parse(speaker.metadata || '{}');
          const audioTrack = audioTracks.find(
            t => t.participant.identity === speaker.identity
          );

          return (
            <div 
              key={speaker.identity} 
              className={`speaker-card ${speaker.isSpeaking ? 'speaking' : ''}`}
            >
              <div className="avatar">
                {meta.avatarUrl ? (
                  <img src={meta.avatarUrl} alt={speaker.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {(speaker.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                {speaker.isSpeaking && <div className="speaking-indicator" />}
              </div>
              <span className="name">{speaker.name || 'Anonim'}</span>
              <span className="role">{meta.role}</span>
              
              {/* Audio track render (görünmez ama çalar) */}
              {audioTrack && (
                <AudioTrack trackRef={audioTrack} style={{ display: 'none' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Dinleyici Listesi */}
      <div className="listeners-list">
        <h4>Dinleyiciler ({listeners.length})</h4>
        <div className="listeners-scroll">
          {listeners.slice(0, 50).map((listener) => (
            <div key={listener.identity} className="listener-chip">
              {listener.name || 'Anonim'}
            </div>
          ))}
          {listeners.length > 50 && (
            <span className="more">+{listeners.length - 50} daha</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3. Admin Token Endpoint

```typescript
// pages/api/admin/livekit-token.ts (Next.js)
// veya
// app/api/admin/livekit-token/route.ts (Next.js App Router)

import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Admin auth kontrolü
    const adminUser = await verifyAdminAuth(req);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName, role } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: 'roomName required' }, { status: 400 });
    }

    // Admin için özel token oluştur
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: `admin_${adminUser.id}`,
        name: `Admin: ${adminUser.full_name}`,
        metadata: JSON.stringify({
          role: 'admin_viewer',
          adminId: adminUser.id,
          isAdmin: true
        }),
        ttl: '1h' // Admin için 1 saat yeterli
      }
    );

    // Admin sadece izleyebilir, yayın yapamaz
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: false,        // ❌ Yayın yapamaz
      canSubscribe: true,       // ✅ İzleyebilir
      canPublishData: false,    // ❌ Data gönderemez
      hidden: true              // ✅ Katılımcı listesinde görünmez
    });

    const token = await at.toJwt();

    return NextResponse.json({ 
      token,
      wsUrl: process.env.LIVEKIT_URL 
    });

  } catch (error) {
    console.error('Admin token error:', error);
    return NextResponse.json(
      { error: 'Token generation failed' }, 
      { status: 500 }
    );
  }
}
```

---

## 🎯 Önemli Özellikler

### 1. Hidden Participant (Gizli Katılımcı)

Admin odaya katıldığında **diğer kullanıcılar tarafından görülmez**:

```typescript
at.addGrant({
  room: roomName,
  roomJoin: true,
  hidden: true  // ⭐ Katılımcı listesinde görünmez
});
```

### 2. Volume Control

Admin sesi kontrol edebilir:

```tsx
<RoomAudioRenderer volume={0.5} /> {/* 0.0 - 1.0 arası */}

// veya
<AudioTrack trackRef={track} volume={0.7} />
```

### 3. Connection Quality

Bağlantı kalitesini göster:

```tsx
import { useConnectionQualityIndicator } from '@livekit/components-react';

function ConnectionQuality({ participant }) {
  const { quality } = useConnectionQualityIndicator({ participant });
  
  return (
    <div className={`quality-${quality}`}>
      {quality === 'excellent' && '🟢'}
      {quality === 'good' && '🟡'}
      {quality === 'poor' && '🔴'}
    </div>
  );
}
```

### 4. Speaking Indicator

Kimin konuştuğunu göster:

```tsx
function SpeakingIndicator({ participant }) {
  return (
    <div className={participant.isSpeaking ? 'speaking' : ''}>
      {participant.isSpeaking && '🔊'}
    </div>
  );
}
```

---

## 🔧 Admin İşlemleri (İzleme Sırasında)

Admin izlerken şu işlemleri yapabilir:

```tsx
function AdminActions({ sessionId, participant }) {
  const handleKick = async () => {
    await fetch(`/api/admin/sessions/${sessionId}/kick`, {
      method: 'POST',
      body: JSON.stringify({ participantIdentity: participant.identity })
    });
  };

  const handleTerminate = async () => {
    await fetch(`/api/admin/sessions/${sessionId}/terminate`, {
      method: 'POST'
    });
    // LiveKitRoom otomatik disconnect olur
  };

  return (
    <div className="admin-actions">
      <button onClick={handleKick}>👢 Kick</button>
      <button onClick={handleTerminate}>🔴 Yayını Kapat</button>
    </div>
  );
}
```

---

## 📱 UI Layout Önerisi

```
┌─────────────────────────────────────────────────────────────────┐
│  Session Detail                                    [× Kapat]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────┐  ┌──────────────────┐ │
│  │                                     │  │ Katılımcılar (24)│ │
│  │                                     │  │                  │ │
│  │        [VIDEO PREVIEW]              │  │ 🎤 @host1        │ │
│  │                                     │  │ 🎤 @speaker1     │ │
│  │        veya                         │  │ 👂 @viewer1      │ │
│  │                                     │  │ 👂 @viewer2      │ │
│  │        🎙️ Sesli Yayın               │  │ 👂 @viewer3      │ │
│  │                                     │  │ ...              │ │
│  │                                     │  │                  │ │
│  └─────────────────────────────────────┘  └──────────────────┘ │
│                                                                 │
│  🔊 Ses: [━━━━━━━━━░░░░░░░] 60%                                 │
│                                                                 │
│  [⚠️ Uyar] [👢 Kick Seçili] [🔴 Yayını Kapat]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist

### Paketler
- [ ] `@livekit/components-react` kuruldu
- [ ] `@livekit/components-styles` kuruldu
- [ ] `livekit-client` kuruldu

### Backend
- [ ] `/api/admin/livekit-token` endpoint oluşturuldu
- [ ] Hidden participant grant eklendi
- [ ] Admin auth kontrolü yapıldı

### Frontend
- [ ] SessionPreview component oluşturuldu
- [ ] AudioRoomPreview component oluşturuldu
- [ ] Volume control eklendi
- [ ] Katılımcı listesi gösteriliyor
- [ ] Speaking indicator çalışıyor
- [ ] Admin aksiyonları (kick, terminate) çalışıyor


## Ek Bilgi
Eğer mobil projede ve mobil ekibin yapması gereken bir özellik geliştirmesi, bizim yaptıgımız bir sistemin mobilde karşılığının yapılması gibi senaryolarda yapılacak işlemi detaylı anlatan dökümasyon oluşturacaksın.
---

## 📚 Referanslar

- [LiveKit React Quickstart](https://docs.livekit.io/home/quickstarts/react/)
- [LiveKit React Components](https://github.com/livekit/components-js)
- [LiveKit Components Storybook](https://livekit.github.io/components-js/)
- [VideoGrant Options](https://docs.livekit.io/home/get-started/authentication/#video-grant)
