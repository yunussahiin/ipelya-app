---
title: İPELYA Mobil - Master Sayfa Planı
description: Proje vizyonuna göre tüm mobil sayfaların detaylı planı ve geliştirme sırası
---

# 📱 İPELYA Mobil - Master Sayfa Planı

**Oluşturulma Tarihi**: 18 Kasım 2025  
**Temel Alınan Vizyon**: 15 Kritik Modül + MVP Çıktı Seti  
**Toplam Sayfa**: 45+ sayfa  
**Geliştirme Süresi**: 16-20 hafta (4-5 ay)

---

## 🎯 Proje Vizyonundan Sayfalar

### **15 Kritik Modül → Sayfa Mapping**

| Modül                | Sayfalar                  | Tier |
| -------------------- | ------------------------- | ---- |
| 1. Dual Identity     | (profile)/shadow-mode.tsx | T1   |
| 2. Anti-Screenshot   | (settings)/security.tsx   | T2   |
| 3. Ekonomi           | (economy)/*               | T1   |
| 4. Content Themes    | (creator)/themes.tsx      | T2   |
| 5. Vibe Match        | (feed)/vibe-match.tsx     | T3   |
| 6. AI Fantasy        | (fantasy)/generator.tsx   | T2   |
| 7. ASMR Market       | (asmr)/*                  | T1   |
| 8. Avatar Mode       | (creator)/avatar.tsx      | T3   |
| 9. No-Trace Chat     | (chat)/[id].tsx           | T1   |
| 10. Social Firewall  | (settings)/firewall.tsx   | T2   |
| 11. DMCA Protection  | (settings)/dmca.tsx       | T2   |
| 12. Dual Feed        | (feed)/*                  | T1   |
| 13. News Feed        | (feed)/index.tsx          | T1   |
| 14. Creator Planning | (creator)/schedule.tsx    | T2   |
| 15. App Icon         | (settings)/app-icon.tsx   | T3   |

---

## 📊 Sayfa Yapısı (45+ Sayfa)

### **TIER 1: MVP - ZORUNLU (Sprint 1-2, 4 hafta)**

#### **Auth Stack** `(auth)/` - 3 sayfa
```
✅ login.tsx
   - Email + Password
   - Hata handling
   - Şifremi unuttum linki

✅ register.tsx
   - Email + Password + Confirm
   - Validation
   - Trigger → 2 profile oluşturma

✅ onboarding.tsx (5-step)
   - Step 1: Profil (name, bio, avatar, gender)
   - Step 2: Vibe (mood, style, intensity)
   - Step 3: Shadow PIN (4-6 digit)
   - Step 4: Privacy (ToS, Privacy, Anti-SS, Firewall)
   - Step 5: Complete (welcome bonus)
```

#### **Feed Stack** `(feed)/` - 3 sayfa
```
✅ index.tsx (Dual Feed - Normal)
   - News feed (Futbol, Skorlar, Tech, Kripto)
   - Creator discovery (Vibe Match powered)
   - Pull-to-refresh
   - Infinite scroll

✅ shadow.tsx (Dual Feed - Shadow)
   - Shadow-only content
   - Fantezi kategorileri
   - PPV content preview
   - Subscription status

✅ creator/[id].tsx (Creator Detail)
   - Creator profili
   - Content grid (public/PPV/subscriber)
   - Subscribe button
   - PPV satın alma
   - Mesaj gönderme
   - Vibe badge
```

#### **Chat Stack** `(chat)/` - 2 sayfa
```
✅ index.tsx (DM List)
   - Konuşma listesi
   - Last message preview
   - Unread badge
   - Search

✅ [id].tsx (Conversation)
   - No-trace messaging
   - Auto-delete timer
   - Emoji + sticker
   - Image sharing (encrypted)
   - Typing indicator
```

#### **Economy Stack** `(economy)/` - 3 sayfa
```
✅ shop.tsx (Coin Shop)
   - Paketler: 100, 300, 500, 1000, 5000
   - Fiyat gösterimi
   - Bakiye göstergesi
   - Best value badge

✅ history.tsx (Transaction History)
   - Coin işlemleri
   - PPV satın almalar
   - ASMR satın almalar
   - Subscription renewals
   - Refund requests

✅ checkout.tsx (Payment)
   - Paket seçimi
   - Ödeme yöntemi (Stripe/Iyzico/IAP)
   - Billing address
   - Başarı/Hata ekranı
   - Receipt
```

#### **ASMR Stack** `(asmr)/` - 2 sayfa
```
✅ index.tsx (ASMR Market)
   - ASMR listesi
   - Kategori filtreleme
   - Fiyat filtreleme
   - Search
   - Purchased vs Preview

✅ [id].tsx (ASMR Player)
   - Audio player
   - Waveform
   - Duration
   - Quality selector
   - Download option
   - Creator info
```

#### **Profile Stack** `(profile)/` - 2 sayfa
```
✅ index.tsx (Profile View)
   - Real profile görüntüleme
   - Avatar
   - Bio
   - Stats (followers, following)
   - Edit button

✅ edit.tsx (Profile Edit)
   - Display name
   - Bio
   - Avatar upload
   - Gender
   - Vibe preferences
   - Save button
```

#### **Settings Stack** `(settings)/` - 1 sayfa
```
✅ index.tsx (Settings)
   - Account
   - Notifications
   - Privacy
   - Security
   - About
   - Logout
```

#### **Tab Navigation** - 1 sayfa
```
✅ home.tsx (Main Tab Navigator)
   - Feed tab
   - Chat tab
   - Creator tab (if creator)
   - Profile tab
   - Settings tab
```

**Tier 1 Toplam: 17 sayfa**

---

### **TIER 2: POST-MVP (Sprint 3-4, 4 hafta)**

#### **Creator Stack** `(creator)/` - 5 sayfa
```
⚠️ dashboard.tsx (Creator Dashboard)
   - Revenue overview
   - Subscriber count
   - Content performance
   - Quick actions

⚠️ upload.tsx (Content Upload)
   - Video/Image upload
   - Theme seçimi (12 tema)
   - Visibility (public/subscriber/PPV)
   - Price setting
   - Preview

⚠️ schedule.tsx (Content Scheduling)
   - Takvim görünümü
   - Zamanla yayın
   - Tekrarlayan yayınlar
   - Optimal time suggestions
   - Bildirim ayarları

⚠️ revenue.tsx (Revenue Analytics)
   - Gelir grafiği
   - Kaynak analizi (PPV/Subs/Tips)
   - Payout geçmişi
   - Tax reports

⚠️ themes.tsx (Content Themes)
   - 12 tema seçimi
   - Tema açıklaması
   - Pricing by theme
   - Performance by theme
```

#### **Fantasy Stack** `(fantasy)/` - 2 sayfa
```
⚠️ index.tsx (AI Fantasy List)
   - Generated fantasies
   - Filter by type
   - Favorites
   - History

⚠️ generator.tsx (AI Fantasy Generator)
   - Woman type seçimi
   - Atmosphere seçimi
   - Mood seçimi
   - Scenario level
   - Generate button
   - Loading state
   - Result: story + images + video
```

#### **Live Stack** `(live)/` - 2 sayfa
```
⚠️ index.tsx (Live Streams List)
   - Active streams
   - Upcoming streams
   - Filter by category
   - Viewer count
   - Thumbnail

⚠️ room/[id].tsx (Live Room)
   - Video stream (LiveKit)
   - Chat
   - Viewer count
   - Tip button
   - Follow button
   - Quality selector
```

#### **Settings Stack** `(settings)/` - 3 sayfa
```
⚠️ privacy.tsx (Privacy Settings)
   - Profile visibility
   - Search visibility
   - Block list
   - Muted users

⚠️ security.tsx (Security & Anti-Screenshot)
   - Anti-screenshot logs
   - Device history
   - Login attempts
   - Security alerts

⚠️ firewall.tsx (Social Firewall)
   - Upload contacts
   - Blocked contacts
   - IP blocking
   - Firewall status
```

#### **Profile Stack** `(profile)/` - 1 sayfa
```
⚠️ shadow-mode.tsx (Shadow Mode Toggle)
   - PIN/FaceID input
   - Shadow mode toggle
   - Shadow profile name
   - Deactivation option
   - Animation
```

**Tier 2 Toplam: 13 sayfa**

---

### **TIER 3: ADVANCED (Sprint 5-6, 4 hafta)**

#### **Settings Stack** `(settings)/` - 2 sayfa
```
❌ dmca.tsx (DMCA Management)
   - DMCA reports
   - Report details
   - Takedown status
   - Appeal option

❌ app-icon.tsx (App Icon Customizer)
   - Icon seçimi (Notes, Weather, Tools, etc.)
   - Preview
   - Apply
   - Reset to default
```

#### **Feed Stack** `(feed)/` - 1 sayfa
```
❌ vibe-match.tsx (Vibe Match UI)
   - Vibe seçimi
   - Matching creators
   - Vibe score
   - Personalization settings
```

#### **Creator Stack** `(creator)/` - 1 sayfa
```
❌ avatar.tsx (Avatar Mode)
   - Avatar style seçimi (Anime/Barbie/Realistic)
   - Face upload
   - Lip-sync preview
   - Generate video
   - Download
```

#### **Admin Stack** `(admin)/` - 2 sayfa
```
❌ dashboard.tsx (Admin Dashboard)
   - User stats
   - Revenue overview
   - Reports
   - Moderation queue

❌ content-review.tsx (Content Moderation)
   - Reported content
   - Approve/Reject
   - Send warning
   - Ban user
```

#### **Web Stack** `(web)/` - 1 sayfa
```
❌ landing.tsx (Landing Page)
   - Hero section
   - Features
   - Pricing
   - CTA
   - Footer
```

**Tier 3 Toplam: 7 sayfa**

---

## 🚀 Geliştirme Sırası (Sprint Planı)

### **Sprint 1: Auth & Onboarding (Hafta 1-2)**

**Hedef**: Kullanıcı kaydı ve ilk kurulum

```
Week 1:
- [ ] login.tsx
- [ ] register.tsx
- [ ] Supabase Auth entegrasyonu
- [ ] SecureStore token storage
- [ ] Device info tracking

Week 2:
- [ ] onboarding.tsx (5-step)
- [ ] Profile creation trigger
- [ ] Vibe preferences
- [ ] Shadow PIN setup
- [ ] Privacy acceptance
```

**Çıktı**: Kullanıcı kaydı, onboarding, shadow profile oluşturma

---

### **Sprint 2: Feed & Economy (Hafta 3-4)**

**Hedef**: Ana feed ve coin sistemi

```
Week 3:
- [ ] feed/index.tsx (normal feed)
- [ ] feed/shadow.tsx (shadow feed)
- [ ] News API entegrasyonu
- [ ] Creator discovery
- [ ] Vibe Match (basic)

Week 4:
- [ ] economy/shop.tsx
- [ ] economy/checkout.tsx
- [ ] economy/history.tsx
- [ ] Stripe/Iyzico entegrasyonu
- [ ] Coin balance tracking
```

**Çıktı**: Feed, coin satın alma, ekonomi sistemi

---

### **Sprint 3: Chat & Content (Hafta 5-6)**

**Hedef**: Messaging ve ASMR market

```
Week 5:
- [ ] chat/index.tsx
- [ ] chat/[id].tsx
- [ ] No-trace messaging
- [ ] Realtime messaging
- [ ] Auto-delete timer

Week 6:
- [ ] asmr/index.tsx
- [ ] asmr/[id].tsx
- [ ] ASMR player
- [ ] PPV purchase
- [ ] Audio quality
```

**Çıktı**: Messaging sistemi, ASMR market

---

### **Sprint 4: Creator Tools (Hafta 7-8)**

**Hedef**: Creator dashboard ve content management

```
Week 7:
- [ ] creator/dashboard.tsx
- [ ] creator/upload.tsx
- [ ] creator/themes.tsx
- [ ] Content upload
- [ ] Theme selection

Week 8:
- [ ] creator/schedule.tsx
- [ ] creator/revenue.tsx
- [ ] Scheduling logic
- [ ] Revenue analytics
- [ ] Payout management
```

**Çıktı**: Creator tools, content management

---

### **Sprint 5: Advanced Features (Hafta 9-10)**

**Hedef**: AI features ve security

```
Week 9:
- [ ] fantasy/generator.tsx
- [ ] AI Fantasy generation
- [ ] Prompt engineering
- [ ] Image generation
- [ ] Video generation

Week 10:
- [ ] live/index.tsx
- [ ] live/room/[id].tsx
- [ ] LiveKit integration
- [ ] Real-time streaming
- [ ] Tipping system
```

**Çıktı**: AI Fantasy, Live streaming

---

### **Sprint 6: Security & Polish (Hafta 11-12)**

**Hedef**: Security features ve UI polish

```
Week 11:
- [ ] settings/security.tsx
- [ ] settings/firewall.tsx
- [ ] settings/dmca.tsx
- [ ] Anti-screenshot logging
- [ ] Social firewall
- [ ] DMCA management

Week 12:
- [ ] settings/app-icon.tsx
- [ ] profile/shadow-mode.tsx
- [ ] UI polish
- [ ] Performance optimization
- [ ] Bug fixes
```

**Çıktı**: Security features, app icon customizer

---

### **Sprint 7-8: Advanced & Admin (Hafta 13-16)**

**Hedef**: Advanced features, admin panel, optimization

```
Week 13-14:
- [ ] feed/vibe-match.tsx
- [ ] creator/avatar.tsx
- [ ] Vibe matching algorithm
- [ ] Avatar mode
- [ ] Advanced analytics

Week 15-16:
- [ ] admin/dashboard.tsx
- [ ] admin/content-review.tsx
- [ ] Moderation tools
- [ ] Performance optimization
- [ ] Testing & QA
```

**Çıktı**: Advanced features, admin panel

---

## 📋 MVP Çıktı Seti (Sprint 1-4)

**Zorunlu Sayfalar (17 sayfa)**:

```
✅ Auth
- login.tsx
- register.tsx
- onboarding.tsx (5-step)

✅ Feed
- feed/index.tsx (news + creators)
- feed/shadow.tsx
- feed/creator/[id].tsx

✅ Chat
- chat/index.tsx
- chat/[id].tsx

✅ Economy
- economy/shop.tsx
- economy/history.tsx
- economy/checkout.tsx

✅ ASMR
- asmr/index.tsx
- asmr/[id].tsx

✅ Profile
- profile/index.tsx
- profile/edit.tsx

✅ Settings
- settings/index.tsx

✅ Navigation
- home.tsx (tab navigator)
```

**MVP Hedefleri**:
- ✅ Shadow Profile
- ✅ Creator gelir ekonomisi
- ✅ ASMR + PPV satışları
- ✅ Vibe Match (basic)
- ✅ Social Firewall
- ✅ Anti-screenshot
- ✅ Haber akışı
- ✅ Jeton ekonomisi

**MVP Süresi**: 8 hafta (2 ay)

---

## 🎯 Başlangıç Stratejisi

### **Hafta 1: Foundation (Temel Altyapı)**

**Görevler**:
1. Auth screens (login, register)
2. Supabase Auth setup
3. SecureStore integration
4. Device info tracking
5. Zustand stores (auth, profile, coins)

**Dosyalar**:
```
apps/mobile/app/(auth)/
├── login.tsx
├── register.tsx
└── onboarding.tsx (placeholder)

apps/mobile/src/
├── hooks/useAuthActions.ts (existing)
├── services/secure-store.service.ts (existing)
├── store/auth.store.ts (existing)
└── store/profile.store.ts (existing)
```

**Deliverable**: Kullanıcı kaydı ve login

---

### **Hafta 2: Onboarding (5-Step Flow)**

**Görevler**:
1. Onboarding 5-step UI
2. Form validation (Zod)
3. Profile güncelleme
4. Vibe preferences
5. Shadow PIN setup

**Dosyalar**:
```
apps/mobile/app/(auth)/
└── onboarding.tsx (5-step component)

apps/mobile/src/
├── components/onboarding/
│   ├── ProfileStep.tsx
│   ├── VibeStep.tsx
│   ├── ShadowPinStep.tsx
│   ├── PrivacyStep.tsx
│   └── CompleteStep.tsx
└── hooks/useOnboarding.ts
```

**Deliverable**: Complete onboarding flow

---

### **Hafta 3: Feed (News + Creators)**

**Görevler**:
1. News API integration
2. Creator discovery
3. Dual feed (normal + shadow)
4. Pull-to-refresh
5. Infinite scroll

**Dosyalar**:
```
apps/mobile/app/(feed)/
├── index.tsx (normal feed)
├── shadow.tsx (shadow feed)
└── creator/[id].tsx (creator detail)

apps/mobile/src/
├── hooks/useFeed.ts
├── hooks/useCreatorDetail.ts
└── services/feed.service.ts
```

**Deliverable**: Feed system

---

### **Hafta 4: Economy (Coin Shop)**

**Görevler**:
1. Coin shop UI
2. Stripe/Iyzico integration
3. Payment handling
4. Transaction history
5. Coin balance tracking

**Dosyalar**:
```
apps/mobile/app/(economy)/
├── shop.tsx
├── checkout.tsx
└── history.tsx

apps/mobile/src/
├── hooks/useCoins.ts
└── services/economy.service.ts
```

**Deliverable**: Coin system

---

## 📊 Sayfa Sayısı Özeti

| Tier         | Sprint | Sayfalar | Hafta  | Durum       |
| ------------ | ------ | -------- | ------ | ----------- |
| **MVP**      | 1-4    | 17       | 8      | 🚀 **BAŞLA** |
| **Post-MVP** | 5-6    | 13       | 4      | ⏳ Sonra     |
| **Advanced** | 7-8    | 7        | 4      | ⏳ Sonra     |
| **TOPLAM**   | -      | **37**   | **16** | -           |

---

## 🔗 Bağlantılar

**Mevcut Dokümantasyon**:
- `docs/mobile/README.md` - Ana rehber
- `docs/mobile/auth-implementation-guide.md` - Auth detayları
- `docs/mobile/onboarding-flow.md` - Onboarding detayları
- `docs/mobile/profiles-database-schema.md` - Database
- `docs/mobile/QUICK_REFERENCE.md` - Hızlı referans

**Sistem Dokümantasyonu**:
- `docs/system/domain-flows.md` - User flows
- `docs/system/data-platform.md` - Database schema
- `docs/system/application-architecture.md` - Architecture

---

## ✅ Checklist

### **Başlamadan Önce**
- [ ] Tüm dokümantasyonu oku
- [ ] Database schema'yı anla
- [ ] Auth flow'u anla
- [ ] Tech stack'i kur
- [ ] Supabase project'i setup et

### **Sprint 1 (Auth)**
- [ ] login.tsx
- [ ] register.tsx
- [ ] useAuthActions hook
- [ ] SecureStore integration
- [ ] Zustand stores

### **Sprint 2 (Onboarding)**
- [ ] onboarding.tsx (5-step)
- [ ] Form validation
- [ ] Profile creation
- [ ] Vibe preferences
- [ ] Shadow PIN

### **Sprint 3 (Feed)**
- [ ] feed/index.tsx
- [ ] feed/shadow.tsx
- [ ] feed/creator/[id].tsx
- [ ] News API
- [ ] Creator discovery

### **Sprint 4 (Economy)**
- [ ] economy/shop.tsx
- [ ] economy/checkout.tsx
- [ ] economy/history.tsx
- [ ] Stripe/Iyzico
- [ ] Coin tracking

---

## 🎯 Sonraki Adım

**Başlayacağımız Yer**: **Sprint 1 - Auth Screens**

**İlk Görev**: `apps/mobile/app/(auth)/login.tsx` geliştirme

**Tahmini Süre**: 2-3 gün

---

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🚀 **READY TO START**

---

**Başlamaya hazır! 🚀**
