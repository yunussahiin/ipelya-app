# Shadow Profile - End-to-End Test Rehberi

**Durum:** Test Hazır  
**Tarih:** 2025-11-22  
**Proje:** Shadow Profile İki Yönlü Senkronizasyon

---

## 🎯 Test Genel Bakış

Bu rehber, shadow profile web-ops'tan mobil uygulamaya iletişim sisteminin end-to-end testini kapsar. Supabase Broadcast kullanılmaktadır.

**Test Ortamı:**
- Supabase Projesi: `ojkyisyjsbgbfytrmmlz`
- Realtime Kanalı: `ops:user:{userId}`
- Test Kullanıcı ID: `9143806b-1467-4a82-af7d-195239dc0a77`

---

## 📋 Test Senaryoları

### Test 1: Oturum Sonlandırma

**Amaç:** Web-ops'tan shadow oturumunu sonlandırabildiğini ve mobil tarafının event'i aldığını doğrula.

**Web-Ops Adımları:**
1. `/apps/web/app/ops/(private)/shadow/sessions` sayfasına git
2. Aktif bir shadow oturumu bul
3. "Terminate" (Sonlandır) butonuna tıkla
4. Sebep gir: "Test oturum sonlandırması"
5. "Confirm" (Onayla) butonuna tıkla

**Beklenen Web-Ops Davranışı:**
- ✅ API endpoint çağrıldı: `POST /api/ops/shadow/sessions/{sessionId}/terminate`
- ✅ Broadcast gönderildi: `sendBroadcast(userId, 'session_terminated', {...})`
- ✅ Database güncellendi: `sessions.status = 'terminated'`
- ✅ Audit log oluşturuldu: `action = 'session_terminated_by_ops'`
- ✅ Toast gösterildi: "✓ Oturum başarıyla sonlandırıldı"

**Mobil Adımları:**
1. Shadow feed screen'i açık tut
2. Console log'larını izle
3. Mobil davranışını gözlemle

**Beklenen Mobil Davranışı:**
- ✅ Console log: `📡 Received: session_terminated`
- ✅ Console log: `⚠️ Session terminated by ops: {sessionId}`
- ✅ Alert gösterildi: "Oturum Sonlandırıldı - Ops tarafından oturumunuz sonlandırıldı"
- ✅ Shadow mode devre dışı: `useShadowStore.enabled = false`
- ✅ Console log: `✅ Session terminated successfully`

**Doğrulama:**
```sql
-- Oturum sonlandırıldı mı kontrol et
SELECT * FROM sessions 
WHERE id = '{sessionId}' 
AND status = 'terminated';

-- Audit log kontrol et
SELECT * FROM audit_logs 
WHERE action = 'session_terminated_by_ops' 
AND user_id = '{userId}';
```

---

### Test 2: User Lockout

**Objective:** Verify that web-ops can lock a user and mobile receives the event.

**Web-Ops Steps:**
1. Navigate to `/apps/web/app/ops/(private)/shadow/users`
2. Select a user
3. Click "Lock" button
4. Enter reason: "Test user lockout"
5. Select duration: "30 min"
6. Click "Confirm"

**Expected Web-Ops Behavior:**
- ✅ API endpoint called: `POST /api/ops/shadow/users/{userId}/lockout`
- ✅ Broadcast sent: `lockUserByOps(userId, reason, 30)`
- ✅ Record created in `user_lockouts` table
- ✅ Audit log created: `action = 'user_locked_by_ops'`
- ✅ Toast shown: "✓ Kullanıcı başarıyla kilitlendi"

**Mobile Steps:**
1. Keep shadow feed screen open
2. Watch console logs
3. Observe mobile behavior

**Expected Mobile Behavior:**
- ✅ Console log: `📡 Received: user_locked`
- ✅ Console log: `🔒 User locked by ops: Test user lockout (30 min)`
- ✅ Alert shown: "🔒 Hesap Kilitlendi - Hesabınız 30 dakika boyunca kilitlenmiştir"
- ✅ Shadow mode disabled
- ✅ Console log: `✅ User lockout handled`

**Verification:**
```sql
-- Check user lockout
SELECT * FROM user_lockouts 
WHERE user_id = '{userId}' 
AND locked_until > NOW();

-- Check audit log
SELECT * FROM audit_logs 
WHERE action = 'user_locked_by_ops' 
AND user_id = '{userId}';
```

---

### Test 3: User Unlock

**Objective:** Verify that web-ops can unlock a user and mobile receives the event.

**Web-Ops Steps:**
1. Same user from Test 2
2. Click "Unlock" button
3. Click "Confirm"

**Expected Web-Ops Behavior:**
- ✅ API endpoint called: `POST /api/ops/shadow/users/{userId}/unlock`
- ✅ Broadcast sent: `unlockUserByOps(userId)`
- ✅ Record deleted from `user_lockouts` table
- ✅ Audit log created: `action = 'user_unlocked_by_ops'`
- ✅ Toast shown: "✓ Kullanıcı başarıyla açıldı"

**Mobile Steps:**
1. Keep shadow feed screen open
2. Watch console logs

**Expected Mobile Behavior:**
- ✅ Console log: `📡 Received: user_unlocked`
- ✅ Console log: `🔓 User unlocked by ops`
- ✅ Alert shown: "🔓 Hesap Açıldı - Hesabınızın kilidi açılmıştır"
- ✅ Console log: `✅ User unlock handled`

**Verification:**
```sql
-- Check user lockout removed
SELECT * FROM user_lockouts 
WHERE user_id = '{userId}';
-- Should return 0 rows

-- Check audit log
SELECT * FROM audit_logs 
WHERE action = 'user_unlocked_by_ops' 
AND user_id = '{userId}';
```

---

### Test 4: Rate Limit Config Update

**Objective:** Verify that web-ops can update rate limit config and mobile applies it dynamically.

**Web-Ops Steps:**
1. Navigate to `/apps/web/app/ops/(private)/shadow/config`
2. Click "Update Rate Limit Config" button
3. Select type: "pin"
4. Enter config:
   - maxAttempts: 3
   - windowMinutes: 10
   - lockoutMinutes: 20
5. Click "Confirm"

**Expected Web-Ops Behavior:**
- ✅ API endpoint called: `PUT /api/ops/shadow/config/rate-limits/update`
- ✅ Broadcast sent: `updateRateLimitConfig(userId, 'pin', {...})`
- ✅ Record created/updated in `ops_config` table
- ✅ Audit log created: `action = 'rate_limit_config_updated_by_ops'`
- ✅ Toast shown: "✓ Oran limiti başarıyla güncellendi"

**Mobile Steps:**
1. Keep shadow feed screen open
2. Watch console logs

**Expected Mobile Behavior:**
- ✅ Console log: `📡 Received: rate_limit_config_updated`
- ✅ Console log: `⚙️ Rate limit config updated for pin: {...}`
- ✅ Console log: `✅ Rate limit config updated successfully`
- ✅ `PIN_RATE_LIMIT` updated in memory

**Verification:**
```sql
-- Check config updated
SELECT * FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'rate_limit_pin';

-- Verify config values
SELECT config->'maxAttempts' as maxAttempts,
       config->'windowMinutes' as windowMinutes,
       config->'lockoutMinutes' as lockoutMinutes
FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'rate_limit_pin';
```

---

### Test 5: Anomaly Detection Config Update

**Objective:** Verify that web-ops can update anomaly detection config and mobile applies it.

**Web-Ops Steps:**
1. Click "Update Anomaly Config" button
2. Enter config:
   - excessiveFailedAttempts.threshold: 5
   - excessiveFailedAttempts.windowMinutes: 30
   - longSession.maxSessionMinutes: 90
3. Click "Confirm"

**Expected Web-Ops Behavior:**
- ✅ API endpoint called: `PUT /api/ops/shadow/config/anomaly-detection/update`
- ✅ Broadcast sent: `updateAnomalyDetectionConfig(userId, {...})`
- ✅ Record created/updated in `ops_config` table
- ✅ Audit log created
- ✅ Toast shown: "✓ Anomali algılama başarıyla güncellendi"

**Mobile Steps:**
1. Keep shadow feed screen open
2. Watch console logs

**Expected Mobile Behavior:**
- ✅ Console log: `📡 Received: anomaly_detection_config_updated`
- ✅ Console log: `⚙️ Anomaly detection config updated: {...}`
- ✅ Console log: `✅ Anomaly detection config updated successfully`
- ✅ `ANOMALY_CONFIG` updated in memory

**Verification:**
```sql
-- Check config updated
SELECT * FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'anomaly_detection';

-- Verify config values
SELECT config->'excessiveFailedAttempts'->>'threshold' as threshold,
       config->'excessiveFailedAttempts'->>'windowMinutes' as windowMinutes
FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'anomaly_detection';
```

---

### Test 6: Anomaly Alert

**Objective:** Verify that web-ops can send anomaly alerts and mobile displays them.

**Web-Ops Steps (Manual via Supabase SQL):**
```sql
-- Send test anomaly alert via broadcast
SELECT
  pg_notify(
    'realtime:ops:user:9143806b-1467-4a82-af7d-195239dc0a77',
    json_build_object(
      'type', 'broadcast',
      'event', 'anomaly_alert',
      'payload', json_build_object(
        'type', 'excessive_failed_attempts',
        'severity', 'high',
        'message', 'Test: 10 başarısız giriş denemesi algılandı'
      )
    )::text
  );
```

**Mobile Steps:**
1. Keep shadow feed screen open
2. Watch console logs

**Expected Mobile Behavior:**
- ✅ Console log: `📡 Received: anomaly_alert`
- ✅ Console log: `🚨 Anomaly alert received: excessive_failed_attempts (high)`
- ✅ Alert shown: "🚨 Şüpheli Aktivite Algılandı - Test: 10 başarısız giriş denemesi algılandı"
- ✅ Console log: `✅ Anomaly alert handled`

---

## 🧪 Quick Testing Checklist

### Session Termination
- [ ] Web-ops API endpoint works
- [ ] Broadcast sent successfully
- [ ] Mobile receives event
- [ ] Alert displayed
- [ ] Shadow mode disabled
- [ ] Audit log created
- [ ] Session marked as terminated

### User Lockout
- [ ] Web-ops API endpoint works
- [ ] Broadcast sent successfully
- [ ] Mobile receives event
- [ ] Alert displayed with duration
- [ ] Shadow mode disabled
- [ ] user_lockouts record created
- [ ] Audit log created

### User Unlock
- [ ] Web-ops API endpoint works
- [ ] Broadcast sent successfully
- [ ] Mobile receives event
- [ ] Alert displayed
- [ ] user_lockouts record deleted
- [ ] Audit log created

### Rate Limit Config
- [ ] Web-ops API endpoint works
- [ ] Broadcast sent successfully
- [ ] Mobile receives event
- [ ] Config applied dynamically
- [ ] ops_config record created
- [ ] PIN_RATE_LIMIT updated in memory

### Anomaly Detection Config
- [ ] Web-ops API endpoint works
- [ ] Broadcast sent successfully
- [ ] Mobile receives event
- [ ] Config applied dynamically
- [ ] ops_config record created
- [ ] ANOMALY_CONFIG updated in memory

### Anomaly Alert
- [ ] Web-ops can send alerts
- [ ] Mobile receives event
- [ ] Alert displayed
- [ ] Correct severity shown

---

## 🔍 Debugging Tips

### Check Realtime Connection
```typescript
// In mobile console
supabase.channel('ops:user:9143806b-1467-4a82-af7d-195239dc0a77')
  .subscribe((status) => console.log('Status:', status))
```

### Check Audit Logs
```sql
SELECT * FROM audit_logs 
WHERE user_id = '9143806b-1467-4a82-af7d-195239dc0a77'
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Config Updates
```sql
SELECT * FROM ops_config 
WHERE user_id = '9143806b-1467-4a82-af7d-195239dc0a77';
```

### Check User Lockouts
```sql
SELECT * FROM user_lockouts 
WHERE user_id = '9143806b-1467-4a82-af7d-195239dc0a77';
```

### Monitor Realtime Logs
```bash
# In Supabase Dashboard → Logs → Realtime
# Filter by user ID: 9143806b-1467-4a82-af7d-195239dc0a77
```

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Test 1: Session Termination
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test 2: User Lockout
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 3: User Unlock
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 4: Rate Limit Config
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 5: Anomaly Detection Config
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 6: Anomaly Alert
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Overall Status
- All Tests: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
- Issues Found: 
- Next Steps:
```

---

## 🚀 Next Steps

1. Run all 6 tests
2. Document results
3. Fix any issues found
4. Re-run failed tests
5. Mark as complete when all tests pass

---

**Last Updated:** 2025-11-22  
**Status:** Ready for Testing
