# Hızlı Referans - Mobile Bildirim Sistemi

## 🎯 Sırada Ne Var?

### Phase 8.1: Database Triggers (2-3 gün)
**Dosya:** `01_DATABASE_TRIGGERS.md`

15 trigger oluştur:
```sql
-- Sosyal (3)
on_new_follower, on_follow_back, on_profile_mention

-- Mesajlaşma (3)
on_new_message, on_message_like, on_message_reply

-- İçerik (4)
on_content_like, on_content_comment, on_content_share, on_content_update

-- Sistem (3)
on_user_blocked, on_system_alert, on_security_alert

-- Bakım (2)
on_maintenance_start, on_maintenance_end
```

**Kontrol:** Her trigger için test SQL'i çalıştır

---

### Phase 8.2: EAS Setup (1-2 gün)
**Dosya:** `02_EAS_SETUP.md`

```bash
# 1. Firebase FCM (Android)
npx eas-cli@latest credentials configure --platform android

# 2. Apple APNs (iOS)
npx eas-cli@latest credentials configure --platform ios

# 3. Development Build
npx eas-cli@latest build:dev --platform ios
npx eas-cli@latest build:dev --platform android

# 4. Fiziksel cihazda test
# - Bildirim izni ver
# - Device token kaydedildi mi kontrol et
# - Test bildirimi gönder
```

**Kontrol:** Device token database'de var mı?

---

### Phase 8.3: Testing (3-4 gün)
**Dosya:** `03_TESTING.md`

```bash
# 1. Jest Setup
npm install --save-dev jest @testing-library/react-native

# 2. Unit Tests
npm test -- useNotifications.test.ts
npm test -- useDeviceToken.test.ts

# 3. Integration Tests
npm test -- --integration

# 4. E2E Tests
detox test e2e --configuration ios.sim.debug

# 5. Coverage
npm test -- --coverage
# Target: %85+
```

**Kontrol:** Coverage %85+ ulaştı mı?

---

### Phase 8.4: Documentation (2-3 gün)
**Dosya:** `04_DOCUMENTATION_POLISH.md`

```typescript
// 1. JSDoc Comments
/**
 * Hook for managing notifications
 * @returns {UseNotificationsReturn}
 */
export function useNotifications(): UseNotificationsReturn

// 2. README.md
// - Setup instructions
// - API reference
// - Notification types

// 3. Dark Mode
import { useTheme } from '@/theme/ThemeProvider'

// 4. Error Handling
<NotificationErrorBoundary>
  <NotificationCenter />
</NotificationErrorBoundary>

// 5. Sentry
Sentry.init({ dsn: '...' })
```

**Kontrol:** Tüm hooks JSDoc'a sahip mi?

---

## 📋 Kontrol Listesi

### Database Triggers ✅
- [ ] 15 trigger oluşturuldu
- [ ] Tüm triggers test edildi
- [ ] Production'a deploy edildi

### EAS Setup ✅
- [ ] Firebase FCM setup
- [ ] Apple APNs setup
- [ ] iOS build oluşturuldu
- [ ] Android build oluşturuldu
- [ ] Fiziksel cihazda test edildi

### Testing ✅
- [ ] Unit tests yazıldı
- [ ] Integration tests yazıldı
- [ ] E2E tests yazıldı
- [ ] Coverage %85+ ulaştı

### Documentation ✅
- [ ] JSDoc comments eklendi
- [ ] README.md yazıldı
- [ ] Dark mode eklendi
- [ ] Error handling setup edildi

---

## 🔗 Dosya Konumları

```
apps/mobile/
├── src/
│   ├── hooks/
│   │   ├── useNotifications.ts ✅
│   │   ├── useDeviceToken.ts ✅
│   │   ├── useNotificationListener.ts ✅
│   │   └── useNotificationPreferences.ts ✅
│   └── components/
│       └── notifications/
│           ├── NotificationCenter.tsx ✅
│           ├── NotificationBell.tsx ✅
│           └── NotificationItem.tsx ✅
├── __tests__/
│   ├── hooks/
│   │   ├── useNotifications.test.ts ⏳
│   │   ├── useDeviceToken.test.ts ⏳
│   │   └── useNotificationPreferences.test.ts ⏳
│   └── integration/
│       ├── device-token-flow.test.ts ⏳
│       ├── notification-flow.test.ts ⏳
│       └── deep-linking-flow.test.ts ⏳
├── e2e/
│   ├── notification-permission.e2e.ts ⏳
│   ├── notification-center.e2e.ts ⏳
│   └── config.e2e.js ⏳
├── app.json ✅
├── NOTIFICATIONS_README.md ⏳
└── TROUBLESHOOTING.md ⏳

supabase/
├── functions/
│   └── send-notification/ ✅
└── migrations/
    └── (triggers will be here) ⏳
```

---

## 🚀 Başlangıç Komutları

```bash
# 1. Rehberleri oku
cat docs/bildirim-sistemi/mobile/devamedilecek/01_DATABASE_TRIGGERS.md
cat docs/bildirim-sistemi/mobile/devamedilecek/02_EAS_SETUP.md
cat docs/bildirim-sistemi/mobile/devamedilecek/03_TESTING.md
cat docs/bildirim-sistemi/mobile/devamedilecek/04_DOCUMENTATION_POLISH.md

# 2. Database Triggers
# (Supabase SQL Editor'da çalıştır)

# 3. EAS Setup
npx eas-cli@latest login
npx eas-cli@latest credentials configure --platform ios
npx eas-cli@latest credentials configure --platform android

# 4. Development Build
npx eas-cli@latest build:dev --platform ios
npx eas-cli@latest build:dev --platform android

# 5. Testing
npm install --save-dev jest @testing-library/react-native
npm test

# 6. Documentation
# (JSDoc, README, Dark Mode ekle)
```

---

## 📊 Zaman Tahmini

| Adım              | Süre         | Zorluk   |
| ----------------- | ------------ | -------- |
| Database Triggers | 2-3 gün      | 🟡 Orta   |
| EAS Setup         | 1-2 gün      | 🔴 Yüksek |
| Testing           | 3-4 gün      | 🔴 Yüksek |
| Documentation     | 2-3 gün      | 🟢 Düşük  |
| **Total**         | **8-12 gün** | -        |

---

## ⚠️ Önemli Notlar

1. **Simulator:** Push notifications çalışmaz → Fiziksel cihaz gerekli
2. **EAS:** Paid plan gerekli
3. **Apple:** Developer Account gerekli
4. **Firebase:** Project gerekli
5. **Credentials:** Güvenli tut!

---

## 🔍 Sorun Giderme

### "Device token not registered"
```bash
# 1. Bildirim izni kontrol et
# 2. Device token database'de var mı kontrol et
SELECT * FROM device_tokens WHERE user_id = 'your-id';
# 3. Logs kontrol et
npx eas-cli@latest logs --platform ios
```

### "Notifications not received"
```bash
# 1. Preferences kontrol et
SELECT * FROM notification_preferences WHERE user_id = 'your-id';
# 2. Quiet hours kontrol et
# 3. Edge Function logs kontrol et
npx eas-cli@latest logs --service edge-function
```

### "Deep linking not working"
```bash
# 1. Route var mı kontrol et
# 2. Deep link URL format kontrol et: ipelya://path/to/screen
# 3. Notification data.url kontrol et
```

---

## 📚 Detaylı Rehberler

- **Database Triggers:** `01_DATABASE_TRIGGERS.md` (15 trigger, 250+ satır)
- **EAS Setup:** `02_EAS_SETUP.md` (Firebase + APNs, 200+ satır)
- **Testing:** `03_TESTING.md` (Unit + Integration + E2E, 400+ satır)
- **Documentation:** `04_DOCUMENTATION_POLISH.md` (JSDoc + README, 350+ satır)

---

## ✅ Son Kontrol

```bash
# Tüm testler geçti mi?
npm test -- --coverage
# ✅ Coverage %85+

# App çalışıyor mu?
npx expo start
# ✅ Simulator'da açılıyor

# Database triggers var mı?
SELECT * FROM pg_trigger WHERE tgname LIKE '%notification%';
# ✅ 15 trigger görülüyor

# Device token kaydediliyor mu?
SELECT * FROM device_tokens;
# ✅ Token var

# Bildirimler alınıyor mu?
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
# ✅ Yeni bildirim var
```

---

**Hazır mısın?** 🚀

Başla: `01_DATABASE_TRIGGERS.md`
