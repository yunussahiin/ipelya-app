# Mobile Push Notifications - TODO List ✅

## Phase 1: Database & Infrastructure (Hafta 1)

### 1.1 Database Schema
- [x] `notifications` tablosu oluştur
  - [x] id (UUID)
  - [x] recipient_id (UUID)
  - [x] actor_id (UUID, nullable)
  - [x] type (TEXT)
  - [x] title (TEXT)
  - [x] body (TEXT)
  - [x] data (JSONB)
  - [x] read (BOOLEAN)
  - [x] read_at (TIMESTAMP, nullable)
  - [x] created_at (TIMESTAMP)
  - [x] Foreign keys ekle
  - [x] Indexes ekle (recipient_id, created_at)

- [x] `device_tokens` tablosu oluştur
  - [x] id (UUID)
  - [x] user_id (UUID, UNIQUE)
  - [x] token (TEXT)
  - [x] device_type (TEXT: ios/android)
  - [x] device_name (TEXT, nullable)
  - [x] created_at (TIMESTAMP)
  - [x] updated_at (TIMESTAMP)
  - [x] Foreign key ekle

- [x] `notification_preferences` tablosu oluştur
  - [x] user_id (UUID, PRIMARY KEY)
  - [x] push_enabled (BOOLEAN, default: true)
  - [x] email_enabled (BOOLEAN, default: false)
  - [x] notification_types (JSONB)
  - [x] quiet_hours_start (TIME, nullable)
  - [x] quiet_hours_end (TIME, nullable)
  - [x] created_at (TIMESTAMP)
  - [x] updated_at (TIMESTAMP)
  - [x] Foreign key ekle

### 1.2 RLS Policies
- [x] `notifications` tablosu RLS enable et
  - [x] SELECT policy: Users can view own notifications
  - [x] UPDATE policy: Users can mark own notifications as read
  - [x] DELETE policy: Users can delete own notifications
  - [x] INSERT policy: Service role can insert notifications

- [x] `device_tokens` tablosu RLS enable et
  - [x] SELECT policy: Users can view own device tokens
  - [x] INSERT policy: Users can insert own device tokens
  - [x] UPDATE policy: Users can update own device tokens
  - [x] DELETE policy: Users can delete own device tokens

- [x] `notification_preferences` tablosu RLS enable et
  - [x] SELECT policy: Users can view own preferences
  - [x] INSERT policy: Users can insert own preferences
  - [x] UPDATE policy: Users can update own preferences

### 1.3 Supabase Setup
- [x] Realtime enable et
- [x] REPLICA IDENTITY FULL set et (tüm tablolar)
- [x] TypeScript types generate et

**Dosyalar:**
- `supabase/migrations/001_create_notifications_tables.sql`
- `supabase/migrations/002_add_rls_policies.sql`

---

## Phase 2: Frontend Setup (Hafta 1-2)

### 2.1 Paket Kurulumu
- [x] `expo-notifications` install et
- [x] `expo-device` install et
- [x] `expo-constants` install et
- [x] `app.json` konfigürasyonu yap
  - [x] Plugin ekle
  - [x] Icon belirt
  - [x] Sound belirt
  - [x] Background notifications enable et

### 2.2 Environment Setup
- [x] `.env.local` oluştur
  - [x] SUPABASE_URL
  - [x] SUPABASE_ANON_KEY
  - [x] EAS_PROJECT_ID

### 2.3 EAS Credentials
- [ ] Android FCM setup
  - [ ] Firebase project oluştur
  - [ ] google-services.json indir
  - [ ] EAS'e upload et
  
- [ ] iOS APNs setup
  - [ ] Apple Developer Account
  - [ ] Push Notifications capability ekle
  - [ ] Certificate oluştur
  - [ ] EAS'e upload et

- [ ] Development build oluştur
  - [ ] `eas build:dev --platform ios`
  - [ ] `eas build:dev --platform android`

**Dosyalar:**
- [x] `apps/mobile/app.json` (plugin config)
- [ ] `.env.local` (environment variables)

---

## Phase 3: Hooks Implementation (Hafta 2)

### 3.1 useDeviceToken Hook
- [x] Hook oluştur (`apps/mobile/src/hooks/useDeviceToken.ts`)
  - [x] Device check (fiziksel cihaz)
  - [x] Permission request
  - [x] Android notification channel setup
  - [x] Expo Push Token alma
  - [x] Token Supabase'e kaydetme
  - [x] Error handling
  - [x] Console logs

### 3.2 useNotificationListener Hook
- [x] Hook oluştur (`apps/mobile/src/hooks/useNotificationListener.ts`)
  - [x] Notification handler setup
  - [x] Foreground notification listener
  - [x] Response listener (tıklandığında)
  - [x] Deep linking setup
  - [x] Last notification check
  - [x] Cleanup

### 3.3 useNotifications Hook
- [x] Hook oluştur (`apps/mobile/src/hooks/useNotifications.ts`)
  - [x] Load notifications
  - [x] Realtime subscription
  - [x] Mark as read
  - [x] Mark all as read
  - [x] Delete notification
  - [x] Unread count tracking
  - [x] Error handling

### 3.4 useNotificationPreferences Hook
- [x] Hook oluştur (`apps/mobile/src/hooks/useNotificationPreferences.ts`)
  - [x] Load preferences
  - [x] Update preferences
  - [x] Toggle notification types
  - [x] Set quiet hours
  - [x] Error handling

**Dosyalar:**
- `apps/mobile/src/hooks/useDeviceToken.ts`
- `apps/mobile/src/hooks/useNotificationListener.ts`
- `apps/mobile/src/hooks/useNotifications.ts`
- `apps/mobile/src/hooks/useNotificationPreferences.ts`

---

## Phase 4: App Root Layout Integration (Hafta 2)

### 4.1 Root Layout Setup
- [x] `_layout.tsx` güncelle
  - [x] useDeviceToken() hook'u çağır
  - [x] useNotificationListener() hook'u çağır
  - [x] Error handling

### 4.2 Testing
- [ ] Device'ta test et
- [ ] Permissions dialog gösterilir mi?
- [ ] Token başarıyla kaydedilir mi?
- [ ] Notification listener çalışır mı?

**Dosyalar:**
- [x] `apps/mobile/app/_layout.tsx`

---

## Phase 5: Components (Hafta 2-3)

### 5.1 NotificationCenter Component
- [x] Component oluştur (`apps/mobile/src/components/notifications/NotificationCenter.tsx`)
  - [x] Notification list
  - [x] Mark as read button
  - [x] Delete button
  - [x] Empty state
  - [x] Loading state
  - [x] Error state
  - [x] Styling

### 5.2 NotificationBell Component
- [x] Component oluştur (`apps/mobile/src/components/notifications/NotificationBell.tsx`)
  - [x] Bell icon
  - [x] Badge (unread count)
  - [x] Pressable
  - [x] Styling

### 5.3 NotificationItem Component
- [x] Component oluştur (`apps/mobile/src/components/notifications/NotificationItem.tsx`)
  - [x] Title
  - [x] Body
  - [x] Timestamp
  - [x] Read/unread indicator
  - [x] Actions (mark read, delete)
  - [x] Styling

### 5.4 NotificationPreferences Screen
- [x] Screen oluştur (`apps/mobile/app/(settings)/notifications.tsx`)
  - [x] Push enabled toggle
  - [x] Email enabled toggle
  - [x] Notification type toggles (15 types)
  - [x] Auto-save functionality
  - [x] Error handling
  - [x] Loading state

**Dosyalar:**
- [x] `apps/mobile/src/components/notifications/NotificationCenter.tsx`
- [x] `apps/mobile/src/components/notifications/NotificationBell.tsx`
- [x] `apps/mobile/src/components/notifications/NotificationItem.tsx`
- [x] `apps/mobile/app/(settings)/notifications.tsx`

---

## Phase 6: Notification Types Implementation (Hafta 3)

### 6.1 Social Notifications
- [ ] new_follower bildirim tetikle
- [ ] follow_back bildirim tetikle
- [ ] profile_mention bildirim tetikle
- [ ] user_blocked bildirim tetikle

### 6.2 Messaging Notifications
- [ ] new_message bildirim tetikle
- [ ] message_like bildirim tetikle
- [ ] message_reply bildirim tetikle

### 6.3 Content Notifications
- [ ] content_like bildirim tetikle
- [ ] content_comment bildirim tetikle
- [ ] content_share bildirim tetikle
- [ ] content_update bildirim tetikle

### 6.4 System Notifications
- [ ] system_alert bildirim tetikle
- [ ] maintenance bildirim tetikle
- [ ] security_alert bildirim tetikle
- [ ] account_activity bildirim tetikle

**Dosyalar:**
- Edge Functions (Supabase tarafında)

---

## Phase 7: Deep Linking (Hafta 3)

### 7.1 Deep Link Routes
- [ ] `/profile/{userId}` route
- [ ] `/messages/{userId}` route
- [ ] `/content/{contentId}` route
- [ ] `/settings/security` route

### 7.2 Notification Data Mapping
- [ ] new_follower → `/profile/{actor_id}`
- [ ] new_message → `/messages/{actor_id}`
- [ ] content_like → `/content/{content_id}`
- [ ] security_alert → `/settings/security`

### 7.3 Testing
- [ ] Bildirime tıkla
- [ ] Doğru sayfaya gidiyor mu?
- [ ] Data doğru mu?

**Dosyalar:**
- `apps/mobile/app/_layout.tsx` (deep linking config)

---

## Phase 8: Testing & Optimization (Hafta 3-4)

### 8.1 Unit Tests
- [ ] useDeviceToken hook test
- [ ] useNotifications hook test
- [ ] useNotificationPreferences hook test

### 8.2 Integration Tests
- [ ] Device token registration flow
- [ ] Notification receive flow
- [ ] Mark as read flow
- [ ] Delete notification flow

### 8.3 E2E Tests
- [ ] Full notification flow
- [ ] Deep linking
- [ ] Preferences update

### 8.4 Performance
- [ ] Memory leak check
- [ ] Battery usage check
- [ ] Network usage check
- [ ] Realtime subscription optimization

### 8.5 Security
- [ ] RLS policies test
- [ ] Token security
- [ ] Data encryption

**Dosyalar:**
- `apps/mobile/__tests__/notifications.test.ts`
- `apps/mobile/__tests__/hooks.test.ts`

---

## Phase 9: Documentation & Polish (Hafta 4)

### 9.1 Code Documentation
- [ ] JSDoc comments ekle
- [ ] README güncelle
- [ ] SETUP.md güncelle
- [ ] Troubleshooting guide oluştur

### 9.2 Error Messages
- [ ] User-friendly error messages
- [ ] Logging setup
- [ ] Error tracking (Sentry)

### 9.3 UI/UX Polish
- [ ] Dark mode support
- [ ] Animations
- [ ] Accessibility (a11y)
- [ ] Loading states
- [ ] Empty states

### 9.4 Production Ready
- [ ] Environment variables check
- [ ] Secrets management
- [ ] Build optimization
- [ ] Performance profiling

**Dosyalar:**
- `apps/mobile/README.md`
- `apps/mobile/TROUBLESHOOTING.md`

---

## Checklist Summary

### Database ✅
- [ ] 3 tablo oluştur
- [ ] Indexes ekle
- [ ] RLS policies ekle
- [ ] Realtime enable et

### Frontend ✅
- [ ] 4 hook oluştur
- [ ] 4 component oluştur
- [ ] 1 screen oluştur
- [ ] Root layout entegre et

### Features ✅
- [ ] Device token management
- [ ] Real-time notifications
- [ ] Deep linking
- [ ] Notification preferences
- [ ] 16 notification type

### Testing ✅
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests

### Documentation ✅
- [ ] Code comments
- [ ] README
- [ ] Troubleshooting guide
- [ ] API documentation

---

## Success Criteria

- ✅ Device token başarıyla kaydedilir
- ✅ Bildirimler gerçek zamanlı alınır
- ✅ Deep linking çalışır
- ✅ Notification preferences kaydedilir
- ✅ Tüm 16 notification type çalışır
- ✅ Performance acceptable (<100ms)
- ✅ Battery usage minimal
- ✅ Tests pass (%>90 coverage)
- ✅ No memory leaks
- ✅ Production ready

---

## Timeline

| Phase                       | Duration     | Status        |
| --------------------------- | ------------ | ------------- |
| Phase 1: Database           | 2-3 days     | ✅ Completed   |
| Phase 2: Frontend Setup     | 2-3 days     | ✅ Completed   |
| Phase 3: Hooks              | 3-4 days     | ✅ Completed   |
| Phase 4: Root Layout        | 1 day        | ✅ Completed   |
| Phase 5: Components         | 3-4 days     | ✅ Completed   |
| Phase 6: Notification Types | 3-4 days     | 🔄 In Progress |
| Phase 7: Deep Linking       | 2-3 days     | ⏳ Pending     |
| Phase 8: Testing            | 3-4 days     | ⏳ Pending     |
| Phase 9: Polish             | 2-3 days     | ⏳ Pending     |
| **Total**                   | **~4 weeks** | ⏳ Pending     |

---

## Notes

- 📱 Physical device gerekli (simulator'da push notifications çalışmaz)
- 🔑 EAS credentials setup zorunlu
- 🔐 RLS policies güvenlik için kritik
- 📊 Realtime subscription'lar optimize edilmeli
- 🧹 Eski bildirimler düzenli temizlenmeli (30 gün)
- 🔄 Realtime sync mobile ve web arasında shared database ile

---

## Getting Started

1. **Database Schema Oluştur** (Phase 1)
   - Migrations çalıştır
   - RLS policies ekle
   - Realtime enable et

2. **Frontend Setup** (Phase 2)
   - Paketleri install et
   - EAS credentials setup et
   - Development build oluştur

3. **Hooks Implement Et** (Phase 3)
   - useDeviceToken
   - useNotificationListener
   - useNotifications
   - useNotificationPreferences

4. **Components Oluştur** (Phase 5)
   - NotificationCenter
   - NotificationBell
   - NotificationItem
   - NotificationPreferences screen

5. **Test & Deploy** (Phase 8-9)
   - Unit tests
   - Integration tests
   - Production build

---

**Başlamaya hazır mısın?** 🚀
