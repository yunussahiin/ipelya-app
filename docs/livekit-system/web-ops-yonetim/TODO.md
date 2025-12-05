# LiveKit Web Ops Dashboard - TODO

> Web Admin Dashboard için detaylı görev listesi ve implementasyon planı

**Oluşturulma Tarihi:** 2025-12-06  
**Son Güncelleme:** 2025-12-06  
**Durum:** ✅ Tamamlandı (Faz 1-6, 8 Tamamlandı - Faz 7 Test Aşaması)

---

## 📋 Genel Bakış

Bu TODO dosyası, İpelya platformunun LiveKit Web Admin Dashboard modülünün geliştirme aşamalarını içerir.

### Referans Dökümanlar

| Döküman                                                        | Açıklama                                        | Öncelik  |
| -------------------------------------------------------------- | ----------------------------------------------- | -------- |
| [WEB_ADMIN_DASHBOARD.md](./WEB_ADMIN_DASHBOARD.md)             | Dashboard sayfaları, UI tasarımı, SQL sorguları | 🔴 Kritik |
| [LIVEKIT_REACT_INTEGRATION.md](./LIVEKIT_REACT_INTEGRATION.md) | LiveKit React SDK entegrasyonu, canlı izleme    | 🔴 Kritik |
| [../MODERATION.md](../MODERATION.md)                           | Kick, ban, moderasyon politikaları              | 🟡 Yüksek |
| [../EDGE-FUNCTIONS.md](../EDGE-FUNCTIONS.md)                   | Edge function yapısı ve API'ler                 | 🟡 Yüksek |
| [../DATABASE.md](../DATABASE.md)                               | Veritabanı şeması ve RLS policies               | 🟡 Yüksek |
| [../MONITORING.md](../MONITORING.md)                           | Metrikler, alarmlar, kota takibi                | 🟢 Orta   |

---

## Faz 1: Veritabanı Hazırlığı

> **Referans:** DATABASE.md, MODERATION.md

### 1.1 Eksik Tabloların Oluşturulması

| Görev                         | Durum | Öncelik | Tablo             | Açıklama                       |
| ----------------------------- | ----- | ------- | ----------------- | ------------------------------ |
| [x] `live_reports` tablosu    | ✅     | Kritik  | `live_reports`    | Şikayet/incident yönetimi için |
| [x] `live_admin_logs` tablosu | ✅     | Kritik  | `live_admin_logs` | Admin işlem logları            |

### 1.2 Mevcut Tabloların Kontrolü

| Görev                          | Durum | Öncelik | Notlar                        |
| ------------------------------ | ----- | ------- | ----------------------------- |
| [x] `live_sessions` mevcut     | ✅     | -       | Tüm alanlar hazır             |
| [x] `live_participants` mevcut | ✅     | -       | Rol ve durum alanları mevcut  |
| [x] `live_messages` mevcut     | ✅     | -       | is_deleted soft delete mevcut |
| [x] `live_session_bans` mevcut | ✅     | -       | Session/permanent ban desteği |
| [x] `admin_profiles` mevcut    | ✅     | -       | is_super_admin flag mevcut    |
| [x] `calls` mevcut             | ✅     | -       | 1-1 çağrı kayıtları           |

---

## Faz 2: API Endpoints (Next.js Route Handlers)

> **Referans:** WEB_ADMIN_DASHBOARD.md → API Endpoints bölümü  
> **Konum:** `/apps/web/app/api/ops/live/`

### 2.1 Session Management

| Görev                            | Durum | Öncelik | Endpoint                                   | Metod |
| -------------------------------- | ----- | ------- | ------------------------------------------ | ----- |
| [x] Aktif oturumları listele     | ✅     | Kritik  | `/api/ops/live/sessions`                   | GET   |
| [x] Oturum detayı getir          | ✅     | Kritik  | `/api/ops/live/sessions/[id]`              | GET   |
| [x] Oturum katılımcılarını getir | ✅     | Kritik  | `/api/ops/live/sessions/[id]/participants` | GET   |
| [x] Oturum mesajlarını getir     | ✅     | Yüksek  | `/api/ops/live/sessions/[id]/messages`     | GET   |
| [x] Oturumu zorla sonlandır      | ✅     | Kritik  | `/api/ops/live/sessions/[id]/terminate`    | POST  |
| [x] Duyuru gönder                | ✅     | Orta    | `/api/ops/live/sessions/[id]/announce`     | POST  |

### 2.2 Participant Management

| Görev                        | Durum | Öncelik | Endpoint                                  | Metod |
| ---------------------------- | ----- | ------- | ----------------------------------------- | ----- |
| [x] Katılımcıyı çıkar (kick) | ✅     | Kritik  | `/api/ops/live/participants/[id]/kick`    | POST  |
| [x] Katılımcıyı banla        | ✅     | Kritik  | `/api/ops/live/participants/[id]/ban`     | POST  |
| [x] Rol yükselt              | ✅     | Orta    | `/api/ops/live/participants/[id]/promote` | POST  |
| [x] Rol düşür                | ✅     | Orta    | `/api/ops/live/participants/[id]/demote`  | POST  |

### 2.3 Moderation

| Görev                   | Durum | Öncelik | Endpoint                            | Metod  |
| ----------------------- | ----- | ------- | ----------------------------------- | ------ |
| [x] Şikayet listesi     | ✅     | Yüksek  | `/api/ops/live/reports`             | GET    |
| [x] Şikayet detayı      | ✅     | Yüksek  | `/api/ops/live/reports/[id]`        | GET    |
| [x] Şikayete aksiyon al | ✅     | Yüksek  | `/api/ops/live/reports/[id]/action` | POST   |
| [x] Ban listesi         | ✅     | Yüksek  | `/api/ops/live/bans`                | GET    |
| [x] Ban kaldır          | ✅     | Orta    | `/api/ops/live/bans/[id]`           | DELETE |

### 2.4 Analytics

| Görev                      | Durum | Öncelik | Endpoint                           | Metod |
| -------------------------- | ----- | ------- | ---------------------------------- | ----- |
| [x] Özet istatistikler     | ✅     | Orta    | `/api/ops/live/analytics/overview` | GET   |
| [x] Günlük veriler         | ✅     | Orta    | `/api/ops/live/analytics/daily`    | GET   |
| [x] Creator istatistikleri | ✅     | Orta    | `/api/ops/live/analytics/creators` | GET   |

### 2.5 LiveKit Token (Admin için)

| Görev                  | Durum | Öncelik | Endpoint                      | Metod |
| ---------------------- | ----- | ------- | ----------------------------- | ----- |
| [x] Admin viewer token | ✅     | Kritik  | `/api/ops/live/livekit-token` | POST  |

---

## Faz 3: UI Sayfaları

> **Referans:** WEB_ADMIN_DASHBOARD.md → Dashboard Sayfaları bölümü  
> **Konum:** `/apps/web/app/ops/(private)/live/`

### 3.1 Sayfa Yapısı

| Görev                         | Durum | Öncelik | Sayfa                     | Dosya                         |
| ----------------------------- | ----- | ------- | ------------------------- | ----------------------------- |
| [x] Live ana layout           | ✅     | Kritik  | Layout                    | `live/layout.tsx`             |
| [x] Live Overview (Ana sayfa) | ✅     | Kritik  | `/ops/live`               | `live/page.tsx`               |
| [x] Session Detail            | ✅     | Kritik  | `/ops/live/sessions/[id]` | `live/sessions/[id]/page.tsx` |
| [x] Moderation Panel          | ✅     | Yüksek  | `/ops/live/moderation`    | `live/moderation/page.tsx`    |
| [x] Analytics Dashboard       | ✅     | Orta    | `/ops/live/analytics`     | `live/analytics/page.tsx`     |
| [x] System Logs (Webhook)     | ✅     | Orta    | `/ops/live/logs`          | `live/logs/page.tsx`          |
| [x] Quota & Alerts            | ✅     | Orta    | `/ops/live/alerts`        | `live/alerts/page.tsx`        |

### 3.2 Sidebar Menü Ekleme

| Görev                             | Durum | Öncelik | Notlar                |
| --------------------------------- | ----- | ------- | --------------------- |
| [x] "Canlı Yayın" menü grubu ekle | ✅     | Kritik  | AppSidebar'a eklendi  |
| [x] Menü ikonları (Tabler)        | ✅     | Orta    | IconCamera kullanıldı |

---

## Faz 4: UI Components

> **Referans:** LIVEKIT_REACT_INTEGRATION.md  
> **Konum:** `/apps/web/components/ops/live/`

### 4.1 LiveKit Paket Kurulumu

| Görev                          | Durum | Öncelik | Paket                               |
| ------------------------------ | ----- | ------- | ----------------------------------- |
| [x] @livekit/components-react  | ✅     | Kritik  | pnpm add @livekit/components-react  |
| [x] @livekit/components-styles | ✅     | Kritik  | pnpm add @livekit/components-styles |
| [x] livekit-client             | ✅     | Kritik  | pnpm add livekit-client             |

### 4.2 Core Components

| Görev                | Durum | Öncelik | Component               | Açıklama                       |
| -------------------- | ----- | ------- | ----------------------- | ------------------------------ |
| [x] StatsCards       | ✅     | Kritik  | `stats-cards.tsx`       | Aktif session, viewer sayıları |
| [x] SessionsTable    | ✅     | Kritik  | `sessions-table.tsx`    | Aktif oturumlar tablosu        |
| [x] CallsTable       | ✅     | Yüksek  | `calls-table.tsx`       | Aktif çağrılar tablosu         |
| [x] ParticipantsList | ✅     | Kritik  | `participants-list.tsx` | Katılımcı listesi              |
| [x] ChatMessages     | ✅     | Yüksek  | `chat-messages.tsx`     | Son chat mesajları             |

### 4.3 LiveKit Preview Components

| Görev                   | Durum | Öncelik | Component                  | Açıklama            |
| ----------------------- | ----- | ------- | -------------------------- | ------------------- |
| [x] SessionPreview      | ✅     | Kritik  | `session-preview.tsx`      | Video yayını izleme |
| [x] AudioRoomPreview    | ✅     | Kritik  | `audio-room-preview.tsx`   | Sesli oda izleme    |
| [x] VolumeControl       | ✅     | Yüksek  | `volume-control.tsx`       | Ses kontrolü slider |
| [x] ConnectionIndicator | ✅     | Orta    | `connection-indicator.tsx` | Bağlantı kalitesi   |
| [x] SpeakingIndicator   | ✅     | Orta    | `speaking-indicator.tsx`   | Konuşan göstergesi  |

### 4.4 Moderation Components

| Görev                 | Durum | Öncelik | Component                 | Açıklama                      |
| --------------------- | ----- | ------- | ------------------------- | ----------------------------- |
| [x] ModerationActions | ✅     | Kritik  | `moderation-actions.tsx`  | Kick/Ban/Terminate butonları  |
| [x] ReportsQueue      | ✅     | Yüksek  | `reports-queue.tsx`       | Bekleyen şikayetler           |
| [x] ReportDetailModal | ✅     | Yüksek  | `report-detail-modal.tsx` | Şikayet detay modalı (Dialog) |
| [x] BansTable         | ✅     | Yüksek  | `bans-table.tsx`          | Aktif banlar tablosu          |
| [x] TerminateDialog   | ✅     | Kritik  | `terminate-dialog.tsx`    | Oturum kapatma onay           |

### 4.5 Analytics Components

| Görev                  | Durum | Öncelik | Component                  | Açıklama               |
| ---------------------- | ----- | ------- | -------------------------- | ---------------------- |
| [x] DailySessionsChart | ✅     | Orta    | `daily-sessions-chart.tsx` | Günlük oturum grafiği  |
| [x] TopCreatorsTable   | ✅     | Orta    | `top-creators-table.tsx`   | En aktif creator'lar   |
| [x] SessionTypesPie    | ✅     | Orta    | `session-types-pie.tsx`    | Oturum türü dağılımı   |
| [x] QuotaUsageCard     | ✅     | Yüksek  | `quota-usage-card.tsx`     | LiveKit kota kullanımı |

---

## Faz 5: Hooks & State Management

> **Konum:** `/apps/web/hooks/ops/live/`

### 5.1 React Query Hooks

| Görev                 | Durum | Öncelik | Hook                     | Açıklama            |
| --------------------- | ----- | ------- | ------------------------ | ------------------- |
| [x] useActiveSessions | ✅     | Kritik  | `use-active-sessions.ts` | Aktif oturumları al |
| [x] useSessionDetail  | ✅     | Kritik  | `use-session-detail.ts`  | Oturum detayı al    |
| [x] useParticipants   | ✅     | Kritik  | `use-participants.ts`    | Katılımcıları al    |
| [x] useLiveMessages   | ✅     | Yüksek  | `use-live-messages.ts`   | Chat mesajlarını al |
| [x] useReports        | ✅     | Yüksek  | `use-reports.ts`         | Şikayetleri al      |
| [x] useBans           | ✅     | Yüksek  | `use-bans.ts`            | Banları al          |
| [x] useAnalytics      | ✅     | Orta    | `use-analytics.ts`       | İstatistikleri al   |

### 5.2 Realtime Hooks (Supabase)

| Görev                       | Durum | Öncelik | Hook                           | Açıklama                         |
| --------------------------- | ----- | ------- | ------------------------------ | -------------------------------- |
| [x] useRealtimeSessions     | ✅     | Kritik  | `use-realtime-sessions.ts`     | Oturum değişikliklerini dinle    |
| [x] useRealtimeParticipants | ✅     | Kritik  | `use-realtime-participants.ts` | Katılımcı değişikliklerini dinle |

### 5.3 Mutation Hooks

| Görev                   | Durum | Öncelik | Hook                       | Açıklama           |
| ----------------------- | ----- | ------- | -------------------------- | ------------------ |
| [x] useKickParticipant  | ✅     | Kritik  | `use-kick-participant.ts`  | Katılımcı çıkarma  |
| [x] useBanParticipant   | ✅     | Kritik  | `use-ban-participant.ts`   | Katılımcı banlama  |
| [x] useTerminateSession | ✅     | Kritik  | `use-terminate-session.ts` | Oturum sonlandırma |
| [x] useHandleReport     | ✅     | Yüksek  | `use-handle-report.ts`     | Şikayet işleme     |

---

## Faz 6: Admin Token & Live Preview

> **Referans:** LIVEKIT_REACT_INTEGRATION.md

### 6.1 Token Endpoint

| Görev                        | Durum | Öncelik | Notlar                            |
| ---------------------------- | ----- | ------- | --------------------------------- |
| [x] Admin token endpoint     | ✅     | Kritik  | `/api/ops/live/livekit-token`     |
| [x] Hidden participant grant | ✅     | Kritik  | `hidden: true, canPublish: false` |
| [x] Admin auth kontrolü      | ✅     | Kritik  | admin_profiles.is_active check    |

### 6.2 Preview Implementation

| Görev                   | Durum | Öncelik | Notlar                         |
| ----------------------- | ----- | ------- | ------------------------------ |
| [x] LiveKitRoom wrapper | ✅     | Kritik  | Token + serverUrl ile bağlantı |
| [x] VideoTrack render   | ✅     | Kritik  | Host video gösterimi           |
| [x] RoomAudioRenderer   | ✅     | Kritik  | Tüm sesleri çal (volume: 0.5)  |
| [x] Katılımcı listesi   | ✅     | Yüksek  | useParticipants hook           |
| [x] Konuşan göstergesi  | ✅     | Orta    | isSpeaking property            |

---

## Faz 7: Testler - sonra test edeceğiz.

> **Referans:** ../TEST_STRATEGY.md

### 7.1 Unit Tests

| Görev               | Durum | Öncelik | Test                         |
| ------------------- | ----- | ------- | ---------------------------- |
| [ ] API route tests | 🟡     | Yüksek  | Jest + MSW                   |
| [ ] Hook tests      | 🟡     | Yüksek  | @testing-library/react-hooks |
| [ ] Component tests | 🟢     | Orta    | @testing-library/react       |

### 7.2 Integration Tests

| Görev                   | Durum | Öncelik | Test       |
| ----------------------- | ----- | ------- | ---------- |
| [ ] Session flow E2E    | 🟢     | Orta    | Playwright |
| [ ] Moderation flow E2E | 🟢     | Orta    | Playwright |

---

## Faz 8: Deployment Checklist

| Görev                                  | Durum | Öncelik | Notlar                |
| -------------------------------------- | ----- | ------- | --------------------- |
| [x] LiveKit paketleri production build | ✅     | Kritik  | pnpm build başarılı   |
| [x] Environment variables              | ✅     | Kritik  | Tüm env'ler mevcut    |
| [x] Admin auth middleware              | ✅     | Kritik  | Layout'ta kontrol var |
| [x] Error handling                     | ✅     | Yüksek  | Toast + try/catch     |
| [x] Loading states                     | ✅     | Orta    | Loading state'ler var |

---

## 📁 Dosya Yapısı (Planlanan)

```
apps/web/
├── app/
│   ├── api/
│   │   └── ops/
│   │       └── live/
│   │           ├── sessions/
│   │           │   ├── route.ts                    # GET: Aktif oturumlar
│   │           │   └── [id]/
│   │           │       ├── route.ts                # GET: Oturum detayı
│   │           │       ├── participants/route.ts   # GET: Katılımcılar
│   │           │       ├── messages/route.ts       # GET: Mesajlar
│   │           │       └── terminate/route.ts      # POST: Zorla kapat
│   │           ├── participants/
│   │           │   └── [id]/
│   │           │       ├── kick/route.ts           # POST: Kick
│   │           │       └── ban/route.ts            # POST: Ban
│   │           ├── reports/
│   │           │   ├── route.ts                    # GET: Şikayetler
│   │           │   └── [id]/
│   │           │       ├── route.ts                # GET: Şikayet detayı
│   │           │       └── action/route.ts         # POST: Aksiyon al
│   │           ├── bans/
│   │           │   ├── route.ts                    # GET: Banlar
│   │           │   └── [id]/route.ts               # DELETE: Ban kaldır
│   │           ├── analytics/
│   │           │   ├── overview/route.ts           # GET: Özet
│   │           │   ├── daily/route.ts              # GET: Günlük
│   │           │   └── creators/route.ts           # GET: Creators
│   │           └── livekit-token/route.ts          # POST: Admin token
│   │
│   └── ops/
│       └── (private)/
│           └── live/
│               ├── layout.tsx                      # Live layout
│               ├── page.tsx                        # Overview
│               ├── sessions/
│               │   └── [id]/
│               │       └── page.tsx                # Session detail
│               ├── moderation/
│               │   └── page.tsx                    # Moderation panel
│               ├── analytics/
│               │   └── page.tsx                    # Analytics
│               ├── logs/
│               │   └── page.tsx                    # System logs
│               └── alerts/
│                   └── page.tsx                    # Quota & alerts
│
├── components/
│   └── ops/
│       └── live/
│           ├── index.ts                            # Barrel export
│           ├── stats-cards.tsx                     # Özet kartlar
│           ├── sessions-table.tsx                  # Oturum tablosu
│           ├── calls-table.tsx                     # Çağrı tablosu
│           ├── participants-list.tsx               # Katılımcılar
│           ├── chat-messages.tsx                   # Chat
│           ├── session-preview.tsx                 # Video preview
│           ├── audio-room-preview.tsx              # Audio preview
│           ├── volume-control.tsx                  # Ses kontrolü
│           ├── connection-indicator.tsx            # Bağlantı
│           ├── speaking-indicator.tsx              # Konuşan
│           ├── moderation-actions.tsx              # Moderasyon
│           ├── reports-queue.tsx                   # Şikayetler
│           ├── report-detail-modal.tsx             # Şikayet modal
│           ├── bans-table.tsx                      # Banlar
│           ├── terminate-dialog.tsx                # Sonlandırma
│           ├── daily-sessions-chart.tsx            # Grafik
│           ├── top-creators-table.tsx              # Top creators
│           ├── session-types-pie.tsx               # Pie chart
│           └── quota-usage-card.tsx                # Kota
│
└── hooks/
    └── ops/
        └── live/
            ├── index.ts                            # Barrel export
            ├── use-active-sessions.ts
            ├── use-session-detail.ts
            ├── use-participants.ts
            ├── use-live-messages.ts
            ├── use-reports.ts
            ├── use-bans.ts
            ├── use-analytics.ts
            ├── use-realtime-sessions.ts
            ├── use-realtime-participants.ts
            ├── use-kick-participant.ts
            ├── use-ban-participant.ts
            ├── use-terminate-session.ts
            └── use-handle-report.ts
```

---

## 📝 Notlar

### Önemli Kararlar

1. **Hidden Participant:** Admin yayına katıldığında `hidden: true` grant ile görünmez olacak
2. **Ses Kontrolü:** Varsayılan ses seviyesi %50, admin ayarlayabilir
3. **Realtime:** Supabase Realtime ile oturum/katılımcı değişiklikleri anlık takip edilecek
4. **Auth:** Tüm endpoint'ler `admin_profiles.is_active` kontrolü yapacak

### Bağımlılıklar

- Faz 2 (API) → Faz 1 (DB) tabloları gerektirir
- Faz 3 (UI) → Faz 2 (API) endpoint'leri gerektirir
- Faz 4 (Components) → Faz 3 (UI) sayfaları gerektirir
- Faz 6 (Preview) → LiveKit paketleri kurulu olmalı

---

## 🔄 Güncelleme Geçmişi

| Tarih      | Değişiklik               | Yazan |
| ---------- | ------------------------ | ----- |
| 2025-12-06 | İlk versiyon oluşturuldu | AI    |
