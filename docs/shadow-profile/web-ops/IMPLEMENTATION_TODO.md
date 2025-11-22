# Shadow Profile - Web-Ops Implementation TODO

**Status:** Ready for Implementation  
**Framework:** Next.js (App Router)  
**Priority:** Critical  
**Estimated Time:** 2-3 days  
**Assigned To:** Web-Ops Developer

---

## 🎯 Kimin Ne Yapacağı

### 📱 Mobile Developer (Assistant)
- ✅ Shared packages oluştur (types + broadcast service)
- ✅ `useOpsRealtime` hook (mobil tarafı)
- ✅ Event handlers (session termination, user lockout, config sync)
- ✅ Rate limit & anomaly config dynamic yapma
- ✅ Push notifications (optional)
- ✅ Tests

### 🌐 Web-Ops Developer (You)
- ✅ Shared packages oluştur (types + broadcast service) - **SHARED**
- ✅ API endpoints (5 tane)
- ✅ UI dialogs (4 tane)
- ✅ Integration into pages
- ✅ Database migrations
- ✅ Tests

### 📦 Shared (Both)
- `packages/types/src/shadow.ts` - Shared types
- `packages/api/src/shadow/broadcast.ts` - Broadcast service (web-ops tarafından kullanılacak)

---

## 📋 Başlama Sırası

1. **Shared Packages** (Mobile developer yapacak)
   - Types oluştur
   - Broadcast service oluştur

2. **Web-Ops** (You)
   - API endpoints
   - UI components
   - Database migrations
   - Integration

3. **Mobile** (Mobile developer)
   - useOpsRealtime hook
   - Event handlers
   - Config sync
   - Tests

4. **End-to-End Test** (Both)
   - Web-ops → Mobile communication test

---

## Phase 1: Broadcast Service (SHARED - Mobile Developer)

### Task 1.1: Create Shared Types

**File:** `packages/types/src/shadow.ts` (NEW)

```typescript
// Broadcast event types
export type OpsEventType = 
  | 'session_terminated'
  | 'user_locked'
  | 'user_unlocked'
  | 'rate_limit_config_updated'
  | 'anomaly_detection_config_updated'
  | 'anomaly_alert';

export interface OpsEvent {
  type: OpsEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

// Rate limit config
export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutMinutes: number;
}

// Anomaly detection config
export interface AnomalyDetectionConfig {
  excessiveFailedAttempts: {
    threshold: number;
    windowMinutes: number;
  };
  multipleIps: {
    windowMinutes: number;
  };
  longSession: {
    maxSessionMinutes: number;
  };
  unusualTime: {
    normalHours: { start: number; end: number };
  };
}
```

### Task 1.2: Create Broadcast Service (SHARED)

**File:** `packages/api/src/shadow/broadcast.ts` (NEW)

```typescript
import { createClient } from '@supabase/supabase-js';
import { OpsEvent, OpsEventType } from '@ipelya/types';

export async function sendBroadcast(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  type: OpsEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const channel = supabase.channel(`ops:user:${userId}`);
  
  await channel.send('broadcast', {
    event: type,
    payload: {
      ...payload,
      timestamp: new Date().toISOString()
    }
  });
}

export async function terminateSessionByOps(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  sessionId: string,
  reason: string
): Promise<void> {
  await sendBroadcast(supabase, userId, 'session_terminated', {
    sessionId,
    reason
  });
}

export async function lockUserByOps(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reason: string,
  durationMinutes: number
): Promise<void> {
  const lockedUntil = new Date(Date.now() + durationMinutes * 60000);
  
  await sendBroadcast(supabase, userId, 'user_locked', {
    reason,
    duration: durationMinutes,
    locked_until: lockedUntil.toISOString()
  });
}

export async function unlockUserByOps(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  await sendBroadcast(supabase, userId, 'user_unlocked', {});
}

export async function updateRateLimitConfig(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  type: 'pin' | 'biometric',
  config: Record<string, unknown>
): Promise<void> {
  await sendBroadcast(supabase, userId, 'rate_limit_config_updated', {
    type,
    config
  });
}

export async function updateAnomalyDetectionConfig(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  config: Record<string, unknown>
): Promise<void> {
  await sendBroadcast(supabase, userId, 'anomaly_detection_config_updated', {
    config
  });
}

export async function sendAnomalyAlert(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  alertType: string,
  severity: 'low' | 'medium' | 'high',
  message: string
): Promise<void> {
  await sendBroadcast(supabase, userId, 'anomaly_alert', {
    type: alertType,
    severity,
    message
  });
}
```

---

## Phase 2: API Endpoints (Web-Ops Developer)

### Task 2.1: Session Termination Endpoint

**File:** `/apps/web/app/api/ops/shadow/sessions/[sessionId]/terminate/route.ts` (NEW)

**Endpoint:** `POST /api/ops/shadow/sessions/{sessionId}/terminate`

**Body:**
```json
{
  "userId": "user-id",
  "reason": "Suspicious activity"
}
```

**Implementation:**
- Check auth (user must be admin)
- Call `terminateSessionByOps()` from shared package
- Update session in database
- Log to audit_logs
- Return success/error

**Code Template:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { terminateSessionByOps } from '@ipelya/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check auth
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { userId, reason } = await request.json();
    
    // Call broadcast service
    await terminateSessionByOps(supabase, userId, params.sessionId, reason);
    
    // Update database
    await supabase
      .from('shadow_sessions')
      .update({ status: 'terminated', ended_at: new Date() })
      .eq('id', params.sessionId);
    
    // Log to audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'session_terminated_by_ops',
        profile_type: 'real',
        metadata: { sessionId: params.sessionId, reason, terminated_by: user.id }
      });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### Task 2.2: User Lockout Endpoint

**File:** `/apps/web/app/api/ops/shadow/users/[userId]/lockout/route.ts` (NEW)

**Endpoint:** `POST /api/ops/shadow/users/{userId}/lockout`

**Body:**
```json
{
  "reason": "Suspicious activity",
  "durationMinutes": 30
}
```

**Implementation:**
- Check auth (admin only)
- Call `lockUserByOps()` from shared package
- Create `user_lockouts` record
- Log to audit_logs
- Return success/error

---

### Task 2.3: User Unlock Endpoint

**File:** `/apps/web/app/api/ops/shadow/users/[userId]/unlock/route.ts` (NEW)

**Endpoint:** `POST /api/ops/shadow/users/{userId}/unlock`

**Implementation:**
- Check auth (admin only)
- Call `unlockUserByOps()` from shared package
- Delete `user_lockouts` record
- Log to audit_logs
- Return success/error

---

### Task 2.4: Rate Limit Config Update Endpoint

**File:** `/apps/web/app/api/ops/shadow/config/rate-limits/update/route.ts` (NEW)

**Endpoint:** `PUT /api/ops/shadow/config/rate-limits/update`

**Body:**
```json
{
  "userId": "user-id",
  "type": "pin",
  "config": {
    "maxAttempts": 5,
    "windowMinutes": 15,
    "lockoutMinutes": 30
  }
}
```

**Implementation:**
- Check auth (admin only)
- Call `updateRateLimitConfig()` from shared package
- Store in `ops_config` table
- Log to audit_logs
- Return success/error

---

### Task 2.5: Anomaly Config Update Endpoint

**File:** `/apps/web/app/api/ops/shadow/config/anomaly-detection/update/route.ts` (NEW)

**Endpoint:** `PUT /api/ops/shadow/config/anomaly-detection/update`

**Body:**
```json
{
  "userId": "user-id",
  "config": {
    "excessiveFailedAttempts": { "threshold": 10, "windowMinutes": 60 },
    "longSession": { "maxSessionMinutes": 120 }
  }
}
```

**Implementation:**
- Check auth (admin only)
- Call `updateAnomalyDetectionConfig()` from shared package
- Store in `ops_config` table
- Log to audit_logs
- Return success/error

---

## Phase 3: UI Components (Web-Ops Developer)

### Task 3.1: Session Termination Dialog

**File:** `/apps/web/components/ops/session-termination-dialog.tsx` (NEW)

**Features:**
- Input field for termination reason
- Confirm button
- Call `/api/ops/shadow/sessions/{sessionId}/terminate`
- Show toast on success/error

**Usage in SessionsTable:**
```tsx
const [terminateDialog, setTerminateDialog] = useState<{
  open: boolean;
  sessionId: string;
  userId: string;
} | null>(null);

// In table row action button:
onClick={() => setTerminateDialog({ open: true, sessionId, userId })}

// In component:
{terminateDialog && (
  <SessionTerminationDialog
    open={terminateDialog.open}
    onOpenChange={(open) => setTerminateDialog(open ? terminateDialog : null)}
    sessionId={terminateDialog.sessionId}
    userId={terminateDialog.userId}
    onSuccess={() => refetch()}
  />
)}
```

---

### Task 3.2: User Lockout Dialog

**File:** `/apps/web/components/ops/user-lockout-dialog.tsx` (NEW)

**Features:**
- Input field for lockout reason
- Select dropdown for duration (15min, 30min, 1h, 4h, 1day)
- Confirm button
- Call `/api/ops/shadow/users/{userId}/lockout`
- Show toast on success/error

---

### Task 3.3: Rate Limit Config Dialog

**File:** `/apps/web/components/ops/rate-limit-config-dialog.tsx` (NEW)

**Features:**
- Select for PIN or Biometric
- Input fields for maxAttempts, windowMinutes, lockoutMinutes
- Confirm button
- Call `/api/ops/shadow/config/rate-limits/update`
- Show toast on success/error

---

### Task 3.4: Anomaly Config Dialog

**File:** `/apps/web/components/ops/anomaly-config-dialog.tsx` (NEW)

**Features:**
- Input fields for thresholds
- Confirm button
- Call `/api/ops/shadow/config/anomaly-detection/update`
- Show toast on success/error

---

## Phase 4: Integration into Existing Pages

### Task 4.1: Add Termination to Sessions Page

**File:** `/apps/web/app/ops/(private)/shadow/sessions/page.tsx` (MODIFY)

**Changes:**
- Import `SessionTerminationDialog`
- Add state for dialog
- Add "Terminate" button to each session row
- Show dialog on button click
- Refetch sessions on success

---

### Task 4.2: Add Lockout to Users Page

**File:** `/apps/web/app/ops/(private)/shadow/users/page.tsx` (MODIFY or CREATE)

**Features:**
- List all users with shadow profiles
- Show user info (username, email, role)
- Show lockout status
- Add "Lock" and "Unlock" buttons
- Add "Update Config" button

---

### Task 4.3: Add Config Update to Config Page

**File:** `/apps/web/app/ops/(private)/shadow/config/page.tsx` (MODIFY)

**Changes:**
- Add "Update Rate Limit Config" button
- Add "Update Anomaly Config" button
- Show dialogs on button click
- Allow selecting user to update

---

## Phase 5: Database Schema Updates

### Task 5.1: Create `user_lockouts` Table

**SQL:**
```sql
CREATE TABLE user_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  locked_until TIMESTAMP NOT NULL,
  created_by TEXT DEFAULT 'ops',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

---

### Task 5.2: Create `ops_config` Table

**SQL:**
```sql
CREATE TABLE ops_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  config_type TEXT NOT NULL,
  config JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, config_type)
);
```

---

## Phase 6: Testing

### Manual Testing Checklist

- [ ] Session Termination
  - [ ] Web-ops terminates session
  - [ ] Mobile receives broadcast
  - [ ] Session ends on mobile
  - [ ] Audit log created

- [ ] User Lockout
  - [ ] Web-ops locks user
  - [ ] Mobile receives broadcast
  - [ ] Shadow mode disables
  - [ ] Audit log created

- [ ] Rate Limit Config Update
  - [ ] Web-ops updates config
  - [ ] Mobile receives broadcast
  - [ ] Config applies on mobile

- [ ] Anomaly Config Update
  - [ ] Web-ops updates config
  - [ ] Mobile receives broadcast
  - [ ] Config applies on mobile

---

## Summary

**New Files to Create:**
1. `/apps/web/src/services/ops-broadcast.service.ts`
2. `/apps/web/app/api/ops/shadow/sessions/[sessionId]/terminate/route.ts`
3. `/apps/web/app/api/ops/shadow/users/[userId]/lockout/route.ts`
4. `/apps/web/app/api/ops/shadow/users/[userId]/unlock/route.ts`
5. `/apps/web/app/api/ops/shadow/config/rate-limits/update/route.ts`
6. `/apps/web/app/api/ops/shadow/config/anomaly-detection/update/route.ts`
7. `/apps/web/components/ops/session-termination-dialog.tsx`
8. `/apps/web/components/ops/user-lockout-dialog.tsx`
9. `/apps/web/components/ops/rate-limit-config-dialog.tsx`
10. `/apps/web/components/ops/anomaly-config-dialog.tsx`

**Files to Modify:**
1. `/apps/web/app/ops/(private)/shadow/sessions/page.tsx`
2. `/apps/web/app/ops/(private)/shadow/config/page.tsx`

**Database Migrations:**
1. Create `user_lockouts` table
2. Create `ops_config` table

**Estimated Time:** 2-3 days
