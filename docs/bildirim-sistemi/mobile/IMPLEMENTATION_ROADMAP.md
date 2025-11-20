# Implementation Roadmap 🗺️

## Phase 1: Database & Infrastructure (Hafta 1)

### 1.1 Database Schema
- [ ] `notifications` tablosu oluştur
- [ ] `device_tokens` tablosu oluştur
- [ ] `notification_preferences` tablosu oluştur
- [ ] Indexes ekle (recipient_id, created_at)
- [ ] RLS policies ekle

### 1.2 Supabase Setup
- [ ] Realtime enable et
- [ ] REPLICA IDENTITY FULL set et
- [ ] Triggers setup et

**Dosyalar:**
- `supabase/migrations/create_notifications_tables.sql`

---

## Phase 2: Frontend Setup (Hafta 1-2)

### 2.1 Paket Kurulumu
- [ ] `expo-notifications` install
- [ ] `expo-device` install
- [ ] `expo-constants` install
- [ ] `app.json` konfigürasyonu

### 2.2 Hooks Oluştur
- [ ] `useDeviceToken` hook
- [ ] `useNotificationListener` hook
- [ ] `useNotifications` hook
- [ ] `useNotificationPreferences` hook

### 2.3 App Root Layout
- [ ] Device token setup
- [ ] Notification listener setup
- [ ] Deep linking setup

**Dosyalar:**
- `apps/mobile/src/hooks/useDeviceToken.ts`
- `apps/mobile/src/hooks/useNotificationListener.ts`
- `apps/mobile/src/hooks/useNotifications.ts`
- `apps/mobile/src/hooks/useNotificationPreferences.ts`

---

## Phase 3: Components (Hafta 2)

### 3.1 Notification Center
- [ ] `NotificationCenter` component
- [ ] `NotificationItem` component
- [ ] `NotificationBell` component (badge)
- [ ] `NotificationPreferences` screen

### 3.2 Styling & UX
- [ ] Dark/Light mode support
- [ ] Animations
- [ ] Accessibility

**Dosyalar:**
- `apps/mobile/src/components/notifications/NotificationCenter.tsx`
- `apps/mobile/src/components/notifications/NotificationItem.tsx`
- `apps/mobile/src/components/notifications/NotificationBell.tsx`
- `apps/mobile/app/(settings)/notifications.tsx`

---

## Phase 4: Edge Functions (Hafta 2-3)

### 4.1 Notification Triggers
- [ ] `send-notification` function
- [ ] `mark-as-read` function
- [ ] `delete-notification` function
- [ ] `cleanup-old-notifications` function (cron)

### 4.2 Social Notifications
- [ ] `on_new_follower` trigger
- [ ] `on_follow_back` trigger
- [ ] `on_profile_mention` trigger

### 4.3 Messaging Notifications
- [ ] `on_new_message` trigger
- [ ] `on_message_like` trigger
- [ ] `on_message_reply` trigger

**Dosyalar:**
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/mark-notification-read/index.ts`
- `supabase/functions/cleanup-notifications/index.ts`

---

## Phase 5: Messaging System Integration (Hafta 3-4)

### 5.1 Messaging Hooks
- [ ] `useMessages` hook
- [ ] `useConversations` hook
- [ ] `useMessageListener` hook

### 5.2 Messaging Components
- [ ] `ConversationList` component
- [ ] `MessageList` component
- [ ] `MessageInput` component
- [ ] `ChatScreen` screen

### 5.3 Notifications
- [ ] New message notifications
- [ ] Message like notifications
- [ ] Message reply notifications
- [ ] Typing indicators

**Dosyalar:**
- `apps/mobile/src/hooks/useMessages.ts`
- `apps/mobile/src/hooks/useConversations.ts`
- `apps/mobile/src/components/messaging/ConversationList.tsx`
- `apps/mobile/src/components/messaging/MessageList.tsx`
- `apps/mobile/app/(messaging)/index.tsx`

---

## Phase 6: Testing & Optimization (Hafta 4)

### 6.1 Testing
- [ ] Unit tests (hooks)
- [ ] Integration tests (components)
- [ ] E2E tests (flows)

### 6.2 Performance
- [ ] Pagination optimize
- [ ] Query optimize
- [ ] Memory leak check
- [ ] Battery usage check

### 6.3 Production Ready
- [ ] Error handling
- [ ] Logging
- [ ] Analytics
- [ ] Documentation

**Dosyalar:**
- `apps/mobile/__tests__/notifications.test.ts`
- `apps/mobile/__tests__/messaging.test.ts`

---

## Implementation Checklist

### Database
```sql
-- Notifications table
CREATE TABLE notifications (...)
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Device tokens table
CREATE TABLE device_tokens (...)

-- Notification preferences table
CREATE TABLE notification_preferences (...)

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ...
```

### Frontend
```typescript
// App root layout
useDeviceToken();
useNotificationListener();

// Notification center
<NotificationCenter />
<NotificationBell />

// Settings
<NotificationPreferences />
```

### Edge Functions
```typescript
// Triggers
on_new_follower()
on_new_message()
on_message_like()

// Utilities
send_notification()
mark_as_read()
cleanup_old()
```

### Messaging
```typescript
// Hooks
useMessages()
useConversations()
useMessageListener()

// Components
<ConversationList />
<MessageList />
<MessageInput />
```

---

## Timeline

| Phase                   | Duration     | Status    |
| ----------------------- | ------------ | --------- |
| Phase 1: Database       | 2-3 days     | ⏳ Pending |
| Phase 2: Frontend Setup | 3-4 days     | ⏳ Pending |
| Phase 3: Components     | 3-4 days     | ⏳ Pending |
| Phase 4: Edge Functions | 3-4 days     | ⏳ Pending |
| Phase 5: Messaging      | 5-7 days     | ⏳ Pending |
| Phase 6: Testing        | 3-4 days     | ⏳ Pending |
| **Total**               | **~4 weeks** | ⏳ Pending |

---

## Success Criteria

- ✅ Device token başarıyla kaydedilir
- ✅ Bildirimler gerçek zamanlı alınır
- ✅ Deep linking çalışır
- ✅ Notification preferences kaydedilir
- ✅ Messaging system entegre edilir
- ✅ Push notifications gönderilir
- ✅ Tüm notification tipleri çalışır
- ✅ Performance acceptable (<100ms)
- ✅ Battery usage minimal
- ✅ Tests pass (%>90 coverage)

---

## Notes

- 📱 Physical device gerekli (simulator'da push notifications çalışmaz)
- 🔑 EAS credentials setup zorunlu
- 🔐 RLS policies güvenlik için kritik
- 📊 Realtime subscription'lar optimize edilmeli
- 🧹 Eski bildirimler düzenli temizlenmeli (30 gün)

---

## Sonraki Adımlar

1. Database schema oluştur
2. RLS policies ekle
3. Hooks implement et
4. Components oluştur
5. Edge Functions deploy et
6. Messaging system entegre et
7. Testing & optimization
8. Production deploy
