# 📱 İpelya Mobile App - Tüm Kalan Görevler

**Oluşturulma Tarihi:** 2025-11-30
**Son Güncelleme:** 2025-11-30 19:24 UTC+03:00
**Toplam Kalan Görev:** ~75

---

## 📊 Genel İlerleme Özeti

| Sistem                           | Tamamlanan | Kalan    | Öncelik  |
| -------------------------------- | ---------- | -------- | -------- |
| Shadow Profile (Mobile Realtime) | 0%         | 8 görev  | 🔴 Yüksek |
| Abonelik & Ödeme                 | 80%        | 15 görev | 🔴 Yüksek |
| Yüz Efektleri (Vision Camera)    | 70%        | 12 görev | 🔴 Yüksek |
| Mesaj Sistemi                    | 89%        | 9 görev  | 🟡 Orta   |
| Home Feed                        | 59%        | 18 görev | 🟡 Orta   |
| Bildirim Sistemi                 | 80%        | 12 görev | 🟡 Orta   |
| Genel Entegrasyonlar             | 60%        | 4 görev  | 🟢 Düşük  |

---

## ✅ Son Tamamlanan İşler (2025-11-30)

- [x] **Story Oluşturma Sistemi** ✅
  - [x] `StoryMediaPicker.tsx` - 3 sütun galeri seçici (dikey format)
  - [x] `StoryPreview.tsx` - Önizleme ve paylaşım ekranı
  - [x] `StoryCreator.tsx` - Ana story oluşturma akışı
  - [x] `useCreateStory` hook - API entegrasyonu
  - [x] `create-story` edge function entegrasyonu
  - [x] `stories` bucket upload desteği
  - [x] `media-worker` v13 - Multi-bucket optimizasyon (stories, post-media, message-media)
  - [x] `StoriesRow` - Kendi hikayem üzerine gelme + plus butonu
- [x] `get-feed` Edge Function - Profil bilgileri düzeltildi (v15)
  - `.eq('type', 'real')` filtresi eklendi
  - User objesi artık doğru display_name ve avatar_url döndürüyor
- [x] Comment Sheet API tam entegrasyon
  - `comment-post`, `like-comment`, `get-post-details` edge functions
  - Nested replies, mention sistemi, likers sheet

---

## 🔴 YÜKSEK ÖNCELİK

### 1. Shadow Profile - Mobile Realtime (Web-Ops → Mobile İletişim)

**Kaynak:** `/docs/shadow-profile/mobile/IMPLEMENTATION_TODO.md`
**Tahmini Süre:** 2-3 gün
**Bağımlılık:** Web-Ops API endpoints (✅ tamamlandı)

#### Phase 1: Realtime WebSocket Setup
- [ ] `useOpsRealtime.ts` hook oluştur
  - Supabase channel: `ops:user:{userId}`
  - Event listeners: session_terminated, user_locked, config_updated
- [ ] Hook'u app'e entegre et (`(shadow)/index.tsx`)

#### Phase 2: Session Termination Handler
- [ ] `handleSessionTerminated()` implement et
  - Session'ı local'de sonlandır
  - Shadow mode'u devre dışı bırak
  - Audit log oluştur
  - Kullanıcıya alert göster
- [ ] `session_terminated_by_ops` audit action ekle

#### Phase 3: User Lockout Handler
- [ ] `handleUserLocked()` implement et
  - Shadow mode'u devre dışı bırak
  - Kilitleme süresini göster
  - Audit log oluştur
- [ ] `user_locked_by_ops` audit action ekle

#### Phase 4: Rate Limit Config Sync
- [ ] `rate-limit.service.ts` - Config'i dinamik yap
- [ ] `updateRateLimitConfigDynamic()` fonksiyonu ekle
- [ ] `loadRateLimitConfig()` - App başlangıcında yükle
- [ ] AsyncStorage persistence (opsiyonel)

#### Phase 5: Anomaly Detection Config Sync
- [ ] `anomaly-detection.service.ts` - Config'i dinamik yap
- [ ] `updateAnomalyConfig()` fonksiyonu ekle
- [ ] `getAnomalyConfig()` fonksiyonu ekle

#### Phase 6: Push Notifications (Opsiyonel)
- [ ] `lib/notifications.ts` - Expo Notifications setup
- [ ] Kritik olaylar için local notification gönder
- [ ] Notification response listener

#### Phase 7: Testing
- [ ] Manual testing checklist
- [ ] `useOpsRealtime.test.ts` integration tests

---

### 2. Abonelik & Ödeme Sistemi

**Kaynak:** `/docs/mobile/abonelik-ve-odeme-yonetimi/abonelik-todo-list.md`
**Tahmini Süre:** 5-7 gün
**Bağımlılık:** Faz 1-4 ✅ tamamlandı

#### Faz 5: Store Setup (Apple & Google)
- [ ] **Apple App Store Connect:**
  - [ ] `ipelya_coins_100` (Consumable) oluştur
  - [ ] `ipelya_coins_500` (Consumable) oluştur
  - [ ] `ipelya_coins_1000` (Consumable) oluştur
  - [ ] `ipelya_premium_monthly` (Auto-Renewable) oluştur
  - [ ] `ipelya_premium_yearly` (Auto-Renewable) oluştur
  - [ ] Server Notifications v2 webhook URL ayarla
  - [ ] Sandbox test hesapları oluştur

- [ ] **Google Play Console:**
  - [ ] `ipelya_coins_100` oluştur
  - [ ] `ipelya_coins_500` oluştur
  - [ ] `ipelya_coins_1000` oluştur
  - [ ] `ipelya_premium_monthly` oluştur
  - [ ] `ipelya_premium_yearly` oluştur
  - [ ] RTDN (Real-time Developer Notifications) ayarla
  - [ ] License test hesapları ekle

- [ ] **API Credentials:**
  - [ ] Apple App Store Connect API key oluştur
  - [ ] Google Play Developer API service account oluştur
  - [ ] Supabase secrets'a ekle:
    - [ ] `APPLE_SHARED_SECRET`
    - [ ] `APPLE_ISSUER_ID`
    - [ ] `APPLE_KEY_ID`
    - [ ] `APPLE_PRIVATE_KEY`
    - [ ] `GOOGLE_SERVICE_ACCOUNT_KEY`

#### UI Eksikleri
- [ ] `app/(store)/index.tsx` - Ana mağaza ekranı
- [ ] `app/(store)/coins.tsx` - Coin satın alma ekranı
- [ ] `app/(store)/subscription.tsx` - Abonelik ekranı
- [ ] Profil ekranına coin bakiyesi ekle
- [ ] Profil ekranına abonelik durumu ekle
- [ ] Creator profiline hediye gönder butonu ekle
- [ ] Creator profiline abonelik tier'ları ekle
- [ ] Creator profiline "Abone Ol" butonu ekle

#### Faz 6: Test & QA
- [ ] Unit tests (IAP service, economy store, hooks)
- [ ] Integration tests (purchase flow, gift send/receive)
- [ ] Edge Function tests (verify-purchase, send-gift, webhooks)
- [ ] E2E tests (coin satın alma, abonelik, hediye gönderme)
- [ ] Security tests (receipt replay, double-spend, rate limiting)
- [ ] Cron job tests (process-subscription-renewals)

---

### 3. Yüz Efektleri (Vision Camera)

**Kaynak:** `/docs/mobile/vision-camera/kamera-yuz-effectleri-snapchat-ınstagram-tarzı/yuz-effect-todo.md`
**Tahmini Süre:** 3-4 gün
**Bağımlılık:** Development build gerekli

#### ⚠️ Kritik Sorun
```
TurboModuleRegistry.getEnforcing(...): 'Worklets' could not be found
```
**Çözüm:** Yeni development build almak gerekiyor:
```bash
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

#### Phase 1: Development Build
- [ ] Development build oluştur (iOS)
- [ ] Development build oluştur (Android)
- [ ] iOS/Android native bağımlılıkları kontrol et

#### Phase 3: Gelişmiş Efektler
- [ ] `EyelinerEffect.tsx` - Göz konturu çizimi
- [ ] `EyeshadowEffect.tsx` - Göz farı efekti
- [ ] `BlushEffect.tsx` - Allık efekti (yanak bölgesi, radial gradient)
- [ ] `CrownEffect.tsx` - Taç/Şapka AR objesi
- [ ] `AnimalFaceEffect.tsx` - Kedi/Köpek yüzü
- [ ] `ParticleEffect.tsx` - Kalp, Kar, Glitter animasyonları

#### Phase 4: UI/UX İyileştirmeleri
- [ ] Intensity slider ekle (FaceEffectSelector'a)
- [ ] Daha fazla gözlük asset'i ekle
- [ ] Daha fazla maske asset'i ekle
- [ ] Animasyon sistemi (parçacık efektleri için)

#### Testing
- [ ] Farklı yüz açılarında test
- [ ] Çoklu yüz tespiti test
- [ ] Düşük ışık koşulları test
- [ ] Ön/arka kamera geçişi test
- [ ] Performance tests (FPS ≥30, Latency <50ms)

---

## 🟡 ORTA ÖNCELİK

### 4. Mesaj Sistemi - Testing

**Kaynak:** `/docs/mesaj-sistemi/mesaj-sistemi-todo.md`
**Durum:** %89 tamamlandı (97/109 görev)
**Tahmini Süre:** 2 gün

#### Phase 9: Testing & Optimization
- [ ] **Unit Tests:**
  - [ ] useMessages hook tests
  - [ ] useConversations hook tests
  - [ ] useBroadcast hook tests
  - [ ] Zustand store tests
  - [ ] Utility function tests

- [ ] **Component Tests:**
  - [ ] MessageBubble tests
  - [ ] ChatListItem tests
  - [ ] BroadcastMessageCard tests

- [ ] **Integration Tests:**
  - [ ] Send message flow
  - [ ] Create conversation flow
  - [ ] Broadcast message flow

- [ ] **Performance Tests:**
  - [ ] Message list scrolling (FlashList)
  - [ ] Realtime latency
  - [ ] Memory usage

- [ ] **Optimizations:**
  - [ ] Message virtualization kontrol
  - [ ] Image caching (expo-image)
  - [ ] Lazy loading media
  - [ ] Optimistic updates kontrol

---

### 5. Home Feed - Kalan Görevler

**Kaynak:** `/docs/home-feed/remaining-tasks-todo.md`
**Durum:** 68/116 tamamlandı ✅ (2025-11-30 güncellendi)
**Tahmini Süre:** 2-3 hafta

#### Comment Sheet API Entegrasyonu ✅ TAMAMLANDI
- [x] `get-comments` Edge Function entegrasyonu (`get-post-details` içinde)
- [x] `create-comment` API çağrısı (`comment-post` edge function)
- [x] Nested replies desteği (`parent_comment_id` ile)
- [x] `like-comment` Edge Function
- [x] Mention sistemi (`searchMentions` API)
- [x] CommentSheet component (tam implement)
- [x] CommentLikersSheet component
- [ ] Real-time comment updates (WebSocket listener)

#### Tag People Sistemi
- [ ] Fotoğraf üzerinde pozisyon belirleme UI (dokunarak etiket konumu)
- [ ] `TagMarker.tsx` - Fotoğraf üzerinde etiket balonu
- [ ] `TagOverlay.tsx` - Etiketleri gösteren overlay
- [ ] Bildirim sistemi entegrasyonu ("X seni etiketledi")
- [ ] Profilde "Etiketlenenler" sekmesi

#### Stories Feature
- [x] `StoriesRow.tsx` - ListHeaderComponent olarak ✅
- [x] Story oluşturma UI ✅
  - [x] `StoryMediaPicker.tsx` - Galeri seçici (3 sütun, dikey format)
  - [x] `StoryPreview.tsx` - Önizleme ve paylaşım ekranı
  - [x] `StoryCreator.tsx` - Ana story oluşturma akışı
  - [x] `useCreateStory` hook - API entegrasyonu
- [x] Edge Functions ✅
  - [x] `create-story` - Story oluşturma
  - [x] `get-stories` - Hikayeleri getirme
  - [x] `view-story` - Görüntüleme kaydı
  - [x] `react-to-story` - Tepki ekleme
  - [x] `delete-story` - Silme
  - [x] `get-user-stories` - Kullanıcı hikayeleri
- [x] Story görüntüleme (StoryViewer) ✅
  - [x] `StoryViewer/index.tsx` - Tam ekran hikaye görüntüleme
  - [x] Progress bar animasyonu
  - [x] Tap left/right: Önceki/sonraki hikaye
  - [x] Long press: Duraklat
  - [x] Kullanıcılar arası geçiş
  - [x] Video desteği
- [ ] Story reactions UI (kalp, emoji picker)

#### Eksik Components
- [ ] `TimeCapsuleCard.tsx` - expires_at badge ekle (PostCard'a prop)
- [ ] `IRLEventCard.tsx` - City events card (external API gerekli)
- [ ] `MicroGroupCard.tsx` - Mini community card

#### Eksik Hooks
- [ ] `useInstantChemistry` hook (messaging system gerekli)
- [ ] `useSocialGraph` hook (get-social-graph API gerekli)

#### UI/UX Polish
- [ ] Post analytics sheet (owner'lar için view/engagement stats)
- [ ] Vibe/Intent filters UI (header tabs)

#### Testing
- [ ] Unit tests (useFeed, usePost, usePoll, useVibe, useIntent, useSocial)
- [ ] Component tests (PostCard, MiniPostCard, PollCard, FeedItem)
- [ ] Integration tests (Edge Function çağrıları)
- [ ] E2E tests (Detox ile kullanıcı akışları)
- [ ] Performance tests (FlashList performansı)
- [ ] Security tests (RLS policies)
- [ ] Load tests (concurrent users)
- [ ] A/B testing setup (feature flags)

#### Analytics & Monitoring
- [ ] Feed engagement tracking
- [ ] Post performance metrics
- [ ] User behavior analytics
- [ ] Vibe Match success rate
- [ ] Error logging (Sentry)
- [ ] Performance monitoring
- [ ] Crash reporting

---

### 6. Bildirim Sistemi - Kalan Görevler

**Kaynak:** `/docs/bildirim-sistemi/mobile/TODO.md`
**Durum:** Phase 1-7 ✅, Phase 8-9 bekliyor
**Tahmini Süre:** 1 hafta

#### EAS Credentials Setup
- [ ] **Android FCM:**
  - [ ] Firebase project oluştur
  - [ ] google-services.json indir
  - [ ] EAS'e upload et

- [ ] **iOS APNs:**
  - [ ] Apple Developer Account
  - [ ] Push Notifications capability ekle
  - [ ] Certificate oluştur
  - [ ] EAS'e upload et

- [ ] **Development Build:**
  - [ ] `eas build:dev --platform ios`
  - [ ] `eas build:dev --platform android`

#### Testing
- [ ] Device'ta test et
- [ ] Permissions dialog gösterilir mi?
- [ ] Token başarıyla kaydedilir mi?
- [ ] Notification listener çalışır mı?
- [ ] Push toggle çalışıyor mu?
- [ ] Email toggle çalışıyor mu?
- [ ] Notification type toggles çalışıyor mu?
- [ ] Quiet hours ayarlanabiliyor mu?

#### Unit Tests
- [ ] useDeviceToken hook test
- [ ] useNotifications hook test
- [ ] useNotificationPreferences hook test

#### Integration Tests
- [ ] Device token registration flow
- [ ] Notification receive flow
- [ ] Mark as read flow
- [ ] Delete notification flow

#### Documentation
- [ ] JSDoc comments ekle
- [ ] README güncelle
- [ ] Troubleshooting guide oluştur

---

## 🟢 DÜŞÜK ÖNCELİK

### 7. Genel Entegrasyonlar

**Kaynak:** `/docs/todo.md`
**Tahmini Süre:** 1 hafta

- [ ] Supabase auth + React Query entegrasyonu tamamla
  - Session hydrate akışını `useAuthStore` ile bağla
- [ ] Shadow/Coin Zustand store'larını genişlet
  - SecureStore senkronizasyonu ekle
- [ ] LiveKit token akışı
  - Dakika bazlı coin düşümü için edge functions + mobile client entegrasyonu
- [ ] AI Fantasy ve ASMR flow'ları
  - Edge functions ile uçtan uca bağla
  - UI'da sonuç dinlemeyi implemente et

---

## 🎯 Önerilen Sprint Planı

### Sprint 1 (1 hafta) - Kritik Altyapı
1. ✅ Shadow Profile Mobile Realtime (`useOpsRealtime` hook)
2. ✅ Yüz Efektleri Development Build
3. ✅ EAS Credentials Setup (FCM + APNs)

### Sprint 2 (1 hafta) - Ödeme Sistemi
1. Apple App Store Connect IAP oluştur
2. Google Play Console IAP oluştur
3. Store ekranları UI (coins, subscription)

### Sprint 3 (1 hafta) - Home Feed
1. Comment Sheet API entegrasyonu
2. Tag People sistemi
3. TimeCapsuleCard expires_at badge

### Sprint 4 (1 hafta) - Stories & Testing
1. Stories feature başlangıç
2. Mesaj sistemi testing
3. Home feed testing

### Sprint 5 (1 hafta) - Polish & QA
1. Yüz efektleri gelişmiş efektler
2. Abonelik testing
3. Bildirim sistemi testing

---

## ⚠️ Bağımlılıklar

| Görev                  | Bağımlılık                         |
| ---------------------- | ---------------------------------- |
| Shadow Mobile Realtime | Web-Ops API endpoints ✅            |
| Yüz Efektleri          | Development build (native modules) |
| Bildirim Sistemi       | EAS Credentials (FCM + APNs)       |
| Store Ekranları        | Apple/Google IAP ürünleri          |
| instant-chemistry      | Messaging system                   |
| get-social-graph       | Advanced algorithm                 |
| IRLEventCard           | External API entegrasyonu          |

---

## 📝 Notlar

### Development Build Gereksinimleri
Aşağıdaki özellikler **Expo Go'da çalışmaz**, development build gerektirir:
- Push notifications (expo-notifications)
- Face detection (react-native-vision-camera-face-detector)
- Worklets (react-native-worklets-core)
- In-App Purchases (expo-iap)

### Komutlar
```bash
# Development build oluştur
npx eas build --profile development --platform ios
npx eas build --profile development --platform android

# Dev server başlat
EXPO_UNSTABLE_MCP_SERVER=1 npx expo start

# TypeScript types generate et
pnpm run generate:types
```

---

## 🔄 Güncelleme Geçmişi

| Tarih      | Güncelleme                                |
| ---------- | ----------------------------------------- |
| 2025-11-30 | İlk versiyon - Tüm TODO'lar birleştirildi |

---

**Toplam Tahmini Süre:** 5-6 hafta
**Öncelik Sırası:** Shadow Realtime → Dev Build → IAP → Home Feed → Testing
