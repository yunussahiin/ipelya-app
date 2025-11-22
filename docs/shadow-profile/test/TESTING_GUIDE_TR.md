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

### Test 2: Kullanıcı Kilitleme

**Amaç:** Web-ops'tan kullanıcıyı kilitleyebildiğini ve mobil tarafının event'i aldığını doğrula.

**Web-Ops Adımları:**
1. `/apps/web/app/ops/(private)/shadow/users` sayfasına git
2. Bir kullanıcı seç
3. "Lock" (Kilitle) butonuna tıkla
4. Sebep gir: "Test kullanıcı kilitleme"
5. Süre seç: "30 dakika"
6. "Confirm" (Onayla) butonuna tıkla

**Beklenen Web-Ops Davranışı:**
- ✅ API endpoint çağrıldı: `POST /api/ops/shadow/users/{userId}/lockout`
- ✅ Broadcast gönderildi: `lockUserByOps(userId, reason, 30)`
- ✅ `user_lockouts` tablosuna kayıt eklendi
- ✅ Audit log oluşturuldu: `action = 'user_locked_by_ops'`
- ✅ Toast gösterildi: "✓ Kullanıcı başarıyla kilitlendi"

**Mobil Adımları:**
1. Shadow feed screen'i açık tut
2. Console log'larını izle

**Beklenen Mobil Davranışı:**
- ✅ Console log: `📡 Received: user_locked`
- ✅ Console log: `🔒 User locked by ops: Test kullanıcı kilitleme (30 min)`
- ✅ Alert gösterildi: "🔒 Hesap Kilitlendi - Hesabınız 30 dakika boyunca kilitlenmiştir"
- ✅ Shadow mode devre dışı
- ✅ Console log: `✅ User lockout handled`

**Doğrulama:**
```sql
-- Kullanıcı kilitli mi kontrol et
SELECT * FROM user_lockouts 
WHERE user_id = '{userId}' 
AND locked_until > NOW();

-- Audit log kontrol et
SELECT * FROM audit_logs 
WHERE action = 'user_locked_by_ops' 
AND user_id = '{userId}';
```

---

### Test 3: Kullanıcı Kilit Açma

**Amaç:** Web-ops'tan kullanıcının kilidini açabildiğini ve mobil tarafının event'i aldığını doğrula.

**Web-Ops Adımları:**
1. Test 2'deki aynı kullanıcıyı seç
2. "Unlock" (Kilidi Aç) butonuna tıkla
3. "Confirm" (Onayla) butonuna tıkla

**Beklenen Web-Ops Davranışı:**
- ✅ API endpoint çağrıldı: `POST /api/ops/shadow/users/{userId}/unlock`
- ✅ Broadcast gönderildi: `unlockUserByOps(userId)`
- ✅ `user_lockouts` tablosundan kayıt silindi
- ✅ Audit log oluşturuldu: `action = 'user_unlocked_by_ops'`
- ✅ Toast gösterildi: "✓ Kullanıcı başarıyla açıldı"

**Mobil Adımları:**
1. Shadow feed screen'i açık tut
2. Console log'larını izle

**Beklenen Mobil Davranışı:**
- ✅ Console log: `📡 Received: user_unlocked`
- ✅ Console log: `🔓 User unlocked by ops`
- ✅ Alert gösterildi: "🔓 Hesap Açıldı - Hesabınızın kilidi açılmıştır"
- ✅ Console log: `✅ User unlock handled`

**Doğrulama:**
```sql
-- Kullanıcı kilidi açıldı mı kontrol et
SELECT * FROM user_lockouts 
WHERE user_id = '{userId}';
-- 0 satır dönmeli

-- Audit log kontrol et
SELECT * FROM audit_logs 
WHERE action = 'user_unlocked_by_ops' 
AND user_id = '{userId}';
```

---

### Test 4: Oran Limiti Konfigürasyonu Güncelleme

**Amaç:** Web-ops'tan oran limiti konfigürasyonunu güncelleyebildiğini ve mobil tarafının dinamik olarak uyguladığını doğrula.

**Web-Ops Adımları:**
1. `/apps/web/app/ops/(private)/shadow/config` sayfasına git
2. "Update Rate Limit Config" (Oran Limiti Güncelle) butonuna tıkla
3. Tip seç: "pin"
4. Konfigürasyonu gir:
   - maxAttempts: 3
   - windowMinutes: 10
   - lockoutMinutes: 20
5. "Confirm" (Onayla) butonuna tıkla

**Beklenen Web-Ops Davranışı:**
- ✅ API endpoint çağrıldı: `PUT /api/ops/shadow/config/rate-limits/update`
- ✅ Broadcast gönderildi: `updateRateLimitConfig(userId, 'pin', {...})`
- ✅ `ops_config` tablosuna kayıt eklendi/güncellendi
- ✅ Audit log oluşturuldu
- ✅ Toast gösterildi: "✓ Oran limiti başarıyla güncellendi"

**Mobil Adımları:**
1. Shadow feed screen'i açık tut
2. Console log'larını izle

**Beklenen Mobil Davranışı:**
- ✅ Console log: `📡 Received: rate_limit_config_updated`
- ✅ Console log: `⚙️ Rate limit config updated for pin: {...}`
- ✅ Console log: `✅ Rate limit config updated successfully`
- ✅ `PIN_RATE_LIMIT` bellekte güncellendi

**Doğrulama:**
```sql
-- Konfigürasyon güncellendi mi kontrol et
SELECT * FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'rate_limit_pin';

-- Konfigürasyon değerlerini doğrula
SELECT config->'maxAttempts' as maxAttempts,
       config->'windowMinutes' as windowMinutes,
       config->'lockoutMinutes' as lockoutMinutes
FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'rate_limit_pin';
```

---

### Test 5: Anomali Algılama Konfigürasyonu Güncelleme

**Amaç:** Web-ops'tan anomali algılama konfigürasyonunu güncelleyebildiğini ve mobil tarafının uyguladığını doğrula.

**Web-Ops Adımları:**
1. "Update Anomaly Config" (Anomali Konfigürasyonunu Güncelle) butonuna tıkla
2. Konfigürasyonu gir:
   - excessiveFailedAttempts.threshold: 5
   - excessiveFailedAttempts.windowMinutes: 30
   - longSession.maxSessionMinutes: 90
3. "Confirm" (Onayla) butonuna tıkla

**Beklenen Web-Ops Davranışı:**
- ✅ API endpoint çağrıldı: `PUT /api/ops/shadow/config/anomaly-detection/update`
- ✅ Broadcast gönderildi: `updateAnomalyDetectionConfig(userId, {...})`
- ✅ `ops_config` tablosuna kayıt eklendi/güncellendi
- ✅ Audit log oluşturuldu
- ✅ Toast gösterildi: "✓ Anomali algılama başarıyla güncellendi"

**Mobil Adımları:**
1. Shadow feed screen'i açık tut
2. Console log'larını izle

**Beklenen Mobil Davranışı:**
- ✅ Console log: `📡 Received: anomaly_detection_config_updated`
- ✅ Console log: `⚙️ Anomaly detection config updated: {...}`
- ✅ Console log: `✅ Anomaly detection config updated successfully`
- ✅ `ANOMALY_CONFIG` bellekte güncellendi

**Doğrulama:**
```sql
-- Konfigürasyon güncellendi mi kontrol et
SELECT * FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'anomaly_detection';

-- Konfigürasyon değerlerini doğrula
SELECT config->'excessiveFailedAttempts'->>'threshold' as threshold,
       config->'excessiveFailedAttempts'->>'windowMinutes' as windowMinutes
FROM ops_config 
WHERE user_id = '{userId}' 
AND config_type = 'anomaly_detection';
```

---

### Test 6: Anomali Uyarısı

**Amaç:** Web-ops'tan anomali uyarısı gönderebildiğini ve mobil tarafının gösterebildiğini doğrula.

**Web-Ops Adımları (Supabase SQL ile Manual):**
```sql
-- Test anomali uyarısı gönder
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

**Mobil Adımları:**
1. Shadow feed screen'i açık tut
2. Console log'larını izle

**Beklenen Mobil Davranışı:**
- ✅ Console log: `📡 Received: anomaly_alert`
- ✅ Console log: `🚨 Anomaly alert received: excessive_failed_attempts (high)`
- ✅ Alert gösterildi: "🚨 Şüpheli Aktivite Algılandı - Test: 10 başarısız giriş denemesi algılandı"
- ✅ Console log: `✅ Anomaly alert handled`

---

## 🧪 Hızlı Test Kontrol Listesi

### Oturum Sonlandırma
- [ ] Web-ops API endpoint çalışıyor
- [ ] Broadcast başarıyla gönderildi
- [ ] Mobil event alıyor
- [ ] Alert gösterildi
- [ ] Shadow mode devre dışı
- [ ] Audit log oluşturuldu
- [ ] Oturum terminated olarak işaretlendi

### Kullanıcı Kilitleme
- [ ] Web-ops API endpoint çalışıyor
- [ ] Broadcast başarıyla gönderildi
- [ ] Mobil event alıyor
- [ ] Alert gösterildi (süre ile)
- [ ] Shadow mode devre dışı
- [ ] user_lockouts kaydı oluşturuldu
- [ ] Audit log oluşturuldu

### Kullanıcı Kilit Açma
- [ ] Web-ops API endpoint çalışıyor
- [ ] Broadcast başarıyla gönderildi
- [ ] Mobil event alıyor
- [ ] Alert gösterildi
- [ ] user_lockouts kaydı silindi
- [ ] Audit log oluşturuldu

### Oran Limiti Konfigürasyonu
- [ ] Web-ops API endpoint çalışıyor
- [ ] Broadcast başarıyla gönderildi
- [ ] Mobil event alıyor
- [ ] Konfigürasyon dinamik olarak uygulandı
- [ ] ops_config kaydı oluşturuldu
- [ ] PIN_RATE_LIMIT bellekte güncellendi

### Anomali Algılama Konfigürasyonu
- [ ] Web-ops API endpoint çalışıyor
- [ ] Broadcast başarıyla gönderildi
- [ ] Mobil event alıyor
- [ ] Konfigürasyon dinamik olarak uygulandı
- [ ] ops_config kaydı oluşturuldu
- [ ] ANOMALY_CONFIG bellekte güncellendi

### Anomali Uyarısı
- [ ] Web-ops uyarı gönderebiliyor
- [ ] Mobil event alıyor
- [ ] Alert gösterildi
- [ ] Doğru severity gösterildi

---

## 🔍 Debug İpuçları

### Realtime Bağlantısını Kontrol Et
```typescript
// Mobil console'da
supabase.channel('ops:user:9143806b-1467-4a82-af7d-195239dc0a77')
  .subscribe((status) => console.log('Status:', status))
```

### Audit Log'ları Kontrol Et
```sql
SELECT * FROM audit_logs 
WHERE user_id = '9143806b-1467-4a82-af7d-195239dc0a77'
ORDER BY created_at DESC 
LIMIT 10;
```

### Konfigürasyonları Kontrol Et
```sql
SELECT * FROM ops_config 
WHERE user_id = '9143806b-1467-4a82-af7d-195239dc0a77';
```

### Kullanıcı Kilidini Kontrol Et
```sql
SELECT * FROM user_lockouts 
WHERE user_id = '9143806b-1467-4a82-af7d-195239dc0a77';
```

### Realtime Log'larını İzle
```bash
# Supabase Dashboard → Logs → Realtime
# Filtrele: 9143806b-1467-4a82-af7d-195239dc0a77
```

---

## 📊 Test Sonuçları Şablonu

```markdown
## Test Sonuçları - [Tarih]

### Test 1: Oturum Sonlandırma
- Durum: ✅ PASS / ❌ FAIL
- Notlar: 

### Test 2: Kullanıcı Kilitleme
- Durum: ✅ PASS / ❌ FAIL
- Notlar:

### Test 3: Kullanıcı Kilit Açma
- Durum: ✅ PASS / ❌ FAIL
- Notlar:

### Test 4: Oran Limiti Konfigürasyonu
- Durum: ✅ PASS / ❌ FAIL
- Notlar:

### Test 5: Anomali Algılama Konfigürasyonu
- Durum: ✅ PASS / ❌ FAIL
- Notlar:

### Test 6: Anomali Uyarısı
- Durum: ✅ PASS / ❌ FAIL
- Notlar:

### Genel Durum
- Tüm Testler: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
- Bulunan Sorunlar: 
- Sonraki Adımlar:
```

---

## 🚀 Sonraki Adımlar

1. Tüm 6 testi çalıştır
2. Sonuçları dokümante et
3. Bulunan sorunları düzelt
4. Başarısız testleri tekrar çalıştır
5. Tüm testler geçtiğinde tamamlandı olarak işaretle

---

**Son Güncelleme:** 2025-11-22  
**Durum:** Test Hazır
