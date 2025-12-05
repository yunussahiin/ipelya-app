# LiveKit System - TODO

> Detaylı görev listesi ve implementasyon durumu

**Son Güncelleme:** 2025-12-05
**Durum:** � Faz 1-4 Tamamlandı (Kritik/Yüksek öncelikli görevler bitti)

## SDK Referans

- **React Native SDK:** `@livekit/react-native` + `@livekit/react-native-webrtc`
- **Expo Plugin:** `@livekit/react-native-expo-plugin`
- **GitHub:** https://github.com/livekit/client-sdk-react-native
- **Docs:** https://docs.livekit.io/home/quickstarts/expo/

---

## 🚨 Kritik Öncelikler (ANALYSIS_REPORT'tan)

| #   | Görev                                   | Durum | Öncelik | Referans                                  |
| --- | --------------------------------------- | ----- | ------- | ----------------------------------------- |
| 1   | VoIP Push + CallKeep entegrasyonu       | 🔴     | Kritik  | Native kod gerekli                        |
| 2   | Background Audio modes (iOS/Android)    | 🔴     | Kritik  | Native kod gerekli                        |
| 3   | Host disconnect handling (30sn bekleme) | ✅     | Kritik  | `handle-host-disconnect` edge function    |
| 4   | Orphaned session cleanup cron           | ✅     | Yüksek  | `cleanup-orphaned-sessions` edge function |
| 5   | Rate limiting (token endpoint)          | ✅     | Yüksek  | `get-livekit-token` v2 güncellendi        |
| 6   | **Guest/Co-Host sistemi**               | ✅     | Yüksek  | [GUEST_COHOST.md](./GUEST_COHOST.md)      |

---

## Faz 1: Veritabanı Altyapısı

### 1.1 Tablo Oluşturma

| Görev                             | Durum | Öncelik | Notlar                                                       |
| --------------------------------- | ----- | ------- | ------------------------------------------------------------ |
| [x] `live_sessions` tablosu       | ✅     | Kritik  | + `peak_viewers`, `total_duration_seconds` alanları          |
| [x] `live_participants` tablosu   | ✅     | Kritik  | Katılımcı ve rol bilgileri + guest invitation alanları       |
| [x] `live_messages` tablosu       | ✅     | Yüksek  | + `is_deleted` soft delete alanı                             |
| [x] `live_gifts` tablosu          | ✅     | Yüksek  | Hediye kayıtları                                             |
| [x] `calls` tablosu               | ✅     | Yüksek  | + `status` enum, `ended_reason`                              |
| [x] `live_session_bans` tablosu   | ✅     | Orta    | Session bazlı ban                                            |
| [ ] `creator_bans` tablosu        | 🔴     | Orta    | Creator bazlı kalıcı ban → [MODERATION.md](./MODERATION.md)  |
| [ ] `live_reports` tablosu        | 🔴     | Orta    | Şikayet/incident yönetimi → [MODERATION.md](./MODERATION.md) |
| [x] `live_guest_requests` tablosu | ✅     | Yüksek  | Request to join → [GUEST_COHOST.md](./GUEST_COHOST.md)       |

### 1.2 RLS Policies

| Görev                       | Durum | Öncelik | Notlar                                |
| --------------------------- | ----- | ------- | ------------------------------------- |
| [x] `live_sessions` RLS     | ✅     | Kritik  | `(SELECT auth.uid())` pattern kullan! |
| [x] `live_participants` RLS | ✅     | Kritik  | Kendi katılımını görme                |
| [x] `live_messages` RLS     | ✅     | Yüksek  | + rate limit check                    |
| [x] `live_gifts` RLS        | ✅     | Yüksek  | Service role + okuma                  |
| [x] `calls` RLS             | ✅     | Yüksek  | caller_id OR callee_id                |
| [x] `live_session_bans` RLS | ✅     | Orta    | Host yönetimi                         |

### 1.3 Realtime & Indexes

| Görev                                     | Durum | Öncelik | Notlar                                                |
| ----------------------------------------- | ----- | ------- | ----------------------------------------------------- |
| [x] Realtime publication ekle             | ✅     | Kritik  | `live_sessions`, `live_participants`, `live_messages` |
| [x] REPLICA IDENTITY FULL                 | ✅     | Kritik  | Tüm değişiklikleri görmek için                        |
| [x] FK indexes                            | ✅     | Yüksek  | Her FK için index!                                    |
| [x] `livekit_room_name` UNIQUE constraint | ✅     | Kritik  | → [ROOM_NAMING.md](./ROOM_NAMING.md)                  |

---

## Faz 2: Edge Functions

### 2.1 Temel Token ve Oturum

| Görev                     | Durum | Öncelik | Notlar                           |
| ------------------------- | ----- | ------- | -------------------------------- |
| [x] `get-livekit-token`   | ✅     | Kritik  | + Rate limiting, Zod validation  |
| [x] `create-live-session` | ✅     | Kritik  | Room naming: `live_video_{uuid}` |
| [x] `join-live-session`   | ✅     | Kritik  | + Access type kontrolü           |
| [x] `end-live-session`    | ✅     | Kritik  | + Stats kaydet (webhook ile)     |
| [ ] `leave-live-session`  | 🔴     | Yüksek  | Participant cleanup              |

### 2.2 1-1 Çağrı Functions

| Görev                     | Durum | Öncelik | Notlar                    |
| ------------------------- | ----- | ------- | ------------------------- |
| [ ] `initiate-call`       | 🔴     | Yüksek  | + Busy check, VoIP push   |
| [ ] `answer-call`         | 🔴     | Yüksek  | State: RINGING → ACCEPTED |
| [ ] `reject-call`         | 🔴     | Orta    | State: RINGING → REJECTED |
| [ ] `end-call`            | 🔴     | Yüksek  | Both parties disconnect   |
| [ ] `timeout-call` (cron) | 🔴     | Orta    | 30sn → MISSED             |

### 2.3 Guest/Co-Host Functions → [GUEST_COHOST.md](./GUEST_COHOST.md)

| Görev                          | Durum | Öncelik | Notlar                   |
| ------------------------------ | ----- | ------- | ------------------------ |
| [x] `invite-guest`             | ✅     | Yüksek  | Host → Viewer davet      |
| [x] `respond-guest-invitation` | ✅     | Yüksek  | Accept/Reject invitation |
| [x] `request-to-join`          | ✅     | Yüksek  | Viewer → Host istek      |
| [x] `respond-join-request`     | ✅     | Yüksek  | Host approve/reject      |
| [x] `end-guest`                | ✅     | Yüksek  | Co-host → Viewer demote  |

### 2.4 Moderasyon Functions

| Görev                     | Durum | Öncelik | Notlar                                                    |
| ------------------------- | ----- | ------- | --------------------------------------------------------- |
| [ ] `kick-participant`    | 🔴     | Orta    | RemoveParticipant API                                     |
| [ ] `ban-participant`     | 🔴     | Orta    | DB + RemoveParticipant → [MODERATION.md](./MODERATION.md) |
| [ ] `unban-participant`   | 🔴     | Düşük   | DB only                                                   |
| [ ] `delete-live-message` | 🔴     | Orta    | Soft delete + broadcast                                   |

### 2.5 Webhook Handler

| Görev                             | Durum | Öncelik | Notlar                                 |
| --------------------------------- | ----- | ------- | -------------------------------------- |
| [x] `livekit-webhook` function    | ✅     | Yüksek  | → [ERROR_STATES.md](./ERROR_STATES.md) |
| [x] `room_started` handler        | ✅     | Yüksek  | Session status → live                  |
| [x] `room_finished` handler       | ✅     | Yüksek  | Stats kaydet, status → ended           |
| [x] `participant_joined` handler  | ✅     | Orta    | Peak viewers güncelle                  |
| [x] `participant_left` handler    | ✅     | Kritik  | Host left? → 30sn bekle                |
| [ ] LiveKit Dashboard webhook URL | 🔴     | Yüksek  | Config                                 |

### 2.5 Scheduled Functions (Cron)

| Görev                           | Durum | Öncelik | Notlar                                         |
| ------------------------------- | ----- | ------- | ---------------------------------------------- |
| [x] `cleanup-orphaned-sessions` | ✅     | Yüksek  | Host timeout + orphan + 24h cleanup            |
| [ ] `check-quota-usage`         | 🔴     | Orta    | %80 → alert → [MONITORING.md](./MONITORING.md) |

---

## Faz 3: Mobil Entegrasyon

### 3.1 Paket Kurulumu & Config

| Görev                              | Durum | Öncelik | Notlar                                        |
| ---------------------------------- | ----- | ------- | --------------------------------------------- |
| [x] `@livekit/react-native` kur    | ✅     | Kritik  | v2.9.5 + expo-plugin v1.0.1 + webrtc v137.0.2 |
| [x] `app.config.ts` plugin ekle    | ✅     | Kritik  | Expo plugin yapılandırması                    |
| [x] `registerGlobals()` ekle       | ✅     | Kritik  | `_layout.tsx` içinde                          |
| [ ] **iOS Background Modes**       | 🔴     | Kritik  | `audio`, `voip` → Native config gerekli       |
| [ ] **Android Foreground Service** | 🔴     | Kritik  | Arka plan ses için → Native config gerekli    |
| [ ] Development build oluştur      | 🔴     | Kritik  | `eas build --profile development`             |

### 3.2 VoIP & CallKeep (KRİTİK!)

| Görev                               | Durum | Öncelik | Notlar                   |
| ----------------------------------- | ----- | ------- | ------------------------ |
| [ ] `react-native-callkeep` araştır | 🔴     | Kritik  | Expo uyumluluğu kontrol  |
| [ ] iOS PushKit entegrasyonu        | 🔴     | Kritik  | VoIP push için           |
| [ ] Android ConnectionService       | 🔴     | Kritik  | Native call UI           |
| [ ] `useIncomingCall` hook          | 🔴     | Kritik  | Background call handling |

### 3.3 Hooks

| Görev                      | Durum | Öncelik | Notlar                                               |
| -------------------------- | ----- | ------- | ---------------------------------------------------- |
| [x] `useLiveKitRoom`       | ✅     | Kritik  | + reconnection handling                              |
| [x] `useLiveSession`       | ✅     | Kritik  | Create/join/leave                                    |
| [x] `useCall`              | ✅     | Yüksek  | State machine → [ERROR_STATES.md](./ERROR_STATES.md) |
| [x] `useGuestInvitation`   | ✅     | Yüksek  | Guest/Co-Host → [GUEST_COHOST.md](./GUEST_COHOST.md) |
| [x] `useConnectionQuality` | ✅     | Orta    | Poor signal UI + warning                             |
| [x] `useLiveChat`          | ✅     | Orta    | Realtime chat                                        |
| [x] `useLiveGifts`         | ✅     | Orta    | Gift sending + realtime + queue                      |
| [x] `useHostDisconnect`    | ✅     | Kritik  | 30sn countdown + realtime                            |

### 3.4 Components

| Görev                            | Durum | Öncelik | Notlar                                                        |
| -------------------------------- | ----- | ------- | ------------------------------------------------------------- |
| [x] `LiveVideoView`              | ✅     | Kritik  | RTCView wrapper                                               |
| [x] `LiveControls`               | ✅     | Kritik  | Mic, cam, end buttons                                         |
| [x] `ViewerOverlay`              | ✅     | Kritik  | State-based UI → [MOBILE_UX_STATES.md](./MOBILE_UX_STATES.md) |
| [x] `GuestInvitationModal`       | ✅     | Yüksek  | Davet popup → [GUEST_COHOST.md](./GUEST_COHOST.md)            |
| [x] `HostGuestControls`          | ✅     | Yüksek  | Host guest yönetimi panel                                     |
| [x] `ConnectionQualityIndicator` | ✅     | Orta    | Signal bars                                                   |
| [x] `IncomingCallScreen`         | ✅     | Kritik  | Full screen incoming call                                     |
| [x] `ParticipantGrid`            | ✅     | Yüksek  | Multi-participant layout (Guest dahil)                        |
| [x] `LiveChat`                   | ✅     | Orta    | Chat UI with rate limit                                       |
| [x] `GiftOverlay`                | ✅     | Orta    | Reanimated particle animations                                |

### 3.5 Ekranlar

| Görev                        | Durum | Öncelik | Notlar                           |
| ---------------------------- | ----- | ------- | -------------------------------- |
| [x] Live Session List        | ✅     | Kritik  | FlatList + Realtime              |
| [x] Creator Broadcast Screen | ✅     | Kritik  | Camera preview + settings        |
| [x] Viewer Watch Screen      | ✅     | Kritik  | Hook'lar genişletildi, hazır     |
| [x] Audio Room Screen        | ✅     | Yüksek  | Speaker/listener UI              |
| [x] Call Screen              | ✅     | Yüksek  | In-call UI                       |
| [x] Incoming Call Screen     | ✅     | Kritik  | Accept/Reject (Component olarak) |
| [x] Missed Call Screen       | ✅     | Orta    | Call back + dismiss + profile    |

---

## Faz 4: İş Mantığı ve Entegrasyonlar

### 4.1 Erişim Kontrolü

| Görev                | Durum | Öncelik | Notlar                          |
| -------------------- | ----- | ------- | ------------------------------- |
| [x] Public erişim    | ✅     | Kritik  | join-live-session'da implement  |
| [x] Subscribers only | ✅     | Yüksek  | `creator_subscriptions` check   |
| [x] Pay-per-view     | ✅     | Yüksek  | Coin kesimi + `live_payments`   |
| [x] Ban kontrolü     | ✅     | Orta    | Session ban + Creator ban check |

### 4.2 Coin/Ödeme Entegrasyonu

| Görev                     | Durum | Öncelik | Notlar                         |
| ------------------------- | ----- | ------- | ------------------------------ |
| [x] PPV coin kesimi       | ✅     | Yüksek  | join-live-session'da           |
| [x] Hediye coin transferi | ✅     | Yüksek  | send-live-gift (%70 creator)   |
| [x] Creator gelir kaydı   | ✅     | Orta    | live_gifts + coin_transactions |

### 4.3 Bildirimler

| Görev                          | Durum | Öncelik | Notlar                         |
| ------------------------------ | ----- | ------- | ------------------------------ |
| [x] "Creator yayında" push     | ✅     | Yüksek  | notify-live-started            |
| [x] **VoIP Push (Call)**       | ✅     | Kritik  | create-call → send-voip-push   |
| [x] Missed call notification   | ✅     | Orta    | cancel-call/decline-call       |
| [x] Gift received notification | ✅     | Düşük   | send-live-gift → live_messages |

### 4.4 Moderasyon UI

| Görev                        | Durum | Öncelik | Notlar                              |
| ---------------------------- | ----- | ------- | ----------------------------------- |
| [x] Host: Kick/Ban buttons   | ✅     | Orta    | ModerationControls + edge functions |
| [ ] Host: Delete message     | 🔴     | Orta    | Long press → delete                 |
| [x] Host: Promote to speaker | ✅     | Orta    | promote-to-speaker edge function    |
| [x] Report user flow         | ✅     | Orta    | report-live-user edge function      |

---

## Faz 5: Ops Dashboard Bunun İçin ayrı dökümasyon oluşturacaksın, Web ekibi yapacak.

### 5.1 Live Monitoring → [MONITORING.md](./MONITORING.md)

| Görev                    | Durum | Öncelik | Notlar                    |
| ------------------------ | ----- | ------- | ------------------------- |
| [ ] Active sessions list | 🔴     | Orta    | Real-time + "Kill" button |
| [ ] Session detail page  | 🔴     | Orta    | Participants, stats, chat |
| [ ] Quota usage widget   | 🔴     | Yüksek  | % of monthly limit        |
| [ ] Alert configuration  | 🔴     | Orta    | Slack/Discord webhook     |

### 5.2 Moderation Panel → [MODERATION.md](./MODERATION.md)

| Görev                     | Durum | Öncelik | Notlar            |
| ------------------------- | ----- | ------- | ----------------- |
| [ ] Pending reports queue | 🔴     | Orta    | Review + action   |
| [ ] Ban management        | 🔴     | Orta    | View, lift bans   |
| [ ] Session force-close   | 🔴     | Orta    | Admin kill switch |

### 5.3 Analytics

| Görev                         | Durum | Öncelik | Notlar            |
| ----------------------------- | ----- | ------- | ----------------- |
| [ ] Daily/weekly usage charts | 🔴     | Düşük   | Chart.js          |
| [ ] Top creators by hours     | 🔴     | Düşük   | Leaderboard       |
| [ ] Call logs                 | 🔴     | Düşük   | Duration, outcome |

---

## Faz 6: Test & QA → [TEST_STRATEGY.md](./TEST_STRATEGY.md)

### 6.1 Unit & Integration Tests

| Görev                        | Durum | Öncelik | Notlar          |
| ---------------------------- | ----- | ------- | --------------- |
| [ ] Edge function unit tests | 🔴     | Yüksek  | Deno test       |
| [ ] Mobile hooks tests       | 🔴     | Yüksek  | Jest + mocks    |
| [ ] RLS policy tests         | 🔴     | Yüksek  | pgTAP or manual |

### 6.2 E2E & Load Tests

| Görev                        | Durum | Öncelik | Notlar           |
| ---------------------------- | ----- | ------- | ---------------- |
| [ ] Maestro/Detox E2E        | 🔴     | Orta    | Happy path flows |
| [ ] Token endpoint load test | 🔴     | Yüksek  | k6 script        |
| [ ] 50 viewer load test      | 🔴     | Yüksek  | `lk load-test`   |

### 6.3 Network & Edge Cases

| Görev                     | Durum | Öncelik | Notlar                   |
| ------------------------- | ----- | ------- | ------------------------ |
| [ ] 3G network test       | 🔴     | Orta    | Network Link Conditioner |
| [ ] WiFi → 4G switch test | 🔴     | Orta    | Reconnection             |
| [ ] Host disconnect test  | 🔴     | Yüksek  | 30sn wait behavior       |
| [ ] Background audio test | 🔴     | Kritik  | iOS + Android            |

---

## Faz 7: Recording & VOD (Opsiyonel)

### 7.1 LiveKit Egress

| Görev                          | Durum | Öncelik | Notlar                  |
| ------------------------------ | ----- | ------- | ----------------------- |
| [ ] Egress SDK araştırma       | 🔴     | Düşük   | Room composite vs track |
| [ ] `start-recording` function | 🔴     | Düşük   | Manual trigger          |
| [ ] Auto-record config         | 🔴     | Düşük   | CreateRoom options      |

### 7.2 Storage & VOD

| Görev                      | Durum | Öncelik | Notlar               |
| -------------------------- | ----- | ------- | -------------------- |
| [ ] Storage bucket (S3/R2) | 🔴     | Düşük   | 30 gün retention     |
| [ ] VOD playback UI        | 🔴     | Düşük   | Video player         |
| [ ] "Recording" indicator  | 🔴     | Düşük   | Viewer bilgilendirme |

---

## Faz 8: Production Checklist

### 8.1 Security

| Görev                        | Durum | Öncelik | Notlar              |
| ---------------------------- | ----- | ------- | ------------------- |
| [ ] Rate limiting aktif      | 🔴     | Kritik  | Token endpoint      |
| [ ] RLS policies audit       | 🔴     | Kritik  | Performance advisor |
| [ ] Webhook signature verify | 🔴     | Yüksek  | HMAC                |

### 8.2 Monitoring

| Görev                     | Durum | Öncelik | Notlar                |
| ------------------------- | ----- | ------- | --------------------- |
| [ ] Sentry entegrasyonu   | 🔴     | Yüksek  | Error tracking        |
| [ ] Quota alerts          | 🔴     | Yüksek  | %75, %90 thresholds   |
| [ ] Health check endpoint | 🔴     | Orta    | `/api/health/livekit` |

### 8.3 Documentation

| Görev                      | Durum | Öncelik | Notlar                       |
| -------------------------- | ----- | ------- | ---------------------------- |
| [ ] Runbook tamamla        | 🔴     | Orta    | → [RUNBOOK.md](./RUNBOOK.md) |
| [ ] Ops training           | 🔴     | Orta    | Dashboard kullanımı          |
| [ ] Incident response plan | 🔴     | Orta    | Eskalasyon akışı             |

---

## Faz 9: Gelişmiş Özellikler (Yeni)

### 9.1 Creator Yayın Ayarları

| Görev                        | Durum | Öncelik | Notlar                                   |
| ---------------------------- | ----- | ------- | ---------------------------------------- |
| [x] Video kalitesi seçimi    | ✅     | Orta    | 360p/540p/720p/1080p presets             |
| [ ] Kamera seçimi            | 🔴     | Düşük   | Birden fazla kamera varsa                |
| [x] Noise suppression toggle | ✅     | Orta    | Gürültü bastırma açma/kapama             |
| [x] Echo cancellation toggle | ✅     | Orta    | Yankı engelleme açma/kapama              |
| [x] Auto gain control toggle | ✅     | Orta    | Otomatik ses seviyesi                    |
| [ ] Simulcast açma/kapama    | 🔴     | Düşük   | Farklı kalite katmanları                 |
| [x] Ayarlar modal UI         | ✅     | Orta    | BroadcastSettings component geliştirildi |

### 9.2 Realtime Text & Data (LiveKit Data Channels)

| Görev                      | Durum | Öncelik | Notlar                               |
| -------------------------- | ----- | ------- | ------------------------------------ |
| [ ] Text Streams           | 🔴     | Yüksek  | Chat için `sendText` / `streamText`  |
| [ ] Byte Streams           | 🔴     | Orta    | Dosya/resim paylaşımı                |
| [ ] RPC (Remote Procedure) | 🔴     | Orta    | Participant'lar arası method çağrısı |
| [ ] Data Packets           | 🔴     | Düşük   | Low-level lossy/reliable data        |
| [ ] Typing indicator       | 🔴     | Düşük   | "X yazıyor..." göstergesi            |

### 9.3 Screen Sharing

| Görev                          | Durum | Öncelik | Notlar                         |
| ------------------------------ | ----- | ------- | ------------------------------ |
| [ ] iOS ReplayKit entegrasyonu | 🔴     | Orta    | In-app capture                 |
| [ ] iOS Broadcast Extension    | 🔴     | Düşük   | Full screen share (background) |
| [ ] Android MediaProjection    | 🔴     | Orta    | Screen capture permission      |
| [ ] Screen share UI            | 🔴     | Orta    | Start/stop button + indicator  |

### 9.4 Gelişmiş Audio/Video

| Görev                        | Durum | Öncelik | Notlar                                 |
| ---------------------------- | ----- | ------- | -------------------------------------- |
| [x] Active Speaker Detection | ✅     | Yüksek  | `isSpeaking` + `ActiveSpeakersChanged` |
| [ ] Volume control           | 🔴     | Orta    | `track.setVolume(0-1)`                 |
| [ ] Video quality selector   | 🔴     | Orta    | İzleyici tarafı LOW/MEDIUM/HIGH        |
| [ ] Background voice cancel  | 🔴     | Düşük   | LiveKit Cloud BVC model                |
| [ ] Hi-Fi audio mode         | 🔴     | Düşük   | Müzik yayını için 510kbps stereo       |

### 9.5 Mevcut Implementasyon (Tamamlandı)

| Özellik             | Durum | Değer                                   |
| ------------------- | ----- | --------------------------------------- |
| [x] Video Capture   | ✅     | 720p @ 30fps, facingMode: user          |
| [x] Audio Capture   | ✅     | echoCancellation, noiseSuppression, AGC |
| [x] Simulcast       | ✅     | h360 + h180 katmanları                  |
| [x] Adaptive Stream | ✅     | Otomatik kalite ayarı                   |
| [x] Dynacast        | ✅     | Bant genişliği optimizasyonu            |
| [x] DTX             | ✅     | Sessizlikte tasarruf                    |
| [x] Audio RED       | ✅     | Paket kaybına karşı yedekli encoding    |
| [x] Torch/Flash     | ✅     | Preview modunda arka kamerada flaş      |
| [x] Camera Flip     | ✅     | Ön/arka kamera değiştirme               |


---

## Teknik Notlar

### Environment Variables

```env
# LiveKit Cloud (Supabase Edge Functions için)
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_URL=wss://your-project.livekit.cloud

# Mobil uygulama için
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Alerting (opsiyonel)
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
```

### LiveKit Cloud Webhook URL

```
https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/livekit-webhook
```

### Room Naming Pattern → [ROOM_NAMING.md](./ROOM_NAMING.md)

```
live_video_{session_uuid}     # Canlı video
audio_room_{session_uuid}     # Sesli oda
call_video_{call_uuid}_{ts}   # Görüntülü çağrı
call_audio_{call_uuid}_{ts}   # Sesli çağrı
```

### Mevcut İlgili Tablolar

- `profiles` - `is_creator`, `role`, `banned_until`
- `creator_subscriptions` - Abone kontrolü için
- `coin_transactions` - Ödeme kayıtları (mevcut mu kontrol et)
- `gifts` - Hediye tanımları (planlayacağız)

---

## Riskler ve Bağımlılıklar

| Risk                      | Etki              | Çözüm              | Referans                                   |
| ------------------------- | ----------------- | ------------------ | ------------------------------------------ |
| Expo Go desteği yok       | Dev build gerekli | EAS Build          | -                                          |
| Free plan: 100 concurrent | Scale sorunu      | Ship plan ($49/ay) | [LIMITS_QUALITY.md](./LIMITS_QUALITY.md)   |
| Free plan: 5000 min/ay    | Hızlı tükenir     | Kota takibi        | [MONITORING.md](./MONITORING.md)           |
| VoIP push (iOS)           | Background call   | PushKit + CallKeep | [ANALYSIS_REPORT.md](./ANALYSIS_REPORT.md) |
| Host disconnect           | Orphan session    | Webhook + cron     | [ERROR_STATES.md](./ERROR_STATES.md)       |
| Network switch            | Bağlantı kopması  | Auto-reconnect     | [ERROR_STATES.md](./ERROR_STATES.md)       |

---

## Döküman Referansları

### Teknik Dökümanlar
- [DATABASE.md](./DATABASE.md) - Veritabanı şema tasarımı
- [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md) - Edge function implementasyonları
- [MOBILE-INTEGRATION.md](./MOBILE-INTEGRATION.md) - Mobil entegrasyon rehberi
- [ROOM_NAMING.md](./ROOM_NAMING.md) - Room isimlendirme stratejisi
- [GUEST_COHOST.md](./GUEST_COHOST.md) - Konuk davet ve co-host sistemi

### Operasyonel Dökümanlar
- [ERROR_STATES.md](./ERROR_STATES.md) - Hata senaryoları ve state machine
- [LIMITS_QUALITY.md](./LIMITS_QUALITY.md) - Kotalar ve kalite profilleri
- [MODERATION.md](./MODERATION.md) - Moderasyon politikası
- [MONITORING.md](./MONITORING.md) - Metrikler ve alarmlar
- [RUNBOOK.md](./RUNBOOK.md) - Operasyonel prosedürler

### Test & UX
- [TEST_STRATEGY.md](./TEST_STRATEGY.md) - Test ortamları ve senaryoları
- [MOBILE_UX_STATES.md](./MOBILE_UX_STATES.md) - Mobile UI state'leri

### Analiz
- [ANALYSIS_REPORT.md](./ANALYSIS_REPORT.md) - Eksiklik analizi ve öneriler

### External
- [LiveKit Docs](https://docs.livekit.io)
- [LiveKit React Native SDK](https://github.com/livekit/client-sdk-react-native)
- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
