# LiveKit Mobil Entegrasyon Rehberi

> React Native Expo uygulamasında LiveKit SDK kullanımı

## Kurulum

### 1. Paket Kurulumu

```bash
cd apps/mobile
npx expo install @livekit/react-native @livekit/react-native-expo-plugin @livekit/react-native-webrtc @config-plugins/react-native-webrtc livekit-client
```

### 2. Expo Plugin Yapılandırması

`app.json` veya `app.config.ts` dosyasına ekle:

```json
{
  "expo": {
    "plugins": [
      "@livekit/react-native-expo-plugin",
      "@config-plugins/react-native-webrtc"
    ]
  }
}
```

### 3. Global Kayıt

`apps/mobile/app/_layout.tsx` içinde:

```typescript
import { registerGlobals } from '@livekit/react-native';

// App başlamadan önce çağır
registerGlobals();
```

> ⚠️ **Önemli**: LiveKit SDK, Expo Go ile uyumlu DEĞİLDİR. Development build gereklidir.

---

## Temel Hooks ve Components

### useLiveKitRoom Hook

```typescript
// hooks/useLiveKitRoom.ts
import { useState, useCallback, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  LocalParticipant,
  RemoteParticipant,
  Track,
} from 'livekit-client';
import { supabase } from '@/lib/supabase';

interface UseLiveKitRoomOptions {
  sessionId?: string;
  callId?: string;
  role?: string;
}

export function useLiveKitRoom(options: UseLiveKitRoomOptions = {}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (roomName: string) => {
    try {
      setError(null);

      // Token al
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        'get-livekit-token',
        {
          body: {
            roomName,
            sessionId: options.sessionId,
            callId: options.callId,
            participantRole: options.role,
          },
        }
      );

      if (tokenError || !tokenData?.token) {
        throw new Error(tokenData?.error || 'Token alınamadı');
      }

      // Room oluştur ve bağlan
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720, frameRate: 30 },
        },
      });

      // Event listeners
      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        setRemoteParticipants((prev) => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteParticipants((prev) =>
          prev.filter((p) => p.sid !== participant.sid)
        );
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.Disconnected);
      });

      // Bağlan
      await newRoom.connect(tokenData.wsUrl, tokenData.token);

      setRoom(newRoom);
      setLocalParticipant(newRoom.localParticipant);
      setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));

      return newRoom;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bağlantı hatası';
      setError(message);
      throw err;
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setLocalParticipant(null);
      setRemoteParticipants([]);
    }
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    room,
    connectionState,
    localParticipant,
    remoteParticipants,
    error,
    connect,
    disconnect,
    isConnected: connectionState === ConnectionState.Connected,
    isConnecting: connectionState === ConnectionState.Connecting,
  };
}
```

### useLiveSession Hook

```typescript
// hooks/useLiveSession.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLiveKitRoom } from './useLiveKitRoom';

interface CreateSessionParams {
  title: string;
  description?: string;
  sessionType: 'video_live' | 'audio_room';
  accessType: 'public' | 'subscribers_only' | 'pay_per_view';
  ppvCoinPrice?: number;
}

export function useLiveSession() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveKit = useLiveKitRoom({ sessionId: session?.id });

  // Creator: Oturum oluştur
  const createSession = useCallback(async (params: CreateSessionParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'create-live-session',
        { body: params }
      );

      if (fnError || !data?.success) {
        throw new Error(data?.error || 'Oturum oluşturulamadı');
      }

      setSession(data.session);

      // LiveKit'e bağlan
      await liveKit.connect(data.session.livekitRoomName);

      return data.session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hata oluştu';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [liveKit]);

  // Viewer: Oturuma katıl
  const joinSession = useCallback(async (sessionId: string, role?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'join-live-session',
        { body: { sessionId, requestedRole: role } }
      );

      if (fnError || !data?.success) {
        throw new Error(data?.error || 'Oturuma katılınamadı');
      }

      setSession({ id: sessionId, ...data });

      // LiveKit'e bağlan
      await liveKit.connect(data.livekitRoomName);

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hata oluştu';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [liveKit]);

  // Oturumdan ayrıl
  const leaveSession = useCallback(async () => {
    liveKit.disconnect();
    setSession(null);
  }, [liveKit]);

  // Creator: Oturumu sonlandır
  const endSession = useCallback(async () => {
    if (!session?.id) return;

    try {
      await supabase.functions.invoke('end-live-session', {
        body: { sessionId: session.id },
      });
    } finally {
      liveKit.disconnect();
      setSession(null);
    }
  }, [session, liveKit]);

  return {
    session,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    endSession,
    ...liveKit,
  };
}
```

### useCall Hook

```typescript
// hooks/useCall.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLiveKitRoom } from './useLiveKitRoom';

interface UseCallOptions {
  onIncomingCall?: (call: any) => void;
}

export function useCall(options: UseCallOptions = {}) {
  const [call, setCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveKit = useLiveKitRoom({ callId: call?.id });

  // Çağrı başlat
  const initiateCall = useCallback(async (
    calleeId: string,
    callType: 'audio_call' | 'video_call'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'initiate-call',
        { body: { calleeId, callType } }
      );

      if (fnError || !data?.success) {
        throw new Error(data?.error || 'Çağrı başlatılamadı');
      }

      setCall(data.call);

      // LiveKit'e bağlan
      await liveKit.connect(data.call.roomName);

      return data.call;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hata oluştu';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [liveKit]);

  // Çağrıyı cevapla
  const answerCall = useCallback(async (callId: string, accept: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'answer-call',
        { body: { callId, accept } }
      );

      if (fnError || !data?.success) {
        throw new Error(data?.error || 'Çağrı cevaplanamadı');
      }

      if (accept && data.token) {
        setCall({ id: callId, ...data });
        await liveKit.connect(data.roomName);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hata oluştu';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [liveKit]);

  // Çağrıyı sonlandır
  const endCall = useCallback(async () => {
    if (!call?.id) return;

    try {
      await supabase.functions.invoke('end-call', {
        body: { callId: call.id },
      });
    } finally {
      liveKit.disconnect();
      setCall(null);
    }
  }, [call, liveKit]);

  // Gelen çağrıları dinle (Realtime)
  useEffect(() => {
    if (!options.onIncomingCall) return;

    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `callee_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`,
        },
        (payload) => {
          if (payload.new.status === 'initiated') {
            options.onIncomingCall?.(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.onIncomingCall]);

  return {
    call,
    isLoading,
    error,
    initiateCall,
    answerCall,
    endCall,
    ...liveKit,
  };
}
```

---

## UI Components

### LiveVideoView Component

```typescript
// components/live/LiveVideoView.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoTrack, isTrackReference } from '@livekit/react-native';
import { Track, Participant } from 'livekit-client';
import { useTracks } from '@livekit/react-native';

interface LiveVideoViewProps {
  participant: Participant;
  style?: any;
}

export function LiveVideoView({ participant, style }: LiveVideoViewProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, participant },
    ],
    { onlySubscribed: true }
  );

  const videoTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && isTrackReference(t)
  );

  if (!videoTrack || !isTrackReference(videoTrack)) {
    return (
      <View style={[styles.placeholder, style]}>
        {/* Avatar placeholder */}
      </View>
    );
  }

  return (
    <VideoTrack
      trackRef={videoTrack}
      style={[styles.video, style]}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### LiveControls Component

```typescript
// components/live/LiveControls.tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room, Track } from 'livekit-client';
import { useTheme } from '@/theme/ThemeProvider';

interface LiveControlsProps {
  room: Room;
  onEndSession?: () => void;
  showVideo?: boolean;
}

export function LiveControls({ room, onEndSession, showVideo = true }: LiveControlsProps) {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);

  const toggleMute = async () => {
    const micTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (micTrack) {
      if (isMuted) {
        await micTrack.unmute();
      } else {
        await micTrack.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (camTrack) {
      if (isVideoOff) {
        await camTrack.unmute();
      } else {
        await camTrack.mute();
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, isMuted && styles.buttonActive]}
        onPress={toggleMute}
      >
        <Ionicons
          name={isMuted ? 'mic-off' : 'mic'}
          size={24}
          color={isMuted ? '#fff' : colors.textPrimary}
        />
      </Pressable>

      {showVideo && (
        <Pressable
          style={[styles.button, isVideoOff && styles.buttonActive]}
          onPress={toggleVideo}
        >
          <Ionicons
            name={isVideoOff ? 'videocam-off' : 'videocam'}
            size={24}
            color={isVideoOff ? '#fff' : colors.textPrimary}
          />
        </Pressable>
      )}

      {onEndSession && (
        <Pressable
          style={[styles.button, styles.endButton]}
          onPress={onEndSession}
        >
          <Ionicons name="call" size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#666',
  },
  endButton: {
    backgroundColor: '#ff3b30',
    transform: [{ rotate: '135deg' }],
  },
});
```

---

## Ekran Örnekleri

### Creator Canlı Yayın Ekranı

```typescript
// app/(tabs)/live/broadcast.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { AudioSession, LiveKitRoom } from '@livekit/react-native';
import { useLiveSession } from '@/hooks/useLiveSession';
import { LiveVideoView } from '@/components/live/LiveVideoView';
import { LiveControls } from '@/components/live/LiveControls';
import { useTheme } from '@/theme/ThemeProvider';

export default function BroadcastScreen() {
  const { colors } = useTheme();
  const {
    session,
    room,
    localParticipant,
    remoteParticipants,
    isConnected,
    createSession,
    endSession,
    error,
  } = useLiveSession();

  useEffect(() => {
    // Audio session başlat
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  const handleStartBroadcast = async () => {
    await createSession({
      title: 'Canlı Yayın',
      sessionType: 'video_live',
      accessType: 'public',
    });
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.warning }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={styles.startButton} onPress={handleStartBroadcast}>
          <Text style={styles.startButtonText}>Yayını Başlat</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.videoContainer}>
        {localParticipant && (
          <LiveVideoView participant={localParticipant} style={styles.video} />
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.stats, { color: colors.textPrimary }]}>
          İzleyici: {remoteParticipants.length}
        </Text>
      </View>

      {room && (
        <LiveControls
          room={room}
          onEndSession={endSession}
          showVideo={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stats: {
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    padding: 16,
  },
});
```

---

## Best Practices

### 1. Audio Session Yönetimi

```typescript
useEffect(() => {
  AudioSession.startAudioSession();
  return () => {
    AudioSession.stopAudioSession();
  };
}, []);
```

### 2. Bağlantı Durumu İzleme

```typescript
room.on(RoomEvent.ConnectionStateChanged, (state) => {
  switch (state) {
    case ConnectionState.Connecting:
      // Loading göster
      break;
    case ConnectionState.Connected:
      // Bağlandı
      break;
    case ConnectionState.Reconnecting:
      // Yeniden bağlanıyor toast
      break;
    case ConnectionState.Disconnected:
      // Bağlantı koptu
      break;
  }
});
```

### 3. Track Yönetimi

```typescript
// Kamera aç/kapat
await room.localParticipant.setCameraEnabled(true);
await room.localParticipant.setCameraEnabled(false);

// Mikrofon aç/kapat
await room.localParticipant.setMicrophoneEnabled(true);
await room.localParticipant.setMicrophoneEnabled(false);

// Kamera değiştir (ön/arka)
await room.localParticipant.switchCamera();
```

### 4. Hata Yönetimi

```typescript
room.on(RoomEvent.MediaDevicesError, (error) => {
  console.error('Media device error:', error);
  showToast({
    type: 'error',
    message: 'Kamera veya mikrofon hatası',
  });
});

room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
  if (quality === ConnectionQuality.Poor) {
    showToast({
      type: 'warning',
      message: 'Bağlantı kalitesi düşük',
    });
  }
});
```

---

## Dosya Yapısı

```
apps/mobile/src/
├── hooks/
│   ├── useLiveKitRoom.ts       # Temel LiveKit hook
│   ├── useLiveSession.ts       # Canlı oturum yönetimi
│   └── useCall.ts              # 1-1 çağrı yönetimi
├── components/
│   └── live/
│       ├── LiveVideoView.tsx   # Video görüntüleme
│       ├── LiveControls.tsx    # Kontrol butonları
│       ├── ParticipantList.tsx # Katılımcı listesi
│       ├── LiveChat.tsx        # Canlı chat
│       └── GiftOverlay.tsx     # Hediye animasyonları
└── app/
    └── (tabs)/
        └── live/
            ├── index.tsx       # Canlı yayın listesi
            ├── broadcast.tsx   # Yayın başlat (creator)
            ├── watch/[id].tsx  # Yayın izle (viewer)
            └── call/[id].tsx   # 1-1 çağrı ekranı
```
