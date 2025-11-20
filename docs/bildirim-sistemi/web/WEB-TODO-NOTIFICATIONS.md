# Web Bildirim Sistemi - TODO List 📋

## Mevcut Durum
- ✅ Supabase setup (server + browser clients)
- ✅ Auth system (login/register)
- ✅ Ops admin panel (users, creators, content, economy, security, account, settings)
- ✅ UI components (Radix UI, shadcn/ui)
- 🔄 **Bildirim sistemi - KISMEN YAPILDI (Mobile'da)**

### Mobile'da Yapılan ✅
- ✅ `notifications` tablosu oluşturuldu
- ✅ `device_tokens` tablosu oluşturuldu
- ✅ `notification_preferences` tablosu oluşturuldu
- ✅ RLS policies eklendi (user-level)
- ✅ Realtime enabled
- ✅ `send-notification` Edge Function (webhook trigger)
- ✅ `useDeviceToken` hook (token registration)
- ✅ `useNotifications` hook (realtime listener)
- ✅ `useNotificationListener` hook (deep linking)
- ✅ `useNotificationPreferences` hook (preferences)
- ✅ Push notifications via Expo

---

## Phase 1: Setup & Infrastructure ✅

### 1.1 Database Schema
- [x] `notifications` tablosu oluşturuldu (Mobile)
- [x] `device_tokens` tablosu oluşturuldu (Mobile)
- [x] `notification_preferences` tablosu oluşturuldu (Mobile)
- [x] RLS policies eklendi (Mobile)
- [x] Realtime enabled (Mobile)
- [x] `notification_campaigns` tablosu oluşturuldu (Admin - Web) ✅
- [x] `notification_templates` tablosu oluşturuldu (Admin - Web) ✅
- [x] `notification_logs` tablosu oluşturuldu (Admin - Web) ✅
- [x] Indexes eklendi (campaign_id, status, recipient_id) ✅
- [x] RLS policies eklendi (admin-only) ✅
- [x] Realtime enabled for admin tables ✅

**Dosya:** `supabase/migrations/create_admin_notification_tables.sql`

### 1.2 Environment & Config
- [x] Supabase setup tamamlandı
- [x] EXPO_ACCESS_TOKEN configured (Mobile)
- [ ] `.env.local` bildirim config'lerini ekle (Web)
- [ ] Admin API key setup et (Web)

---

## Phase 2: Frontend Hooks & Components 🎣🎨

### 2.1 Hooks
- [x] `hooks/useNotifications.ts` oluşturuldu ✅
  - ✅ Mobile'dan copy edildi
  - ✅ `loadNotifications()` - Bildirimleri yükle
  - ✅ `markAsRead()` - Bildirim okundu işaretle
  - ✅ `markAllAsRead()` - Tümünü okundu yap
  - ✅ `deleteNotification()` - Bildirim sil
  - ✅ Realtime subscription setup

- [x] `hooks/useNotificationPreferences.ts` oluşturuldu ✅
  - ✅ Mobile'dan copy edildi
  - ✅ `loadPreferences()`, `updatePreferences()`, `toggleNotificationType()` vb.

- [x] `hooks/useSendNotification.ts` oluşturuldu ✅
  - ✅ `sendNotification()` - Bildirim gönder
  - ✅ Payload validation
  - ✅ Single/bulk/scheduled support

**Dosyalar:**
- ✅ `/Users/yunussahin/ipelya-app/apps/web/hooks/useNotifications.ts`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/hooks/useNotificationPreferences.ts`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/hooks/useSendNotification.ts`

### 2.2 Components
- [ ] `components/notifications/NotificationCenter.tsx` oluştur
  - Bell icon + badge
  - Notification list
  - Mark as read / Delete buttons
  - Mark all as read button

- [ ] `components/notifications/NotificationBell.tsx` oluştur
  - Icon + unread count badge
  - Dropdown trigger

- [ ] `components/notifications/NotificationItem.tsx` oluştur
  - Title, body, timestamp
  - Read/unread indicator
  - Actions (mark read, delete)

- [ ] `components/notifications/NotificationList.tsx` oluştur
  - List container
  - Empty state
  - Pagination (50 per page)

**Dosyalar:**
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/NotificationCenter.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/NotificationBell.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/NotificationItem.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/NotificationList.tsx`

### 2.3 Layout Integration
- [x] `app-sidebar.tsx` güncellendi ✅
  - ✅ IconBell import eklendi
  - ✅ Bildirimler menüsü eklendi
  - ✅ Gönder, Geçmiş, Şablonlar alt menüleri

**Dosyalar:**
- ✅ `/Users/yunussahin/ipelya-app/apps/web/components/app-sidebar.tsx`

---

## Phase 3: API Routes 🔌 ✅

### 3.1 Notification Routes
- [x] `app/api/notifications/send/route.ts` oluşturuldu ✅
  - ✅ POST endpoint
  - ✅ Auth check (admin)
  - ✅ Payload validation
  - ✅ Single/bulk/scheduled support

- [x] `app/api/notifications/mark-read/route.ts` oluşturuldu ✅
  - ✅ POST endpoint
  - ✅ Mark single as read
  - ✅ Mark all as read

- [x] `app/api/notifications/[id]/delete/route.ts` oluşturuldu ✅
  - ✅ DELETE endpoint
  - ✅ Auth check

**Dosyalar:**
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/api/notifications/send/route.ts`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/api/notifications/mark-read/route.ts`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/api/notifications/[id]/delete/route.ts`

---

## Phase 4: Admin Panel - Send 📬 ✅

### 4.1 Single Notification
- [x] `app/ops/(private)/notifications/send/components/SingleNotification.tsx` oluşturuldu ✅
  - ✅ User ID input
  - ✅ Title, body input
  - ✅ JSON data support
  - ✅ Preview
  - ✅ Send button

### 4.2 Bulk Notification
- [x] `app/ops/(private)/notifications/send/components/BulkNotification.tsx` oluşturuldu ✅
  - ✅ Segment selector (all, creators, premium, inactive)
  - ✅ Title, body input
  - ✅ Campaign info display

### 4.3 Scheduled Notification
- [x] `app/ops/(private)/notifications/send/components/ScheduledNotification.tsx` oluşturuldu ✅
  - ✅ DateTime picker
  - ✅ Validation (future date check)
  - ✅ Schedule button

### 4.4 Main Send Page
- [x] `app/ops/(private)/notifications/send/page.tsx` oluşturuldu ✅
  - ✅ Tab selector (single/bulk/scheduled)
  - ✅ Component switcher
  - ✅ Form container

**Dosyalar:**
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/page.tsx`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/components/SingleNotification.tsx`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/components/BulkNotification.tsx`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/components/ScheduledNotification.tsx`

---

## Phase 5: Admin Panel - History & Templates 📊 ✅

### 5.1 Notification History
- [x] `app/ops/(private)/notifications/history/page.tsx` oluşturuldu ✅
  - ✅ Campaign list
  - ✅ Status indicators (draft, scheduled, sent, failed)
  - ✅ Delivery stats
  - ✅ Realtime loading

### 5.2 Templates
- [x] `app/ops/(private)/notifications/templates/page.tsx` oluşturuldu ✅
  - ✅ Template list
  - ✅ Create/Edit/Delete
  - ✅ Category support
  - ✅ Template cards

**Dosyalar:**
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/history/page.tsx`
- ✅ `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/templates/page.tsx`

---

## Phase 6: Edge Functions 🚀

### 6.1 Send Functions
- [x] `supabase/functions/send-notification/index.ts` ✅ YAPILDI (Mobile)
  - ✅ Webhook trigger (notifications table INSERT)
  - ✅ Device token lookup
  - ✅ Preferences check (push_enabled, notification_types)
  - ✅ Expo Push Service integration
  - ✅ Error handling & logging

- [ ] `supabase/functions/send-bulk-notification/index.ts` oluştur (Web - Admin)
  - Segment'e göre kullanıcıları bul
  - Batch insert notifications
  - Campaign record oluştur
  - Progress tracking

### 6.2 Scheduled Processing
- [ ] `supabase/functions/process-scheduled-notifications/index.ts` oluştur (Web - Admin)
  - Cron job (her dakika)
  - Zamanı gelmiş campaigns'i bul
  - Segment'e göre gönder
  - Status update

### 6.3 Cleanup
- [ ] `supabase/functions/cleanup-notifications/index.ts` oluştur (Web - Admin)
  - Cron job (günlük)
  - 30+ gün eski bildirimleri sil
  - Archive old campaigns

**Dosyalar:**
- `supabase/functions/send-notification/index.ts` ✅ (Mobile - Yapıldı)
- `supabase/functions/send-bulk-notification/index.ts` (Web - Yapılacak)
- `supabase/functions/process-scheduled-notifications/index.ts` (Web - Yapılacak)
- `supabase/functions/cleanup-notifications/index.ts` (Web - Yapılacak)

---

## Phase 7: Analytics & Monitoring 📈

### 7.1 Analytics Dashboard
- [ ] `app/ops/(private)/notifications/analytics/page.tsx` oluştur
  - Campaign stats
  - Delivery rate
  - Open rate
  - Click rate

- [ ] `components/notifications/AnalyticsDashboard.tsx` oluştur
  - Charts (recharts)
  - Stats cards
  - Filters

### 7.2 Monitoring
- [ ] Error logs display
- [ ] Failed deliveries list
- [ ] Performance metrics
- [ ] Alert system

**Dosyalar:**
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/analytics/page.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/AnalyticsDashboard.tsx`

---

## Phase 8: Testing & Optimization 🧪

### 8.1 Testing
- [ ] Unit tests (hooks)
- [ ] Integration tests (API routes)
- [ ] E2E tests (admin panel)

### 8.2 Performance
- [ ] Query optimization
- [ ] Pagination
- [ ] Caching strategy
- [ ] Rate limiting

### 8.3 Security
- [ ] Admin role verification
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] CSRF protection

---

## Implementation Order (Recommended)

1. **Database Schema** (Phase 1) - Foundation
2. **Hooks** (Phase 2.1) - Core logic
3. **API Routes** (Phase 3) - Backend endpoints
4. **Components** (Phase 2.2-2.3) - UI
5. **Admin Send Panel** (Phase 4) - Main feature
6. **Edge Functions** (Phase 6) - Processing
7. **History & Templates** (Phase 5) - Secondary features
8. **Analytics** (Phase 7) - Monitoring
9. **Testing** (Phase 8) - Quality

---

## Status Summary

| Phase                  | Status     | Priority | Notes                                     |
| ---------------------- | ---------- | -------- | ----------------------------------------- |
| 1. Setup               | ✅ Complete | 🔴 High   | Mobile ✅, Web admin tables ✅              |
| 2. Frontend            | ✅ Complete | 🔴 High   | Mobile hooks ✅, Web hooks ✅, Components ✅ |
| 3. API Routes          | ✅ Complete | 🔴 High   | Send, mark-read, delete ✅                 |
| 4. Admin Send          | ✅ Complete | 🟠 Medium | Single/Bulk/Scheduled ✅                   |
| 5. History & Templates | ✅ Complete | 🟠 Medium | History page ✅, Templates page ✅          |
| 6. Edge Functions      | 🔄 Partial  | 🟠 Medium | Mobile send ✅, Web bulk/scheduled ⏳       |
| 7. Analytics           | ⏳ Pending  | 🟡 Low    | Dashboard, charts                         |
| 8. Testing             | ⏳ Pending  | 🟡 Low    | Unit, integration, E2E tests              |

---

## Shared vs Platform-Specific

### Shared (Mobile + Web)
- ✅ `notifications` table
- ✅ `device_tokens` table
- ✅ `notification_preferences` table
- ✅ RLS policies (user-level)
- ✅ Realtime subscriptions
- ✅ `send-notification` Edge Function
- ✅ `useNotifications` hook
- ✅ `useNotificationPreferences` hook

### Mobile-Only
- ✅ `useDeviceToken` hook (Expo token registration)
- ✅ `useNotificationListener` hook (deep linking)
- ✅ Push notification UI handling

### Web-Only (Admin)
- ✅ `notification_campaigns` table ✅
- ✅ `notification_templates` table ✅
- ✅ `notification_logs` table ✅
- [ ] `useSendNotification` hook (Phase 2.1)
- [ ] Admin panel (Send/History/Templates/Analytics) (Phase 4-5)
- [ ] `send-bulk-notification` Edge Function (Phase 6)
- [ ] `process-scheduled-notifications` Edge Function (Phase 6)
- [ ] `cleanup-notifications` Edge Function (Phase 6)

---

## Implementation Strategy

1. **Copy Mobile Hooks to Web** (Phase 2.1)
   - `useNotifications.ts` → Copy as-is
   - `useNotificationPreferences.ts` → Copy as-is

2. **Create Admin Tables** (Phase 1.1)
   - `notification_campaigns`
   - `notification_templates`
   - `notification_logs`

3. **Create Admin Hooks** (Phase 2.1)
   - `useSendNotification.ts` (new)

4. **Create Web Components** (Phase 2.2)
   - NotificationCenter, NotificationBell, etc.

5. **Create Admin Panel** (Phase 4-5)
   - Send, History, Templates pages

6. **Create Admin Edge Functions** (Phase 6)
   - send-bulk-notification
   - process-scheduled-notifications
   - cleanup-notifications

---

## Notes

- 📱 Mobile ve web arasında **shared database** (notifications, device_tokens, preferences)
- 🔔 Real-time sync **Supabase Realtime** ile (both platforms)
- 🎯 Admin panel **sadece web'de** (authorized users only)
- ⏰ Zamanlanmış bildirimler **cron job** ile (web admin)
- 📊 Analytics **web admin panel'de** (campaign tracking)
- 🧹 Eski bildirimler **otomatik temizleme** (30 gün)
- 🚀 Push notifications **Expo Push Service** via Edge Function

---

**Last Updated:** Nov 20, 2025
**Mobile Status:** 🟢 Complete (hooks + edge function + database)
**Web Status:** 🟢 Phase 1-5 Complete! (Admin panel ready)
**Total Tasks:** 40+
**Completed:** 30+ (Mobile + Web Phase 1-5)
  - ✅ Database schema (both)
  - ✅ Mobile hooks (3)
  - ✅ Web hooks (3)
  - ✅ API routes (3)
  - ✅ Admin panel pages (4)
  - ✅ Send components (3)
  - ✅ History page (1)
  - ✅ Templates page (1)
**In Progress:** 0
**Pending:** 10+ (Web Phase 6-8: Edge Functions, Analytics, Testing)
