# LiveKit Mobile UX States

> Kullanıcı deneyimi state'leri, UI feedback ve edge-case davranışları

## 1. Canlı Yayın - Viewer States

### State Diagram

```
┌─────────────┐
│   IDLE      │ (Yayın listesi)
└──────┬──────┘
       │ Yayına tıkla
       ▼
┌─────────────┐
│  LOADING    │ "Yükleniyor..."
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐ ┌─────────┐
│ACCESS│ │ TOKEN   │
│DENIED│ │ ERROR   │
└──────┘ └─────────┘
   │
   ▼ (başarılı)
┌─────────────┐
│ CONNECTING  │ "Bağlanılıyor..."
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  WATCHING   │ Normal izleme
└──────┬──────┘
       │
   ┌───┴───────┬──────────┐
   │           │          │
   ▼           ▼          ▼
┌──────┐ ┌──────────┐ ┌─────────┐
│ POOR │ │RECONNECT │ │  ENDED  │
│SIGNAL│ │ING       │ │         │
└──────┘ └──────────┘ └─────────┘
```

### UI Feedback Tablosu

| State                 | UI                                      | Aksiyon                  |
| --------------------- | --------------------------------------- | ------------------------ |
| **LOADING**           | Full screen spinner + "Yükleniyor..."   | -                        |
| **ACCESS_DENIED**     | Modal: "Bu yayın sadece abonelere özel" | "Abone Ol" butonu        |
| **PAYMENT_REQUIRED**  | Modal: "X coin gerekli"                 | "Satın Al" butonu        |
| **TOKEN_ERROR**       | Toast: "Bir hata oluştu"                | "Tekrar Dene" butonu     |
| **CONNECTING**        | Video alanında spinner                  | -                        |
| **WATCHING**          | Normal video player                     | Controls görünür         |
| **POOR_SIGNAL**       | Banner: "Bağlantı kalitesi düşük"       | "Düşük Kalite" seçeneği  |
| **RECONNECTING**      | Overlay: "Yeniden bağlanılıyor..."      | 15 sn sonra "Çık" butonu |
| **HOST_DISCONNECTED** | Overlay: "Yayıncı bağlantısı koptu"     | Bekle veya çık           |
| **ENDED**             | Modal: "Yayın sona erdi"                | "Kapat" veya "Replay"    |

### Code Implementation

```typescript
// components/live/ViewerOverlay.tsx
interface ViewerOverlayProps {
  state: ViewerState;
  onRetry?: () => void;
  onLeave?: () => void;
  onSubscribe?: () => void;
}

export function ViewerOverlay({ state, onRetry, onLeave, onSubscribe }: ViewerOverlayProps) {
  const { colors } = useTheme();

  switch (state) {
    case 'LOADING':
      return (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.text}>Yükleniyor...</Text>
        </View>
      );

    case 'CONNECTING':
      return (
        <View style={styles.overlay}>
          <LottieAnimation source={connectingAnimation} />
          <Text style={styles.text}>Bağlanılıyor...</Text>
        </View>
      );

    case 'RECONNECTING':
      return (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <Ionicons name="wifi-outline" size={48} color={colors.warning} />
          <Text style={styles.text}>Yeniden bağlanılıyor...</Text>
          <Text style={styles.subtext}>Lütfen bekleyin</Text>
          <Pressable style={styles.button} onPress={onLeave}>
            <Text>Çık</Text>
          </Pressable>
        </View>
      );

    case 'HOST_DISCONNECTED':
      return (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <Ionicons name="person-outline" size={48} color={colors.warning} />
          <Text style={styles.text}>Yayıncı bağlantısı koptu</Text>
          <Text style={styles.subtext}>Yeniden bağlanması bekleniyor...</Text>
          <CountdownTimer seconds={30} onEnd={onLeave} />
        </View>
      );

    case 'ENDED':
      return (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.text}>Yayın sona erdi</Text>
          <Pressable style={styles.button} onPress={onLeave}>
            <Text>Kapat</Text>
          </Pressable>
        </View>
      );

    // ... diğer state'ler
  }
}
```

---

## 2. Çağrı (Call) States

### Giden Çağrı (Caller)

```
┌─────────────┐
│ INITIATING  │ "Aranıyor..."
└──────┬──────┘
       │
   ┌───┴───────┬──────────┬──────────┐
   │           │          │          │
   ▼           ▼          ▼          ▼
┌──────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐
│REJECT│ │ ACCEPTED │ │ TIMEOUT │ │  BUSY   │
│ED    │ │          │ │(MISSED) │ │         │
└──────┘ └────┬─────┘ └─────────┘ └─────────┘
              │
              ▼
        ┌──────────┐
        │  IN_CALL │
        └──────────┘
```

### Gelen Çağrı (Callee)

```
App Foreground:               App Background:
┌─────────────┐               ┌─────────────┐
│  INCOMING   │               │ PUSH NOTIF  │
│  (In-app)   │               │ (System)    │
└──────┬──────┘               └──────┬──────┘
       │                             │
   ┌───┴───┐                     ┌───┴───┐
   │       │                     │       │
   ▼       ▼                     ▼       ▼
┌──────┐ ┌──────┐            ┌──────┐ ┌──────┐
│ACCEPT│ │REJECT│            │ACCEPT│ │REJECT│
└──────┘ └──────┘            └──────┘ └──────┘
```

### UI Components

```typescript
// Gelen çağrı ekranı (Full screen)
function IncomingCallScreen({ caller, callType, onAccept, onReject }) {
  return (
    <View style={styles.container}>
      {/* Caller bilgisi */}
      <Image source={{ uri: caller.avatarUrl }} style={styles.avatar} />
      <Text style={styles.callerName}>{caller.displayName}</Text>
      <Text style={styles.callType}>
        {callType === 'video_call' ? 'Görüntülü Arama' : 'Sesli Arama'}
      </Text>

      {/* Pulse animasyonu */}
      <PulseAnimation />

      {/* Butonlar */}
      <View style={styles.buttons}>
        <Pressable style={[styles.button, styles.rejectButton]} onPress={onReject}>
          <Ionicons name="close" size={32} color="#fff" />
        </Pressable>
        <Pressable style={[styles.button, styles.acceptButton]} onPress={onAccept}>
          <Ionicons name="call" size={32} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
```

### Background Call Handling

```typescript
// VoIP Push (iOS) + FCM High Priority (Android)
// Bu kısım native entegrasyon gerektirir

// react-native-callkeep ile
import RNCallKeep from 'react-native-callkeep';

RNCallKeep.setup({
  ios: {
    appName: 'İpelya',
    supportsVideo: true,
  },
  android: {
    alertTitle: 'İzin Gerekli',
    alertDescription: 'Gelen aramalar için izin verin',
  },
});

// Gelen çağrı geldiğinde
function handleIncomingCall(callId: string, callerName: string) {
  RNCallKeep.displayIncomingCall(
    callId,
    callerName,
    callerName,
    'generic',
    true // hasVideo
  );
}

// Kullanıcı cevapladığında
RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
  // Çağrıyı kabul et ve LiveKit'e bağlan
  answerCall(callUUID, true);
});
```

---

## 3. Connection Quality UI

### Quality Indicator

```typescript
// components/live/ConnectionQualityIndicator.tsx
function ConnectionQualityIndicator({ quality }: { quality: ConnectionQuality }) {
  const { colors } = useTheme();
  
  const config = {
    [ConnectionQuality.Excellent]: { bars: 4, color: colors.success },
    [ConnectionQuality.Good]: { bars: 3, color: colors.success },
    [ConnectionQuality.Poor]: { bars: 2, color: colors.warning },
    [ConnectionQuality.Lost]: { bars: 1, color: colors.error },
  }[quality];

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.bar,
            { height: bar * 4 },
            bar <= config.bars && { backgroundColor: config.color },
          ]}
        />
      ))}
    </View>
  );
}
```

### Poor Connection Banner

```typescript
// Viewer ekranında
{connectionQuality === ConnectionQuality.Poor && (
  <Animated.View 
    entering={SlideInUp}
    style={[styles.banner, { backgroundColor: colors.warning }]}
  >
    <Ionicons name="warning" size={16} color="#000" />
    <Text style={styles.bannerText}>Bağlantı kalitesi düşük</Text>
    <Pressable onPress={() => setQualityPreference('low')}>
      <Text style={styles.bannerAction}>Düşük Kalite</Text>
    </Pressable>
  </Animated.View>
)}
```

---

## 4. Session End States

### Yayın Bitiş Senaryoları

| Senaryo                       | Viewer UI                   | Aksiyon Seçenekleri |
| ----------------------------- | --------------------------- | ------------------- |
| **Normal bitiş**              | "Yayın sona erdi"           | Kapat, Profili gör  |
| **Host düştü**                | "Yayıncı ayrıldı"           | 30 sn bekle, Çık    |
| **Kicked**                    | "Yayından çıkarıldınız"     | Kapat               |
| **Banned**                    | "Bu yayından engellendiniz" | Kapat               |
| **Session kapatıldı (Admin)** | "Yayın sonlandırıldı"       | Kapat               |

### Missed Call UI

```typescript
// Cevapsız çağrı notification'ı tıklandığında
function MissedCallScreen({ call, caller }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Image source={{ uri: caller.avatarUrl }} style={styles.avatar} />
      <Text style={styles.title}>Cevapsız Arama</Text>
      <Text style={styles.callerName}>{caller.displayName}</Text>
      <Text style={styles.time}>{formatTime(call.initiated_at)}</Text>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => initiateCall(caller.id, 'audio_call')}>
          <Ionicons name="call" size={24} color={colors.accent} />
          <Text>Geri Ara</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => startChat(caller.id)}>
          <Ionicons name="chatbubble" size={24} color={colors.accent} />
          <Text>Mesaj Gönder</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

---

## 5. Background Audio

### iOS Background Modes

```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio", "voip"],
        "NSMicrophoneUsageDescription": "Sesli görüşme için mikrofon erişimi gerekli"
      }
    }
  }
}
```

### Audio Session Configuration

```typescript
// Sesli odada veya çağrıda
import { AudioSession } from '@livekit/react-native';

async function configureAudioSession() {
  await AudioSession.startAudioSession();
  
  // iOS: Arka planda ses devam etsin
  await AudioSession.configureAudio({
    android: {
      preferredOutputList: ['speaker'],
      audioMode: 'communication',
    },
    ios: {
      category: 'playAndRecord',
      mode: 'voiceChat',
      options: ['allowBluetooth', 'allowBluetoothA2DP', 'mixWithOthers'],
    },
  });
}
```

---

## 6. Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

// Çağrı geldiğinde
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Bağlantı kurulduğunda
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Çağrı bittiğinde
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Hediye gönderildiğinde
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

---

## 7. Accessibility

```typescript
// Viewer sayısı
<Text
  accessibilityLabel={`${viewerCount} kişi izliyor`}
  accessibilityRole="text"
>
  {viewerCount} 👁
</Text>

// Bağlantı kalitesi
<ConnectionQualityIndicator
  quality={quality}
  accessibilityLabel={`Bağlantı kalitesi: ${qualityLabel}`}
/>

// Kontrol butonları
<Pressable
  accessibilityLabel={isMuted ? "Mikrofonu aç" : "Mikrofonu kapat"}
  accessibilityRole="button"
  accessibilityState={{ checked: !isMuted }}
  onPress={toggleMute}
>
  <Ionicons name={isMuted ? "mic-off" : "mic"} />
</Pressable>
```

---

## 8. State Management Summary

```typescript
// types/live.ts
export type ViewerState = 
  | 'IDLE'
  | 'LOADING'
  | 'ACCESS_DENIED'
  | 'PAYMENT_REQUIRED'
  | 'TOKEN_ERROR'
  | 'CONNECTING'
  | 'WATCHING'
  | 'POOR_SIGNAL'
  | 'RECONNECTING'
  | 'HOST_DISCONNECTED'
  | 'ENDED'
  | 'KICKED'
  | 'BANNED';

export type CallState =
  | 'IDLE'
  | 'INITIATING'
  | 'RINGING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'TIMEOUT'
  | 'BUSY'
  | 'IN_CALL'
  | 'ENDED'
  | 'FAILED';

export type BroadcasterState =
  | 'IDLE'
  | 'PREPARING'
  | 'GOING_LIVE'
  | 'LIVE'
  | 'PAUSED'
  | 'ENDING'
  | 'ENDED';
```
