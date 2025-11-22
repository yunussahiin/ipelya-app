# Shadow Profile - Implementation Guide

**Status:** Ready for Implementation  
**Timeline:** 2-3 days  
**Last Updated:** 2025-11-22

---

## 📋 Genel Bakış

Bu döküman, shadow profile sisteminin two-way synchronization'ını implement etmek için gerekli olan tüm adımları açıklar.

**Mevcut Durum:**
- ✅ Mobile → Web-Ops: Audit logs, sessions, rate limits, anomalies kaydediliyor
- ❌ Web-Ops → Mobile: Komutlar uygulanmıyor, config güncellemeleri yok

**Hedef:**
- ✅ Two-way synchronization (Mobile ↔ Web-Ops)
- ✅ Realtime updates
- ✅ Config sync
- ✅ Session management
- ✅ User lockout/unlock

---

## 👥 Kimin Ne Yapacağı

### 📱 Mobile Developer (Assistant)

**Sorumlu:**
1. Shared packages oluştur
   - `packages/types/src/shadow.ts` - Types
   - `packages/api/src/shadow/broadcast.ts` - Broadcast service

2. Mobile implementation
   - `useOpsRealtime` hook
   - Event handlers
   - Config sync
   - Tests

**Döküman:** `/docs/shadow-profile/mobile/IMPLEMENTATION_TODO.md`

### 🌐 Web-Ops Developer (You)

**Sorumlu:**
1. API endpoints (5 tane)
   - Session termination
   - User lockout/unlock
   - Rate limit config update
   - Anomaly detection config update

2. UI components (4 tane)
   - Session termination dialog
   - User lockout dialog
   - Rate limit config dialog
   - Anomaly detection config dialog

3. Database migrations
   - `user_lockouts` table
   - `ops_config` table

4. Integration
   - Sessions page
   - Users page
   - Config page

**Döküman:** `/docs/shadow-profile/web-ops/IMPLEMENTATION_TODO.md`

---

## 🔄 Realtime Architecture

### Broadcast Flow

```
Web-Ops Dashboard
    ↓
API Endpoint (POST /api/ops/shadow/...)
    ↓
Broadcast Service (packages/api/src/shadow/broadcast.ts)
    ↓
Supabase Broadcast Channel (ops:user:{userId})
    ↓
Mobile App (useOpsRealtime hook)
    ↓
Event Handler
    ↓
Local State Update + Audit Log
```

### Event Types

```typescript
type OpsEventType = 
  | 'session_terminated'      // Web-ops terminates session
  | 'user_locked'             // Web-ops locks user
  | 'user_unlocked'           // Web-ops unlocks user
  | 'rate_limit_config_updated'       // Web-ops updates rate limit config
  | 'anomaly_detection_config_updated' // Web-ops updates anomaly config
  | 'anomaly_alert'           // Web-ops sends anomaly alert
```

---

## 📦 Shared Packages Structure

### `packages/types/src/shadow.ts`

```typescript
// Event types
export type OpsEventType = 'session_terminated' | 'user_locked' | ...

// Interfaces
export interface OpsEvent { ... }
export interface RateLimitConfig { ... }
export interface AnomalyDetectionConfig { ... }
```

### `packages/api/src/shadow/broadcast.ts`

```typescript
// Generic broadcast sender
export async function sendBroadcast(supabase, userId, type, payload)

// Specific functions
export async function terminateSessionByOps(supabase, userId, sessionId, reason)
export async function lockUserByOps(supabase, userId, reason, durationMinutes)
export async function unlockUserByOps(supabase, userId)
export async function updateRateLimitConfig(supabase, userId, type, config)
export async function updateAnomalyDetectionConfig(supabase, userId, config)
export async function sendAnomalyAlert(supabase, userId, alertType, severity, message)
```

---

## 🚀 Implementation Order

### Phase 1: Shared Packages (Mobile Developer)
**Duration:** 2-4 hours

1. Create `packages/types/src/shadow.ts`
2. Create `packages/api/src/shadow/broadcast.ts`
3. Update `packages/types/src/index.ts` and `packages/api/src/index.ts`

**Checklist:**
- [ ] Types created
- [ ] Broadcast service created
- [ ] Exports updated
- [ ] No TypeScript errors

---

### Phase 2: Mobile Implementation (Mobile Developer)
**Duration:** 1-2 days

1. Create `useOpsRealtime` hook
2. Implement event handlers
3. Make rate limit config dynamic
4. Make anomaly detection config dynamic
5. Add push notifications (optional)
6. Write tests

**Checklist:**
- [ ] Hook created
- [ ] All event handlers working
- [ ] Config sync working
- [ ] Tests passing

---

### Phase 3: Web-Ops Implementation (Web-Ops Developer)
**Duration:** 1-2 days

1. Create API endpoints (5 tane)
2. Create UI dialogs (4 tane)
3. Create database migrations
4. Integrate into pages
5. Write tests

**Checklist:**
- [ ] All endpoints created
- [ ] All dialogs created
- [ ] Database migrations applied
- [ ] Integration complete
- [ ] Tests passing

---

### Phase 4: End-to-End Testing (Both)
**Duration:** 4-8 hours

1. Test session termination flow
2. Test user lockout/unlock flow
3. Test rate limit config update
4. Test anomaly detection config update
5. Verify audit logs
6. Performance testing

**Checklist:**
- [ ] Session termination working
- [ ] User lockout/unlock working
- [ ] Config updates working
- [ ] Audit logs created
- [ ] No performance issues

---

## 📝 Documentation Files

### Main Docs
- `/docs/shadow-profile/README.md` - Overview
- `/docs/shadow-profile/OVERVIEW.md` - Concepts
- `/docs/shadow-profile/IMPLEMENTATION.md` - Technical details
- `/docs/shadow-profile/SECURITY.md` - Security protocols

### Implementation Docs
- `/docs/shadow-profile/mobile/IMPLEMENTATION_TODO.md` - Mobile tasks
- `/docs/shadow-profile/web-ops/IMPLEMENTATION_TODO.md` - Web-ops tasks
- `/docs/shadow-profile/shared/CHECKLIST.md` - Master checklist

### Status Docs
- `/docs/shadow-profile/mobile/SYNC_STATUS.md` - Mobile sync status

---

## 🔑 Key Points

### Realtime Communication
- **Channel:** `ops:user:{userId}` (Supabase Broadcast)
- **Direction:** Web-Ops → Mobile (one-way)
- **Latency:** ~20-50ms
- **Reliability:** Guaranteed delivery (Supabase handles)

### Database Updates
- **Web-Ops:** Updates database BEFORE sending broadcast
- **Mobile:** Receives broadcast and updates local state
- **Audit:** All actions logged to `audit_logs`

### Security
- **Auth:** Admin-only for web-ops actions
- **RLS:** Not needed for broadcast (channel-based)
- **Validation:** Input validation on both sides

### Error Handling
- **Web-Ops:** Try-catch with proper error responses
- **Mobile:** Try-catch with user alerts
- **Logging:** All errors logged for debugging

---

## 🧪 Testing Strategy

### Unit Tests
- Broadcast service functions
- Event handlers
- Config update logic

### Integration Tests
- API endpoints
- Database operations
- Audit logging

### End-to-End Tests
- Full flow from web-ops to mobile
- Multiple event types
- Error scenarios

---

## 📞 Communication

### If Issues Arise

**Mobile Developer → Web-Ops Developer:**
- "API endpoint not working" → Check endpoint implementation
- "Broadcast not received" → Check channel name and event type
- "Config not applying" → Check config update handler

**Web-Ops Developer → Mobile Developer:**
- "Broadcast not sent" → Check if API endpoint called correctly
- "Mobile not responding" → Check if hook is initialized
- "Audit log missing" → Check if logging is implemented

---

## ✅ Completion Checklist

### Shared Packages
- [ ] Types created
- [ ] Broadcast service created
- [ ] Exports updated
- [ ] No TypeScript errors

### Mobile
- [ ] useOpsRealtime hook created
- [ ] All event handlers implemented
- [ ] Config sync working
- [ ] Push notifications added (optional)
- [ ] Tests passing

### Web-Ops
- [ ] All API endpoints created
- [ ] All UI dialogs created
- [ ] Database migrations applied
- [ ] Integration complete
- [ ] Tests passing

### End-to-End
- [ ] Session termination working
- [ ] User lockout/unlock working
- [ ] Config updates working
- [ ] Audit logs created
- [ ] Performance acceptable

---

## 📚 Reference

### Supabase Broadcast
- Channel: `supabase.channel('ops:user:{userId}')`
- Send: `channel.send('broadcast', { event: type, payload })`
- Listen: `channel.on('broadcast', { event: type }, callback)`

### Database Tables
- `shadow_sessions` - Shadow profile sessions
- `user_lockouts` - User lockout records (NEW)
- `ops_config` - Operation configurations (NEW)
- `audit_logs` - Audit trail

### API Endpoints
- `POST /api/ops/shadow/sessions/{sessionId}/terminate`
- `POST /api/ops/shadow/users/{userId}/lockout`
- `POST /api/ops/shadow/users/{userId}/unlock`
- `PUT /api/ops/shadow/config/rate-limits/update`
- `PUT /api/ops/shadow/config/anomaly-detection/update`

---

**Ready to start? Check the specific implementation docs for your role!**
