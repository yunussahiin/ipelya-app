# İpelya Home Feed - Web Ops Todo List

## 📋 Genel Bakış

Bu todo-list, Home Feed sisteminin Web Ops panelinden yönetimi için gerekli tüm geliştirmeleri içerir.

> **Referans:** Mobile feed implementasyonu için bkz: [feed-system-todo-list.md](../feed-system-todo-list.md)

---

## 🎯 Mevcut Durum Analizi

### ✅ Hazır Sistemler

| Sistem                     | Durum   | Lokasyon                        |
| -------------------------- | ------- | ------------------------------- |
| Notification Management    | ✅ Tam   | `/ops/(private)/notifications/` |
| User Management            | ✅ Tam   | `/ops/(private)/users/`         |
| Shadow Profile Monitoring  | ✅ Tam   | `/ops/(private)/shadow/`        |
| Content Moderation (Temel) | ⚠️ Kısmi | `/ops/(private)/content/`       |
| Economy Management         | ✅ Tam   | `/ops/(private)/economy/`       |

### ⏳ Yapılacak Sistemler

| Sistem                         | Öncelik      | Bağımlılık                |
| ------------------------------ | ------------ | ------------------------- |
| Feed Algorithm Management      | ✅ Tamamlandı | `algorithm_configs` table |
| Feed Analytics Dashboard       | ✅ Tamamlandı | `feed_analytics` table    |
| Content Moderation (Home Feed) | ✅ Tamamlandı | `moderation_queue` table  |
| Feed Viewer (Instagram tarzı)  | ✅ Tamamlandı | `ops-get-feed` edge fn    |
| A/B Testing Management         | 🟡 Orta       | `algorithm_configs` table |
| Real-time Stats                | 🟡 Orta       | Supabase Realtime         |

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

### 1.0 Feed Viewer Sayfası ✅ (YENİ)
- [x] `/ops/(private)/feed/viewer/page.tsx` oluştur
- [x] Instagram tarzı kart görünümü
- [x] `ops-get-feed` edge function (admin için özel)
- [x] Filtreleme (content_type, status)
- [x] Infinite scroll
- [x] Quick moderation actions

### 1.5 Feed Overview Sayfası ✅
- [x] `/ops/(private)/feed/page.tsx` oluştur
- [x] Feed istatistikleri
- [x] Hızlı erişim kartları

### 1.6 Feed Moderation Sayfası ✅
- [x] `/ops/(private)/feed/moderation/page.tsx` oluştur
- [x] Moderation queue
- [x] Pending/Approved/Rejected tabs

### 1.7 Feed Analytics Sayfası ✅
- [x] `/ops/(private)/feed/analytics/page.tsx` oluştur
- [x] Engagement metrikleri
- [x] İçerik dağılımı

### 1.2 Vibe Matrix Sayfası
- [ ] `/ops/(private)/feed/algorithm/vibe/page.tsx` oluştur
- [ ] 5x5 matrix editor (energetic, chill, social, creative, adventurous)
- [ ] Heatmap visualization
- [ ] `algorithm_configs` table'a kaydet (config_type: 'vibe')

**Vibe Types:**
- `energetic` - Enerjik
- `chill` - Sakin
- `social` - Sosyal
- `creative` - Yaratıcı
- `adventurous` - Maceracı

### 1.3 Intent Matrix Sayfası
- [ ] `/ops/(private)/feed/algorithm/intent/page.tsx` oluştur
- [ ] Intent-Content type matrix editor
- [ ] `algorithm_configs` table'a kaydet (config_type: 'intent')

**Intent Types:**
- `meet_new` - Yeni insanlarla tanış
- `activity_partner` - Aktivite partneri bul
- `flirt` - Flört et
- `serious_relationship` - Ciddi ilişki ara

**Content Types:**
- `post` - Normal post
- `mini_post` - Kısa metin
- `voice_moment` - Ses paylaşımı
- `poll` - Anket

### 1.4 Diversity Settings Sayfası
- [ ] `/ops/(private)/feed/algorithm/diversity/page.tsx` oluştur
- [ ] Content type distribution sliders
- [ ] Per-20-items distribution
- [ ] `algorithm_configs` table'a kaydet (config_type: 'diversity')

---

## Phase 2: Content Moderation (Home Feed) 🔴

### 2.1 Moderation Queue Sayfası
- [ ] `/ops/(private)/feed/moderation/queue/page.tsx` oluştur
- [ ] `moderation_queue` table'dan veri çek
- [ ] Filter: content_type, status, priority, reason
- [ ] Bulk actions: approve, reject, escalate
- [ ] AI scores gösterimi (toxicity, nsfw, spam)

**Mevcut `moderation_queue` Table:**
```sql
- id, content_type, content_id, user_id
- priority (0-10), reason (ai_flagged, user_reported, manual_review)
- toxicity_score, nsfw_score, spam_score
- report_count, report_reasons
- status (pending, reviewing, approved, rejected, escalated)
- reviewed_by, reviewed_at, resolution, notes
```

### 2.2 Content Preview Modal
- [ ] Post preview component
- [ ] Mini post preview component
- [ ] Voice moment player
- [ ] Poll preview component
- [ ] User info sidebar
- [ ] Action buttons (approve, reject, hide, delete)

### 2.3 User Reports Sayfası
- [ ] `/ops/(private)/feed/moderation/reports/page.tsx` oluştur
- [ ] Report reasons breakdown
- [ ] Reporter info
- [ ] Reported content preview
- [ ] Action: dismiss, warn user, ban user

### 2.4 Bulk Actions
- [ ] Multi-select checkbox
- [ ] Bulk approve
- [ ] Bulk reject
- [ ] Bulk hide
- [ ] Confirmation modal

---

## Phase 3: Feed Analytics Dashboard 🔴

### 3.1 Overview Sayfası
- [ ] `/ops/(private)/feed/analytics/page.tsx` oluştur
- [ ] `feed_analytics` table'dan veri çek
- [ ] Daily/Weekly/Monthly view toggle
- [ ] Key metrics cards

**Metrics:**
- Total views, likes, comments, shares
- Engagement rate
- Avg dwell time, session length
- Content distribution (posts, mini_posts, voice_moments, polls)

### 3.2 Engagement Charts
- [ ] Line chart: Daily engagement trend
- [ ] Bar chart: Content type performance
- [ ] Pie chart: Content distribution
- [ ] Recharts library kullan

### 3.3 Algorithm Performance
- [ ] Vibe match success rate
- [ ] Intent match success rate
- [ ] A/B test results (varsa)
- [ ] Comparison charts

### 3.4 Content Performance
- [ ] Trending posts table
- [ ] Viral content detection
- [ ] Top creators leaderboard
- [ ] Content quality distribution

---

## Phase 4: A/B Testing Management 🟡

### 4.1 Experiments Sayfası
- [ ] `/ops/(private)/feed/experiments/page.tsx` oluştur
- [ ] Active experiments list
- [ ] Create new experiment
- [ ] `algorithm_configs` table (config_type: 'experiment')

### 4.2 Experiment Detail
- [ ] Variant A vs Variant B config
- [ ] User allocation percentage
- [ ] Start/End dates
- [ ] Results comparison

### 4.3 Experiment Results
- [ ] Engagement comparison
- [ ] Statistical significance
- [ ] Winner declaration
- [ ] Apply winner config

---

## Phase 5: Real-time Stats 🟡

### 5.1 Live Dashboard
- [ ] `/ops/(private)/feed/live/page.tsx` oluştur
- [ ] Supabase Realtime subscription
- [ ] Active users count
- [ ] Live feed activity
- [ ] Real-time engagement

### 5.2 Live Metrics
- [ ] Posts per minute
- [ ] Likes per minute
- [ ] Comments per minute
- [ ] Active sessions

---

## Phase 6: API Routes 🔴

### 6.1 Algorithm API
- [ ] `GET /api/ops/feed/algorithm/weights` - Get current weights
- [ ] `PUT /api/ops/feed/algorithm/weights` - Update weights
- [ ] `GET /api/ops/feed/algorithm/vibe` - Get vibe matrix
- [ ] `PUT /api/ops/feed/algorithm/vibe` - Update vibe matrix
- [ ] `GET /api/ops/feed/algorithm/intent` - Get intent matrix
- [ ] `PUT /api/ops/feed/algorithm/intent` - Update intent matrix
- [ ] `GET /api/ops/feed/algorithm/diversity` - Get diversity settings
- [ ] `PUT /api/ops/feed/algorithm/diversity` - Update diversity settings

### 6.2 Moderation API
- [ ] `GET /api/ops/feed/moderation/queue` - Get queue items
- [ ] `POST /api/ops/feed/moderation/[id]/approve` - Approve content
- [ ] `POST /api/ops/feed/moderation/[id]/reject` - Reject content
- [ ] `POST /api/ops/feed/moderation/[id]/escalate` - Escalate content
- [ ] `POST /api/ops/feed/moderation/bulk` - Bulk actions

### 6.3 Analytics API
- [ ] `GET /api/ops/feed/analytics` - Get analytics data
- [ ] `GET /api/ops/feed/analytics/engagement` - Engagement metrics
- [ ] `GET /api/ops/feed/analytics/content` - Content metrics
- [ ] `GET /api/ops/feed/analytics/algorithm` - Algorithm metrics

---

## Phase 7: Edge Function Entegrasyonları 🟡

### Mevcut Edge Functions (Kullanılacak)
| Function                  | Amaç           | Ops Kullanımı     |
| ------------------------- | -------------- | ----------------- |
| `get-feed`                | Feed getir     | Preview/Test      |
| `calculate-feed-scores`   | Skor hesapla   | Algorithm preview |
| `analyze-content-quality` | Kalite analizi | Moderation        |
| `moderate-content`        | AI moderasyon  | Auto-flag         |

### Yeni Edge Functions (Gerekirse)
- [ ] `ops-get-moderation-queue` - Moderation queue getir
- [ ] `ops-update-algorithm-config` - Config güncelle
- [ ] `ops-get-feed-analytics` - Analytics getir
- [ ] `ops-bulk-moderate` - Toplu moderasyon

---

## 📊 Sayfa Yapısı (Final)

```
/ops/(private)/
├── page.tsx                          # Dashboard (mevcut)
├── feed/                             # 🆕 Feed yönetimi
│   ├── page.tsx                      # Feed overview
│   ├── algorithm/
│   │   ├── page.tsx                  # Algorithm overview
│   │   ├── weights/page.tsx          # Scoring weights
│   │   ├── vibe/page.tsx             # Vibe matrix
│   │   ├── intent/page.tsx           # Intent matrix
│   │   └── diversity/page.tsx        # Diversity settings
│   ├── moderation/
│   │   ├── page.tsx                  # Moderation overview
│   │   ├── queue/page.tsx            # Moderation queue
│   │   └── reports/page.tsx          # User reports
│   ├── analytics/
│   │   ├── page.tsx                  # Analytics overview
│   │   ├── engagement/page.tsx       # Engagement metrics
│   │   ├── content/page.tsx          # Content metrics
│   │   └── algorithm/page.tsx        # Algorithm performance
│   ├── experiments/
│   │   ├── page.tsx                  # A/B tests list
│   │   └── [id]/page.tsx             # Experiment detail
│   └── live/page.tsx                 # Real-time stats
├── content/                          # Mevcut (güncelle)
├── notifications/                    # Mevcut ✅
├── users/                            # Mevcut ✅
├── shadow/                           # Mevcut ✅
├── economy/                          # Mevcut ✅
├── security/                         # Mevcut
├── settings/                         # Mevcut
└── account/                          # Mevcut
```

---

## 🗓️ Tahmini Timeline

| Phase                         | Süre    | Öncelik  |
| ----------------------------- | ------- | -------- |
| Phase 1: Algorithm Management | 2-3 gün | 🔴 Yüksek |
| Phase 2: Content Moderation   | 2-3 gün | 🔴 Yüksek |
| Phase 3: Analytics Dashboard  | 2 gün   | 🔴 Yüksek |
| Phase 4: A/B Testing          | 1-2 gün | 🟡 Orta   |
| Phase 5: Real-time Stats      | 1 gün   | 🟡 Orta   |
| Phase 6: API Routes           | 1-2 gün | 🔴 Yüksek |
| Phase 7: Edge Functions       | 1 gün   | 🟡 Orta   |

**Toplam:** ~10-14 gün

---

## 🔗 İlgili Kaynaklar

- [Mobile Feed Todo](../feed-system-todo-list.md)
- [Algorithm & Scoring](../05-ALGORITHM-SCORING.md)
- [Security & Moderation](../06-SECURITY-MODERATION.md)
- [Database Schema](../02-DATABASE-SCHEMA.md)

---

**Son Güncelleme:** 2025-11-27
**Durum:** Planlama tamamlandı, implementasyon başlayacak
