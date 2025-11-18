---
title: İPELYA Mobil - Quick Reference Card
description: Hızlı referans ve sık kullanılan bilgiler
---

# ⚡ İPELYA Mobil - Quick Reference Card

Sık kullanılan bilgiler ve hızlı referans.

---

## 🎯 Hangi Dokümantasyonu Okumalıyım?

| Görev                          | Dosya                          | Bölüm                   |
| ------------------------------ | ------------------------------ | ----------------------- |
| **Sayfa yapısını anlamak**     | `mobile-pages-roadmap.md`      | Mevcut Sayfa Yapısı     |
| **Auth ekranları geliştirmek** | `auth-implementation-guide.md` | Authentication Flow     |
| **Onboarding geliştirmek**     | `onboarding-flow.md`           | 5-Step Onboarding Flow  |
| **Database schema**            | `profiles-database-schema.md`  | Tablo Yapısı            |
| **Shadow mode**                | `auth-implementation-guide.md` | Dual Identity System    |
| **Device tracking**            | `profiles-database-schema.md`  | Device Info JSON Yapısı |
| **Security**                   | `auth-implementation-guide.md` | Security Best Practices |
| **RLS policies**               | `profiles-database-schema.md`  | Row Level Security      |
| **Yeni başlıyorum**            | `README.md`                    | Hızlı Başlangıç         |

---

## 📊 Mevcut Sayfa Yapısı (28 sayfa)

```
(auth)/
├── login.tsx
├── register.tsx
└── onboarding.tsx

(feed)/
├── index.tsx
└── shadow.tsx

(chat)/
├── index.tsx
└── [id].tsx

(creator)/
├── dashboard.tsx
├── upload.tsx
├── schedule.tsx
└── revenue.tsx

(fantasy)/
├── index.tsx
└── [id].tsx

(asmr)/
├── index.tsx
└── [id].tsx

(live)/
├── index.tsx
└── room/[id].tsx

(profile)/
├── index.tsx
├── edit.tsx
└── shadow-pin.tsx

(settings)/
├── index.tsx
└── privacy.tsx

Tab Navigation:
├── home.tsx
├── profile.tsx
├── live.tsx
└── flow.tsx
```

---

## 🎯 Yapılması Gereken Sayfalar (12+)

### **Tier 1: Kritik (MVP)**
- [ ] `(economy)/shop.tsx` - Coin satın alma
- [ ] `(economy)/history.tsx` - İşlem geçmişi
- [ ] `(economy)/checkout.tsx` - Ödeme
- [ ] `(profile)/shadow-mode.tsx` - Shadow mode UI
- [ ] `(feed)/creator/[id].tsx` - Creator detayı + PPV
- [ ] `(economy)/checkout.tsx` - Ödeme onayı

### **Tier 2: Önemli**
- [ ] `(creator)/schedule-detail.tsx` - Takvim detayı
- [ ] `(live)/room/[id]/chat.tsx` - Live chat
- [ ] `(settings)/dmca.tsx` - DMCA raporları
- [ ] `(settings)/security.tsx` - Anti-screenshot logs

### **Tier 3: Gelişmiş**
- [ ] `(fantasy)/generator.tsx` - AI generator
- [ ] `(feed)/vibe-match.tsx` - Vibe matching
- [ ] `(creator)/analytics.tsx` - Analytics
- [ ] `(admin)/dashboard.tsx` - Admin panel

---

## 🔐 Auth Flow (Hızlı Özet)

```
1. App Boot
   ├─ SecureStore token kontrolü
   └─ Zustand store hydrate

2. Token var mı?
   ├─ EVET → /home
   └─ HAYIR → (auth)/login

3. Login/Register
   ├─ Email + Password
   ├─ Supabase auth
   ├─ Device info kaydet
   └─ SecureStore'a token kaydet

4. Shadow mode var mı?
   ├─ EVET → /home (shadow)
   └─ HAYIR → Onboarding (5 step)

5. Onboarding
   ├─ Step 1: Profil
   ├─ Step 2: Vibe
   ├─ Step 3: Shadow PIN
   ├─ Step 4: Privacy
   └─ Step 5: Complete

6. /home (Feed)
```

---

## 💾 Database Tables (Hızlı Referans)

### **profiles**
```sql
id (uuid)
user_id (uuid) - FK auth.users
type (text) - 'real' | 'shadow'
username (text) - UNIQUE
display_name (text)
avatar_url (text)
bio (text)
gender (text) - 'male' | 'female' | 'lgbt'
shadow_pin_hash (text) - bcrypt
shadow_unlocked (boolean)
last_device_info (jsonb)
last_ip_address (inet)
last_login_at (timestamptz)
device_token (text)
created_at (timestamptz)
updated_at (timestamptz)
```

### **Constraints**
- UNIQUE: `(user_id, type)`
- UNIQUE: `username`
- CHECK: `type IN ('real', 'shadow')`
- CHECK: `gender IN ('male', 'female', 'lgbt')`

### **Indexes**
```sql
idx_profiles_user_id
idx_profiles_type
idx_profiles_username
idx_profiles_is_creator
```

---

## 🔐 RLS Policies (Hızlı Referans)

### **Policy 1: users_view_own_profiles**
```sql
FOR SELECT USING (user_id = auth.uid())
```

### **Policy 2: users_update_own_profiles**
```sql
FOR UPDATE USING (user_id = auth.uid())
```

### **Policy 3: shadow_isolation**
```sql
FOR SELECT USING (
  (type = 'shadow' AND shadow_mode_claim = true)
  OR
  (type = 'real' AND shadow_mode_claim = false)
)
```

---

## 📱 Device Info JSON

```json
{
  "platform": "ios",           // "ios" | "android" | "web"
  "model": "iPhone 15 Pro",
  "os_version": "17.2",
  "app_version": "1.0.0",
  "device_id": "uuid-string",
  "locale": "tr-TR"
}
```

---

## 🔑 Zustand Stores

### **useAuthStore**
```typescript
sessionToken: string | null
isHydrated: boolean
setSession(token: string | null): void
markHydrated(): void
clearSession(): void
```

### **useProfileStore**
```typescript
profile: Profile | null
setProfile(data: Profile | null): void
updatePartial(payload: Partial<Profile>): void
```

### **useShadowStore**
```typescript
isShadowMode: boolean
shadowDisplayName: string | null
setShadowMode(enabled: boolean): void
```

### **useCoinsStore**
```typescript
balance: number
transactions: Transaction[]
setBalance(amount: number): void
addTransaction(tx: Transaction): void
```

---

## 🛠️ Sık Kullanılan Kodlar

### **Token Kaydetme**
```typescript
import { saveSession } from '@/services/secure-store.service';

await saveSession(token);
```

### **Token Okuma**
```typescript
import { getSession } from '@/services/secure-store.service';

const token = await getSession();
```

### **Device Info Toplama**
```typescript
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const deviceInfo = {
  platform: Device.osName?.toLowerCase() || 'unknown',
  model: Device.modelName || 'unknown',
  os_version: Device.osVersion || 'unknown',
  app_version: Constants.expoConfig?.version || '1.0.0',
  device_id: Constants.deviceId || 'unknown'
};
```

### **Profile Güncelleme**
```typescript
await supabase
  .from('profiles')
  .update({
    display_name: 'New Name',
    last_device_info: deviceInfo,
    last_login_at: new Date().toISOString()
  })
  .eq('user_id', userId)
  .eq('type', 'real');
```

### **Shadow Mode Aktivasyonu**
```typescript
// Edge Function çağrısı
const { data, error } = await supabase.functions.invoke('enable-shadow-mode', {
  body: { pin: '1234' }
});
```

---

## 🔒 Security Checklist

- [ ] PIN'ler bcrypt ile hash'lenir
- [ ] Token'lar SecureStore'da saklanır
- [ ] RLS policies aktif
- [ ] Shadow/Real izolasyonu sağlanır
- [ ] Device info kaydedilir
- [ ] IP adresi kaydedilir
- [ ] Expired token'lar temizlenir
- [ ] Error messages güvenli

---

## 🚀 Geliştirme Sırası

### **Sprint 1 (Bu Hafta)**
1. Onboarding 5-step ekranları
2. Shadow mode UI
3. Device tracking test

### **Sprint 2 (Hafta 2-3)**
1. Coin shop
2. Creator content detail
3. Checkout

### **Sprint 3 (Hafta 4-5)**
1. Creator schedule
2. Live chat
3. DMCA management

### **Sprint 4 (Hafta 6+)**
1. AI generator
2. Vibe match
3. Admin panel

---

## 📞 Sık Sorulan Sorular

**S: Shadow mode nedir?**
A: Gizli profil, PIN ile korunan, özel içerik erişimi için.

**S: Device info neden kaydediliyor?**
A: Security analizi, fraud detection, cihaz takibi.

**S: PIN'ler nasıl saklanır?**
A: bcrypt ile hash'lenir, asla plain text değil.

**S: RLS nedir?**
A: Row Level Security - Supabase veri koruma mekanizması.

**S: Onboarding kaç adım?**
A: 5 adım: Profil → Vibe → PIN → Privacy → Complete.

**S: Dual identity nedir?**
A: Her user 2 profile: real (gerçek) + shadow (gizli).

---

## 🔗 Dosya Yolları

```
docs/
├── mobile-pages-roadmap.md
└── mobile/
    ├── README.md
    ├── QUICK_REFERENCE.md (bu dosya)
    ├── profiles-database-schema.md
    ├── onboarding-flow.md
    └── auth-implementation-guide.md
```

---

## 📊 Dokümantasyon Haritası

```
README.md (Başlangıç)
├── profiles-database-schema.md (Database)
├── auth-implementation-guide.md (Auth)
├── onboarding-flow.md (UI)
└── QUICK_REFERENCE.md (Hızlı Ref)
```

---

## ⚡ Hızlı Komutlar

### **Profil Oluştur**
```sql
INSERT INTO profiles (user_id, type, username, display_name, gender)
VALUES ('uuid', 'real', 'username', 'Display Name', 'male');
```

### **Profil Güncelle**
```sql
UPDATE profiles
SET display_name = 'New Name', updated_at = now()
WHERE user_id = 'uuid' AND type = 'real';
```

### **Shadow Profile Oluştur**
```sql
INSERT INTO profiles (user_id, type, username, display_name, shadow_pin_hash)
VALUES ('uuid', 'shadow', 'shadow_uuid', 'Shadow', 'bcrypt_hash');
```

### **Device Info Güncelle**
```sql
UPDATE profiles
SET last_device_info = '{"platform":"ios",...}'::jsonb,
    last_login_at = now()
WHERE user_id = 'uuid' AND type = 'real';
```

---

## 🎯 Sonraki Adımlar

1. **Bugün**: `README.md` oku
2. **Yarın**: `profiles-database-schema.md` oku
3. **Gün 3**: `auth-implementation-guide.md` oku
4. **Gün 4**: `onboarding-flow.md` oku
5. **Gün 5**: Geliştirmeye başla

---

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready

---

**Başarılı geliştirmeler! 🚀**
