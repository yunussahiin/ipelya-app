---
title: İPELYA Mobil Uygulaması - Sayfa Yapısı ve Geliştirme Yol Haritası
description: Mevcut sayfalar, yapılması gereken sayfalar ve teknik detaylar
---

# İPELYA Mobil Uygulaması - Sayfa Yapısı & Yol Haritası

## 📱 Mevcut Sayfa Yapısı

### 1. **Auth Stack** `(auth)/`
- **login.tsx** - OTP/Email giriş
- **register.tsx** - Yeni hesap oluşturma
- **onboarding.tsx** - İlk kurulum (profil, vibe seçimi, PIN)

### 2. **Feed Stack** `(feed)/`
- **index.tsx** - Ana haber akışı (Sports/Tech/Crypto) + Creator keşfi
- **shadow.tsx** - Shadow mod feed (gölgeli içerik)

### 3. **Chat Stack** `(chat)/`
- **index.tsx** - Mesaj listesi
- **[id].tsx** - Konuşma detayı (No-trace messaging)

### 4. **Creator Stack** `(creator)/`
- **dashboard.tsx** - Creator kontrol paneli
- **upload.tsx** - İçerik yükleme
- **schedule.tsx** - Yayın takvimi
- **revenue.tsx** - Gelir raporları

### 5. **Fantasy Stack** `(fantasy)/`
- **index.tsx** - AI fantezi listesi
- **[id].tsx** - Fantezi detayı

### 6. **ASMR Stack** `(asmr)/`
- **index.tsx** - ASMR ürünleri listesi
- **[id].tsx** - ASMR detayı ve oynatıcı

### 7. **Live Stack** `(live)/`
- **index.tsx** - Canlı yayınlar listesi
- **room/[id].tsx** - Canlı yayın odası (LiveKit)

### 8. **Profile Stack** `(profile)/`
- **index.tsx** - Profil görüntüleme
- **edit.tsx** - Profil düzenleme
- **shadow-pin.tsx** - Shadow PIN ayarı

### 9. **Settings Stack** `(settings)/`
- **index.tsx** - Ayarlar
- **privacy.tsx** - Gizlilik ayarları

### 10. **Tab Navigation**
- **home.tsx** - Ana sayfa (tab navigator)
- **profile.tsx** - Profil tab'ı
- **live.tsx** - Canlı tab'ı
- **flow.tsx** - Akış yönetimi

---

## 🎯 Yapılması Gereken Sayfalar & Özellikler

### **Tier 1: Kritik (MVP)**

#### 1. **Coin Shop / Ekonomi Sayfası** `(economy)/`
```
Sayfa: (economy)/shop.tsx
- Jeton paketleri göster (100, 500, 1000, 5000 coins)
- Stripe/Iyzico entegrasyonu
- Bakiye göstergesi
- Satın alma geçmişi

Sayfa: (economy)/history.tsx
- Coin işlem geçmişi
- Harcama detayları
- Refund yönetimi
```

**Teknik Detay:**
- `packages/api/economy.buyCoin()` Edge Function çağrısı
- Stripe webhook: `stripe-webhook` Edge Function
- Zustand `coins` store güncellemesi
- React Query cache invalidation

---

#### 2. **Shadow Mode Aktivasyon** `(profile)/shadow-mode.tsx`
```
Sayfa: (profile)/shadow-mode.tsx
- PIN/FaceID ile shadow mod açma
- Shadow mod açılışı animasyonu
- Shadow mod kapalı mı açık mı göstergesi
- Deactivation seçeneği
```

**Teknik Detay:**
- `useShadowProfile` hook
- `enable-shadow-mode` Edge Function
- SecureStore PIN hash depolama
- JWT claim güncelleme: `shadow_mode=true`
- RLS politikaları otomatik uygulanır

---

#### 3. **Creator Content Detail** `(feed)/creator/[id].tsx`
```
Sayfa: (feed)/creator/[id].tsx
- Creator profili
- İçerik grid'i (public/PPV/subscriber)
- Subscribe butonu
- PPV satın alma
- Mesaj gönderme
```

**Teknik Detay:**
- RLS: visibility + shadow flag kontrol
- PPV: `buy-ppv` Edge Function
- Signed URL (60 sn TTL)
- Realtime subscription status

---

#### 4. **Coin Satın Alma Onay** `(economy)/checkout.tsx`
```
Sayfa: (economy)/checkout.tsx
- Paket seçimi
- Fiyat gösterimi
- Ödeme yöntemi seçimi
- Stripe/Iyzico modal
- Başarı/Hata ekranı
```

**Teknik Detay:**
- `buy-coins` Edge Function
- Stripe/Iyzico client initialization
- Webhook handling
- Error recovery

---

### **Tier 2: Önemli (Post-MVP)**

#### 5. **Creator Schedule Management** `(creator)/schedule-detail.tsx`
```
Sayfa: (creator)/schedule-detail.tsx
- Takvim görünümü
- Yayın zamanı ayarlama
- Tekrarlayan yayınlar
- Bildirim ayarları
```

**Teknik Detay:**
- `schedule-content` Edge Function
- Cron job: periyodik yayın başlatma
- Realtime notifications

---

#### 6. **Live Room Chat** `(live)/room/[id]/chat.tsx`
```
Sayfa: (live)/room/[id]/chat.tsx
- Canlı yayın sohbeti
- Emoji/sticker desteği
- Moderasyon araçları
- Tipping (coin gönderme)
```

**Teknik Detay:**
- Supabase Realtime channels
- LiveKit messaging API
- Coin transaction: `deduct_coins` RPC

---

#### 7. **DMCA / İçerik Koruma** `(settings)/dmca.tsx`
```
Sayfa: (settings)/dmca.tsx
- DMCA raporları listesi
- Rapor detayı
- İçerik kaldırma talepleri
- Yasal bilgiler
```

**Teknik Detay:**
- `dmca-scan` Edge Function
- Reverse image search
- `dmca_reports` tablo
- RLS: creator-only access

---

#### 8. **Anti-Screenshot Logs** `(settings)/security.tsx`
```
Sayfa: (settings)/security.tsx
- Screenshot/record denemelerini göster
- Cihaz bilgileri
- Tarih/saat
- Engelleme seçenekleri
```

**Teknik Detay:**
- `log-screenshot` Edge Function
- `anti_screenshot_logs` tablo
- RLS: creator-only
- Real-time alerts

---

### **Tier 3: Gelişmiş (Sonrası)**

#### 9. **AI Fantasy Generator UI** `(fantasy)/generator.tsx`
```
Sayfa: (fantasy)/generator.tsx
- Prompt builder
- Stil seçimi (anime, realistic, vibe-based)
- Preview
- Üretim durumu (loading)
- Sonuç galerisi
```

**Teknik Detay:**
- `generate-fantasy` Edge Function
- OpenAI GPT prompt
- Stable Diffusion / Pika / Runway
- Realtime status subscription
- `ai_fantasy_requests` / `ai_fantasy_outputs` tablolar

---

#### 10. **Vibe Match Algorithm UI** `(feed)/vibe-match.tsx`
```
Sayfa: (feed)/vibe-match.tsx
- Vibe seçimi (mood, style, intensity)
- Matching creators listesi
- Vibe score göstergesi
- Kişiselleştirme ayarları
```

**Teknik Detay:**
- `embeddings_profiles` pgvector
- Similarity search: `embedding_vector <-> $user_vector`
- `discovery_feed` logging
- Behavior scoring

---

#### 11. **Creator Revenue Dashboard** `(creator)/analytics.tsx`
```
Sayfa: (creator)/analytics.tsx
- Gelir grafiği (günlük/haftalık/aylık)
- Kaynak analizi (PPV/Subs/Tips)
- Payout geçmişi
- Tax raporları
```

**Teknik Detay:**
- `creator_revenue` tablo
- `creator_payouts` tablo
- Chart library (react-native-chart-kit)
- RLS: creator-only

---

#### 12. **Admin Moderation Panel** `(admin)/`
```
Sayfa: (admin)/dashboard.tsx
- Raporlanan içerik
- Kullanıcı yönetimi
- DMCA aksiyonları
- Analytics

Sayfa: (admin)/content-review.tsx
- İçerik onay/reddetme
- Uyarı gönderme
- Yasaklama
```

**Teknik Detay:**
- RLS: admin-only role check
- `dmca_actions` tablo
- Moderation workflow

---

## 🏗️ Teknik Stack Özeti

### **Frontend**
- **Framework**: Expo + React Native
- **Navigation**: expo-router (file-system routing)
- **State Management**: Zustand (auth, profile, coins, live) + React Query (server state)
- **UI**: Lucide React Native icons, custom components
- **Styling**: React Native StyleSheet + theme provider
- **Media**: expo-av (ASMR), expo-camera, expo-image-picker

### **Backend**
- **Database**: Supabase PostgreSQL + pgvector
- **Auth**: Supabase Auth (OTP)
- **Edge Functions**: Deno runtime
- **Storage**: Supabase Storage buckets
- **Realtime**: Supabase Realtime channels
- **Payments**: Stripe + Iyzico webhooks

### **External Services**
- **Live Streaming**: LiveKit
- **Video Encoding**: Mux
- **AI Generation**: OpenAI (GPT, Image), Stable Diffusion, Pika/Runway
- **Voice**: ElevenLabs (TTS), Whisper (ASR)
- **Security**: Anti-screenshot (UISecureScreen/FLAG_SECURE), DMCA bot

---

## 📊 Sayfa Bağımlılıkları

```
Entry Point (index.tsx)
├── Auth Stack (auth)
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding.tsx
│
├── Main App (home.tsx - Tab Navigator)
│   ├── Feed Tab (feed)
│   │   ├── index.tsx (news + creator discovery)
│   │   ├── shadow.tsx (shadow feed)
│   │   ├── creator/[id].tsx (creator detail + PPV)
│   │   └── vibe-match.tsx (vibe algorithm)
│   │
│   ├── Chat Tab (chat)
│   │   ├── index.tsx (message list)
│   │   └── [id].tsx (conversation detail)
│   │
│   ├── Creator Tab (creator) - if user is creator
│   │   ├── dashboard.tsx
│   │   ├── upload.tsx
│   │   ├── schedule.tsx
│   │   ├── revenue.tsx
│   │   └── analytics.tsx
│   │
│   ├── Fantasy Tab (fantasy)
│   │   ├── index.tsx (list)
│   │   ├── [id].tsx (detail)
│   │   └── generator.tsx (AI generator)
│   │
│   ├── ASMR Tab (asmr)
│   │   ├── index.tsx (list)
│   │   └── [id].tsx (player)
│   │
│   ├── Live Tab (live)
│   │   ├── index.tsx (list)
│   │   └── room/[id].tsx (live room)
│   │
│   ├── Economy (economy)
│   │   ├── shop.tsx (coin packages)
│   │   ├── history.tsx (transaction history)
│   │   └── checkout.tsx (payment)
│   │
│   ├── Profile Tab (profile)
│   │   ├── index.tsx
│   │   ├── edit.tsx
│   │   ├── shadow-pin.tsx
│   │   ├── shadow-mode.tsx
│   │   ├── security.tsx (anti-screenshot logs)
│   │   └── dmca.tsx (DMCA reports)
│   │
│   └── Settings Tab (settings)
│       ├── index.tsx
│       └── privacy.tsx
│
└── Admin (admin) - if user is admin
    ├── dashboard.tsx
    └── content-review.tsx
```

---

## 🚀 Geliştirme Sırası Önerisi

### **Sprint 1: MVP (Ekonomi + Shadow Mode)**
1. Coin Shop sayfası
2. Shadow Mode aktivasyonu
3. Creator Content Detail (PPV)
4. Checkout sayfası

### **Sprint 2: Creator Features**
5. Creator Schedule Management
6. Creator Analytics
7. Revenue Dashboard

### **Sprint 3: Live & Community**
8. Live Room Chat
9. Vibe Match UI
10. ASMR Player improvements

### **Sprint 4: Security & Admin**
11. Anti-Screenshot Logs
12. DMCA Management
13. Admin Moderation Panel

### **Sprint 5: AI & Advanced**
14. AI Fantasy Generator UI
15. Advanced Analytics
16. Recommendation refinements

---

## 📝 Notlar

- **RLS Politikaları**: Tüm sayfalar Supabase RLS ile korunur; shadow flag JWT claim'inde tutulur
- **Realtime**: Chat, live, notifications Supabase Realtime channels kullanır
- **Offline**: React Query ile optimistic updates ve cache management
- **Performance**: Lazy loading, code splitting, image optimization
- **Accessibility**: Safe area handling, color contrast, text scaling

---

## 🔗 İlgili Dokümantasyon

- `docs/system/application-architecture.md` - Mimari genel bakış
- `docs/system/data-platform.md` - Supabase şeması
- `docs/system/domain-flows.md` - Kullanıcı akışları
- `docs/tech/geneltech-stack.md` - Teknoloji stack
- `docs/tech/ İPELYA – UÇTAN UCA APP FLOW.md` - Detaylı akışlar
