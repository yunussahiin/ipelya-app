# İpelya Home Feed - Web Ops Yönetim Paneli

## 📚 Genel Bakış

Bu döküman, **Home Feed sisteminin Web Ops panelinden yönetimi** için gerekli tüm bilgileri içerir. Ops paneli üzerinden feed algoritması, içerik moderasyonu, analytics ve sistem ayarları yönetilir.

> **Not:** Bu döküman Home Feed sistemine özeldir. Genel ops panel dökümanları için `/docs/ops/` klasörüne bakın.

---

## 🎯 Home Feed Ops Özellikleri

### 1. Feed Algorithm Yönetimi
- **Scoring weights** - Base, vibe, intent, social graph ağırlıkları
- **Vibe parameters** - Mood uyumluluk matrisi ayarları
- **Intent parameters** - Intent-content type eşleştirme
- **Diversity settings** - İçerik türü dağılımı
- **A/B testing** - Algoritma deneyleri

### 2. Content Moderation
- **Moderation queue** - AI tarafından işaretlenen içerikler
- **Manual review** - Manuel inceleme gerektiren içerikler
- **Bulk actions** - Toplu onaylama/reddetme/gizleme
- **AI scores** - Toxicity, NSFW, spam skorları
- **User reports** - Kullanıcı şikayetleri

### 3. Feed Analytics
- **Engagement metrics** - Like, comment, share oranları
- **Algorithm performance** - Vibe/Intent match başarı oranları
- **Content distribution** - İçerik türü dağılımı
- **User behavior** - Dwell time, scroll depth
- **Daily snapshots** - Günlük performans raporları

### 4. Notification Management ✅ (Mevcut Sistem)
- **Bulk notifications** - Toplu bildirim gönderme
- **Scheduled notifications** - Zamanlanmış bildirimler
- **Templates** - Bildirim şablonları
- **History** - Bildirim geçmişi
- **Analytics** - Delivery, open, click rates
- **Cleanup** - Eski bildirimleri temizleme

### 5. User Management ✅ (Mevcut Sistem)
- **User profiles** - Profil görüntüleme ve düzenleme
- **Creators** - Creator kullanıcıları yönetimi
- **Banned users** - Yasaklı kullanıcılar
- **User detail modal** - Detaylı kullanıcı bilgisi

### 6. Shadow Profile Monitoring ✅ (Mevcut Sistem)
- **Shadow users** - Shadow profil kullanıcıları
- **Sessions** - Aktif oturumlar
- **Audit logs** - İşlem logları
- **Anomalies** - Anormal davranış tespiti
- **Rate limits** - Rate limit konfigürasyonu
- **Config** - Shadow sistem ayarları

---

## 📖 Döküman İndeksi

| Döküman                                                    | Açıklama                         |
| ---------------------------------------------------------- | -------------------------------- |
| [WEB-OPS-TODO.md](./WEB-OPS-TODO.md)                       | **Todo List** - Tüm yapılacaklar |
| [01-WEB-OPS-ARCHITECTURE.md](./01-WEB-OPS-ARCHITECTURE.md) | Sistem mimarisi                  |
| [05-WEB-OPS-DATABASE.md](./05-WEB-OPS-DATABASE.md)         | Database tabloları               |

---

## 🗄️ Database Tabloları (Home Feed Ops)

### Mevcut Tablolar

| Tablo                    | Amaç                                                       | Durum |
| ------------------------ | ---------------------------------------------------------- | ----- |
| `algorithm_configs`      | Algoritma parametreleri (weights, vibe, intent, diversity) | ✅ Var |
| `moderation_queue`       | İçerik moderasyon kuyruğu                                  | ✅ Var |
| `feed_analytics`         | Günlük feed performans metrikleri                          | ✅ Var |
| `notification_campaigns` | Toplu bildirim kampanyaları                                | ✅ Var |
| `notification_templates` | Bildirim şablonları                                        | ✅ Var |
| `notification_logs`      | Bildirim delivery logları                                  | ✅ Var |

---

## ⚙️ Edge Functions (Home Feed)

### Feed İşlemleri
| Function                  | Amaç                            |
| ------------------------- | ------------------------------- |
| `get-feed`                | Ana feed endpoint (algorithmic) |
| `calculate-feed-scores`   | Feed skorlama hesaplaması       |
| `analyze-content-quality` | İçerik kalite analizi           |

### Content İşlemleri
| Function              | Amaç                |
| --------------------- | ------------------- |
| `create-post`         | Post oluşturma      |
| `create-mini-post`    | Mini post oluşturma |
| `create-poll`         | Anket oluşturma     |
| `create-voice-moment` | Ses paylaşımı       |
| `moderate-content`    | AI moderasyon       |

### Interaction İşlemleri
| Function                    | Amaç          |
| --------------------------- | ------------- |
| `like-post`                 | Post beğenme  |
| `comment-post`              | Yorum yapma   |
| `like-comment`              | Yorum beğenme |
| `share-post`                | Paylaşma      |
| `vote-poll` / `unvote-poll` | Anket oylama  |

### User İşlemleri
| Function            | Amaç                      |
| ------------------- | ------------------------- |
| `update-vibe`       | Kullanıcı mood güncelleme |
| `update-intent`     | Dating intent güncelleme  |
| `get-suggestions`   | Profil önerileri          |
| `send-crystal-gift` | Dijital hediye gönderme   |

---

## 🎛️ Algoritma Yönetimi

### Scoring Weights (algorithm_configs)

```typescript
// config_type: 'weights'
interface ScoringWeights {
  base: number;      // 0.30 - Temel ilgi skoru
  vibe: number;      // 0.25 - Mood uyumu
  intent: number;    // 0.25 - Intent eşleşmesi
  social: number;    // 0.20 - Sosyal graf
}
```

### Vibe Matrix (algorithm_configs)

```typescript
// config_type: 'vibe'
interface VibeMatrix {
  energetic: { energetic: 1.0, social: 0.8, creative: 0.7, ... };
  chill: { chill: 1.0, creative: 0.8, ... };
  social: { social: 1.0, energetic: 0.8, ... };
  creative: { creative: 1.0, chill: 0.8, ... };
  adventurous: { adventurous: 1.0, energetic: 0.9, ... };
}
```

### Intent Matrix (algorithm_configs)

```typescript
// config_type: 'intent'
interface IntentMatrix {
  meet_new: { post: 0.8, mini_post: 0.7, poll: 0.9, ... };
  activity_partner: { post: 0.9, voice_moment: 0.8, ... };
  flirt: { post: 0.9, mini_post: 0.8, ... };
  serious_relationship: { post: 0.95, ... };
}
```

### Diversity Settings (algorithm_configs)

```typescript
// config_type: 'diversity'
interface DiversitySettings {
  post: 10;           // Her 20 içerikte max 10 post
  mini_post: 4;       // Her 20 içerikte max 4 mini post
  voice_moment: 3;    // Her 20 içerikte max 3 voice moment
  poll: 3;            // Her 20 içerikte max 3 anket
}
```

---

## �️ Content Moderation

### Moderation Queue Yapısı

```typescript
interface ModerationQueueItem {
  id: string;
  content_type: 'post' | 'mini_post' | 'voice_moment' | 'poll' | 'comment';
  content_id: string;
  user_id: string;
  
  // Öncelik ve sebep
  priority: number;  // 0-10, yüksek = acil
  reason: 'ai_flagged' | 'user_reported' | 'manual_review';
  
  // AI Skorları
  toxicity_score: number;   // 0-1
  nsfw_score: number;       // 0-1
  spam_score: number;       // 0-1
  
  // Raporlar
  report_count: number;
  report_reasons: string[];
  
  // Durum
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'escalated';
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: string;
  notes?: string;
}
```

### Moderasyon Akışı

```
1. İçerik Oluşturulur
   ↓
2. AI Moderasyon (moderate-content)
   - toxicity_score > 0.7 → moderation_queue'ya ekle
   - nsfw_score > 0.8 → moderation_queue'ya ekle
   - spam_score > 0.6 → moderation_queue'ya ekle
   ↓
3. Ops Panel'de İnceleme
   - Approve → is_hidden = false
   - Reject → is_hidden = true, moderation_status = 'rejected'
   - Escalate → priority artır, üst yöneticiye bildir
   ↓
4. Audit Log Kaydı
```

---

## 📊 Feed Analytics

### Daily Snapshot (feed_analytics)

```typescript
interface FeedAnalytics {
  date: string;
  
  // Engagement
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  engagement_rate: number;  // (likes + comments + shares) / views
  
  // User Behavior
  avg_dwell_time: number;      // saniye
  avg_session_length: number;  // saniye
  
  // Content Distribution
  posts_count: number;
  mini_posts_count: number;
  voice_moments_count: number;
  polls_count: number;
  
  // Algorithm Performance
  vibe_match_success_rate: number;   // 0-1
  intent_match_success_rate: number; // 0-1
}
```

---

## 🏗️ Ops Panel Sayfa Yapısı

### Mevcut Sayfalar ✅

```
/ops/(private)/
├── page.tsx                    # Dashboard
├── content/
│   └── page.tsx               # İçerik moderasyonu (temel)
├── notifications/              # ✅ Bildirim yönetimi
│   ├── page.tsx               # Overview
│   ├── send/                  # Bildirim gönderme
│   ├── templates/             # Şablonlar
│   ├── history/               # Geçmiş
│   ├── analytics/             # Analytics
│   └── cleanup/               # Temizlik
├── users/                      # ✅ Kullanıcı yönetimi
│   ├── page.tsx               # Kullanıcı listesi
│   ├── creators/              # Creator'lar
│   └── banned/                # Yasaklı kullanıcılar
├── shadow/                     # ✅ Shadow profil yönetimi
│   ├── page.tsx               # Overview
│   ├── users/                 # Shadow kullanıcılar
│   ├── sessions/              # Aktif oturumlar
│   ├── audit-logs/            # İşlem logları
│   ├── anomalies/             # Anomali tespiti
│   ├── rate-limits/           # Rate limit config
│   ├── config/                # Sistem config
│   └── analytics/             # Shadow analytics
├── economy/                    # ✅ Ekonomi yönetimi
├── security/                   # Güvenlik
├── settings/                   # Ayarlar
└── account/                    # Hesap
```

### Yapılacak Sayfalar (Home Feed Ops) 🆕

```
/ops/(private)/
├── feed/                      # 🆕 Feed yönetimi
│   ├── page.tsx              # Feed overview
│   ├── algorithm/            # Algoritma ayarları
│   │   ├── page.tsx          # Algorithm overview
│   │   ├── weights/          # Scoring weights
│   │   ├── vibe/             # Vibe matrix
│   │   ├── intent/           # Intent matrix
│   │   └── diversity/        # Diversity settings
│   ├── moderation/           # Content moderation (Home Feed)
│   │   ├── page.tsx          # Moderation overview
│   │   ├── queue/            # Moderation queue
│   │   └── reports/          # User reports
│   ├── analytics/            # Feed analytics
│   │   ├── page.tsx          # Analytics overview
│   │   ├── engagement/       # Engagement metrics
│   │   ├── content/          # Content distribution
│   │   └── algorithm/        # Algorithm performance
│   ├── experiments/          # A/B Testing
│   │   ├── page.tsx          # Experiments list
│   │   └── [id]/             # Experiment detail
│   └── live/                 # Real-time stats
│       └── page.tsx          # Live dashboard
```

---

## 🔗 İlgili Dökümanlar

- [Home Feed System Architecture](../01-SYSTEM-ARCHITECTURE.md)
- [Database Schema](../02-DATABASE-SCHEMA.md)
- [Algorithm & Scoring](../05-ALGORITHM-SCORING.md)
- [Security & Moderation](../06-SECURITY-MODERATION.md)
- [Feed System Todo List](../feed-system-todo-list.md)

---

**Son Güncelleme:** 2025-11-27
**Durum:** Döküman güncellendi ✅
