# Shadow Profile API Documentation

## Services

### Audit Service (`audit.service.ts`)

**Purpose:** Logging and tracking of shadow profile activities for security monitoring.

#### `logAudit(userId, action, profileType, metadata)`
Logs an audit event to the database.

```typescript
await logAudit(userId, "pin_changed", "real", { pinLength: 4 });
```

**Parameters:**
- `userId` (string): User ID
- `action` (AuditAction): Action type (e.g., "shadow_mode_enabled", "pin_failed")
- `profileType` ("real" | "shadow"): Profile type
- `metadata` (object, optional): Additional metadata

**Returns:** `Promise<AuditLogResponse>`

#### `getAuditLogs(userId, limit, offset)`
Retrieves audit logs for a user.

```typescript
const result = await getAuditLogs(userId, 50, 0);
```

**Returns:** `Promise<{ success: boolean; data?: AuditLogEntry[] }>`

---

### Rate Limit Service (`rate-limit.service.ts`)

**Purpose:** Prevents brute force attacks on PIN and biometric authentication.

#### `checkPinRateLimit(userId)`
Checks if user is rate limited for PIN attempts.

```typescript
const status = await checkPinRateLimit(userId);
if (status.isLocked) {
  // User is locked out
}
```

**Returns:** `Promise<RateLimitStatus>`

**Rate Limits:**
- PIN: 5 attempts / 15 minutes
- Biometric: 3 attempts / 5 minutes

#### `checkBiometricRateLimit(userId)`
Checks if user is rate limited for biometric attempts.

---

### Anomaly Detection Service (`anomaly-detection.service.ts`)

**Purpose:** Detects suspicious activities and potential security threats.

#### `runAnomalyDetections(userId)`
Runs all anomaly detections in parallel.

```typescript
const alerts = await runAnomalyDetections(userId);
```

**Detections:**
- Excessive failed attempts (10+ in 60 minutes)
- Multiple IPs (2+ different IPs in 60 minutes)
- Long sessions (120+ minutes)
- Unusual access time (outside 8:00-23:00)

**Returns:** `Promise<AnomalyAlert[]>`

---

### Session Service (`session.service.ts`)

**Purpose:** Handles shadow profile session tracking, timeout, and invalidation.

#### `createSession(userId, profileType)`
Creates a new session.

```typescript
const result = await createSession(userId, "shadow");
```

**Session Timeout:** 30 minutes

**Returns:** `Promise<{ success: boolean; sessionId?: string }>`

#### `checkSessionTimeout(sessionId)`
Checks if session is expired.

```typescript
const isExpired = await checkSessionTimeout(sessionId);
```

#### `endSession(sessionId, reason)`
Ends a session.

```typescript
await endSession(sessionId, "user_logout");
```

**Reasons:** "user_logout" | "expired" | "invalidated"

#### `invalidateAllSessions(userId)`
Invalidates all active sessions for a user.

---

## Hooks

### useShadowMode Hook

**Purpose:** Shadow mode authentication and state management.

#### `toggleShadowMode(pin, biometricVerified)`
Toggles shadow mode on/off.

```typescript
const success = await toggleShadowMode("1234", false);
```

**Parameters:**
- `pin` (string): Shadow PIN (empty if biometric verified)
- `biometricVerified` (boolean): Whether biometric was verified

**Returns:** `Promise<boolean>`

#### `verifyShadowPin(pin)`
Verifies shadow PIN.

```typescript
const isValid = await verifyShadowPin("1234");
```

**Rate Limiting:** 5 attempts / 15 minutes

#### `verifyBiometric()`
Verifies biometric authentication.

```typescript
const success = await verifyBiometric();
```

**Rate Limiting:** 3 attempts / 5 minutes

---

## Error Codes

| Code             | Message                       | Severity |
| ---------------- | ----------------------------- | -------- |
| PIN_INVALID      | PIN doğru değil               | High     |
| PIN_RATE_LIMIT   | Çok fazla başarısız deneme    | High     |
| BIOMETRIC_FAILED | Biometric doğrulama başarısız | Medium   |
| SESSION_EXPIRED  | Oturum süresi doldu           | Medium   |
| ANOMALY_DETECTED | Şüpheli aktivite algılandı    | High     |

---

## Best Practices

1. **Always check rate limits** before attempting authentication
2. **Log all security-related actions** for audit trail
3. **Invalidate sessions** on logout or suspicious activity
4. **Monitor anomalies** regularly
5. **Use strong PINs** (6 digits recommended)
6. **Enable biometric** when available for better UX
