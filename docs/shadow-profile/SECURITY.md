# Shadow Profil - Güvenlik Protokolleri

## 🔐 Güvenlik Prensipleri

1. **Defense in Depth** - Katmanlı güvenlik
2. **Least Privilege** - Minimum yetki prensibi
3. **Zero Trust** - Her işlem doğrulanmalı
4. **Audit Everything** - Tüm işlemler loglanmalı

## 🔒 PIN Güvenliği

### PIN Hashing

```typescript
// ❌ YANLIŞ - Plain text storage
const pin = "1234";
await supabase.from('profiles').update({ pin });

// ✅ DOĞRU - SHA-256 hashing
import { hashPin } from '@/utils/crypto';
const hashedPin = await hashPin("1234");
await supabase.from('profiles').update({ 
  shadow_pin_hash: hashedPin 
});
```

### PIN Requirements

- **Minimum:** 4 digit
- **Maximum:** 6 digit
- **Format:** Sadece rakamlar
- **Validation:** Client + Server-side

### PIN Rate Limiting

```typescript
// 5 yanlış denemeden sonra 30 dakika ban
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 min

async function verifyPinWithRateLimit(userId: string, pin: string) {
  const attempts = await getFailedAttempts(userId);
  
  if (attempts >= MAX_ATTEMPTS) {
    const lastAttempt = await getLastAttemptTime(userId);
    const timeSince = Date.now() - lastAttempt;
    
    if (timeSince < LOCKOUT_DURATION) {
      throw new Error('Too many attempts. Try again later.');
    }
  }
  
  const isValid = await verifyShadowPin(pin);
  
  if (!isValid) {
    await incrementFailedAttempts(userId);
  } else {
    await resetFailedAttempts(userId);
  }
  
  return isValid;
}
```

## 🔑 Biometric Güvenliği

### Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometric() {
  // Check hardware support
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    throw new Error('Biometric hardware not available');
  }
  
  // Check enrollment
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) {
    throw new Error('No biometric data enrolled');
  }
  
  // Authenticate
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Shadow profiline geçiş yap',
    fallbackLabel: 'PIN kullan',
    cancelLabel: 'İptal',
    disableDeviceFallback: false, // PIN fallback enabled
  });
  
  return result.success;
}
```

### Biometric Best Practices

- ✅ **Always provide PIN fallback**
- ✅ **Clear error messages**
- ✅ **Respect user preference**
- ❌ **Never store biometric data**
- ❌ **Never send biometric data to server**

## 🛡️ RLS (Row Level Security) Policies

### Real Profile Protection

```sql
-- Real profile sadece owner görebilir
CREATE POLICY "Users can view own real profile"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id AND type = 'real'
);

-- Real profile sadece owner güncelleyebilir
CREATE POLICY "Users can update own real profile"
ON profiles FOR UPDATE
USING (
  auth.uid() = user_id AND type = 'real'
);
```

### Shadow Profile Isolation

```sql
-- Shadow profile herkes görebilir (anonim olması için)
CREATE POLICY "Anyone can view shadow profiles"
ON profiles FOR SELECT
USING (type = 'shadow');

-- Shadow profile sadece owner güncelleyebilir
CREATE POLICY "Users can update own shadow profile"
ON profiles FOR UPDATE
USING (
  auth.uid() = user_id AND type = 'shadow'
);

-- Shadow profile'dan real profile verilerine erişim yok
CREATE POLICY "Shadow profiles cannot access real data"
ON profiles FOR SELECT
USING (
  NOT (type = 'shadow' AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.type = 'real'
    AND p.shadow_unlocked = true
  ))
);
```

### Cross-Profile Protection

```sql
-- Real ve shadow arasında veri sızıntısı engelleme
CREATE POLICY "Prevent cross-profile data leak"
ON user_activities FOR SELECT
USING (
  -- Sadece aktif profile'ın verilerini göster
  profile_type = (
    SELECT CASE 
      WHEN shadow_unlocked THEN 'shadow'
      ELSE 'real'
    END
    FROM profiles
    WHERE user_id = auth.uid() AND type = 'real'
  )
);
```

## 📊 Audit Logging

### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  profile_type TEXT CHECK (profile_type IN ('real', 'shadow')),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### Logged Actions

```typescript
// Shadow mode geçişleri
await logAudit({
  action: 'shadow_mode_enter',
  profile_type: 'shadow',
  metadata: {
    auth_method: 'biometric' // or 'pin'
  }
});

await logAudit({
  action: 'shadow_mode_exit',
  profile_type: 'real',
  metadata: {
    duration: sessionDuration
  }
});

// PIN değişiklikleri
await logAudit({
  action: 'shadow_pin_changed',
  profile_type: 'real',
  metadata: {
    old_pin_created_at: oldPinTimestamp
  }
});

// Başarısız denemeler
await logAudit({
  action: 'shadow_pin_failed',
  profile_type: 'real',
  metadata: {
    attempt_number: attemptCount
  }
});
```

## 🚨 Security Monitoring

### Anomaly Detection

```typescript
// Şüpheli aktivite tespiti
async function detectAnomalies(userId: string) {
  const recentLogs = await getAuditLogs(userId, { 
    since: Date.now() - 24 * 60 * 60 * 1000 // Last 24h
  });
  
  // Çok fazla başarısız PIN denemesi
  const failedAttempts = recentLogs.filter(
    log => log.action === 'shadow_pin_failed'
  );
  if (failedAttempts.length > 10) {
    await alertSecurityTeam({
      userId,
      issue: 'Excessive failed PIN attempts',
      count: failedAttempts.length
    });
  }
  
  // Farklı IP'lerden çok fazla geçiş
  const uniqueIPs = new Set(
    recentLogs.map(log => log.ip_address)
  );
  if (uniqueIPs.size > 5) {
    await alertSecurityTeam({
      userId,
      issue: 'Multiple IPs accessing account',
      ips: Array.from(uniqueIPs)
    });
  }
  
  // Shadow mode'da çok uzun süre kalma (7+ gün)
  const shadowEnter = recentLogs.find(
    log => log.action === 'shadow_mode_enter'
  );
  if (shadowEnter) {
    const duration = Date.now() - shadowEnter.timestamp;
    if (duration > 7 * 24 * 60 * 60 * 1000) {
      await notifyUser({
        userId,
        message: 'Shadow mode\'da uzun süredir aktifsiniz'
      });
    }
  }
}
```

### Security Alerts

```typescript
// Real-time security alerts
export async function sendSecurityAlert(
  userId: string, 
  alertType: string,
  details: any
) {
  // Email notification
  await sendEmail({
    to: userEmail,
    subject: `Güvenlik Uyarısı: ${alertType}`,
    body: `Hesabınızda şüpheli aktivite tespit edildi: ${JSON.stringify(details)}`
  });
  
  // Push notification
  await sendPushNotification({
    userId,
    title: 'Güvenlik Uyarısı',
    body: `Şüpheli aktivite: ${alertType}`,
    data: { type: 'security_alert', details }
  });
  
  // In-app notification
  await createNotification({
    userId,
    type: 'security',
    message: `Güvenlik uyarısı: ${alertType}`,
    metadata: details
  });
}
```

## 🔐 Session Management

### Session Isolation

```typescript
// Real ve shadow için ayrı session tracking
type SessionData = {
  userId: string;
  profileType: 'real' | 'shadow';
  startedAt: string;
  lastActivity: string;
  ipAddress: string;
  deviceId: string;
};

async function trackSession(data: SessionData) {
  await supabase.from('sessions').insert({
    user_id: data.userId,
    profile_type: data.profileType,
    started_at: data.startedAt,
    last_activity: data.lastActivity,
    ip_address: data.ipAddress,
    device_id: data.deviceId
  });
}
```

### Session Timeout

```typescript
// Shadow session timeout (30 dakika inaktivite)
const SHADOW_SESSION_TIMEOUT = 30 * 60 * 1000;

async function checkSessionTimeout() {
  const lastActivity = await getLastActivity();
  const timeSince = Date.now() - lastActivity;
  
  if (timeSince > SHADOW_SESSION_TIMEOUT) {
    // Otomatik olarak real profile'a dön
    await toggleShadowMode(pin);
    showNotification('Shadow session timeout - Real profile\'a dönüldü');
  }
}
```

## 🛡️ Data Encryption

### Sensitive Data Encryption

```typescript
// Profile verileri şifreleme (opsiyonel ekstra güvenlik)
import * as Crypto from 'expo-crypto';

async function encryptSensitiveData(data: string): Promise<string> {
  // AES-256 encryption (production'da key management gerekir)
  const key = await getEncryptionKey();
  return await Crypto.encrypt(data, key);
}

async function decryptSensitiveData(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();
  return await Crypto.decrypt(encrypted, key);
}
```

## 🚫 Attack Prevention

### Brute Force Prevention

- Rate limiting (5 attempts / 30 min)
- Progressive delays (1s, 2s, 4s, 8s, 16s)
- Account lockout after excessive attempts
- CAPTCHA after 3 failed attempts

### Session Hijacking Prevention

- Secure cookies (httpOnly, secure, sameSite)
- Session rotation after privilege escalation
- Device fingerprinting
- IP validation

### XSS Prevention

- Input sanitization
- Output encoding
- Content Security Policy (CSP)
- X-XSS-Protection header

### CSRF Prevention

- CSRF tokens
- SameSite cookies
- Origin validation
- Referer checking

## 📋 Security Checklist

### Development

- [ ] PIN SHA-256 hashing
- [ ] Biometric fallback
- [ ] Rate limiting implementation
- [ ] RLS policies configured
- [ ] Audit logging active
- [ ] Input validation
- [ ] Error handling
- [ ] Security testing

### Production

- [ ] HTTPS enforced
- [ ] Secure cookies configured
- [ ] CSP headers set
- [ ] Rate limiting active
- [ ] Monitoring enabled
- [ ] Backup system ready
- [ ] Incident response plan
- [ ] Security audit completed

## 🚨 Incident Response

### Compromised PIN

1. Immediately lock account
2. Notify user via email/SMS
3. Force PIN reset
4. Review audit logs
5. Investigate attack vector

### Suspicious Activity

1. Flag account for review
2. Require re-authentication
3. Limit shadow mode access
4. Contact user
5. Document incident

### Data Breach

1. Isolate affected systems
2. Notify affected users
3. Reset all PINs
4. Revoke sessions
5. Legal compliance (GDPR, etc.)

## 📞 Security Contacts

- **Security Team:** security@ipelya.com
- **Emergency:** +90 XXX XXX XX XX
- **Bug Bounty:** bugbounty@ipelya.com
