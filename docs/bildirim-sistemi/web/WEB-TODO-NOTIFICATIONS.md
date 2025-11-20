# Web Bildirim Sistemi - TODO List 📋

## Mevcut Durum
- ✅ Supabase setup (server + browser clients)
- ✅ Auth system (login/register)
- ✅ Ops admin panel (users, creators, content, economy, security, account, settings)
- ✅ UI components (Radix UI, shadcn/ui)
- ⏳ **Bildirim sistemi - BAŞLANMADI**

---

## Phase 1: Setup & Infrastructure ⏳

### 1.1 Database Schema
- [ ] `notifications` tablosu oluştur
- [ ] `notification_campaigns` tablosu oluştur
- [ ] `notification_templates` tablosu oluştur
- [ ] `notification_logs` tablosu oluştur
- [ ] Indexes ekle (campaign_id, status, recipient_id)
- [ ] RLS policies ekle

**Dosya:** `supabase/migrations/create_notification_tables.sql`

### 1.2 Environment & Config
- [ ] `.env.local` bildirim config'lerini ekle
- [ ] Supabase service role key kontrol et
- [ ] Admin API key setup et

---

## Phase 2: Frontend Components 🎨

### 2.1 Hooks
- [ ] `hooks/useNotifications.ts` oluştur
  - `loadNotifications()` - Bildirimleri yükle
  - `markAsRead()` - Bildirim okundu işaretle
  - `markAllAsRead()` - Tümünü okundu yap
  - `deleteNotification()` - Bildirim sil
  - Realtime subscription setup

- [ ] `hooks/useSendNotification.ts` oluştur (Admin)
  - `sendNotification()` - Bildirim gönder
  - Payload validation

**Dosyalar:**
- `/Users/yunussahin/ipelya-app/apps/web/hooks/useNotifications.ts`
- `/Users/yunussahin/ipelya-app/apps/web/hooks/useSendNotification.ts`

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
- [ ] `app/layout.tsx` güncelle
  - NotificationCenter'ı header'a ekle
  - Providers setup (Supabase, Realtime)

- [ ] `app/ops/(private)/layout.tsx` güncelle
  - Sidebar'a notifications link ekle

**Dosyalar:**
- `/Users/yunussahin/ipelya-app/apps/web/app/layout.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/layout.tsx`

---

## Phase 3: API Routes 🔌

### 3.1 Notification Routes
- [ ] `app/api/notifications/send/route.ts` oluştur
  - POST endpoint
  - Auth check (admin)
  - Payload validation
  - Single/bulk/scheduled support

- [ ] `app/api/notifications/mark-read/route.ts` oluştur
  - POST endpoint
  - Mark single as read
  - Mark all as read

- [ ] `app/api/notifications/[id]/delete/route.ts` oluştur
  - DELETE endpoint
  - Auth check

**Dosyalar:**
- `/Users/yunussahin/ipelya-app/apps/web/app/api/notifications/send/route.ts`
- `/Users/yunussahin/ipelya-app/apps/web/app/api/notifications/mark-read/route.ts`
- `/Users/yunussahin/ipelya-app/apps/web/app/api/notifications/[id]/delete/route.ts`

---

## Phase 4: Admin Panel - Send 📬

### 4.1 Single Notification
- [ ] `app/ops/(private)/notifications/send/components/SingleNotification.tsx` oluştur
  - User search/select
  - Title, body input
  - Preview
  - Send button

### 4.2 Bulk Notification
- [ ] `app/ops/(private)/notifications/send/components/BulkNotification.tsx` oluştur
  - Segment selector (all, creators, premium, inactive)
  - Filter options
  - Recipient count preview
  - Send button

### 4.3 Scheduled Notification
- [ ] `app/ops/(private)/notifications/send/components/ScheduledNotification.tsx` oluştur
  - DateTime picker
  - Timezone support
  - Schedule button

### 4.4 Main Send Page
- [ ] `app/ops/(private)/notifications/send/page.tsx` oluştur
  - Tab selector (single/bulk/scheduled)
  - Component switcher
  - Form container

**Dosyalar:**
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/page.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/components/SingleNotification.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/components/BulkNotification.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/send/components/ScheduledNotification.tsx`

---

## Phase 5: Admin Panel - History & Templates 📊

### 5.1 Notification History
- [ ] `app/ops/(private)/notifications/history/page.tsx` oluştur
  - Campaign list
  - Status indicators (draft, scheduled, sent, failed)
  - Delivery stats
  - Retry failed button

- [ ] `components/notifications/NotificationHistory.tsx` oluştur
  - Data table
  - Filters (status, date range)
  - Pagination

### 5.2 Templates
- [ ] `app/ops/(private)/notifications/templates/page.tsx` oluştur
  - Template list
  - Create/Edit/Delete

- [ ] `components/notifications/TemplateList.tsx` oluştur
  - Template cards
  - Quick send button

- [ ] `components/notifications/TemplateEditor.tsx` oluştur
  - Form (name, title, body, category)
  - Save/Cancel buttons

**Dosyalar:**
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/history/page.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/app/ops/(private)/notifications/templates/page.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/NotificationHistory.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/TemplateList.tsx`
- `/Users/yunussahin/ipelya-app/apps/web/components/notifications/TemplateEditor.tsx`

---

## Phase 6: Edge Functions 🚀

### 6.1 Send Functions
- [ ] `supabase/functions/send-notification/index.ts` oluştur
  - Single notification gönder
  - Error handling
  - Logging

- [ ] `supabase/functions/send-bulk-notification/index.ts` oluştur
  - Segment'e göre kullanıcıları bul
  - Batch insert
  - Campaign record oluştur

### 6.2 Scheduled Processing
- [ ] `supabase/functions/process-scheduled-notifications/index.ts` oluştur
  - Cron job (her dakika)
  - Zamanı gelmiş campaigns'i bul
  - Segment'e göre gönder
  - Status update

### 6.3 Cleanup
- [ ] `supabase/functions/cleanup-notifications/index.ts` oluştur
  - Cron job (günlük)
  - 30+ gün eski bildirimleri sil
  - Archive old campaigns

**Dosyalar:**
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/send-bulk-notification/index.ts`
- `supabase/functions/process-scheduled-notifications/index.ts`
- `supabase/functions/cleanup-notifications/index.ts`

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

| Phase                  | Status    | Priority |
| ---------------------- | --------- | -------- |
| 1. Setup               | ⏳ Pending | 🔴 High   |
| 2. Frontend            | ⏳ Pending | 🔴 High   |
| 3. API Routes          | ⏳ Pending | 🔴 High   |
| 4. Admin Send          | ⏳ Pending | 🟠 Medium |
| 5. History & Templates | ⏳ Pending | 🟠 Medium |
| 6. Edge Functions      | ⏳ Pending | 🟠 Medium |
| 7. Analytics           | ⏳ Pending | 🟡 Low    |
| 8. Testing             | ⏳ Pending | 🟡 Low    |

---

## Notes

- 📱 Mobile ve web arasında shared database
- 🔔 Real-time sync Supabase Realtime ile
- 🎯 Admin panel sadece authorized users
- ⏰ Zamanlanmış bildirimler cron job ile
- 📊 Analytics için event logging
- 🧹 Eski bildirimler otomatik temizleme

---

**Last Updated:** Nov 20, 2025
**Total Tasks:** 40+
**Completed:** 0
**In Progress:** 0
