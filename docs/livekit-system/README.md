# İpelya LiveKit System

> LiveKit Cloud + Supabase entegrasyonu ile canlı yayın, sesli oda ve 1-1 çağrı sistemi

## Genel Bakış

İpelya uygulamasında medya altyapısı için **LiveKit Cloud** kullanılmaktadır. Bu sistem aşağıdaki özellikleri sağlar:

| Özellik                | Açıklama                                  | Durum       |
| ---------------------- | ----------------------------------------- | ----------- |
| **Canlı Video Yayını** | Creator → İzleyiciler (1-N)               | 🔴 Planlandı |
| **Sesli Odalar**       | Çoklu katılımcı, speaker/listener rolleri | 🔴 Planlandı |
| **1-1 Çağrılar**       | Sesli ve görüntülü özel görüşmeler        | 🔴 Planlandı |

## Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBİL UYGULAMA                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ React Native │  │  LiveKit RN  │  │  Supabase Client     │   │
│  │    Expo      │  │     SDK      │  │  (Auth + Realtime)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE EDGE FUNCTIONS                     │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ get-livekit-token│  │ create-session  │  │ end-session    │  │
│  └──────────────────┘  └─────────────────┘  └────────────────┘  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ join-session     │  │ initiate-call   │  │ answer-call    │  │
│  └──────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                                        │
           ▼                                        ▼
┌────────────────────────┐            ┌────────────────────────────┐
│    LIVEKIT CLOUD       │            │    SUPABASE DATABASE       │
│  ┌──────────────────┐  │            │  ┌──────────────────────┐  │
│  │   WebRTC Rooms   │  │            │  │   live_sessions      │  │
│  │   Media Server   │  │            │  │   live_participants  │  │
│  │   Global Edge    │  │            │  │   live_messages      │  │
│  └──────────────────┘  │            │  │   calls              │  │
└────────────────────────┘            │  └──────────────────────┘  │
                                      └────────────────────────────┘
```

## Temel Kavramlar

### 1. Roller ve Yetkiler

| Rol        | Yayın (Publish) | Dinleme (Subscribe) | Kullanım Alanı       |
| ---------- | --------------- | ------------------- | -------------------- |
| `host`     | ✅ Video + Audio | ✅                   | Canlı yayın creator  |
| `co_host`  | ✅ Video + Audio | ✅                   | Ortak sunucu         |
| `speaker`  | ✅ Sadece Audio  | ✅                   | Sesli oda konuşmacı  |
| `viewer`   | ❌               | ✅                   | Canlı yayın izleyici |
| `listener` | ❌               | ✅                   | Sesli oda dinleyici  |

### 2. Erişim Türleri

| Erişim Tipi        | Açıklama        | Kontrol Mekanizması             |
| ------------------ | --------------- | ------------------------------- |
| `public`           | Herkese açık    | Hiçbir kontrol yok              |
| `subscribers_only` | Sadece aboneler | `creator_subscriptions` tablosu |
| `pay_per_view`     | Ücretli erişim  | Coin kontrolü + ödeme kaydı     |

### 3. Oturum Tipleri

| Tip          | Açıklama            | Medya         |
| ------------ | ------------------- | ------------- |
| `video_live` | Canlı video yayını  | Video + Audio |
| `audio_room` | Sesli oda           | Sadece Audio  |
| `video_call` | 1-1 görüntülü çağrı | Video + Audio |
| `audio_call` | 1-1 sesli çağrı     | Sadece Audio  |

## Mevcut Durum

### ✅ Hazır Olan
- LiveKit Cloud hesabı ve API credentials (env'de mevcut)
- Supabase altyapısı
- `profiles` tablosu (`is_creator`, `role` alanları)
- `creator_subscriptions` tablosu

### 🔴 Oluşturulması Gereken
- LiveKit tabloları (`live_sessions`, `live_participants`, vb.)
- Edge Functions (token üretimi, oturum yönetimi)
- Mobil SDK entegrasyonu
- RLS Policies

## Dosya Yapısı

```
docs/livekit-system/
├── README.md                 # Bu dosya - Genel bakış
├── ANALYSIS_REPORT.md        # Eksiklik analizi ve öneriler
├── IMPLEMENTATION.md         # Yüksek seviye mimari referansı
│
├── 📦 Teknik Dökümanlar
├── DATABASE.md               # Veritabanı şema tasarımı
├── EDGE-FUNCTIONS.md         # Edge functions detayları
├── MOBILE-INTEGRATION.md     # Mobil entegrasyon rehberi
├── ROOM_NAMING.md            # Room naming stratejisi
├── GUEST_COHOST.md           # Konuk davet ve co-host sistemi
│
├── 🔧 Operasyonel Dökümanlar
├── ERROR_STATES.md           # Hata senaryoları ve state machine
├── LIMITS_QUALITY.md         # Kotalar, bitrate, süre limitleri
├── MODERATION.md             # Ban, kick, moderasyon politikası
├── MONITORING.md             # Metrikler ve alarm yapılandırması
├── RUNBOOK.md                # Operasyonel prosedürler
│
├── 🧪 Test & UX
├── TEST_STRATEGY.md          # Test ortamları ve senaryoları
├── MOBILE_UX_STATES.md       # Mobile UI state'leri
│
└── TODO.md                   # Detaylı görev listesi
```

## Hızlı Başvuru

### LiveKit Cloud Dashboard
- URL: https://cloud.livekit.io
- Plan: Build (Free) → Gerektiğinde Ship'e yükselt

### Önemli Linkler
- [LiveKit Expo Quickstart](https://docs.livekit.io/home/quickstarts/expo.md)
- [Token Generation](https://docs.livekit.io/home/server/generating-tokens.md)
- [Webhooks](https://docs.livekit.io/home/server/webhooks.md)

### Environment Variables
```env
LIVEKIT_API_KEY=xxx
LIVEKIT_API_SECRET=xxx
LIVEKIT_URL=wss://xxx.livekit.cloud
```

## Sonraki Adımlar

### Faz 1: Altyapı
1. Veritabanı tablolarını oluştur → [DATABASE.md](./DATABASE.md)
2. Edge Functions deploy et → [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md)
3. Webhook handler'ı yapılandır

### Faz 2: Mobil Entegrasyon
1. LiveKit SDK kurulumu → [MOBILE-INTEGRATION.md](./MOBILE-INTEGRATION.md)
2. Hooks ve components geliştirme
3. Background audio + VoIP push (kritik!) → [ANALYSIS_REPORT.md](./ANALYSIS_REPORT.md)

### Faz 3: Operasyonel Hazırlık
1. Monitoring dashboard → [MONITORING.md](./MONITORING.md)
2. Moderasyon sistemi → [MODERATION.md](./MODERATION.md)
3. Ops runbook hazırlığı → [RUNBOOK.md](./RUNBOOK.md)

### Faz 4: Test & QA
1. Test ortamı kurulumu → [TEST_STRATEGY.md](./TEST_STRATEGY.md)
2. Load testing
3. Network condition tests

### Faz 5: Recording (Opsiyonel)
- LiveKit Egress entegrasyonu
- VOD depolama stratejisi

**Detaylı görev listesi için:** [TODO.md](./TODO.md)
