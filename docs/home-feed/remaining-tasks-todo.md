# İpelya Home Feed - Kalan Görevler Todo List

**Oluşturulma Tarihi:** 2025-11-26
**Kaynak:** feed-system-todo-list.md analizi
**Toplam Kalan Görev:** 79

---

## 🔴 Yüksek Öncelik (Kullanıcı Deneyimi)

### Comment Sheet API Entegrasyonu
- [ ] `get-comments` Edge Function entegrasyonu
- [ ] `create-comment` API çağrısı (comment-post mevcut)
- [ ] Nested replies desteği
- [ ] Real-time comment updates

### Tag People Sistemi (Devam Eden)
- [ ] Fotoğraf üzerinde pozisyon belirleme UI (dokunarak etiket konumu)
- [ ] `TagMarker.tsx` - Fotoğraf üzerinde etiket balonu
- [ ] `TagOverlay.tsx` - Etiketleri gösteren overlay
- [ ] Bildirim sistemi entegrasyonu ("X seni etiketledi")
- [ ] Profilde "Etiketlenenler" sekmesi

### Stories Feature
- [ ] `StoriesRow.tsx` - ListHeaderComponent olarak
- [ ] Story oluşturma UI
- [ ] Story görüntüleme (24h expiration)
- [ ] Story reactions

---

## 🟡 Orta Öncelik (Özellik Tamamlama)

### Phase 3: Eksik Edge Functions
- [ ] `instant-chemistry` - Post üzerinden chat başlat
  - **Bağımlılık:** Messaging system gerekli
  - **Not:** Phase 12'ye ertelendi
- [ ] `get-social-graph` - Bağlantı haritası
  - **Not:** Advanced algorithm, Phase 12'ye ertelendi
- [ ] `get-irl-events` - Şehir etkinlikleri
  - **Bağımlılık:** External API entegrasyonu gerekli

### Phase 5: Eksik Mobile Components
- [ ] `TimeCapsuleCard.tsx` - 24h expiring post kartı
  - **Not:** PostCard ile aynı, sadece expires_at badge eklenecek
  - **Kolay:** PostCard'a expires_at prop'u ekle
- [ ] `IRLEventCard.tsx` - City events card
  - **Bağımlılık:** get-irl-events API gerekli
- [ ] `MicroGroupCard.tsx` - Mini community card
  - **Not:** Phase 12'ye ertelendi

### Phase 6: Eksik Hooks
- [ ] `useInstantChemistry` hook
  - **Bağımlılık:** Messaging system gerekli
- [ ] `useSocialGraph` hook
  - **Bağımlılık:** get-social-graph API gerekli

### Phase 10: UI/UX Polish
- [ ] Post analytics sheet (owner'lar için view/engagement stats)
- [ ] Vibe/Intent filters UI (header tabs)
  - **Not:** VibeMatchBlock ve IntentSelector mevcut, FeedScreen'e entegre edilmeli

---

## 🟢 Düşük Öncelik (Kalite & Dokümantasyon)

Test edilecekler

VibeMatchBlock: Feed'de vibe seç → feed filtreleme test et
SuggestionsRow: Feed'de önerilen profilleri gör
CrystalGiftModal: Profil sayfasından hediye gönder
CreateMiniPostModal: FeedScreen'e entegre et ve test et (bunu zaten galiba yaptık ama bu sistemin detaylarını benimle paylaşır mısın??)
IntentSelector: Profil ayarlarına entegre et
### Phase 10: Testing & Quality
- [ ] Unit tests (hooks)
  - Jest + React Testing Library
  - useFeed, usePost, usePoll, useVibe, useIntent, useSocial
- [ ] Component tests (UI)
  - PostCard, MiniPostCard, PollCard, FeedItem
- [ ] Integration tests (API)
  - Edge Function çağrıları
- [ ] E2E tests (user flows)
  - Detox ile kullanıcı akışları
- [ ] Performance tests (feed loading)
  - FlashList performansı
- [ ] Security tests (RLS policies)
  - Supabase RLS test
- [ ] Load tests (concurrent users)
  - Stress testing
- [ ] A/B testing setup (feature flags)
  - Feature flag sistemi

### Phase 11: Analytics & Monitoring
- [ ] Feed engagement tracking
- [ ] Post performance metrics
- [ ] User behavior analytics
- [ ] Vibe Match success rate
- [ ] Instant Chemistry conversion
- [ ] Error logging (Sentry)
- [ ] Performance monitoring
- [ ] Crash reporting

### Phase 12: Documentation & Deployment
- [ ] API documentation (Edge Functions)
- [ ] Component documentation (Storybook?)
- [ ] User guide (in-app onboarding)
- [ ] Developer guide (README)
- [ ] Deployment guide (EAS)
- [ ] Monitoring guide (ops)
- [ ] Troubleshooting guide
- [ ] Changelog

---

## 🔵 Web Ops Panel (Phase 13)

### Dökümanlar
- [ ] Web ops architecture dökümanı (mevcut yapıyı analiz et)
- [ ] Web ops pages dökümanı
- [ ] Web ops components dökümanı
- [ ] Web ops API routes dökümanı

### Database & Backend
- [ ] Web ops database tables
- [ ] Web ops Edge Functions
  - `bulk-notification`
  - `scheduled-notification`
  - `cleanup`

### Pages
- [ ] Dashboard page (overview)
- [ ] Content moderation page
- [ ] Analytics dashboard page (mevcut yapıyı analiz et)
- [ ] Algorithm settings page
- [ ] Notification management page (mevcut yapıyı analiz et)
- [ ] User management page (mevcut yapıyı analiz et)
- [ ] Settings page (mevcut yapıyı analiz et)

### Components & API
- [ ] Reusable components (tables, charts, modals)
- [ ] API routes (content, analytics, algorithm, notifications, users)

### Tests
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

---

## 📊 İlerleme Takibi

| Kategori          | Toplam  | Tamamlanan | Kalan  |
| ----------------- | ------- | ---------- | ------ |
| Edge Functions    | 18      | 15         | 3      |
| Mobile Components | 22      | 19         | 3      |
| Hooks & Stores    | 11      | 9          | 2      |
| UI/UX Polish      | 17      | 13         | 4      |
| Tag People        | 6       | 2          | 4      |
| Testing           | 8       | 0          | 8      |
| Analytics         | 8       | 0          | 8      |
| Documentation     | 8       | 0          | 8      |
| Web Ops           | 18      | 0          | 18     |
| **TOPLAM**        | **116** | **58**     | **58** |

---

## 🎯 Önerilen Sprint Planı

### Sprint 1 (1 hafta) - Kullanıcı Deneyimi
1. Comment Sheet API entegrasyonu
2. TimeCapsuleCard (expires_at badge)
3. Tag People pozisyon UI

### Sprint 2 (1 hafta) - Özellik Tamamlama
1. Tag People tamamlama (TagMarker, TagOverlay, bildirim)
2. Stories feature başlangıç
3. Vibe/Intent filters UI

### Sprint 3 (2 hafta) - Testing
1. Unit tests (hooks)
2. Component tests
3. Integration tests

### Sprint 4 (2 hafta) - Web Ops
1. Dökümanlar
2. Dashboard page
3. Content moderation page

---

## ⚠️ Bağımlılıklar

| Görev               | Bağımlılık           |
| ------------------- | -------------------- |
| instant-chemistry   | Messaging system     |
| get-social-graph    | Advanced algorithm   |
| get-irl-events      | External API         |
| IRLEventCard        | get-irl-events API   |
| MicroGroupCard      | Micro groups feature |
| useInstantChemistry | Messaging system     |
| useSocialGraph      | get-social-graph API |

---

## 📝 Notlar

- **Messaging system** henüz implement edilmedi, instant-chemistry beklemede
- **External API** entegrasyonu (IRL events) için API seçimi yapılmalı
- **Web Ops** mevcut yapıyı bozmadan geliştirilmeli
- **Testing** her sprint'te paralel yapılabilir

---

**Son Güncelleme:** 2025-11-26 01:23 UTC+03:00
