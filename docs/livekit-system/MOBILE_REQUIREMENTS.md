# LiveKit Web Admin Dashboard - Mobil Ekip Gereksinimleri

> Bu döküman, Web Ops Dashboard'un mobil tarafta gerektirdiği özellikleri açıklar.

**Oluşturulma Tarihi:** 2025-12-06  
**Güncelleme:** Web Ops tarafı tamamlandığında

---

## 📋 Genel Bakış

Web Ops Dashboard, mobil uygulamada gerçekleştirilen LiveKit canlı yayınlarını izlemek ve yönetmek için geliştirilmiştir. Mobil tarafta halihazırda çalışan LiveKit entegrasyonu bulunmaktadır.

---

## ✅ Mobil Tarafta Mevcut Olan Özellikler

Bu özellikler zaten mobilde çalışıyor:

| Özellik            | Durum       | Notlar                            |
| ------------------ | ----------- | --------------------------------- |
| Video Live Yayını  | ✅ Çalışıyor | Host video yayını yapabiliyor     |
| Audio Room         | ✅ Çalışıyor | Sesli oda oluşturulabiliyor       |
| 1-1 Çağrılar       | ✅ Çalışıyor | Video ve sesli çağrı              |
| Katılımcı Yönetimi | ✅ Çalışıyor | Host kick/ban yapabiliyor         |
| Chat Mesajları     | ✅ Çalışıyor | live_messages tablosuna yazılıyor |
| Hediye Gönderimi   | ✅ Çalışıyor | live_gifts tablosuna kaydediliyor |

---

## 🔔 Mobil Tarafta Gerekli Yeni Özellikler

### 1. Admin Kick/Ban Event Handling

Web Ops panelinden bir admin kullanıcıyı kick veya ban yaptığında, mobil uygulama bunu handle etmelidir.

**Implementasyon:**

```typescript
// apps/mobile/hooks/useLiveSessionEvents.ts

import { useEffect } from 'react';
import { RoomEvent, DisconnectReason } from 'livekit-client';
import { useRoom } from '@livekit/components-react';

export function useLiveSessionEvents(sessionId: string) {
  const room = useRoom();

  useEffect(() => {
    if (!room) return;

    const handleDisconnect = async (reason?: DisconnectReason) => {
      // Admin tarafından çıkarılma kontrolü
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        // Ban kontrolü yap
        const response = await fetch(`/api/live/check-ban?sessionId=${sessionId}`);
        const data = await response.json();

        if (data.banned) {
          // Ban mesajı göster
          Alert.alert(
            'Oturumdan Çıkarıldınız',
            data.reason || 'Yönetici tarafından bu oturumdan çıkarıldınız.',
            [{ text: 'Tamam', onPress: () => router.back() }]
          );
        } else {
          // Sadece kick - tekrar katılabilir
          Alert.alert(
            'Bağlantı Kesildi',
            'Oturumdan çıkarıldınız. Tekrar katılabilirsiniz.',
            [
              { text: 'Çık', onPress: () => router.back() },
              { text: 'Tekrar Katıl', onPress: () => reconnect() }
            ]
          );
        }
      }
    };

    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
    };
  }, [room, sessionId]);
}
```

### 2. Admin Oturum Sonlandırma Event Handling

Admin oturumu zorla sonlandırdığında tüm katılımcılar bilgilendirilmelidir.

```typescript
// apps/mobile/hooks/useSessionTermination.ts

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSessionTermination(sessionId: string, onTerminated: () => void) {
  useEffect(() => {
    // Supabase Realtime ile session durumunu dinle
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.new.status === 'ended') {
          Alert.alert(
            'Yayın Sonlandırıldı',
            'Bu yayın yönetici tarafından sonlandırıldı.',
            [{ text: 'Tamam', onPress: onTerminated }]
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, onTerminated]);
}
```

### 3. Şikayet Gönderme UI

Kullanıcılar canlı yayındaki diğer kullanıcıları şikayet edebilmelidir.

**Şikayet Nedenleri:**
- `harassment` - Taciz
- `spam` - Spam
- `nudity` - Uygunsuz içerik
- `violence` - Şiddet
- `hate_speech` - Nefret söylemi
- `scam` - Dolandırıcılık
- `underage` - Yaş sınırı ihlali
- `copyright` - Telif hakkı ihlali
- `other` - Diğer

**Şikayet Gönderme:**

```typescript
// apps/mobile/components/live/ReportUserModal.tsx

interface ReportData {
  session_id: string;
  reported_user_id: string;
  reason: ReportReason;
  description?: string;
}

async function reportUser(data: ReportData) {
  const { error } = await supabase
    .from('live_reports')
    .insert({
      session_id: data.session_id,
      reporter_id: currentUser.id,
      reported_user_id: data.reported_user_id,
      reason: data.reason,
      description: data.description,
      status: 'pending',
    });

  if (error) {
    toast.error('Şikayet gönderilemedi');
    return;
  }

  toast.success('Şikayetiniz alındı');
}
```

---

## 📡 Supabase Realtime Subscriptions

Mobil uygulama aşağıdaki Realtime kanallarını dinlemelidir:

| Kanal                         | Event  | Amaç                                                    |
| ----------------------------- | ------ | ------------------------------------------------------- |
| `session:{sessionId}`         | UPDATE | Session durumu değişikliklerini izle (ended, cancelled) |
| `participant:{participantId}` | UPDATE | Katılımcı durumu değişikliklerini izle                  |
| `bans:{userId}`               | INSERT | Kullanıcı banlandığında bildir                          |

---

## 🔧 Edge Functions (Mobil Tarafça Kullanılan)

Bu edge functions mobil tarafta zaten kullanılıyor:

| Function              | Amaç                      |
| --------------------- | ------------------------- |
| `get-livekit-token`   | LiveKit erişim token'ı al |
| `create-live-session` | Yeni yayın başlat         |
| `join-live-session`   | Yayına katıl              |
| `end-live-session`    | Yayını sonlandır          |
| `kick-participant`    | Katılımcıyı çıkar         |
| `ban-participant`     | Katılımcıyı yasakla       |
| `send-live-gift`      | Hediye gönder             |

---

## 📱 UI/UX Gereksinimleri

### 1. Admin Kick/Ban Bildirimi

Kullanıcı admin tarafından kick veya ban edildiğinde:

```
┌─────────────────────────────────────┐
│         ⚠️ Oturumdan Çıkarıldınız   │
│                                      │
│  Yönetici tarafından bu oturumdan    │
│  çıkarıldınız.                       │
│                                      │
│  Neden: [Varsa göster]               │
│                                      │
│  ┌─────────┐  ┌─────────────────┐   │
│  │  Çık    │  │  Tekrar Katıl   │   │
│  └─────────┘  └─────────────────┘   │
└─────────────────────────────────────┘
```

### 2. Oturum Sonlandırma Bildirimi

```
┌─────────────────────────────────────┐
│         🔴 Yayın Sonlandırıldı      │
│                                      │
│  Bu yayın yönetici tarafından        │
│  sonlandırıldı.                      │
│                                      │
│           ┌───────────┐             │
│           │   Tamam   │             │
│           └───────────┘             │
└─────────────────────────────────────┘
```

### 3. Şikayet Butonu

Katılımcı avatarına uzun basıldığında veya menüden erişilebilir:

```
┌──────────────────────────┐
│  @username               │
│  ────────────────────────│
│  📩 Mesaj Gönder         │
│  🔇 Sessize Al           │
│  ⚠️ Şikayet Et           │
│  🚫 Engelle              │
└──────────────────────────┘
```

---

## ✅ Checklist - Mobil Ekip

- [ ] `useLiveSessionEvents` hook'u oluşturuldu
- [ ] `useSessionTermination` hook'u oluşturuldu
- [ ] Admin kick/ban alert UI eklendi
- [ ] Session termination alert UI eklendi
- [ ] ReportUserModal component'i oluşturuldu
- [ ] Şikayet nedenleri i18n'e eklendi
- [ ] Realtime subscription'lar güncellendi
- [ ] Test: Admin kick → Mobil bildirim alıyor ✓
- [ ] Test: Admin ban → Mobil bildirim alıyor ✓
- [ ] Test: Admin terminate → Tüm kullanıcılar bildirim alıyor ✓
- [ ] Test: Şikayet gönder → DB'ye kaydediliyor ✓

---

## 🎯 LiveKit Client Events (React Native) 00:53 6 aralık

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

## 🔮 Gelecek Özellikler (Roadmap)

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

## 🔄 Güncelleme Geçmişi

| Tarih      | Değişiklik                                     | Yazan |
| ---------- | ---------------------------------------------- | ----- |
| 2025-12-06 | İlk versiyon oluşturuldu                       | AI    |
| 2025-12-06 | LiveKit events, Egress/Ingress roadmap eklendi | AI    |
