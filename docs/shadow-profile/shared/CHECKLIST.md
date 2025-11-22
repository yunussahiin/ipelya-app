# Shadow Profile - Implementation Checklist

**Overall Status:** 30% Complete (Mobile → Web-Ops only)  
**Target:** 100% Complete (Two-way sync)  
**Timeline:** 2-3 days

---

## 📱 MOBILE SIDE (Priority 1)

### Phase 1: Realtime WebSocket Setup ⭐ CRITICAL

- [ ] **1.1** Create `/apps/mobile/src/hooks/useOpsRealtime.ts`
  - [ ] Implement Supabase channel subscription
  - [ ] Handle `session_terminated` event
  - [ ] Handle `user_locked` event
  - [ ] Handle `rate_limit_config_updated` event
  - [ ] Handle `anomaly_detection_config_updated` event
  - [ ] Handle `anomaly_alert` event
  - [ ] Add error handling
  - [ ] Add logging

- [ ] **1.2** Integrate hook into app
  - [ ] Import in `/apps/mobile/app/(shadow)/index.tsx`
  - [ ] Call `useOpsRealtime(userId)`
  - [ ] Test connection

---

### Phase 2: Session Termination Handler

- [ ] **2.1** Implement session termination logic
  - [ ] End session in database
  - [ ] Disable shadow mode
  - [ ] Log audit event
  - [ ] Clear session from store
  - [ ] Show alert to user

- [ ] **2.2** Add audit actions
  - [ ] Add `session_terminated_by_ops` to audit types
  - [ ] Add `user_locked_by_ops` to audit types

---

### Phase 3: User Lockout Handler

- [ ] **3.1** Implement user lockout logic
  - [ ] Disable shadow mode
  - [ ] Log audit event
  - [ ] Show alert with duration
  - [ ] Clear session

---

### Phase 4: Rate Limit Config Sync

- [ ] **4.1** Make rate limit config dynamic
  - [ ] Change `PIN_RATE_LIMIT` to mutable
  - [ ] Change `BIOMETRIC_RATE_LIMIT` to mutable
  - [ ] Implement `updateRateLimitConfigDynamic()`
  - [ ] Implement `loadRateLimitConfig()`
  - [ ] Add AsyncStorage persistence (optional)

- [ ] **4.2** Update hook to apply changes
  - [ ] Import update function
  - [ ] Call in `handleRateLimitConfigUpdated()`

---

### Phase 5: Anomaly Detection Config Sync

- [ ] **5.1** Make anomaly config dynamic
  - [ ] Create mutable `ANOMALY_CONFIG` object
  - [ ] Implement `updateAnomalyConfig()`
  - [ ] Implement `getAnomalyConfig()`
  - [ ] Update all detection functions to use config

- [ ] **5.2** Update hook to apply changes
  - [ ] Import update function
  - [ ] Call in `handleAnomalyConfigUpdated()`

---

### Phase 6: Push Notifications (Optional)

- [ ] **6.1** Setup Expo Notifications
  - [ ] Create `/apps/mobile/src/lib/notifications.ts`
  - [ ] Implement `initializeNotifications()`
  - [ ] Implement `sendLocalNotification()`
  - [ ] Implement `setupNotificationResponseListener()`

- [ ] **6.2** Send notifications for events
  - [ ] Add notification to session termination
  - [ ] Add notification to user lockout
  - [ ] Add notification to anomaly alerts

---

### Phase 7: Testing & Verification

- [ ] **7.1** Manual testing
  - [ ] Test session termination flow
  - [ ] Test user lockout flow
  - [ ] Test rate limit config update
  - [ ] Test anomaly config update
  - [ ] Test notifications

- [ ] **7.2** Integration testing
  - [ ] Create test file `/apps/mobile/__tests__/hooks/useOpsRealtime.test.ts`
  - [ ] Write test cases for all handlers
  - [ ] Run tests and verify coverage

---

### Phase 8: Documentation

- [ ] **8.1** Update documentation
  - [ ] Update `/docs/shadow-profile/mobile/SYNC_STATUS.md`
  - [ ] Create `/docs/shadow-profile/mobile/REALTIME_GUIDE.md`

---

## 🌐 WEB-OPS SIDE (Priority 2)

### Phase 1: Broadcast Service

- [ ] **1.1** Create `/apps/web/src/services/ops-broadcast.service.ts`
  - [ ] Implement `sendBroadcast()`
  - [ ] Implement `terminateSessionByOps()`
  - [ ] Implement `lockUserByOps()`
  - [ ] Implement `unlockUserByOps()`
  - [ ] Implement `updateRateLimitConfig()`
  - [ ] Implement `updateAnomalyDetectionConfig()`
  - [ ] Implement `sendAnomalyAlert()`
  - [ ] Add error handling

---

### Phase 2: API Endpoints

- [ ] **2.1** Session termination endpoint
  - [ ] Create `/apps/web/app/api/ops/shadow/sessions/[sessionId]/terminate/route.ts`
  - [ ] Add auth check
  - [ ] Add validation
  - [ ] Call broadcast service

- [ ] **2.2** User lockout endpoint
  - [ ] Create `/apps/web/app/api/ops/shadow/users/[userId]/lockout/route.ts`
  - [ ] Add auth check
  - [ ] Add validation
  - [ ] Call broadcast service

- [ ] **2.3** User unlock endpoint
  - [ ] Create `/apps/web/app/api/ops/shadow/users/[userId]/unlock/route.ts`
  - [ ] Add auth check
  - [ ] Call broadcast service

- [ ] **2.4** Rate limit config endpoint
  - [ ] Create `/apps/web/app/api/ops/shadow/config/rate-limits/update/route.ts`
  - [ ] Add auth check
  - [ ] Add validation
  - [ ] Call broadcast service

- [ ] **2.5** Anomaly config endpoint
  - [ ] Create `/apps/web/app/api/ops/shadow/config/anomaly-detection/update/route.ts`
  - [ ] Add auth check
  - [ ] Add validation
  - [ ] Call broadcast service

---

### Phase 3: UI Components

- [ ] **3.1** Session termination dialog
  - [ ] Create `/apps/web/components/ops/session-termination-dialog.tsx`
  - [ ] Add reason input
  - [ ] Add confirm button
  - [ ] Call API endpoint
  - [ ] Show toast

- [ ] **3.2** User lockout dialog
  - [ ] Create `/apps/web/components/ops/user-lockout-dialog.tsx`
  - [ ] Add reason input
  - [ ] Add duration select
  - [ ] Add confirm button
  - [ ] Call API endpoint
  - [ ] Show toast

- [ ] **3.3** Rate limit config dialog
  - [ ] Create `/apps/web/components/ops/rate-limit-config-dialog.tsx`
  - [ ] Add type select (PIN/Biometric)
  - [ ] Add config inputs
  - [ ] Add confirm button
  - [ ] Call API endpoint

- [ ] **3.4** Anomaly config dialog
  - [ ] Create `/apps/web/components/ops/anomaly-config-dialog.tsx`
  - [ ] Add threshold inputs
  - [ ] Add confirm button
  - [ ] Call API endpoint

---

### Phase 4: Integration into Pages

- [ ] **4.1** Sessions page
  - [ ] Import termination dialog
  - [ ] Add state for dialog
  - [ ] Add "Terminate" button to rows
  - [ ] Refetch on success

- [ ] **4.2** Users page (NEW or MODIFY)
  - [ ] List users with shadow profiles
  - [ ] Add "Lock" button
  - [ ] Add "Unlock" button
  - [ ] Add "Update Config" button
  - [ ] Show lockout status

- [ ] **4.3** Config page
  - [ ] Add "Update Rate Limit Config" button
  - [ ] Add "Update Anomaly Config" button
  - [ ] Show dialogs on click

---

### Phase 5: Database Schema

- [ ] **5.1** Create `user_lockouts` table
  - [ ] user_id (FK to auth.users)
  - [ ] reason (TEXT)
  - [ ] locked_until (TIMESTAMP)
  - [ ] created_by (TEXT)
  - [ ] created_at (TIMESTAMP)

- [ ] **5.2** Create `ops_config` table
  - [ ] user_id (FK to auth.users)
  - [ ] config_type (TEXT)
  - [ ] config (JSONB)
  - [ ] updated_at (TIMESTAMP)

---

### Phase 6: Testing

- [ ] **6.1** Manual testing
  - [ ] Test session termination
  - [ ] Test user lockout/unlock
  - [ ] Test config updates
  - [ ] Verify mobile receives broadcasts

- [ ] **6.2** Integration testing
  - [ ] Test API endpoints
  - [ ] Test error handling
  - [ ] Test auth checks

---

## 📊 Synchronization Status

| Feature                 | Mobile | Web-Ops | Status      |
| ----------------------- | ------ | ------- | ----------- |
| Audit Logging           | ✅      | ✅       | Complete    |
| Sessions                | ✅      | ✅       | Complete    |
| Rate Limiting           | ✅      | ✅       | Complete    |
| Anomaly Detection       | ✅      | ✅       | Complete    |
| **Session Termination** | ⏳      | ⏳       | In Progress |
| **User Lockout**        | ⏳      | ⏳       | In Progress |
| **Config Sync**         | ⏳      | ⏳       | In Progress |
| **Push Notifications**  | ⏳      | ❌       | Pending     |
| **Realtime Updates**    | ⏳      | ⏳       | In Progress |

---

## 🎯 Daily Breakdown

### Day 1: Mobile Realtime Setup
- [ ] Create `useOpsRealtime` hook
- [ ] Implement all event handlers
- [ ] Integrate into app
- [ ] Test connection with web-ops

### Day 2: Mobile Config Sync
- [ ] Make rate limit config dynamic
- [ ] Make anomaly config dynamic
- [ ] Update hook handlers
- [ ] Add notifications (optional)

### Day 3: Web-Ops Implementation
- [ ] Create broadcast service
- [ ] Create API endpoints
- [ ] Create UI dialogs
- [ ] Integrate into pages
- [ ] Test end-to-end

---

## 📝 Documentation Files

**Created:**
- ✅ `/docs/shadow-profile/mobile/SYNC_STATUS.md`
- ✅ `/docs/shadow-profile/mobile/IMPLEMENTATION_TODO.md`
- ✅ `/docs/shadow-profile/web-ops/IMPLEMENTATION_TODO.md`
- ✅ `/docs/shadow-profile/shared/CHECKLIST.md` (this file)

**To Create:**
- [ ] `/docs/shadow-profile/mobile/REALTIME_GUIDE.md`
- [ ] `/docs/shadow-profile/web-ops/GUIDE.md`

---

## 🚀 Quick Start

### Mobile Development
1. Read `/docs/shadow-profile/mobile/IMPLEMENTATION_TODO.md`
2. Start with Phase 1 (Realtime Setup)
3. Follow the checklist above
4. Test with web-ops

### Web-Ops Development
1. Read `/docs/shadow-profile/web-ops/IMPLEMENTATION_TODO.md`
2. Start with Phase 1 (Broadcast Service)
3. Follow the checklist above
4. Test with mobile app

---

## 💡 Key Points

**Mobile:**
- Realtime listener must be active on shadow profile screen
- All events must be logged to audit_logs
- User must see alerts for critical events
- Config updates must be applied dynamically

**Web-Ops:**
- All actions require admin auth
- All actions must be logged to audit_logs
- Broadcast must be sent to mobile
- Database must be updated before broadcast

**Testing:**
- Test each phase independently
- Test end-to-end after each phase
- Verify audit logs are created
- Verify mobile receives broadcasts

---

## 📞 Support

For questions or issues:
1. Check the implementation TODO files
2. Check the SYNC_STATUS.md for current state
3. Review code examples in the TODO files
4. Check Supabase documentation for Broadcast API

---

**Last Updated:** 2025-11-22  
**Status:** Ready for Implementation  
**Assigned To:** Mobile (Priority 1), Web-Ops (Priority 2)
