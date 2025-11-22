# Shadow Profile - Mobile Implementation TODO

**Status:** Ready for Implementation  
**Priority:** Critical (Web-Ops → Mobile Communication)  
**Estimated Time:** 2-3 days  
**Assigned To:** Mobile Developer (Assistant)

---

## 🎯 Kimin Ne Yapacağı

### 📱 Mobile Developer (Assistant - YOU)
- ✅ Shared packages oluştur (types + broadcast service)
- ✅ `useOpsRealtime` hook (mobil tarafı)
- ✅ Event handlers (session termination, user lockout, config sync)
- ✅ Rate limit & anomaly config dynamic yapma
- ✅ Push notifications (optional)
- ✅ Tests

### 🌐 Web-Ops Developer (Web-Ops)
- ✅ Shared packages oluştur (types + broadcast service) - **SHARED**
- ✅ API endpoints (5 tane)
- ✅ UI dialogs (4 tane)
- ✅ Integration into pages
- ✅ Database migrations
- ✅ Tests

### 📦 Shared (Both)
- `packages/types/src/shadow.ts` - Shared types (Mobile developer yapacak)
- `packages/api/src/shadow/broadcast.ts` - Broadcast service (Mobile developer yapacak)

---

## 📋 Başlama Sırası

1. **Shared Packages** (You - Mobile developer)
   - Types oluştur
   - Broadcast service oluştur

2. **Mobile** (You)
   - useOpsRealtime hook
   - Event handlers
   - Config sync
   - Tests

3. **Web-Ops** (Web-ops developer)
   - API endpoints
   - UI components
   - Database migrations
   - Integration

4. **End-to-End Test** (Both)
   - Web-ops → Mobile communication test

---

## Overview

Mobil uygulamada web-ops'tan gelen komutları dinlemek ve uygulamak için realtime WebSocket setup gerekiyor. Şu ana kadar sadece **Mobile → Web-Ops** (one-way) senkronizasyon var. **Web-Ops → Mobile** (two-way) iletişim tamamen eksik.

---

## Phase 1: Realtime WebSocket Setup (CRITICAL)

### Task 1.1: Create `useOpsRealtime` Hook

**File:** `/apps/mobile/src/hooks/useOpsRealtime.ts` (NEW)

**Purpose:** Web-ops'tan gelen broadcast mesajlarını dinlemek

**Implementation:**

```typescript
/**
 * useOpsRealtime Hook
 * 
 * Web-ops'tan gelen komutları realtime olarak dinler:
 * - Session termination by ops
 * - User lockout by ops
 * - Config updates (rate limits, anomaly detection)
 * - Anomaly alerts
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useShadowStore } from '@/store/shadow.store';
import { endSession } from '@/services/session.service';
import { logAudit } from '@/services/audit.service';
import { Alert } from 'react-native';

export interface OpsCommand {
  type: 'session_terminated' | 'user_locked' | 'config_updated' | 'anomaly_alert';
  payload: Record<string, unknown>;
  timestamp: string;
}

export function useOpsRealtime(userId: string | undefined) {
  const setShadowEnabled = useCallback((enabled: boolean) => {
    useShadowStore.setState({ enabled });
  }, []);

  useEffect(() => {
    if (!userId) return;

    console.log('🔗 Setting up realtime listener for ops commands...');

    // Subscribe to ops broadcast channel
    const channel = supabase
      .channel(`ops:user:${userId}`)
      .on(
        'broadcast',
        { event: 'session_terminated' },
        async (payload) => {
          console.log('📡 Received: session_terminated', payload);
          await handleSessionTerminated(payload.payload, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'user_locked' },
        (payload) => {
          console.log('📡 Received: user_locked', payload);
          handleUserLocked(payload.payload, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'rate_limit_config_updated' },
        (payload) => {
          console.log('📡 Received: rate_limit_config_updated', payload);
          handleRateLimitConfigUpdated(payload.payload);
        }
      )
      .on(
        'broadcast',
        { event: 'anomaly_detection_config_updated' },
        (payload) => {
          console.log('📡 Received: anomaly_detection_config_updated', payload);
          handleAnomalyConfigUpdated(payload.payload);
        }
      )
      .on(
        'broadcast',
        { event: 'anomaly_alert' },
        (payload) => {
          console.log('📡 Received: anomaly_alert', payload);
          handleAnomalyAlert(payload.payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime listener connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime listener error');
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime listener disconnected');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from realtime listener...');
      channel.unsubscribe();
    };
  }, [userId]);
}

/**
 * Handle session termination by ops
 */
async function handleSessionTerminated(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    const sessionId = payload.sessionId as string;
    const reason = payload.reason as string;

    console.log(`⚠️ Session terminated by ops: ${sessionId} (reason: ${reason})`);

    // End session locally
    await endSession(sessionId, 'invalidated');

    // Disable shadow mode
    useShadowStore.setState({ enabled: false });

    // Log audit event
    await logAudit(userId, 'session_terminated_by_ops', 'real', {
      sessionId,
      reason
    });

    // Show alert to user
    Alert.alert(
      'Oturum Sonlandırıldı',
      `Ops tarafından oturumunuz sonlandırıldı. Neden: ${reason}`,
      [{ text: 'Tamam', onPress: () => {} }]
    );
  } catch (error) {
    console.error('❌ Error handling session termination:', error);
  }
}

/**
 * Handle user lockout by ops
 */
function handleUserLocked(payload: Record<string, unknown>, userId: string) {
  try {
    const reason = payload.reason as string;
    const duration = payload.duration as number; // minutes

    console.log(`🔒 User locked by ops: ${reason} (${duration} min)`);

    // Disable shadow mode
    useShadowStore.setState({ enabled: false });

    // Log audit event
    logAudit(userId, 'user_locked_by_ops', 'real', {
      reason,
      duration
    });

    // Show alert to user
    Alert.alert(
      'Hesap Kilitlendi',
      `Hesabınız ${duration} dakika boyunca kilitlenmiştir. Neden: ${reason}`,
      [{ text: 'Tamam', onPress: () => {} }]
    );
  } catch (error) {
    console.error('❌ Error handling user lockout:', error);
  }
}

/**
 * Handle rate limit config update
 */
function handleRateLimitConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Record<string, unknown>;
    const type = payload.type as 'pin' | 'biometric';

    console.log(`⚙️ Rate limit config updated for ${type}:`, config);

    // Update rate limit config dynamically
    // This will be implemented in rate-limit.service.ts
    // For now, just log it
    console.log('📝 Rate limit config update received - implementation pending');
  } catch (error) {
    console.error('❌ Error handling rate limit config update:', error);
  }
}

/**
 * Handle anomaly detection config update
 */
function handleAnomalyConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Record<string, unknown>;

    console.log('⚙️ Anomaly detection config updated:', config);

    // Update anomaly detection config dynamically
    // This will be implemented in anomaly-detection.service.ts
    console.log('📝 Anomaly detection config update received - implementation pending');
  } catch (error) {
    console.error('❌ Error handling anomaly config update:', error);
  }
}

/**
 * Handle anomaly alert from ops
 */
function handleAnomalyAlert(payload: Record<string, unknown>) {
  try {
    const alertType = payload.type as string;
    const severity = payload.severity as string;
    const message = payload.message as string;

    console.log(`🚨 Anomaly alert received: ${alertType} (${severity})`);

    // Show notification to user
    Alert.alert(
      'Şüpheli Aktivite Algılandı',
      message,
      [{ text: 'Tamam', onPress: () => {} }]
    );
  } catch (error) {
    console.error('❌ Error handling anomaly alert:', error);
  }
}
```

**Checklist:**
- [ ] Create file
- [ ] Implement all event handlers
- [ ] Add error handling
- [ ] Test with web-ops

---

### Task 1.2: Integrate `useOpsRealtime` into App

**File:** `/apps/mobile/app/(shadow)/index.tsx` (MODIFY)

**Purpose:** Initialize realtime listener when shadow profile screen loads

**Implementation:**

```typescript
import { useOpsRealtime } from '@/hooks/useOpsRealtime';

export default function ShadowScreen() {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Setup realtime listeners for ops commands
  useOpsRealtime(user?.id);

  return (
    // ... existing UI
  );
}
```

**Checklist:**
- [ ] Import hook
- [ ] Call hook with userId
- [ ] Test listener connection

---

## Phase 2: Session Termination Handler

### Task 2.1: Implement Session Termination Logic

**File:** `/apps/mobile/src/hooks/useOpsRealtime.ts` (MODIFY - `handleSessionTerminated`)

**Purpose:** When ops terminates a session, end it locally and logout user

**Implementation Details:**

```typescript
async function handleSessionTerminated(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    const sessionId = payload.sessionId as string;
    const reason = payload.reason as string;

    // 1. End session in database
    await endSession(sessionId, 'invalidated');

    // 2. Disable shadow mode locally
    useShadowStore.setState({ enabled: false });

    // 3. Log audit event
    await logAudit(userId, 'session_terminated_by_ops', 'real', {
      sessionId,
      reason
    });

    // 4. Clear session from store
    useShadowStore.setState({ sessionId: null });

    // 5. Show alert to user
    Alert.alert(
      'Oturum Sonlandırıldı',
      `Ops tarafından oturumunuz sonlandırıldı.\n\nNeden: ${reason}`,
      [
        {
          text: 'Tamam',
          onPress: () => {
            // Optional: Navigate to home screen
            // router.push('/');
          }
        }
      ]
    );

    console.log('✅ Session terminated successfully');
  } catch (error) {
    console.error('❌ Error handling session termination:', error);
  }
}
```

**Checklist:**
- [ ] Implement session termination
- [ ] Clear local state
- [ ] Log audit event
- [ ] Show user alert
- [ ] Test end-to-end

---

### Task 2.2: Add Session Termination Audit Action

**File:** `/apps/mobile/src/services/audit.service.ts` (MODIFY)

**Purpose:** Add `session_terminated_by_ops` to audit actions

**Implementation:**

```typescript
export type AuditAction =
  | "shadow_mode_enabled"
  | "shadow_mode_disabled"
  | "pin_created"
  | "pin_changed"
  | "pin_verified"
  | "pin_failed"
  | "biometric_enabled"
  | "biometric_disabled"
  | "biometric_verified"
  | "biometric_failed"
  | "profile_updated"
  | "avatar_uploaded"
  | "session_started"
  | "session_ended"
  | "session_timeout"
  | "session_terminated_by_ops"  // NEW
  | "user_locked_by_ops";         // NEW
```

**Checklist:**
- [ ] Add new audit actions
- [ ] Update type definitions

---

## Phase 3: User Lockout Handler

### Task 3.1: Implement User Lockout Logic

**File:** `/apps/mobile/src/hooks/useOpsRealtime.ts` (MODIFY - `handleUserLocked`)

**Purpose:** When ops locks a user, disable shadow mode and show alert

**Implementation Details:**

```typescript
function handleUserLocked(payload: Record<string, unknown>, userId: string) {
  try {
    const reason = payload.reason as string;
    const duration = payload.duration as number; // minutes
    const lockedUntil = payload.locked_until as string; // ISO timestamp

    // 1. Disable shadow mode
    useShadowStore.setState({ enabled: false });

    // 2. Log audit event
    logAudit(userId, 'user_locked_by_ops', 'real', {
      reason,
      duration,
      lockedUntil
    });

    // 3. Show alert to user
    Alert.alert(
      '🔒 Hesap Kilitlendi',
      `Hesabınız ${duration} dakika boyunca kilitlenmiştir.\n\nNeden: ${reason}\n\nKilit saat: ${new Date(lockedUntil).toLocaleTimeString('tr-TR')}`,
      [
        {
          text: 'Tamam',
          onPress: () => {
            // Optional: Navigate to home
            // router.push('/');
          }
        }
      ]
    );

    console.log('✅ User lockout handled');
  } catch (error) {
    console.error('❌ Error handling user lockout:', error);
  }
}
```

**Checklist:**
- [ ] Implement user lockout
- [ ] Disable shadow mode
- [ ] Log audit event
- [ ] Show user alert with duration
- [ ] Test end-to-end

---

## Phase 4: Rate Limit Config Sync

### Task 4.1: Make Rate Limit Config Dynamic

**File:** `/apps/mobile/src/services/rate-limit.service.ts` (MODIFY)

**Purpose:** Allow rate limit config to be updated dynamically from web-ops

**Current State:**
```typescript
const PIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMinutes: 15,
  lockoutMinutes: 30
};

const BIOMETRIC_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMinutes: 5,
  lockoutMinutes: 15
};
```

**Required Changes:**

```typescript
// Make configs mutable
let PIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMinutes: 15,
  lockoutMinutes: 30
};

let BIOMETRIC_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMinutes: 5,
  lockoutMinutes: 15
};

/**
 * Update rate limit configuration dynamically
 */
export function updateRateLimitConfigDynamic(
  type: 'pin' | 'biometric',
  config: Partial<RateLimitConfig>
): RateLimitConfig {
  const current = type === 'pin' ? PIN_RATE_LIMIT : BIOMETRIC_RATE_LIMIT;
  const updated = { ...current, ...config };

  if (type === 'pin') {
    PIN_RATE_LIMIT = updated;
  } else {
    BIOMETRIC_RATE_LIMIT = updated;
  }

  console.log(`✅ Rate limit config updated for ${type}:`, updated);
  
  // Optional: Persist to AsyncStorage
  // await AsyncStorage.setItem(`rate_limit_${type}`, JSON.stringify(updated));

  return updated;
}

/**
 * Load rate limit config from storage (on app start)
 */
export async function loadRateLimitConfig(): Promise<void> {
  try {
    // Optional: Load from AsyncStorage if persisted
    // const pinConfig = await AsyncStorage.getItem('rate_limit_pin');
    // if (pinConfig) {
    //   PIN_RATE_LIMIT = JSON.parse(pinConfig);
    // }
    console.log('✅ Rate limit config loaded');
  } catch (error) {
    console.error('❌ Error loading rate limit config:', error);
  }
}
```

**Checklist:**
- [ ] Make configs mutable
- [ ] Implement `updateRateLimitConfigDynamic`
- [ ] Implement `loadRateLimitConfig`
- [ ] Add AsyncStorage persistence (optional)
- [ ] Update `handleRateLimitConfigUpdated` in hook

---

### Task 4.2: Update Hook to Apply Config Changes

**File:** `/apps/mobile/src/hooks/useOpsRealtime.ts` (MODIFY - `handleRateLimitConfigUpdated`)

**Purpose:** Apply rate limit config updates from web-ops

**Implementation:**

```typescript
import { updateRateLimitConfigDynamic } from '@/services/rate-limit.service';

function handleRateLimitConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Partial<RateLimitConfig>;
    const type = payload.type as 'pin' | 'biometric';

    console.log(`⚙️ Updating rate limit config for ${type}:`, config);

    // Apply config update
    updateRateLimitConfigDynamic(type, config);

    console.log('✅ Rate limit config updated successfully');
  } catch (error) {
    console.error('❌ Error handling rate limit config update:', error);
  }
}
```

**Checklist:**
- [ ] Import function
- [ ] Call update function
- [ ] Test config changes

---

## Phase 5: Anomaly Detection Config Sync

### Task 5.1: Make Anomaly Detection Config Dynamic

**File:** `/apps/mobile/src/services/anomaly-detection.service.ts` (MODIFY)

**Purpose:** Allow anomaly detection thresholds to be updated dynamically

**Current State:**
```typescript
export async function detectExcessiveFailedAttempts(
  userId: string,
  threshold: number = 10,
  windowMinutes: number = 60
): Promise<AnomalyAlert | null> {
  // ...
}
```

**Required Changes:**

```typescript
// Store config in a mutable object
let ANOMALY_CONFIG = {
  excessiveFailedAttempts: {
    threshold: 10,
    windowMinutes: 60
  },
  multipleIps: {
    windowMinutes: 60
  },
  longSession: {
    maxSessionMinutes: 120
  },
  unusualTime: {
    normalHours: { start: 8, end: 23 }
  }
};

/**
 * Update anomaly detection configuration
 */
export function updateAnomalyConfig(
  newConfig: Partial<typeof ANOMALY_CONFIG>
): void {
  ANOMALY_CONFIG = { ...ANOMALY_CONFIG, ...newConfig };
  console.log('✅ Anomaly detection config updated:', ANOMALY_CONFIG);
}

/**
 * Get current anomaly config
 */
export function getAnomalyConfig() {
  return ANOMALY_CONFIG;
}

// Update detection functions to use config
export async function detectExcessiveFailedAttempts(
  userId: string
): Promise<AnomalyAlert | null> {
  try {
    const { threshold, windowMinutes } = ANOMALY_CONFIG.excessiveFailedAttempts;
    // ... rest of implementation
  } catch (error) {
    console.error('❌ Excessive failed attempts detection error:', error);
    return null;
  }
}
```

**Checklist:**
- [ ] Create mutable config object
- [ ] Implement `updateAnomalyConfig`
- [ ] Implement `getAnomalyConfig`
- [ ] Update all detection functions to use config
- [ ] Add AsyncStorage persistence (optional)

---

### Task 5.2: Update Hook to Apply Anomaly Config Changes

**File:** `/apps/mobile/src/hooks/useOpsRealtime.ts` (MODIFY - `handleAnomalyConfigUpdated`)

**Purpose:** Apply anomaly detection config updates from web-ops

**Implementation:**

```typescript
import { updateAnomalyConfig } from '@/services/anomaly-detection.service';

function handleAnomalyConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Record<string, unknown>;

    console.log('⚙️ Updating anomaly detection config:', config);

    // Apply config update
    updateAnomalyConfig(config);

    console.log('✅ Anomaly detection config updated successfully');
  } catch (error) {
    console.error('❌ Error handling anomaly config update:', error);
  }
}
```

**Checklist:**
- [ ] Import function
- [ ] Call update function
- [ ] Test config changes

---

## Phase 6: Push Notifications (Optional but Recommended)

### Task 6.1: Setup Expo Notifications

**File:** `/apps/mobile/src/lib/notifications.ts` (NEW)

**Purpose:** Setup push notification handlers for critical events

**Implementation:**

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Initialize notification handler
 */
export async function initializeNotifications() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Request permissions
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Notification permissions not granted');
  }
}

/**
 * Send local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: { seconds: 1 },
  });
}

/**
 * Handle notification response
 */
export function setupNotificationResponseListener() {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { notification } = response;
      console.log('Notification tapped:', notification.request.content.data);
      
      // Handle notification tap
      // e.g., navigate to relevant screen
    }
  );

  return subscription;
}
```

**Checklist:**
- [ ] Create notifications setup file
- [ ] Implement initialization
- [ ] Implement local notification sender
- [ ] Implement response listener

---

### Task 6.2: Send Notifications for Critical Events

**File:** `/apps/mobile/src/hooks/useOpsRealtime.ts` (MODIFY)

**Purpose:** Send push notifications when critical events occur

**Implementation:**

```typescript
import { sendLocalNotification } from '@/lib/notifications';

async function handleSessionTerminated(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    // ... existing code ...

    // Send notification
    await sendLocalNotification(
      '🔴 Oturum Sonlandırıldı',
      `Ops tarafından oturumunuz sonlandırıldı. Neden: ${reason}`,
      { type: 'session_terminated', sessionId }
    );

    // ... rest of code ...
  } catch (error) {
    console.error('❌ Error handling session termination:', error);
  }
}

function handleUserLocked(payload: Record<string, unknown>, userId: string) {
  try {
    // ... existing code ...

    // Send notification
    sendLocalNotification(
      '🔒 Hesap Kilitlendi',
      `Hesabınız ${duration} dakika boyunca kilitlenmiştir.`,
      { type: 'user_locked', duration }
    );

    // ... rest of code ...
  } catch (error) {
    console.error('❌ Error handling user lockout:', error);
  }
}
```

**Checklist:**
- [ ] Import notification function
- [ ] Add notifications to all handlers
- [ ] Test notifications

---

## Phase 7: Testing & Verification

### Task 7.1: Manual Testing Checklist

- [ ] **Session Termination**
  - [ ] Web-ops terminates session
  - [ ] Mobile app receives event
  - [ ] Session ends locally
  - [ ] Shadow mode disables
  - [ ] User sees alert
  - [ ] Audit log created

- [ ] **User Lockout**
  - [ ] Web-ops locks user
  - [ ] Mobile app receives event
  - [ ] Shadow mode disables
  - [ ] User sees alert with duration
  - [ ] Audit log created

- [ ] **Rate Limit Config Update**
  - [ ] Web-ops updates config
  - [ ] Mobile app receives update
  - [ ] Config applies dynamically
  - [ ] New limits enforced

- [ ] **Anomaly Detection Config Update**
  - [ ] Web-ops updates thresholds
  - [ ] Mobile app receives update
  - [ ] Config applies dynamically
  - [ ] New thresholds used

- [ ] **Notifications**
  - [ ] Session termination notification sent
  - [ ] User lockout notification sent
  - [ ] Notifications appear on device
  - [ ] Tapping notification works

---

### Task 7.2: Integration Testing

**File:** `/apps/mobile/__tests__/hooks/useOpsRealtime.test.ts` (NEW)

**Purpose:** Test realtime event handling

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useOpsRealtime } from '@/hooks/useOpsRealtime';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient');
jest.mock('@/services/session.service');
jest.mock('@/services/audit.service');

describe('useOpsRealtime', () => {
  it('should handle session_terminated event', async () => {
    // Test implementation
  });

  it('should handle user_locked event', async () => {
    // Test implementation
  });

  it('should handle rate_limit_config_updated event', async () => {
    // Test implementation
  });

  it('should handle anomaly_detection_config_updated event', async () => {
    // Test implementation
  });
});
```

**Checklist:**
- [ ] Create test file
- [ ] Write test cases
- [ ] Run tests
- [ ] Achieve >80% coverage

---

## Phase 8: Documentation & Deployment

### Task 8.1: Update Mobile Documentation

**File:** `/docs/shadow-profile/mobile/SYNC_STATUS.md` (UPDATE)

**Purpose:** Document completed realtime implementation

**Checklist:**
- [ ] Update synchronization status
- [ ] Document all implemented features
- [ ] Add troubleshooting guide
- [ ] Add example usage

---

### Task 8.2: Create Implementation Guide

**File:** `/docs/shadow-profile/mobile/REALTIME_GUIDE.md` (NEW)

**Purpose:** Guide for future developers

**Content:**
- Architecture overview
- How realtime works
- Event types and payloads
- Troubleshooting common issues
- Performance considerations

**Checklist:**
- [ ] Create guide
- [ ] Add diagrams
- [ ] Add code examples
- [ ] Add troubleshooting section

---

## Summary of Files to Create/Modify

### New Files
1. `/apps/mobile/src/hooks/useOpsRealtime.ts` - Realtime listener hook
2. `/apps/mobile/src/lib/notifications.ts` - Notification setup
3. `/apps/mobile/__tests__/hooks/useOpsRealtime.test.ts` - Tests
4. `/docs/shadow-profile/mobile/REALTIME_GUIDE.md` - Developer guide

### Modified Files
1. `/apps/mobile/src/services/audit.service.ts` - Add new audit actions
2. `/apps/mobile/src/services/rate-limit.service.ts` - Make config dynamic
3. `/apps/mobile/src/services/anomaly-detection.service.ts` - Make config dynamic
4. `/apps/mobile/app/(shadow)/index.tsx` - Initialize realtime listener
5. `/docs/shadow-profile/mobile/SYNC_STATUS.md` - Update status

---

## Implementation Order

1. **Phase 1:** Realtime WebSocket Setup (1 day)
   - Create hook
   - Integrate into app
   - Test connection

2. **Phase 2:** Session Termination (4 hours)
   - Implement handler
   - Add audit action
   - Test end-to-end

3. **Phase 3:** User Lockout (4 hours)
   - Implement handler
   - Test end-to-end

4. **Phase 4:** Rate Limit Config Sync (4 hours)
   - Make config dynamic
   - Update hook
   - Test changes

5. **Phase 5:** Anomaly Detection Config Sync (4 hours)
   - Make config dynamic
   - Update hook
   - Test changes

6. **Phase 6:** Push Notifications (4 hours)
   - Setup notifications
   - Add to handlers
   - Test notifications

7. **Phase 7:** Testing & Verification (1 day)
   - Manual testing
   - Integration tests
   - Bug fixes

8. **Phase 8:** Documentation (4 hours)
   - Update docs
   - Create guide
   - Add examples

**Total Estimated Time:** 2-3 days

---

## Dependencies

```json
{
  "expo-notifications": "^0.27.0",
  "react-native": "^0.73.0",
  "@supabase/supabase-js": "^2.39.0"
}
```

All dependencies already installed ✅

---

## Notes

- All realtime events use Supabase Broadcast (not Postgres Changes)
- Events are sent from web-ops using Supabase client
- Mobile app listens on channel: `ops:user:{userId}`
- All events are logged to audit_logs table
- User is always shown an alert for critical events
- Optional: Persist config changes to AsyncStorage for offline support
