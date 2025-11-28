# İpelya Home Feed - Web Ops Todo List

## 📋 Genel Bakış

Bu todo-list, Home Feed sisteminin Web Ops panelinden yönetimi için gerekli tüm geliştirmeleri içerir.

> **Referans:** Mobile feed implementasyonu için bkz: [feed-system-todo-list.md](../feed-system-todo-list.md)

---

## 🎯 Mevcut Durum Analizi

### ✅ Hazır Sistemler

| Sistem                         | Durum | Lokasyon                          |
| ------------------------------ | ----- | --------------------------------- |
| Notification Management        | ✅ Tam | `/ops/(private)/notifications/`   |
| User Management                | ✅ Tam | `/ops/(private)/users/`           |
| Shadow Profile Monitoring      | ✅ Tam | `/ops/(private)/shadow/`          |
| Content Moderation (Home Feed) | ✅ Tam | `/ops/(private)/feed/moderation/` |
| Economy Management             | ✅ Tam | `/ops/(private)/economy/`         |
| Feed Viewer                    | ✅ Tam | `/ops/(private)/feed/viewer/`     |
| Feed Algorithm (Weights)       | ✅ Tam | `/ops/(private)/feed/algorithm/`  |
| Storage Management             | ✅ Tam | `/ops/(private)/storage/`         |

### ⏳ Yapılacak Sistemler

| Sistem                         | Öncelik      | Bağımlılık                 |
| ------------------------------ | ------------ | -------------------------- |
| Feed Algorithm Management      | ✅ Tamamlandı | `algorithm_configs` table  |
| Feed Analytics Dashboard       | ✅ Tamamlandı | `feed_analytics` table     |
| Content Moderation (Home Feed) | ✅ Tamamlandı | `moderation_actions` table |
| Feed Viewer (Instagram tarzı)  | ✅ Tamamlandı | `ops-get-feed` edge fn     |
| Moderation Logs (TanStack)     | ✅ Tamamlandı | `moderation_actions` table |
| Storage Analytics              | ✅ Tamamlandı | Supabase Storage API       |
| A/B Testing Management         | 🟡 Orta       | `algorithm_configs` table  |
| Real-time Stats                | 🟡 Orta       | Supabase Realtime          |
| Vibe Matrix Editor             | 🟡 Orta       | `algorithm_configs` table  |
| Intent Matrix Editor           | 🟡 Orta       | `algorithm_configs` table  |

---

## Phase 1: Feed Algorithm Management ✅

### 1.1 Scoring Weights Sayfası ✅
- [x] `/ops/(private)/feed/algorithm/weights/page.tsx` oluştur
- [x] Slider components (base, vibe, intent, social weights)
- [x] Real-time preview (örnek feed skorlaması)
- [x] Save/Reset buttons
- [x] `algorithm_configs` table'a kaydet (config_type: 'weights')
- [x] API route (`/api/ops/feed/algorithm/weights`)
- [ ] Audit log kaydı

### 1.0 Feed Viewer Sayfası ✅
- [x] `/ops/(private)/feed/viewer/page.tsx` oluştur
- [x] Instagram tarzı kart görünümü
- [x] `ops-get-feed` edge function (admin için özel)
- [x] Filtreleme (content_type, status)
- [x] Infinite scroll
- [x] Quick moderation actions
- [x] ModerationBadge component
- [x] ModerationDialog component
- [x] Post/MiniPost/Poll/VoiceMoment kartları

### 1.5 Feed Overview Sayfası ✅
- [x] `/ops/(private)/feed/page.tsx` oluştur
- [x] Feed istatistikleri
- [x] Hızlı erişim kartları

### 1.6 Feed Moderation Sayfası ✅
- [x] `/ops/(private)/feed/moderation/page.tsx` oluştur
- [x] Moderation overview
- [x] Moderation logs sayfası
- [x] TanStack Table ile gelişmiş data table
- [x] Sıralama, filtreleme, sayfalama
- [x] Kolon görünürlüğü kontrolü
- [x] Detay modalı
- [x] İşlem değiştirme özelliği
- [x] Yönetim notu (admin_note) - sadece adminler görür
- [x] Moderasyon geçmişi

### 1.7 Feed Analytics Sayfası ✅
- [x] `/ops/(private)/feed/analytics/page.tsx` oluştur
- [x] Engagement metrikleri
- [x] İçerik dağılımı

### 1.2 Vibe Matrix Sayfası ✅
- [x] `/ops/(private)/feed/algorithm/vibe/page.tsx` oluştur
- [x] 5x5 matrix editor (energetic, chill, social, creative, adventurous)
- [x] Heatmap visualization
- [x] `algorithm_configs` table'a kaydet (config_type: 'vibe_matrix')
- [x] API route (`/api/ops/feed/algorithm/vibe`)

### 1.3 Intent Matrix Sayfası ✅
- [x] `/ops/(private)/feed/algorithm/intent/page.tsx` oluştur
- [x] Intent-Content type matrix editor
- [x] `algorithm_configs` table'a kaydet (config_type: 'intent_matrix')
- [x] API route (`/api/ops/feed/algorithm/intent`)

### 1.4 Diversity Settings Sayfası ✅
- [x] `/ops/(private)/feed/algorithm/diversity/page.tsx` oluştur
- [x] Content type distribution sliders
- [x] Per-20-items distribution
- [x] `algorithm_configs` table'a kaydet (config_type: 'diversity')
- [x] API route (`/api/ops/feed/algorithm/diversity`)

---

## Phase 2: Content Moderation (Home Feed) ✅

### 2.1 Moderasyon Sistemi ✅
- [x] `moderation_actions` table kullanımı
- [x] `moderation_reason_templates` table (neden şablonları)
- [x] `moderate-content` edge function
- [x] `get-moderation-logs` edge function
- [x] Moderasyon işlemleri: hide, unhide, delete, restore, warn
- [x] Kullanıcıya bildirim gönderme
- [x] Yönetim notu (admin_note) - sadece adminler görür

### 2.2 Moderation Logs Sayfası ✅
- [x] `/ops/(private)/feed/moderation/logs/page.tsx` oluştur
- [x] TanStack Table ile gelişmiş data table
- [x] Sıralama (tarih, admin, işlem türü)
- [x] Filtreleme (işlem türü, içerik türü, bildirim durumu)
- [x] Kullanıcı/Admin arama
- [x] Kolon görünürlüğü kontrolü
- [x] Sayfa başına kayıt seçimi (10/20/30/40/50)
- [x] Detay modalı (tüm bilgiler)
- [x] İşlem değiştirme özelliği
- [x] Admin profil resmi gösterimi

### 2.3 ModerationDialog Component ✅
- [x] İşlem türü seçimi (hide, unhide, delete, restore, warn)
- [x] Neden şablonları dropdown
- [x] Ek açıklama (kullanıcı görür)
- [x] Yönetim notu (sadece adminler görür)
- [x] Bildirim gönderme seçeneği
- [x] Aktif moderasyon gösterimi
- [x] Moderasyon geçmişi

### 2.4 ModerationBadge Component ✅
- [x] Feed kartlarında moderasyon durumu gösterimi
- [x] Gizli/Silindi/Uyarıldı badge'leri
- [x] Detay popover
- [x] Hızlı aksiyonlar

### 2.5 Moderation Queue ✅
- [x] `/ops/(private)/feed/moderation/queue/page.tsx` oluştur
- [x] AI flagged içerikler listesi
- [x] Toxicity, NSFW, Spam skorları gösterimi
- [x] Approve/Reject/Escalate aksiyonları
- [x] Bulk actions (toplu işlemler)
- [x] API routes (`/api/ops/moderation/queue`, `/api/ops/moderation/queue/action`)

---

## Phase 3: Feed Analytics Dashboard ✅

### 3.1 Overview Sayfası ✅
- [x] `/ops/(private)/feed/analytics/page.tsx` oluştur
- [x] Engagement metrikleri
- [x] İçerik dağılımı

### 3.2 Gelecek Geliştirmeler 🟡
- [ ] Daily/Weekly/Monthly view toggle
- [ ] Line chart: Daily engagement trend
- [ ] Bar chart: Content type performance
- [ ] Pie chart: Content distribution
- [ ] Recharts library kullan
- [ ] Algorithm performance metrics
- [ ] Trending posts table
- [ ] Top creators leaderboard

---

## Phase 4: A/B Testing Management ✅

### 4.1 Experiments Sayfası ✅
- [x] `/ops/(private)/feed/experiments/page.tsx` oluştur
- [x] Active experiments list
- [x] Create new experiment dialog
- [x] `algorithm_configs` table (config_type: 'experiment')
- [x] API route (`/api/ops/feed/experiments`)

### 4.2 Experiment Features ✅
- [x] Variant A vs Variant B config
- [x] User allocation percentage (slider)
- [x] Duration settings
- [x] Start/Stop controls
- [x] Results display
- [x] Apply winner config

---

## Phase 5: Real-time Stats ✅

### 5.1 Live Dashboard ✅
- [x] `/ops/(private)/feed/live/page.tsx` oluştur
- [x] Active users count
- [x] Live feed activity
- [x] Real-time engagement
- [x] Simulated live updates (3 saniye interval)
- [x] API route (`/api/ops/feed/live`)

### 5.2 Live Metrics ✅
- [x] Posts per minute
- [x] Likes per minute
- [x] Comments per minute
- [x] Active sessions
- [x] Engagement rate
- [x] Trending content type
- [x] Recent activities feed

---

## Phase 6: API Routes ✅

### 6.1 Algorithm API ✅
- [x] `GET/PUT /api/ops/feed/algorithm/weights` - Weights yönetimi
- [x] `GET/PUT /api/ops/feed/algorithm/vibe` - Vibe matrix
- [x] `GET/PUT /api/ops/feed/algorithm/intent` - Intent matrix
- [x] `GET/PUT /api/ops/feed/algorithm/diversity` - Diversity settings

### 6.2 Moderation API ✅
- [x] `POST /api/ops/moderation/action` - Moderasyon işlemi
- [x] `GET /api/ops/moderation/logs` - Moderasyon logları
- [x] `GET /api/ops/moderation/reasons` - Neden şablonları
- [x] `GET /api/ops/moderation/history` - İçerik moderasyon geçmişi
- [x] `GET /api/ops/moderation/queue` - Moderation queue
- [x] `POST /api/ops/moderation/queue/action` - Queue aksiyonları

### 6.3 Feed API ✅
- [x] `GET /api/ops/feed/viewer` - Feed içerikleri
- [x] `GET /api/ops/feed/experiments` - A/B testleri
- [x] `POST /api/ops/feed/experiments` - Yeni deney oluştur
- [x] `GET /api/ops/feed/live` - Canlı istatistikler
- [x] `GET /api/ops/feed/post-details` - Post detayları
- [x] `GET /api/ops/feed/poll-voters` - Anket oyları

### 6.4 Storage API ✅
- [x] `GET /api/ops/storage` - Bucket listesi
- [x] `GET /api/ops/storage/[bucketId]` - Bucket dosyaları
- [x] `GET /api/ops/storage/[bucketId]/signed-url` - Signed URL
- [x] `GET /api/ops/storage/analytics/top-users` - Top kullanıcılar

---

## Phase 7: Edge Function Entegrasyonları ✅

### Mevcut Edge Functions ✅
| Function              | Amaç       | Durum   |
| --------------------- | ---------- | ------- |
| `ops-get-feed`        | Admin feed | ✅ Aktif |
| `moderate-content`    | Moderasyon | ✅ Aktif |
| `get-moderation-logs` | Log getir  | ✅ Aktif |

### Gelecek Edge Functions 🟡
- [ ] `ops-bulk-moderate` - Toplu moderasyon
- [ ] `ops-get-feed-analytics` - Analytics getir

---

## 📊 Sayfa Yapısı (Güncel)

```
/ops/(private)/
├── page.tsx                          # Dashboard ✅
├── feed/                             # Feed yönetimi ✅
│   ├── page.tsx                      # Feed overview ✅
│   ├── viewer/                       # Feed viewer ✅
│   │   ├── page.tsx                  # Instagram tarzı görünüm
│   │   └── components/               # Kart componentleri
│   ├── algorithm/
│   │   ├── page.tsx                  # Algorithm overview ✅
│   │   ├── weights/page.tsx          # Scoring weights ✅
│   │   ├── vibe/page.tsx             # Vibe matrix 🟡
│   │   ├── intent/page.tsx           # Intent matrix 🟡
│   │   └── diversity/page.tsx        # Diversity settings 🟡
│   ├── moderation/
│   │   ├── page.tsx                  # Moderation overview ✅
│   │   └── logs/page.tsx             # Moderation logs ✅ (TanStack Table)
│   ├── analytics/
│   │   └── page.tsx                  # Analytics overview ✅
│   ├── experiments/                  # A/B Testing 🟡
│   └── live/                         # Real-time stats 🟡
├── storage/                          # Storage yönetimi ✅
│   ├── page.tsx                      # Bucket listesi
│   └── analytics/page.tsx            # Storage analytics
├── notifications/                    # ✅
├── users/                            # ✅
├── shadow/                           # ✅
├── economy/                          # ✅
├── security/                         # ✅
├── settings/                         # ✅
└── account/                          # ✅
```

---

## Durum Özeti

| Phase                         | Durum      | Notlar                           |
| ----------------------------- | ---------- | -------------------------------- |
| Phase 1: Algorithm Management | Tamamlandı | Weights, Vibe, Intent, Diversity |
| Phase 2: Content Moderation   | Tamamlandı | TanStack Table, Queue, Bulk      |
| Phase 3: Analytics Dashboard  | Tamamlandı | Temel metrikler                  |
| Phase 4: A/B Testing          | Tamamlandı | Experiments sayfası              |
| Phase 5: Real-time Stats      | Tamamlandı | Live dashboard                   |
| Phase 6: API Routes           | Tamamlandı | 20+ API endpoint                 |
| Phase 7: Edge Functions       | Tamamlandı | 3 edge function aktif            |

---

## Tamamlanan İşler 

### Algorithm Management
- [x] Scoring Weights Editor
- [x] Vibe Matrix Editor (5x5 heatmap)
- [x] Intent Matrix Editor (4x4)
- [x] Diversity Settings (sliders)

### Content Moderation
- [x] Moderation Logs (TanStack Table)
- [x] Moderation Queue (AI flagged)
- [x] Bulk Actions (toplu işlemler)
- [x] ModerationDialog & ModerationBadge

### Analytics & Monitoring
- [x] Feed Analytics Dashboard
- [x] Real-time Stats (Live Dashboard)
- [x] A/B Testing Management

### Gelecek Geliştirmeler 
- [ ] Recharts ile gelişmiş grafikler
- [ ] User reports sayfası
- [ ] Supabase Realtime entegrasyonu

---

## İlgili Kaynaklar

- [Mobile Feed Todo](../feed-system-todo-list.md)
- [Algorithm & Scoring](../05-ALGORITHM-SCORING.md)
- [Security & Moderation](../06-SECURITY-MODERATION.md)
- [Database Schema](../02-DATABASE-SCHEMA.md)
- [Moderation System](../../moderation-system/README.md)

---

**Son Güncelleme:** 2025-11-28
**Durum:** ✅ TÜM PHASE'LER TAMAMLANDI! Web-Ops Feed yönetimi tam fonksiyonel.
