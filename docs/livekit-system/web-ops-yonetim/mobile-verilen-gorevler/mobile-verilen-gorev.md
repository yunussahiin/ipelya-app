# 📱 Mobile LiveKit Entegrasyonu - Geliştirici Kılavuzu

> **Son Güncelleme:** 2025-12-06 06:30  
> **Durum:** ✅ Mobile Entegrasyonu Tamamlandı

---

## 🎯 AKTİF TODO LİSTESİ

### Adım 1: Hook Güncellemesi (Merkezi) ✅ TAMAMLANDI
- [x] `useLiveKitRoom.ts` → DisconnectReason handling eklendi
- [x] Yeni callback'ler: `onAdminKick`, `onRoomTerminated`, `onDuplicateSession`

### Adım 2: Modül Güncellemeleri (5 Modül) ✅ TAMAMLANDI
- [x] `broadcast/index.tsx` → `onRoomTerminated` eklendi
- [x] `watch/[sessionId].tsx` → `onAdminKick`, `onRoomTerminated` + ban check eklendi
- [x] `audio-room/index.tsx` → `onRoomTerminated` eklendi
- [x] `audio-room/[sessionId].tsx` → `onAdminKick`, `onRoomTerminated` + ban check eklendi
- [x] `call/[callId].tsx` → `onRoomTerminated` eklendi

### Adım 3: Yeni Hook'lar ✅ TAMAMLANDI
- [x] `useBanCheck.ts` → Yayına katılmadan önce ban kontrolü
- [x] `useReport.ts` → Şikayet gönderme

### Adım 4: UI Components ✅ TAMAMLANDI
- [x] Admin kick/ban alert (Alert.alert ile)
- [x] Room terminated alert (Alert.alert ile)
- [x] `BanInfoModal` - Ban bilgisi modal'ı
- [x] `ReportModal` - Şikayet gönderme modal'ı (viewer + host)

### Adım 5: Admin Mute/Unmute ✅ TAMAMLANDI
- [x] `TrackMuted` / `TrackUnmuted` event handler'ları güncellendi
- [x] Local participant için `isMicrophoneEnabled` / `isCameraEnabled` state güncellemesi
- [x] `participants` useMemo dependency'lerine mic/camera state eklendi
- [x] Audio Room UI'da mute badge otomatik güncelleniyor

---

## 🔍 Mevcut Durum Analizi

### ✅ Zaten Çalışan (useLiveKitRoom.ts)

| Özellik                         | Durum | Notlar                                                       |
| ------------------------------- | ----- | ------------------------------------------------------------ |
| Room bağlantısı                 | ✅     | `connect()`, `disconnect()` çalışıyor                        |
| Reconnecting/Reconnected events | ✅     | Event listener'lar var                                       |
| ConnectionQuality event         | ✅     | `connectionQuality` state var                                |
| ParticipantConnected/Left       | ✅     | `onParticipantJoined`, `onParticipantLeft` callback'leri var |
| DataReceived                    | ✅     | `onDataMessage` callback'i var                               |
| ActiveSpeakersChanged           | ✅     | `isSpeaking` participants'ta güncelleniyor                   |

### ❌ EKSİK - Yapılması Gereken (TÜM MODÜLLER)

| Özellik                           | Öncelik  | Açıklama                                           |
| --------------------------------- | -------- | -------------------------------------------------- |
| **DisconnectReason handling**     | 🔴 Kritik | `PARTICIPANT_REMOVED`, `ROOM_DELETED` kontrolü YOK |
| **Admin kick/ban UI**             | 🔴 Kritik | Alert/Modal gösterimi YOK                          |
| **Ban kontrolü (katılım öncesi)** | 🔴 Kritik | Yayına katılmadan önce ban check YOK               |
| **ConnectionQuality UI**          | 🟡 Yüksek | State var ama görsel gösterge YOK                  |
| **Şikayet gönderme UI**           | 🟡 Yüksek | `live_reports` insert UI YOK                       |
| **Host disconnect overlay**       | 🟡 Yüksek | 30sn countdown UI YOK                              |

---

## 📂 Modül Yapısı (4 Farklı LiveKit Modülü)

```
apps/mobile/app/(live)/
├── broadcast/              # 🎬 Video Yayını (Host)
│   ├── index.tsx           # Creator video yayını ekranı
│   └── _components/        # 10 component
│
├── watch/                  # 👁️ Video İzleme (Viewer)
│   ├── [sessionId].tsx     # Video izleme ekranı
│   └── _components/        # 4 component
│
├── audio-room/             # 🎙️ Sesli Oda
│   ├── index.tsx           # Host - oda oluşturma
│   ├── [sessionId].tsx     # Viewer/Dinleyici
│   └── _components/        # 8 component
│
└── call/                   # 📞 1-1 Çağrı
    ├── [callId].tsx        # Çağrı ekranı
    └── _components/        # 4 component
```

### Room Naming Pattern

| Modül           | Room Name                     | Örnek                          |
| --------------- | ----------------------------- | ------------------------------ |
| Video Yayını    | `live_video_{session_uuid}`   | `live_video_abc123`            |
| Sesli Oda       | `audio_room_{session_uuid}`   | `audio_room_def456`            |
| Görüntülü Çağrı | `call_video_{call_uuid}_{ts}` | `call_video_ghi789_1701858000` |
| Sesli Çağrı     | `call_audio_{call_uuid}_{ts}` | `call_audio_jkl012_1701858000` |

### Her Modülde useLiveKitRoom Kullanımı (Mevcut)

| Modül            | Dosya                        | Satır | Eksik Callback'ler                |
| ---------------- | ---------------------------- | ----- | --------------------------------- |
| **Broadcast**    | `broadcast/index.tsx`        | ~139  | `onAdminKick`, `onRoomTerminated` |
| **Watch**        | `watch/[sessionId].tsx`      | ~55   | `onAdminKick`, `onRoomTerminated` |
| **Audio Host**   | `audio-room/index.tsx`       | ~86   | `onAdminKick`, `onRoomTerminated` |
| **Audio Viewer** | `audio-room/[sessionId].tsx` | ~72   | `onAdminKick`, `onRoomTerminated` |
| **Call**         | `call/[callId].tsx`          | ~43   | `onAdminKick`, `onRoomTerminated` |

---

## 📋 Özet

Bu döküman, İpelya mobil uygulamasının LiveKit entegrasyonu için gerekli bilgileri içerir. Web Ops Dashboard tamamlandı ve aşağıdaki özellikler aktif:

### ✅ Backend Hazır Olan Özellikler

| Özellik      | API Endpoint                                  | Açıklama                   |
| ------------ | --------------------------------------------- | -------------------------- |
| Kick         | `POST /api/ops/live/participants/[id]/kick`   | Admin katılımcı çıkarma    |
| Ban          | `POST /api/ops/live/participants/[id]/ban`    | Session/Creator/Global ban |
| Mute         | `POST /api/ops/live/participants/[id]/mute`   | Mikrofon kapatma           |
| Unmute       | `POST /api/ops/live/participants/[id]/unmute` | Mikrofon açma              |
| Terminate    | `POST /api/ops/live/sessions/[id]/terminate`  | Oturum sonlandırma         |
| Reports      | `GET/POST /api/ops/live/reports`              | Şikayet sistemi            |
| Webhook Logs | `GET /api/ops/live/webhook-logs`              | Event logları              |

> **Not:** `[id]` parametresi hem `live_participants` tablosundaki UUID hem de `user_id` (LiveKit identity) olabilir.
> API her iki formatı da destekler.

### ✅ Mevcut Çalışan Yapı

Mobile'da **Edge Function kullanmıyoruz**. Doğrudan Supabase kullanıyoruz:

```typescript
// useLiveChat.ts - Mesaj gönderme
await supabase.from('live_messages').insert({...});

// Mesaj dinleme - Supabase Realtime
supabase.channel(`live_chat:${sessionId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'live_messages' }, ...)
```

**Bu yaklaşım doğru çünkü:**
- RLS güvenliği sağlıyor
- Ekstra latency yok (Edge function hop yok)
- Realtime subscription direkt çalışıyor

### 🔴 Mobile'da Yapılması Gerekenler (Öncelik Sırasına Göre)

1. **DisconnectReason Handling** - `useLiveKitRoom.ts`'e eklenecek
2. **Ban Kontrolü** - Yayına katılmadan önce `live_session_bans` check
3. **Admin Kick/Ban Alert UI** - Modal component'leri
4. **Şikayet Gönderme UI** - `live_reports` insert (RLS policy ✅ eklendi)
5. **ConnectionQuality UI** - Sinyal göstergesi component
6. **Host Disconnect Overlay** - 30sn countdown UI

---

## 🎯 LiveKit Client Events (React Native)

Mobil uygulamada dinlenmesi gereken LiveKit SDK event'leri:

### Room Events (Kritik)

| Event                     | Açıklama                           | Aksiyon                           |
| ------------------------- | ---------------------------------- | --------------------------------- |
| `ParticipantConnected`    | Katılımcı katıldı                  | UI güncelle, bildirim göster      |
| `ParticipantDisconnected` | Katılımcı ayrıldı                  | UI güncelle                       |
| `Reconnecting`            | Bağlantı koptu, yeniden bağlanıyor | Loading göstergesi göster         |
| `Reconnected`             | Yeniden bağlandı                   | Loading kapat                     |
| `Disconnected`            | Tamamen bağlantı kesildi           | **Disconnect reason kontrol et!** |
| `ActiveSpeakersChanged`   | Konuşanlar değişti                 | Speaking indicator güncelle       |
| `RoomMetadataChanged`     | Oda metadata değişti               | Başlık vb. güncelle               |
| `DataReceived`            | Data channel mesajı                | Chat mesajı işle                  |

### Track Events

| Event               | Açıklama              | Aksiyon                      |
| ------------------- | --------------------- | ---------------------------- |
| `TrackSubscribed`   | Track'e abone olundu  | Video/Audio render et        |
| `TrackUnsubscribed` | Track aboneliği bitti | Render'ı kaldır              |
| `TrackMuted`        | Track sessize alındı  | Mute icon göster             |
| `TrackUnmuted`      | Track sesi açıldı     | Mute icon kaldır             |
| `TrackPublished`    | Track yayınlandı      | Yeni track için subscribe ol |
| `TrackUnpublished`  | Track kaldırıldı      | Track render'ını kaldır      |

> **ÖNEMLİ - Admin Mute/Unmute:**  
> Admin panelinden bir katılımcının mikrofonu kapatıldığında (`TrackMuted`) veya açıldığında (`TrackUnmuted`), 
> mobile tarafta bu event'ler otomatik olarak tetiklenir. LiveKit SDK bu event'leri handle eder.
> Mobile'da ekstra bir şey yapmanıza gerek yok - sadece mute icon'u gösterin/gizleyin.

### Connection & Quality Events

| Event                      | Açıklama                  | Aksiyon                    |
| -------------------------- | ------------------------- | -------------------------- |
| `ConnectionQualityChanged` | Bağlantı kalitesi değişti | Kalite göstergesi güncelle |
| `IsSpeakingChanged`        | Konuşma durumu değişti    | Speaking animasyonu        |

### Örnek Implementation

```typescript
// apps/mobile/hooks/useLiveKitEvents.ts

import { useEffect, useCallback } from 'react';
import { useRoomContext } from '@livekit/react-native';
import { RoomEvent, ConnectionQuality, DisconnectReason } from 'livekit-client';

export function useLiveKitEvents(sessionId: string) {
  const room = useRoomContext();
  
  // Disconnection handler - ÖNEMLİ: Reason kontrolü
  const handleDisconnected = useCallback((reason?: DisconnectReason) => {
    console.log('Disconnected, reason:', reason);
    
    switch (reason) {
      case DisconnectReason.PARTICIPANT_REMOVED:
        // Admin tarafından çıkarıldı (kick/ban)
        handleAdminKick(sessionId);
        break;
      case DisconnectReason.ROOM_DELETED:
        // Oda silindi (admin terminate)
        handleRoomTerminated();
        break;
      case DisconnectReason.CLIENT_INITIATED:
        // Kullanıcı kendisi çıktı
        break;
      case DisconnectReason.DUPLICATE_IDENTITY:
        // Başka cihazdan bağlandı
        showDuplicateSessionAlert();
        break;
      default:
        // Ağ sorunu vs.
        showReconnectOption();
    }
  }, [sessionId]);

  // Reconnection states
  const handleReconnecting = useCallback(() => {
    showReconnectingOverlay();
  }, []);

  const handleReconnected = useCallback(() => {
    hideReconnectingOverlay();
    toast.success('Bağlantı yeniden kuruldu');
  }, []);

  // Connection quality
  const handleConnectionQuality = useCallback((
    quality: ConnectionQuality,
    participant: Participant
  ) => {
    if (participant.isLocal) {
      updateConnectionIndicator(quality);
      
      if (quality === ConnectionQuality.Poor) {
        toast.warning('Bağlantı kalitesi düşük');
      }
    }
  }, []);

  // Active speakers
  const handleActiveSpeakers = useCallback((speakers: Participant[]) => {
    updateSpeakingIndicators(speakers);
  }, []);

  // Data received (chat, reactions, etc.)
  const handleDataReceived = useCallback((
    payload: Uint8Array,
    participant?: RemoteParticipant,
    kind?: DataPacket_Kind
  ) => {
    const message = JSON.parse(new TextDecoder().decode(payload));
    
    switch (message.type) {
      case 'chat':
        addChatMessage(message);
        break;
      case 'reaction':
        showReaction(message);
        break;
      case 'gift':
        showGiftAnimation(message);
        break;
    }
  }, []);

  useEffect(() => {
    if (!room) return;

    // Room events
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.ConnectionQualityChanged, handleConnectionQuality);
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Cleanup
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.ConnectionQualityChanged, handleConnectionQuality);
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);
}
```

---

## 🔮 Gelecek Özellikler (Roadmap) Bunu sonra yapacağız

### 1. Egress (Kayıt Özellikleri)

> **Planlanan:** Phase 2

LiveKit Egress ile yayınları kaydedebileceğiz.

| Özellik            | Açıklama                  | Mobil Etkisi               |
| ------------------ | ------------------------- | -------------------------- |
| Room Composite     | Tüm odayı kaydet          | Kayıt başlat/durdur butonu |
| Track Composite    | Belirli track'leri kaydet | Track seçimi UI            |
| Participant Egress | Tek katılımcıyı kaydet    | -                          |
| Web Egress         | URL'yi kaydet             | -                          |

**Mobil için gerekecek UI:**
```
┌─────────────────────────────────────┐
│  🔴 Yayın Kaydediliyor              │
│  ────────────────────────────────── │
│                                      │
│  [⏺️ Kaydı Başlat]  [⏹️ Durdur]     │
│                                      │
│  Kayıt Süresi: 00:15:32             │
│  Tahmini Boyut: ~45 MB               │
└─────────────────────────────────────┘
```

**Webhook Events:**
- `egress_started` - Kayıt başladı
- `egress_updated` - Kayıt durumu güncellendi
- `egress_ended` - Kayıt tamamlandı (download URL gelir)

**Mobil Aksiyon:**
```typescript
// İleride implement edilecek
interface EgressInfo {
  egressId: string;
  status: 'starting' | 'active' | 'ending' | 'complete';
  roomName: string;
  startedAt: number;
  endedAt?: number;
  fileUrl?: string; // Kayıt tamamlanınca
}

// Realtime subscription
supabase.channel(`egress:${sessionId}`).on('broadcast', {
  event: 'egress_update'
}, (payload: EgressInfo) => {
  if (payload.status === 'complete' && payload.fileUrl) {
    showDownloadOption(payload.fileUrl);
  }
});
```

### 2. Ingress (RTMP/WHIP Stream)

> **Planlanan:** Phase 3

Dışarıdan RTMP/WHIP stream kabul etme.

| Özellik      | Açıklama                 | Mobil Etkisi           |
| ------------ | ------------------------ | ---------------------- |
| RTMP Ingress | OBS vb. yazılımdan yayın | Stream key gösterme UI |
| WHIP Ingress | WebRTC tabanlı push      | -                      |
| URL Ingress  | Bir URL'den stream       | -                      |

**Mobil için gerekecek UI (Creator tarafı):**
```
┌─────────────────────────────────────┐
│  📡 Harici Yayın Kaynağı            │
│  ────────────────────────────────── │
│                                      │
│  RTMP URL:                          │
│  rtmp://live.example.com/live       │
│                                      │
│  Stream Key:                        │
│  live_xxxxx... [📋 Kopyala]         │
│                                      │
│  Durum: 🟢 Bağlı / 🔴 Bekleniyor    │
└─────────────────────────────────────┘
```

**Webhook Events:**
- `ingress_started` - Harici stream başladı
- `ingress_ended` - Harici stream sonlandı

---

## 🌐 Server Webhook Events (Referans)

Backend'de (`livekit-webhook` edge function) işlenen event'ler:

| Event                            | Açıklama              | DB Aksiyonu                          |
| -------------------------------- | --------------------- | ------------------------------------ |
| `room_started`                   | Oda oluştu            | Session status → live                |
| `room_finished`                  | Oda kapandı           | Session status → ended, süre hesapla |
| `participant_joined`             | Katılımcı katıldı     | Participant aktif, peak güncelle     |
| `participant_left`               | Katılımcı ayrıldı     | Participant pasif, host tracking     |
| `participant_connection_aborted` | Bağlantı koptu        | Leave reason kaydet                  |
| `track_published`                | Track yayınlandı      | Log kaydı                            |
| `track_unpublished`              | Track kaldırıldı      | Log kaydı                            |
| `egress_started`                 | Kayıt başladı         | (ileride)                            |
| `egress_updated`                 | Kayıt güncellendi     | (ileride)                            |
| `egress_ended`                   | Kayıt bitti           | (ileride)                            |
| `ingress_started`                | Harici stream başladı | (ileride)                            |
| `ingress_ended`                  | Harici stream bitti   | (ileride)                            |

---

## 📝 Notlar

1. **Öncelik:** Admin kick/ban handling en yüksek öncelikli
2. **Test:** Web Ops paneli aktif olduğunda test edilebilir
3. **Realtime:** Supabase Realtime zaten projede aktif
4. **DisconnectReason:** `PARTICIPANT_REMOVED` ve `ROOM_DELETED` admin aksiyonlarını yakalamak için kritik
5. **ConnectionQuality:** Poor bağlantıda kullanıcıyı uyar

---

## 🚀 Mobile Görev Listesi (Checklist)

### Faz 1: Temel Entegrasyon (Kritik) - ÖNCELİKLİ

| Görev                    | Öncelik  | Durum | Açıklama                                       |
| ------------------------ | -------- | ----- | ---------------------------------------------- |
| DisconnectReason handler | 🔴 Kritik | ⏳     | `PARTICIPANT_REMOVED`, `ROOM_DELETED` handling |
| Admin kick alert UI      | 🔴 Kritik | ⏳     | "Admin tarafından çıkarıldınız" modal          |
| Session terminated UI    | 🔴 Kritik | ⏳     | "Yayın sonlandırıldı" bildirimi                |
| Ban notification         | 🔴 Kritik | ⏳     | Ban süresi ve nedeni gösterimi                 |
| Ban check (join öncesi)  | 🔴 Kritik | ⏳     | Yayına katılmadan önce ban kontrolü            |

### Faz 2: Realtime Subscriptions

| Görev                       | Öncelik  | Durum | Açıklama                               |
| --------------------------- | -------- | ----- | -------------------------------------- |
| Session status subscription | 🟡 Yüksek | ⏳     | `live_sessions` tablosu değişiklikleri |
| Participant changes         | 🟡 Yüksek | ⏳     | Katılımcı join/leave realtime          |
| Host disconnect handling    | 🟡 Yüksek | ⏳     | 30sn bekleme + "Host ayrıldı" UI       |

### Faz 3: UI Components

| Görev                      | Öncelik  | Durum | Açıklama                                    |
| -------------------------- | -------- | ----- | ------------------------------------------- |
| ConnectionQualityIndicator | 🟢 Orta   | ⏳     | Sinyal çubukları (excellent/good/poor/lost) |
| SpeakingIndicator          | 🟢 Orta   | ✅     | **ZATEN VAR** - `isSpeaking` animasyonu     |
| ReportModal                | 🟡 Yüksek | ⏳     | Şikayet gönderme formu                      |
| BanInfoSheet               | 🟢 Orta   | ⏳     | Ban detayları bottom sheet                  |

### Faz 4: Şikayet Sistemi

| Görev                  | Öncelik  | Durum | Açıklama                                             |
| ---------------------- | -------- | ----- | ---------------------------------------------------- |
| Report API integration | 🟡 Yüksek | ✅     | **RLS policy eklendi** - doğrudan insert yapılabilir |
| Report reasons UI      | 🟡 Yüksek | ⏳     | Harassment, spam, nudity vb. seçenekler              |
| Report confirmation    | 🟢 Orta   | ⏳     | "Şikayetiniz alındı" toast                           |

---

## 📝 KONKRET IMPLEMENTASYON ADIMLARI

### Adım 1: useLiveKitRoom.ts'e DisconnectReason Ekleme

**Dosya:** `apps/mobile/src/hooks/live/useLiveKitRoom.ts`

**Değişiklik:** Satır 355 civarında, `RoomEvent.Disconnected` handler'ına reason ekle:

```typescript
// ÖNCEKİ KOD (satır ~355):
newRoom.on(RoomEvent.Disconnected, () => {
  setIsConnected(false);
  setConnectionState(ConnectionState.Disconnected);
  onDisconnected?.();
});

// YENİ KOD:
import { DisconnectReason } from 'livekit-client';

newRoom.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
  setIsConnected(false);
  setConnectionState(ConnectionState.Disconnected);
  
  // Admin aksiyonlarını tespit et
  if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
    // Admin tarafından kick veya ban edildi
    onAdminKick?.();
  } else if (reason === DisconnectReason.ROOM_DELETED) {
    // Oda silindi (admin terminate)
    onRoomTerminated?.();
  } else if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
    // Başka cihazdan giriş yapıldı
    onDuplicateSession?.();
  }
  
  onDisconnected?.(reason);
});
```

**Yeni callback'ler ekle (options interface'e):**

```typescript
export interface UseLiveKitRoomOptions {
  // ... mevcut alanlar ...
  /** Admin tarafından kick/ban edildiğinde */
  onAdminKick?: () => void;
  /** Oda admin tarafından sonlandırıldığında */
  onRoomTerminated?: () => void;
  /** Başka cihazdan giriş yapıldığında */
  onDuplicateSession?: () => void;
  /** Bağlantı kesildiğinde (reason ile) */
  onDisconnected?: (reason?: DisconnectReason) => void;
}
```

### Adım 2: Ban Kontrolü Hook'u

**Yeni dosya:** `apps/mobile/src/hooks/live/useBanCheck.ts`

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface BanInfo {
  id: string;
  ban_type: 'session' | 'creator' | 'global';
  reason?: string;
  expires_at?: string;
}

export function useBanCheck() {
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkBan = useCallback(async (sessionId: string, creatorId?: string) => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Ban kontrolü - session, creator veya global
      let query = supabase
        .from('live_session_bans')
        .select('id, ban_type, reason, expires_at')
        .eq('banned_user_id', user.id)
        .eq('is_active', true);

      // Session veya creator ban kontrolü
      if (creatorId) {
        query = query.or(`session_id.eq.${sessionId},banned_by.eq.${creatorId},ban_type.eq.global`);
      } else {
        query = query.or(`session_id.eq.${sessionId},ban_type.eq.global`);
      }

      // Süresi dolmamış banları al
      query = query.or('expires_at.is.null,expires_at.gt.now()');

      const { data: ban } = await query.maybeSingle();

      if (ban) {
        setIsBanned(true);
        setBanInfo(ban);
        return true;
      }

      setIsBanned(false);
      setBanInfo(null);
      return false;
    } catch (error) {
      console.error('[BanCheck] Error:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { isBanned, banInfo, isChecking, checkBan };
}
```

### Adım 3: Şikayet Gönderme Hook'u

**Yeni dosya:** `apps/mobile/src/hooks/live/useReport.ts`

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type ReportReason = 
  | 'harassment' 
  | 'spam' 
  | 'nudity' 
  | 'violence' 
  | 'hate_speech' 
  | 'scam' 
  | 'underage' 
  | 'copyright' 
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Taciz' },
  { value: 'spam', label: 'Spam' },
  { value: 'nudity', label: 'Uygunsuz İçerik' },
  { value: 'violence', label: 'Şiddet' },
  { value: 'hate_speech', label: 'Nefret Söylemi' },
  { value: 'scam', label: 'Dolandırıcılık' },
  { value: 'underage', label: 'Yaş Sınırı İhlali' },
  { value: 'copyright', label: 'Telif Hakkı' },
  { value: 'other', label: 'Diğer' },
];

export function useReport() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = useCallback(async (data: {
    sessionId: string;
    reportedUserId: string;
    reason: ReportReason;
    description?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('live_reports').insert({
        session_id: data.sessionId,
        reported_user_id: data.reportedUserId,
        reason: data.reason,
        description: data.description,
        status: 'pending',
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[Report] Error:', error);
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitReport, isSubmitting };
}
```

### Adım 4: UI Components

**AdminKickModal:** (basit Alert ile başlayabilirsiniz)

```typescript
// AudioRoomLive.tsx veya ilgili component'te kullanım:
import { Alert } from 'react-native';

const handleAdminKick = useCallback(async () => {
  // Ban bilgisini al
  const { data: ban } = await supabase
    .from('live_session_bans')
    .select('reason, ban_type, expires_at')
    .eq('banned_user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (ban) {
    const expiresText = ban.expires_at 
      ? `\n\nSüre: ${new Date(ban.expires_at).toLocaleDateString('tr-TR')}'e kadar`
      : '\n\nSüre: Kalıcı';

    Alert.alert(
      '🚫 Yasaklandınız',
      `Bu yayıncının yayınlarına katılmanız engellendi.${ban.reason ? `\n\nNeden: ${ban.reason}` : ''}${expiresText}`,
      [{ text: 'Anladım', onPress: () => router.back() }]
    );
  } else {
    Alert.alert(
      '⚠️ Yayından Çıkarıldınız',
      'Bir moderatör tarafından bu yayından çıkarıldınız.',
      [{ text: 'Tamam', onPress: () => router.back() }]
    );
  }
}, []);
```

---

## 🔗 Supabase Realtime Channels

Mobile'da dinlenmesi gereken Supabase channel'ları:

```typescript
// Session durumu değişiklikleri
const sessionChannel = supabase
  .channel(`live:${sessionId}`)
  .on('broadcast', { event: 'session_update' }, (payload) => {
    // status: 'live' | 'ended' | 'host_disconnected'
    handleSessionUpdate(payload);
  })
  .on('broadcast', { event: 'host_disconnected' }, (payload) => {
    // reconnectDeadline: timestamp
    showHostDisconnectedOverlay(payload.reconnectDeadline);
  })
  .on('broadcast', { event: 'host_reconnected' }, () => {
    hideHostDisconnectedOverlay();
  })
  .subscribe();

// Katılımcı değişiklikleri (viewer count için)
const participantsChannel = supabase
  .channel(`participants:${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_participants',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    updateParticipantCount();
  })
  .subscribe();
```

---

## 📦 Gerekli Paketler zaten kurulmuştur.

```bash
# LiveKit React Native SDK
pnpm add @livekit/react-native @livekit/react-native-webrtc

# iOS için ek kurulum
cd ios && pod install

# Android için ek kurulum
# android/app/build.gradle'a eklemeler gerekli
```

---

## 🎨 UI/UX Önerileri

### Admin Kick Modal

```
┌─────────────────────────────────────┐
│  ⚠️ Yayından Çıkarıldınız           │
│  ────────────────────────────────── │
│                                      │
│  Bir moderatör tarafından bu        │
│  yayından çıkarıldınız.             │
│                                      │
│  Neden: Uygunsuz davranış           │
│                                      │
│  [Tamam]                            │
└─────────────────────────────────────┘
```

### Ban Notification

```
┌─────────────────────────────────────┐
│  🚫 Yasaklandınız                   │
│  ────────────────────────────────── │
│                                      │
│  Bu yayıncının yayınlarına          │
│  katılmanız engellendi.             │
│                                      │
│  Süre: 24 saat                      │
│  Bitiş: 07.12.2025 01:15            │
│                                      │
│  [Anladım]                          │
└─────────────────────────────────────┘
```

### Host Disconnected Overlay

```
┌─────────────────────────────────────┐
│                                      │
│         ⏳ Yayıncı Bağlantısı        │
│            Kesildi                   │
│                                      │
│     Yeniden bağlanması bekleniyor    │
│                                      │
│            00:25                     │
│                                      │
│  [Yayından Ayrıl]                   │
└─────────────────────────────────────┘
```

---

## 🔐 Veri Erişim Yöntemleri

### ✅ Doğrudan Supabase (Önerilen)

Mobile için **Edge Function yerine doğrudan Supabase** kullanıyoruz:

| İşlem          | Yöntem             | Tablo               | Açıklama               |
| -------------- | ------------------ | ------------------- | ---------------------- |
| Mesaj gönder   | `insert`           | `live_messages`     | RLS ile güvenli        |
| Mesaj dinle    | `postgres_changes` | `live_messages`     | Realtime               |
| Şikayet gönder | `insert`           | `live_reports`      | RLS ile güvenli        |
| Ban kontrolü   | `select`           | `live_session_bans` | Katılım öncesi kontrol |
| Session durumu | `broadcast`        | Channel             | Host disconnect vb.    |

### Edge Functions (Sadece Token için)

| Function              | Endpoint                            | Kullanım               |
| --------------------- | ----------------------------------- | ---------------------- |
| `get-livekit-token`   | `/functions/v1/get-livekit-token`   | Yayına katılım token'ı |
| `create-live-session` | `/functions/v1/create-live-session` | Yeni yayın başlatma    |

### Örnek: Şikayet Gönderme (Doğrudan Supabase)

```typescript
// ❌ Edge Function kullanma
// const { data } = await supabase.functions.invoke('create-live-report', {...});

// ✅ Doğrudan insert (RLS güvenliği var)
const { error } = await supabase.from('live_reports').insert({
  session_id: sessionId,
  reporter_id: user.id,
  reported_user_id: targetUserId,
  reason: 'harassment', // harassment, spam, nudity, violence, etc.
  description: 'Açıklama...',
});

if (!error) {
  toast.success('Şikayetiniz alındı');
}
```

### Örnek: Ban Kontrolü (Katılım Öncesi)

```typescript
// Yayına katılmadan önce ban kontrolü
const { data: ban } = await supabase
  .from('live_session_bans')
  .select('id, ban_type, expires_at')
  .eq('banned_user_id', user.id)
  .eq('is_active', true)
  .or(`session_id.eq.${sessionId},ban_type.eq.creator,ban_type.eq.global`)
  .maybeSingle();

if (ban) {
  // Kullanıcı banlı, katılamaz
  showBanAlert(ban);
  return;
}

// Token al ve katıl
const { data } = await supabase.functions.invoke('get-livekit-token', {...});
```

---

## 📊 Test Senaryoları

Mobile ekibin test etmesi gereken senaryolar:

1. **Admin Kick Test**
   - Web Ops'tan bir katılımcıyı kick et
   - Mobile'da `DisconnectReason.PARTICIPANT_REMOVED` alınmalı
   - Uygun modal gösterilmeli

2. **Session Terminate Test**
   - Web Ops'tan oturumu sonlandır
   - Mobile'da `DisconnectReason.ROOM_DELETED` alınmalı
   - Tüm katılımcılar çıkarılmalı

3. **Ban Test**
   - Web Ops'tan bir kullanıcıyı banla
   - Kullanıcı kick edilmeli
   - Aynı yayına tekrar katılmaya çalışınca engellenmeli

4. **Host Disconnect Test**
   - Host bağlantısını kes (uçak modu)
   - Viewer'larda 30sn countdown başlamalı
   - Host geri bağlanırsa countdown iptal

---

## 📞 İletişim

Sorular için:
- Web Ops Dashboard: `apps/web/app/ops/(private)/live/`
- API Routes: `apps/web/app/api/ops/live/`
- Edge Functions: `supabase/functions/`