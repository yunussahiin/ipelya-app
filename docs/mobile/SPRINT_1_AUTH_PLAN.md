---
title: Sprint 1 - Auth & Onboarding Detaylı Plan
description: Hafta 1-2, Login, Register, Onboarding implementasyonu
---

# 🚀 Sprint 1 - Auth & Onboarding Detaylı Plan

**Sprint Süresi**: 2 hafta (Hafta 1-2)  
**Hedef**: Kullanıcı kaydı, login, 5-step onboarding  
**Sayfalar**: 3 sayfa  
**Deliverable**: Tam auth sistemi

---

## 📋 Sprint Özeti

### **Hafta 1: Auth Screens (Login + Register)**

| Gün         | Görev               | Dosya                 | Durum |
| ----------- | ------------------- | --------------------- | ----- |
| **Gün 1-2** | Login screen        | `(auth)/login.tsx`    | 🔄     |
| **Gün 3-4** | Register screen     | `(auth)/register.tsx` | 🔄     |
| **Gün 5**   | Integration testing | -                     | 🔄     |

### **Hafta 2: Onboarding (5-Step Flow)**

| Gün         | Görev           | Dosya                     | Durum |
| ----------- | --------------- | ------------------------- | ----- |
| **Gün 6-7** | Onboarding UI   | `(auth)/onboarding.tsx`   | 🔄     |
| **Gün 8-9** | Step components | `components/onboarding/*` | 🔄     |
| **Gün 10**  | E2E testing     | -                         | 🔄     |

---

## 🎯 Hafta 1: Auth Screens

### **Gün 1-2: Login Screen**

**Dosya**: `apps/mobile/app/(auth)/login.tsx`

**Gereksinimler**:
```
✅ Email input (validation)
✅ Password input (secure)
✅ "Şifremi unuttum" linki
✅ "Kayıt ol" linki
✅ Loading state
✅ Error handling
✅ Form validation (Zod)
```

**Implementasyon Adımları**:

1. **Form Setup**
```typescript
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Geçerli e-posta gir'),
  password: z.string().min(6, 'En az 6 karakter')
});

type FormValues = z.infer<typeof schema>;
```

2. **useAuthActions Hook Kullan**
```typescript
const { signIn, isLoading, error, setError } = useAuthActions();

const onSubmit = handleSubmit(async ({ email, password }) => {
  await signIn(email, password);
});
```

3. **UI Components**
```typescript
- AuthScreen (layout)
- AuthTextField (input)
- Pressable (button)
- ActivityIndicator (loading)
```

4. **Error Handling**
```typescript
- Invalid credentials
- Network error
- Server error
- Show user-friendly messages
```

**Kod Referansı**: `apps/mobile/app/(auth)/login.tsx` (mevcut)

**Test Senaryoları**:
- [ ] Valid email + password → /home
- [ ] Invalid email → error message
- [ ] Wrong password → error message
- [ ] Network error → retry option
- [ ] "Kayıt ol" linki → (auth)/register

---

### **Gün 3-4: Register Screen**

**Dosya**: `apps/mobile/app/(auth)/register.tsx`

**Gereksinimler**:
```
✅ Email input
✅ Password input
✅ Confirm password input
✅ Password match validation
✅ Loading state
✅ Error handling
✅ "Giriş yap" linki
✅ Trigger → 2 profile oluşturma
```

**Implementasyon Adımları**:

1. **Form Schema**
```typescript
const schema = z
  .object({
    email: z.string().email('Geçerli e-posta gir'),
    password: z.string().min(6, 'En az 6 karakter'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword']
  });
```

2. **Signup Flow**
```typescript
const onSubmit = handleSubmit(async ({ email, password }) => {
  // 1. Supabase signup
  // 2. Trigger otomatik profile oluşturur
  // 3. Device info güncelle
  // 4. Login ekranına yönlendir
  await signUp(email, password);
});
```

3. **Device Info Tracking**
```typescript
const deviceInfo = {
  platform: Device.osName?.toLowerCase(),
  model: Device.modelName,
  os_version: Device.osVersion,
  app_version: Constants.expoConfig?.version,
  device_id: Constants.deviceId
};
```

**Kod Referansı**: `apps/mobile/app/(auth)/register.tsx` (mevcut)

**Test Senaryoları**:
- [ ] Valid email + matching passwords → login
- [ ] Passwords don't match → error
- [ ] Email already exists → error
- [ ] Device info saved → check DB
- [ ] 2 profiles created → check DB
- [ ] "Giriş yap" linki → (auth)/login

---

### **Gün 5: Integration Testing**

**Test Planı**:

1. **Auth Flow**
```
Signup → Login → /home
```

2. **Database Verification**
```
- profiles tablosu (real + shadow)
- device_info kaydedildi
- last_login_at güncellendi
```

3. **SecureStore Verification**
```
- Token kaydedildi
- Token okunabiliyor
- Token silinebiliyor
```

4. **Error Scenarios**
```
- Network error
- Invalid credentials
- Server error
- Timeout
```

---

## 🎯 Hafta 2: Onboarding (5-Step)

### **Gün 6-7: Onboarding UI**

**Dosya**: `apps/mobile/app/(auth)/onboarding.tsx`

**5-Step Flow**:

```
Step 1: Profil Bilgileri
├── Display name
├── Bio
├── Avatar (camera/gallery)
└── Gender (male/female/lgbt)

Step 2: Vibe Seçimi
├── Mood (multi-select)
├── Style (single-select)
├── Intensity (slider)
└── Interests (tags)

Step 3: Shadow PIN
├── PIN input (4-6 digit)
├── Confirm PIN
├── FaceID/TouchID toggle
└── Shadow display name

Step 4: Privacy & Onay
├── Terms of Service
├── Privacy Policy
├── Anti-screenshot info
└── Social firewall consent

Step 5: Tamamlama
├── Welcome message
├── Bonus coins (100)
├── Animation
└── "Başla" button
```

**Implementasyon**:

1. **Main Component**
```typescript
export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  return (
    <View>
      {step === 1 && <ProfileStep />}
      {step === 2 && <VibeStep />}
      {step === 3 && <ShadowPinStep />}
      {step === 4 && <PrivacyStep />}
      {step === 5 && <CompleteStep />}
    </View>
  );
}
```

2. **Progress Indicator**
```typescript
<ProgressBar value={step} maxValue={5} />
```

3. **Navigation**
```typescript
<Pressable onPress={handlePrev}>
  <Text>Geri</Text>
</Pressable>

<Pressable onPress={handleNext}>
  <Text>İleri</Text>
</Pressable>
```

---

### **Gün 8-9: Step Components**

**Dosya**: `apps/mobile/src/components/onboarding/`

#### **Step 1: ProfileStep.tsx**

```typescript
export function ProfileStep({ data, onChange }) {
  return (
    <View>
      <Text>Profil Bilgileri</Text>
      
      <TextInput
        placeholder="Display name"
        value={data.displayName}
        onChangeText={(text) => onChange('displayName', text)}
      />
      
      <TextInput
        placeholder="Bio"
        value={data.bio}
        onChangeText={(text) => onChange('bio', text)}
        multiline
      />
      
      <Pressable onPress={pickImage}>
        <Text>Avatar Seç</Text>
      </Pressable>
      
      <Picker
        selectedValue={data.gender}
        onValueChange={(value) => onChange('gender', value)}
      >
        <Picker.Item label="Erkek" value="male" />
        <Picker.Item label="Kadın" value="female" />
        <Picker.Item label="LGBT" value="lgbt" />
      </Picker>
    </View>
  );
}
```

#### **Step 2: VibeStep.tsx**

```typescript
export function VibeStep({ data, onChange }) {
  const moods = ['Masum', 'Gizemli', 'Dominant', 'Enerjik', 'Girl Next Door', 'Komik', 'Romantik', 'Şehvetli'];
  const styles = ['Anime', 'Realistic', 'Fantasy', 'Abstract'];

  return (
    <View>
      <Text>Vibe Seçimi</Text>
      
      {/* Mood Multi-Select */}
      <View>
        {moods.map((mood) => (
          <Pressable key={mood} onPress={() => toggleMood(mood)}>
            <Text style={data.moods?.includes(mood) ? styles.selected : {}}>
              {mood}
            </Text>
          </Pressable>
        ))}
      </View>
      
      {/* Style Single-Select */}
      <Picker
        selectedValue={data.style}
        onValueChange={(value) => onChange('style', value)}
      >
        {styles.map((style) => (
          <Picker.Item key={style} label={style} value={style} />
        ))}
      </Picker>
      
      {/* Intensity Slider */}
      <Slider
        value={data.intensity || 3}
        onValueChange={(value) => onChange('intensity', value)}
        min={1}
        max={5}
      />
    </View>
  );
}
```

#### **Step 3: ShadowPinStep.tsx**

```typescript
export function ShadowPinStep({ data, onChange }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const validatePin = () => {
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN 4-6 karakter olmalı');
      return false;
    }
    if (pin !== confirmPin) {
      setError('PIN'ler eşleşmiyor');
      return false;
    }
    return true;
  };

  return (
    <View>
      <Text>Shadow PIN Oluştur</Text>
      
      <TextInput
        placeholder="PIN (4-6 digit)"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
      />
      
      <TextInput
        placeholder="PIN Doğrula"
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="numeric"
        secureTextEntry
      />
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <Switch
        value={data.useFaceID}
        onValueChange={(value) => onChange('useFaceID', value)}
      />
      <Text>FaceID/TouchID Kullan</Text>
      
      <TextInput
        placeholder="Shadow Display Name (opsiyonel)"
        value={data.shadowDisplayName}
        onChangeText={(text) => onChange('shadowDisplayName', text)}
      />
    </View>
  );
}
```

#### **Step 4: PrivacyStep.tsx**

```typescript
export function PrivacyStep({ data, onChange }) {
  return (
    <View>
      <Text>Gizlilik & Onay</Text>
      
      <CheckBox
        value={data.acceptToS}
        onValueChange={(value) => onChange('acceptToS', value)}
      />
      <Text>Hizmet Şartlarını Kabul Ediyorum</Text>
      
      <CheckBox
        value={data.acceptPrivacy}
        onValueChange={(value) => onChange('acceptPrivacy', value)}
      />
      <Text>Gizlilik Politikasını Kabul Ediyorum</Text>
      
      <CheckBox
        value={data.acceptAntiSS}
        onValueChange={(value) => onChange('acceptAntiSS', value)}
      />
      <Text>Anti-Screenshot Sistemini Anladım</Text>
      
      <CheckBox
        value={data.acceptFirewall}
        onValueChange={(value) => onChange('acceptFirewall', value)}
      />
      <Text>Social Firewall Taramasını Kabul Ediyorum</Text>
    </View>
  );
}
```

#### **Step 5: CompleteStep.tsx**

```typescript
export function CompleteStep() {
  return (
    <View>
      <LottieView
        source={require('@/assets/animations/welcome.json')}
        autoPlay
        loop={false}
      />
      
      <Text>Hoş Geldin! 🎉</Text>
      <Text>100 bonus coin aldın!</Text>
      
      <Pressable onPress={() => router.replace('/home')}>
        <Text>Başla</Text>
      </Pressable>
    </View>
  );
}
```

---

### **Gün 10: E2E Testing**

**Test Senaryoları**:

1. **Complete Flow**
```
- [ ] Step 1: Profil bilgileri gir
- [ ] Step 2: Vibe seç
- [ ] Step 3: PIN oluştur
- [ ] Step 4: Privacy onayı
- [ ] Step 5: Complete
- [ ] /home'a yönlendir
```

2. **Data Validation**
```
- [ ] Display name: min 2, max 30 char
- [ ] Bio: max 500 char
- [ ] PIN: 4-6 digit
- [ ] All required fields filled
```

3. **Database Verification**
```
- [ ] profiles tablosu güncellendi
- [ ] profile_vibes kaydedildi
- [ ] shadow_pin_hash kaydedildi
- [ ] coin_transactions (welcome bonus)
```

4. **Navigation**
```
- [ ] Back button çalışıyor
- [ ] Next button çalışıyor
- [ ] Skip option (opsiyonel)
```

---

## 📁 Dosya Yapısı

```
apps/mobile/
├── app/(auth)/
│   ├── login.tsx ✅ (mevcut)
│   ├── register.tsx ✅ (mevcut)
│   └── onboarding.tsx 🔄 (yapılacak)
│
└── src/
    ├── components/
    │   ├── layout/
    │   │   ├── AuthScreen.tsx
    │   │   └── PageScreen.tsx
    │   ├── forms/
    │   │   └── AuthTextField.tsx
    │   └── onboarding/
    │       ├── ProfileStep.tsx 🔄
    │       ├── VibeStep.tsx 🔄
    │       ├── ShadowPinStep.tsx 🔄
    │       ├── PrivacyStep.tsx 🔄
    │       └── CompleteStep.tsx 🔄
    │
    ├── hooks/
    │   ├── useAuthActions.ts ✅ (mevcut)
    │   └── useOnboarding.ts 🔄 (yapılacak)
    │
    ├── services/
    │   └── secure-store.service.ts ✅ (mevcut)
    │
    └── store/
        ├── auth.store.ts ✅ (mevcut)
        └── profile.store.ts ✅ (mevcut)
```

---

## 🔗 Bağlantılar

**Mevcut Kod**:
- `apps/mobile/app/(auth)/login.tsx`
- `apps/mobile/app/(auth)/register.tsx`
- `apps/mobile/src/hooks/useAuthActions.ts`

**Dokümantasyon**:
- `docs/mobile/auth-implementation-guide.md` - Auth detayları
- `docs/mobile/onboarding-flow.md` - Onboarding detayları
- `docs/mobile/profiles-database-schema.md` - Database

---

## ✅ Checklist

### **Hafta 1: Auth**
- [ ] login.tsx tamamlandı
- [ ] register.tsx tamamlandı
- [ ] Form validation çalışıyor
- [ ] Supabase Auth entegrasyonu
- [ ] Device info tracking
- [ ] SecureStore token storage
- [ ] Integration tests passed

### **Hafta 2: Onboarding**
- [ ] onboarding.tsx tamamlandı
- [ ] ProfileStep.tsx
- [ ] VibeStep.tsx
- [ ] ShadowPinStep.tsx
- [ ] PrivacyStep.tsx
- [ ] CompleteStep.tsx
- [ ] Step navigation
- [ ] Data persistence
- [ ] E2E tests passed

### **Deliverables**
- [ ] Tam auth sistemi
- [ ] 5-step onboarding
- [ ] Database integration
- [ ] Error handling
- [ ] User testing

---

## 🚀 Başlangıç

**İlk Görev**: `apps/mobile/app/(auth)/login.tsx` review ve enhancement

**Tahmini Süre**: 2-3 gün

**Sonraki Sprint**: Sprint 2 - Feed & Economy

---

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🚀 **READY TO START**

---

**Sprint 1'e başlamaya hazır! 🚀**
