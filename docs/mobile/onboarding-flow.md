---
title: İPELYA Mobil - Onboarding Flow & Auth System
description: Auth, signup, login ve onboarding ekranlarının detaylı planı ve implementasyonu
---

# İPELYA Mobil - Onboarding Flow & Auth System

## 📋 Genel Bakış

Onboarding sistemi, kullanıcının kaydolmasından itibaren shadow profile kurulumuna kadar tüm adımları yönetir. Dual identity (real + shadow) sistemi ve device tracking ile entegre çalışır.

---

## 🔄 Auth Flow Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                    APP BOOT (index.tsx)                     │
│  - SecureStore token kontrolü                               │
│  - Zustand auth store hydrate                               │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │ Token var mı?   │
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ✅ EVET          ❌ HAYIR
        │                 │
        │                 ▼
        │          ┌──────────────────┐
        │          │ (auth)/login     │
        │          │ - Email input    │
        │          │ - Password input │
        │          └────────┬─────────┘
        │                   │
        │          ┌────────▼──────────┐
        │          │ Hesabın var mı?   │
        │          └────────┬──────────┘
        │                   │
        │        ┌──────────┴──────────┐
        │        │                     │
        │    ✅ EVET              ❌ HAYIR
        │        │                     │
        │        │              ┌──────▼──────────┐
        │        │              │ (auth)/register │
        │        │              │ - Email input   │
        │        │              │ - Password      │
        │        │              │ - Confirm pass  │
        │        │              └────────┬────────┘
        │        │                       │
        │        │              ┌────────▼──────────────┐
        │        │              │ Supabase signUp()     │
        │        │              │ - Trigger real profile│
        │        │              │ - Wait 2 sec         │
        │        │              │ - Update device info │
        │        │              └────────┬─────────────┘
        │        │                       │
        │        │              ┌────────▼──────────┐
        │        │              │ (auth)/login      │
        │        │              │ (redirect)        │
        │        │              └────────┬──────────┘
        │        │                       │
        │   ┌────▼──────────────────────┘
        │   │
        │   ▼
        │ ┌──────────────────────────────┐
        │ │ Supabase signInWithPassword()│
        │ │ - Device info güncelle      │
        │ │ - SecureStore'a token kaydet│
        │ │ - Zustand store güncelle    │
        │ └────────┬─────────────────────┘
        │          │
        │   ┌──────▼──────────────────┐
        │   │ Shadow mode var mı?     │
        │   └──────┬──────────────────┘
        │          │
        │    ┌─────┴─────┐
        │    │           │
        │✅ EVET    ❌ HAYIR
        │    │           │
        │    │      ┌────▼────────────────┐
        │    │      │ (auth)/onboarding   │
        │    │      │ - Step 1: Profile   │
        │    │      │ - Step 2: Vibe      │
        │    │      │ - Step 3: Shadow PIN│
        │    │      │ - Step 4: Privacy   │
        │    │      │ - Step 5: Complete  │
        │    │      └────────┬────────────┘
        │    │               │
        │    └───────┬───────┘
        │            │
        └────────────▼──────────────────┐
                     │                  │
                     ▼                  │
            ┌─────────────────┐         │
            │ /home (Feed)    │◄────────┘
            │ - News feed     │
            │ - Creator cards │
            │ - Tab nav       │
            └─────────────────┘
```

---

## 🔐 Auth Screens (Mevcut)

### 1. **Login Screen** `(auth)/login.tsx`

**Özellikler:**
- Email + Password validation (Zod schema)
- "Şifremi unuttum" linki (TODO)
- Error handling
- Loading state

**Akış:**
```typescript
1. User email + password girer
2. useAuthActions.signIn() çağrılır
3. Supabase.auth.signInWithPassword()
4. Device info güncellenir (platform, model, OS, app version)
5. SecureStore'a token kaydedilir
6. Zustand auth store güncellenir
7. /home'a yönlendirilir
```

**Kod Referansı:**
```@/Users/yunussahin/ipelya-app/apps/mobile/app/(auth)/login.tsx#1:107
import { ActivityIndicator, Pressable, Text } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { AuthScreen } from "@/components/layout/AuthScreen";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { useAuthActions } from "@/hooks/useAuthActions";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(6, "En az 6 karakter")
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn, isLoading, error, setError } = useAuthActions();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await signIn(email, password);
  });

  return (
    <AuthScreen
      title="Tekrar hoş geldin"
      subtitle="Shadow mode ve token ekonomisine kaldığın yerden devam et."
      footer={
        <Text style={{ color: "#94a3b8" }}>
          Hesabın yok mu?{" "}
          <Link href="/(auth)/register" style={{ color: "#f472b6", fontWeight: "600" }}>
            Kayıt ol
          </Link>
        </Text>
      }
    >
      {/* Form fields */}
    </AuthScreen>
  );
}
```

---

### 2. **Register Screen** `(auth)/register.tsx`

**Özellikler:**
- Email + Password + Confirm Password validation
- Zod schema ile form validation
- Error handling
- Loading state

**Akış:**
```typescript
1. User email + password girer
2. useAuthActions.signUp() çağrılır
3. Supabase.auth.signUp()
4. Trigger otomatik real + shadow profil oluşturur
5. 2 saniye bekle (trigger'ın tamamlanması için)
6. Device info güncellenir
7. Login ekranına yönlendirilir
```

**Kod Referansı:**
```@/Users/yunussahin/ipelya-app/apps/mobile/app/(auth)/register.tsx#1:128
import { ActivityIndicator, Pressable, Text } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { AuthScreen } from "@/components/layout/AuthScreen";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { useAuthActions } from "@/hooks/useAuthActions";

const schema = z
  .object({
    email: z.string().email("Geçerli bir e-posta gir"),
    password: z.string().min(6, "En az 6 karakter"),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { signUp, isLoading, error, setError } = useAuthActions();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" }
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await signUp(email, password);
  });

  return (
    <AuthScreen
      title="Yeni bir gerçeklik başlat"
      subtitle="Shadow profilini ve gerçek kimliğini aynı anda yönet."
      footer={
        <Text style={{ color: "#94a3b8" }}>
          Hesabın var mı? {" "}
          <Link href="/(auth)/login" style={{ color: "#f472b6", fontWeight: "600" }}>
            Giriş yap
          </Link>
        </Text>
      }
    >
      {/* Form fields */}
    </AuthScreen>
  );
}
```

---

### 3. **useAuthActions Hook** (Auth Logic)

**Özellikler:**
- `signIn()` - Email/password ile giriş
- `signUp()` - Yeni hesap oluşturma
- `signOut()` - Çıkış
- Error handling ve loading state

**Kod Referansı:**
```@/Users/yunussahin/ipelya-app/apps/mobile/src/hooks/useAuthActions.ts#1:118
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabaseClient";
import { saveSession, clearSession } from "@/services/secure-store.service";
import { useAuthStore } from "@/store/auth.store";

export function useAuthActions() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSessionStore = useAuthStore((s) => s.clearSession);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.session?.access_token && data.user) {
        await saveSession(data.session.access_token);
        setSession(data.session.access_token);
        
        // Device info güncelle
        const deviceInfo = {
          platform: Device.osName?.toLowerCase() || "unknown",
          model: Device.modelName || "unknown",
          os_version: Device.osVersion || "unknown",
          app_version: Constants.expoConfig?.version || "1.0.0",
          device_id: Constants.deviceId || "unknown"
        };
        
        await supabase
          .from("profiles")
          .update({
            last_device_info: deviceInfo,
            last_login_at: new Date().toISOString()
          })
          .eq("user_id", data.user.id)
          .eq("type", "real");
        
        router.replace("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔵 Starting signup for:", email);
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      
      if (authError) {
        console.error("❌ Auth signup error:", authError);
        throw authError;
      }
      
      console.log("✅ Auth signup successful, user ID:", data.user?.id);
      
      // Kayıt sonrası device info kaydet (trigger otomatik profile oluşturur)
      if (data.user) {
        const deviceInfo = {
          platform: Device.osName?.toLowerCase() || "unknown",
          model: Device.modelName || "unknown",
          os_version: Device.osVersion || "unknown",
          app_version: Constants.expoConfig?.version || "1.0.0",
          device_id: Constants.deviceId || "unknown"
        };
        
        console.log("⏳ Waiting for trigger to create profile...");
        // Trigger'ın profile oluşturmasını bekle (2 saniye)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("🔄 Updating profile with device info...");
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            last_device_info: deviceInfo,
            last_login_at: new Date().toISOString()
          })
          .eq("user_id", data.user.id)
          .eq("type", "real");
        
        if (profileError) {
          console.error("⚠️ Profile update error:", profileError);
          // Profile update hatası kritik değil, devam et
        } else {
          console.log("✅ Profile updated successfully");
        }
      }
      
      console.log("🎉 Signup complete, redirecting to login");
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("💥 Signup error:", err);
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearSession();
    clearSessionStore();
    router.replace("/(auth)/login");
  };

  return { signIn, signUp, signOut, isLoading, error, setError };
}
```

---

## 🎯 Onboarding Screen (Placeholder → Gerçek)

### **Mevcut Durum:**
```@/Users/yunussahin/ipelya-app/apps/mobile/app/(auth)/onboarding.tsx#1:11
import { PlaceholderScreen } from "@/components/layout/PlaceholderScreen";

export default function OnboardingScreen() {
  return (
    <PlaceholderScreen
      title="Onboarding"
      description="Shadow mode tercihleri ve profil bilgileri burada toplanacak."
    />
  );
}
```

### **Yapılması Gereken: 5-Step Onboarding Flow**

#### **Step 1: Profil Bilgileri**
```typescript
// Ekran: (auth)/onboarding/profile.tsx
Girdiler:
- Display Name (text input)
- Bio (textarea)
- Avatar (image picker - camera/gallery)
- Gender (radio: male/female/lgbt)
- Birth Date (date picker - yaş doğrulama)

Validasyon:
- Display name: min 2, max 30 char
- Bio: max 500 char
- Avatar: optional
- Gender: required
- Age: 18+ zorunlu

Database Update:
- profiles.display_name
- profiles.bio
- profiles.avatar_url (storage'a upload)
- profiles.gender
```

#### **Step 2: Vibe Seçimi**
```typescript
// Ekran: (auth)/onboarding/vibe.tsx
Girdiler:
- Mood (multi-select): romantic, playful, mysterious, dominant, submissive
- Style (single-select): anime, realistic, fantasy, abstract
- Intensity (slider): 1-5
- Interests (multi-select tags)

Validasyon:
- Min 1 mood seçilmeli
- Style zorunlu
- Intensity default 3

Database Update:
- profile_vibes tablosuna insert
- embeddings_profiles'a vector insert (pgvector)
```

#### **Step 3: Shadow Mode Kurulumu**
```typescript
// Ekran: (auth)/onboarding/shadow-pin.tsx
Girdiler:
- PIN (4-6 digit numeric input)
- Confirm PIN
- FaceID/TouchID toggle (optional)
- Shadow Display Name (optional)

Validasyon:
- PIN: 4-6 digit, numeric only
- PIN match check
- Display name: max 30 char

Database Update:
- profiles.shadow_pin_hash (bcrypt)
- profiles.shadow_display_name
- SecureStore'a PIN hash kaydet
```

#### **Step 4: Gizlilik & Onay**
```typescript
// Ekran: (auth)/onboarding/privacy.tsx
Girdiler:
- Terms of Service (checkbox)
- Privacy Policy (checkbox)
- Anti-screenshot bilgilendirmesi (checkbox)
- Social firewall onayı (checkbox)

Aksiyon:
- Social firewall: upload-contacts Edge Function
- Rehber taraması (expo-contacts)
- social_firewall_rules tablosuna insert
```

#### **Step 5: Tamamlama**
```typescript
// Ekran: (auth)/onboarding/complete.tsx
Gösterilen:
- Hoş geldin mesajı
- Welcome bonus (100 coins)
- Shadow mode açılış animasyonu
- "Başla" butonu

Aksiyon:
- Coin transaction insert
- Zustand store'ları güncelle
- /home'a yönlendir
```

---

## 💾 State Management

### **Auth Store** (Zustand)
```@/Users/yunussahin/ipelya-app/apps/mobile/src/store/auth.store.ts#1:18
import { create } from "zustand";

type AuthState = {
  sessionToken: string | null;
  isHydrated: boolean;
  setSession: (token: string | null) => void;
  markHydrated: () => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  sessionToken: null,
  isHydrated: false,
  setSession: (token) => set({ sessionToken: token }),
  markHydrated: () => set({ isHydrated: true }),
  clearSession: () => set({ sessionToken: null })
}));
```

### **Profile Store** (Zustand)
```@/Users/yunussahin/ipelya-app/apps/mobile/src/store/profile.store.ts#1:27
import { create } from "zustand";

type Profile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isShadow?: boolean;
};

type ProfileState = {
  profile: Profile | null;
  setProfile: (data: Profile | null) => void;
  updatePartial: (payload: Partial<Profile>) => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  setProfile: (data) => set({ profile: data }),
  updatePartial: (payload) => {
    const current = get().profile;
    if (!current) {
      return;
    }
    set({ profile: { ...current, ...payload } });
  }
}));
```

---

## 📊 Database Schema (Profiles)

### **Tablo: profiles**

| Kolon              | Tip         | Açıklama                     |
| ------------------ | ----------- | ---------------------------- |
| `id`               | uuid        | Primary key                  |
| `user_id`          | uuid        | Auth user ID                 |
| `type`             | text        | 'real' \| 'shadow'           |
| `username`         | text        | Unique username              |
| `display_name`     | text        | Görünen ad                   |
| `avatar_url`       | text        | Avatar URL                   |
| `bio`              | text        | Biyografi                    |
| `gender`           | text        | 'male' \| 'female' \| 'lgbt' |
| `shadow_pin_hash`  | text        | PIN hash (bcrypt)            |
| `shadow_unlocked`  | boolean     | Shadow mode aktif mi?        |
| `last_device_info` | jsonb       | Device metadata              |
| `last_ip_address`  | inet        | Son login IP                 |
| `last_login_at`    | timestamptz | Son login zamanı             |
| `device_token`     | text        | Push notification token      |
| `created_at`       | timestamptz | Oluşturulma zamanı           |
| `updated_at`       | timestamptz | Son güncelleme zamanı        |

### **Constraints**
- UNIQUE: `(user_id, type)` - Her user 1 real + 1 shadow
- UNIQUE: `username`
- CHECK: `type IN ('real', 'shadow')`
- CHECK: `gender IN ('male', 'female', 'lgbt')`

---

## 🔗 İlgili Tablolar

### **profile_vibes**
```sql
- profile_id (FK)
- vibe_id (FK)
- score (float)
```

### **embeddings_profiles**
```sql
- profile_id (FK)
- embedding_vector (vector)
- vibe_type (text)
- created_at
```

### **social_firewall_rules**
```sql
- profile_id (FK)
- contact_hash (text)
- rule_type (text)
- created_at
```

---

## 🔐 RLS Policies

### **Policy 1: users_view_own_profiles**
```sql
CREATE POLICY "users_view_own_profiles" ON profiles
  FOR SELECT USING (user_id = auth.uid());
```

### **Policy 2: users_update_own_profiles**
```sql
CREATE POLICY "users_update_own_profiles" ON profiles
  FOR UPDATE USING (user_id = auth.uid());
```

### **Policy 3: shadow_isolation**
```sql
CREATE POLICY "shadow_isolation" ON profiles
  FOR SELECT USING (
    (type = 'shadow' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = true)
    OR
    (type = 'real' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = false)
  );
```

---

## 🔄 Automatic Triggers

### **Trigger 1: on_auth_user_created**
Yeni auth user oluşturulduğunda otomatik real profile oluştur:

```sql
CREATE OR REPLACE FUNCTION create_real_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, type, username, display_name, gender)
  VALUES (
    NEW.id,
    'real',
    split_part(NEW.email, '@', 1),
    split_part(NEW.email, '@', 1),
    'male'
  )
  ON CONFLICT (user_id, type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Trigger 2: update_profiles_updated_at**
Her UPDATE'de `updated_at` otomatik güncelle:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📱 Device Info JSON Format

```json
{
  "platform": "ios",           // "ios" | "android" | "web"
  "model": "iPhone 15 Pro",    // Cihaz modeli
  "os_version": "17.2",        // İşletim sistemi versiyonu
  "app_version": "1.0.0",      // Uygulama versiyonu
  "device_id": "uuid-string",  // Unique device identifier
  "locale": "tr-TR"            // Dil ayarı
}
```

---

## 🚀 Geliştirme Checklist

### **Phase 1: Onboarding UI Oluşturma**
- [ ] Step 1: Profile bilgileri ekranı
- [ ] Step 2: Vibe seçimi ekranı
- [ ] Step 3: Shadow PIN ekranı
- [ ] Step 4: Privacy onayı ekranı
- [ ] Step 5: Tamamlama ekranı
- [ ] Step navigation (prev/next)
- [ ] Progress indicator

### **Phase 2: Form Validation & State**
- [ ] Zod schemas oluştur
- [ ] Form state management
- [ ] Error handling
- [ ] Loading states

### **Phase 3: Database Integration**
- [ ] Profile güncelleme
- [ ] Vibe preferences kaydetme
- [ ] Shadow PIN hash
- [ ] Avatar upload (storage)

### **Phase 4: Edge Functions**
- [ ] enable-shadow-mode
- [ ] upload-contacts (social firewall)
- [ ] welcome-bonus (coin transaction)

### **Phase 5: Testing & Polish**
- [ ] Unit tests
- [ ] Integration tests
- [ ] UI/UX refinement
- [ ] Performance optimization

---

## 📝 Notlar

1. **Trigger Timing**: Signup sonrası trigger'ın profile oluşturması için 2 saniye bekle
2. **PIN Security**: PIN'ler asla plain text olarak saklanmaz, bcrypt ile hash'lenir
3. **Shadow Isolation**: JWT claim bazlı izolasyon sayesinde real ve shadow profiller tamamen ayrı
4. **Device Tracking**: Her login'de device info güncellenir, güvenlik analizi için kullanılır
5. **Onboarding Skip**: Kullanıcı onboarding'i skip edebilir, daha sonra profile'dan düzenleyebilir

---

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🔄 In Development
