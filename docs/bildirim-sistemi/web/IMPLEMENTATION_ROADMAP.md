# Web Implementation Roadmap 🗺️

## Phase 1: Setup & Infrastructure (Hafta 1)

### 1.1 Environment Setup
- [ ] `.env.local` konfigürasyonu
- [ ] Supabase client setup
- [ ] Next.js middleware setup
- [ ] Auth integration

### 1.2 Database Schema
- [ ] `notification_campaigns` tablosu
- [ ] `notification_templates` tablosu
- [ ] `notification_logs` tablosu
- [ ] Indexes ekle
- [ ] RLS policies ekle

**Dosyalar:**
- `lib/supabase.ts`
- `middleware.ts`
- `supabase/migrations/create_admin_tables.sql`

---

## Phase 2: Frontend Components (Hafta 1-2)

### 2.1 Notification Center
- [ ] `NotificationCenter` component
- [ ] `NotificationBell` component (badge)
- [ ] `NotificationItem` component
- [ ] `NotificationList` component
- [ ] Real-time updates

### 2.2 Hooks
- [ ] `useNotifications` hook
- [ ] `useSendNotification` hook (admin)
- [ ] `useNotificationPreferences` hook

### 2.3 API Routes
- [ ] `POST /api/notifications/send`
- [ ] `POST /api/notifications/mark-read`
- [ ] `DELETE /api/notifications/:id`

**Dosyalar:**
- `components/notifications/NotificationCenter.tsx`
- `components/notifications/NotificationBell.tsx`
- `hooks/useNotifications.ts`
- `hooks/useSendNotification.ts`
- `app/api/notifications/send/route.ts`

---

## Phase 3: Admin Panel - Send (Hafta 2)

### 3.1 Single Notification
- [ ] `SingleNotification` component
- [ ] User search/select
- [ ] Preview
- [ ] Send

### 3.2 Bulk Notification
- [ ] `BulkNotification` component
- [ ] Segment selector
- [ ] Filter options
- [ ] Recipient count preview
- [ ] Send

### 3.3 Scheduled Notification
- [ ] `ScheduledNotification` component
- [ ] DateTime picker
- [ ] Timezone support
- [ ] Schedule

**Dosyalar:**
- `app/ops/notifications/send/page.tsx`
- `app/ops/notifications/send/components/SingleNotification.tsx`
- `app/ops/notifications/send/components/BulkNotification.tsx`
- `app/ops/notifications/send/components/ScheduledNotification.tsx`
- `app/ops/notifications/send/components/NotificationPreview.tsx`

---

## Phase 4: Admin Panel - History & Templates (Hafta 2-3)

### 4.1 Notification History
- [ ] `NotificationHistory` component
- [ ] Campaign list
- [ ] Status indicators
- [ ] Delivery stats
- [ ] Retry failed

### 4.2 Templates
- [ ] `TemplateList` component
- [ ] `TemplateEditor` component
- [ ] Create/Edit/Delete
- [ ] Template categories
- [ ] Quick send from template

**Dosyalar:**
- `app/ops/notifications/history/page.tsx`
- `app/ops/notifications/history/components/NotificationHistory.tsx`
- `app/ops/notifications/templates/page.tsx`
- `app/ops/notifications/templates/components/TemplateList.tsx`
- `app/ops/notifications/templates/components/TemplateEditor.tsx`

---

## Phase 5: Edge Functions & Cron (Hafta 3)

### 5.1 Send Functions
- [ ] `send-notification` function
- [ ] `send-bulk-notification` function
- [ ] Error handling
- [ ] Retry logic

### 5.2 Scheduled Processing
- [ ] `process-scheduled-notifications` function
- [ ] Cron job setup
- [ ] Timezone handling
- [ ] Batch processing

### 5.3 Cleanup
- [ ] `cleanup-old-notifications` function
- [ ] Archive old campaigns
- [ ] Delete logs (30+ days)

**Dosyalar:**
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/send-bulk-notification/index.ts`
- `supabase/functions/process-scheduled-notifications/index.ts`
- `supabase/functions/cleanup-notifications/index.ts`

---

## Phase 6: Analytics & Monitoring (Hafta 3-4)

### 6.1 Analytics Dashboard
- [ ] Campaign stats
- [ ] Delivery rate
- [ ] Open rate
- [ ] Click rate
- [ ] Charts & graphs

### 6.2 Monitoring
- [ ] Error logs
- [ ] Failed deliveries
- [ ] Performance metrics
- [ ] Alerts

**Dosyalar:**
- `app/ops/notifications/analytics/page.tsx`
- `app/ops/notifications/analytics/components/AnalyticsDashboard.tsx`

---

## Phase 7: Testing & Optimization (Hafta 4)

### 7.1 Testing
- [ ] Unit tests (hooks)
- [ ] Integration tests (API routes)
- [ ] E2E tests (admin panel)

### 7.2 Performance
- [ ] Query optimization
- [ ] Pagination
- [ ] Caching
- [ ] Rate limiting

### 7.3 Security
- [ ] Admin role verification
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] CSRF protection

**Dosyalar:**
- `app/__tests__/notifications.test.ts`
- `app/ops/__tests__/admin-panel.test.ts`

---

## Implementation Checklist

### Database
```sql
-- Admin tables
CREATE TABLE notification_campaigns (...)
CREATE TABLE notification_templates (...)
CREATE TABLE notification_logs (...)

-- Indexes
CREATE INDEX idx_campaigns_admin_id ON notification_campaigns(admin_id);
CREATE INDEX idx_campaigns_status ON notification_campaigns(status);
CREATE INDEX idx_logs_campaign_id ON notification_logs(campaign_id);

-- RLS Policies
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view own campaigns" ...
```

### Frontend
```typescript
// Layout
<NotificationCenter />
<NotificationBell />

// Admin Panel
/ops/notifications/send
/ops/notifications/history
/ops/notifications/templates
/ops/notifications/analytics
```

### Edge Functions
```typescript
// Triggers
send_notification()
send_bulk_notification()
process_scheduled_notifications()
cleanup_notifications()
```

### API Routes
```typescript
POST /api/notifications/send
POST /api/notifications/mark-read
DELETE /api/notifications/:id
GET /api/notifications/campaigns
GET /api/notifications/templates
```

---

## Timeline

| Phase                        | Duration     | Status    |
| ---------------------------- | ------------ | --------- |
| Phase 1: Setup               | 2-3 days     | ⏳ Pending |
| Phase 2: Frontend            | 3-4 days     | ⏳ Pending |
| Phase 3: Admin Send          | 3-4 days     | ⏳ Pending |
| Phase 4: History & Templates | 3-4 days     | ⏳ Pending |
| Phase 5: Edge Functions      | 3-4 days     | ⏳ Pending |
| Phase 6: Analytics           | 2-3 days     | ⏳ Pending |
| Phase 7: Testing             | 3-4 days     | ⏳ Pending |
| **Total**                    | **~4 weeks** | ⏳ Pending |

---

## Success Criteria

- ✅ Notifications gerçek zamanlı alınır
- ✅ Admin panel çalışır
- ✅ Kişiye özel bildirim gönderilir
- ✅ Toplu bildirim gönderilir
- ✅ Zamanlanmış bildirim gönderilir
- ✅ Cron job çalışır
- ✅ Analytics dashboard çalışır
- ✅ Performance acceptable (<200ms)
- ✅ Tests pass (%>85 coverage)
- ✅ Security audit pass

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Next.js Web App                                        │
│  ├─ NotificationCenter (Real-time)                     │
│  ├─ /ops Admin Panel                                   │
│  │  ├─ Send (Single/Bulk/Scheduled)                   │
│  │  ├─ History                                         │
│  │  ├─ Templates                                       │
│  │  └─ Analytics                                       │
│  └─ API Routes                                         │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│  Supabase Backend                                       │
│  ├─ PostgreSQL                                         │
│  │  ├─ notifications                                   │
│  │  ├─ notification_campaigns                          │
│  │  ├─ notification_templates                          │
│  │  └─ notification_logs                               │
│  ├─ Realtime                                           │
│  │  └─ Subscriptions                                   │
│  └─ Edge Functions                                     │
│     ├─ send-notification                               │
│     ├─ send-bulk-notification                          │
│     ├─ process-scheduled-notifications                 │
│     └─ cleanup-notifications                           │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│  Expo Push Service                                      │
│  ├─ FCM (Android)                                      │
│  └─ APNs (iOS)                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Notes

- 📱 Mobile ve web arasında shared database
- 🔔 Real-time sync Supabase Realtime ile
- 🎯 Admin panel sadece authorized users
- ⏰ Zamanlanmış bildirimler cron job ile
- 📊 Analytics için event logging
- 🧹 Eski bildirimler otomatik temizleme

---

## Sonraki Adımlar

1. Database schema oluştur
2. Frontend components oluştur
3. Admin panel oluştur
4. Edge Functions deploy et
5. Cron job setup et
6. Testing & optimization
7. Production deploy
