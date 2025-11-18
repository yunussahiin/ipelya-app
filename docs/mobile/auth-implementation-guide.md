---
title: İPELYA Mobil - Auth Implementation Guide
description: Auth sistemi, shadow mode, device tracking ve security best practices
---

# İPELYA Mobil - Auth Implementation Guide

## 🎯 Auth System Overview

İPELYA'nın auth sistemi 3 ana bileşenden oluşur:

1. **Supabase Auth** - Email/Password authentication
2. **Dual Identity** - Real + Shadow profiles
3. **Device Tracking** - Cihaz bilgileri ve security

---

## 🔐 Authentication Flow

### **1. Entry Point (index.tsx)**

```typescript
// App açılışında yapılan işlemler:
1. SecureStore'dan token oku
2. Token varsa → Supabase session doğrula
3. Token yoksa → Auth stack aç
4. Zustand auth store hydrate et
```

**Kod:**
```@/Users/yunussahin/ipelya-app/apps/mobile/app/index.tsx#1:76
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/auth.store";

export default function EntryScreen() {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setSession = useAuthStore((state) => state.setSession);
  const markHydrated = useAuthStore((state) => state.markHydrated);

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        // Hata varsa veya session yoksa, storage'ı temizle
        if (error || !data.session) {
          await supabase.auth.signOut();
          if (isMounted) {
            markHydrated();
          }
          return;
        }

        if (data.session?.access_token && isMounted) {
          setSession(data.session.access_token);
        }
      } catch (err) {
        console.error("Session hydration error:", err);
        await supabase.auth.signOut();
      } finally {
        if (isMounted) {
          markHydrated();
        }
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [markHydrated, setSession]);

  if (!isHydrated) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f472b6" />
        <Text style={styles.loaderLabel}>Oturum geri yükleniyor...</Text>
      </View>
    );
  }

  if (sessionToken) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050308",
    gap: 12
  },
  loaderLabel: {
    color: "#94a3b8",
    fontWeight: "600"
  }
});
```

---

### **2. Sign In Flow**

```typescript
// Login ekranı → useAuthActions.signIn()

const signIn = async (email: string, password: string) => {
  setLoading(true);
  setError(null);
  try {
    // 1. Supabase ile authenticate
    const { data, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (authError) throw authError;
    
    if (data.session?.access_token && data.user) {
      // 2. Token'ı SecureStore'a kaydet
      await saveSession(data.session.access_token);
      
      // 3. Zustand store'ı güncelle
      setSession(data.session.access_token);
      
      // 4. Device info güncelle
      const deviceInfo = {
        platform: Device.osName?.toLowerCase() || "unknown",
        model: Device.modelName || "unknown",
        os_version: Device.osVersion || "unknown",
        app_version: Constants.expoConfig?.version || "1.0.0",
        device_id: Constants.deviceId || "unknown"
      };
      
      // 5. Profil güncelle
      await supabase
        .from("profiles")
        .update({
          last_device_info: deviceInfo,
          last_login_at: new Date().toISOString()
        })
        .eq("user_id", data.user.id)
        .eq("type", "real");
      
      // 6. Home'a yönlendir
      router.replace("/home");
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Bilinmeyen hata");
  } finally {
    setLoading(false);
  }
};
```

---

### **3. Sign Up Flow**

```typescript
// Register ekranı → useAuthActions.signUp()

const signUp = async (email: string, password: string) => {
  setLoading(true);
  setError(null);
  try {
    // 1. Supabase ile signup
    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password 
    });
    
    if (authError) throw authError;
    
    // 2. Trigger'ın profile oluşturmasını bekle
    if (data.user) {
      const deviceInfo = {
        platform: Device.osName?.toLowerCase() || "unknown",
        model: Device.modelName || "unknown",
        os_version: Device.osVersion || "unknown",
        app_version: Constants.expoConfig?.version || "1.0.0",
        device_id: Constants.deviceId || "unknown"
      };
      
      // 3. Trigger'ın tamamlanması için bekle (2 saniye)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Device info güncelle
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
        // Kritik değil, devam et
      }
    }
    
    // 5. Login ekranına yönlendir
    router.replace("/(auth)/login");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Bilinmeyen hata");
  } finally {
    setLoading(false);
  }
};
```

---

## 🔑 SecureStore Integration

### **Token Depolama**

```typescript
// services/secure-store.service.ts

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const SHADOW_PIN_KEY = 'shadow_pin';

export async function saveSession(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export async function getSession(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to get session:', err);
    return null;
  }
}

export async function clearSession() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

// Shadow PIN depolama
export async function saveShadowPin(pin: string) {
  try {
    // PIN'i hash'le (client-side)
    const hash = await hashPin(pin);
    await SecureStore.setItemAsync(SHADOW_PIN_KEY, hash);
  } catch (err) {
    console.error('Failed to save shadow pin:', err);
  }
}

export async function getShadowPin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SHADOW_PIN_KEY);
  } catch (err) {
    console.error('Failed to get shadow pin:', err);
    return null;
  }
}
```

---

## 👥 Dual Identity System

### **Real Profile vs Shadow Profile**

```typescript
// Signup sonrası trigger otomatik 2 profil oluşturur:

// Real Profile (type='real')
{
  user_id: "uuid",
  type: "real",
  username: "johndoe",
  display_name: "John Doe",
  avatar_url: "...",
  bio: "...",
  gender: "male",
  shadow_pin_hash: null,
  shadow_unlocked: false,
  // ... device info
}

// Shadow Profile (type='shadow')
{
  user_id: "uuid",
  type: "shadow",
  username: "shadow_uuid",
  display_name: "Shadow Profile",
  avatar_url: null,
  bio: null,
  gender: null,
  shadow_pin_hash: "bcrypt_hash",
  shadow_unlocked: false,
  // ... device info
}
```

### **Shadow Mode Aktivasyonu**

```typescript
// Edge Function: enable-shadow-mode

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function enableShadowMode(userId: string, pin: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. PIN hash'le
  const pinHash = await bcrypt.hash(pin, 10);

  // 2. Shadow profile'ı güncelle
  const { data, error } = await supabase
    .from('profiles')
    .update({
      shadow_pin_hash: pinHash,
      shadow_unlocked: true
    })
    .eq('user_id', userId)
    .eq('type', 'shadow')
    .select()
    .single();

  if (error) throw error;

  // 3. JWT claim'i güncelle
  const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        shadow_mode: true
      }
    }
  );

  if (userError) throw userError;

  return {
    success: true,
    profile: data,
    user: userData
  };
}
```

---

## 📱 Device Tracking

### **Device Info Yapısı**

```typescript
interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  model: string;           // e.g., "iPhone 15 Pro"
  os_version: string;      // e.g., "17.2"
  app_version: string;     // e.g., "1.0.0"
  device_id: string;       // Unique device identifier
  locale: string;          // e.g., "tr-TR"
}
```

### **Device Info Toplama**

```typescript
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Network from 'expo-network';

async function collectDeviceInfo(): Promise<DeviceInfo> {
  return {
    platform: Device.osName?.toLowerCase() || 'unknown',
    model: Device.modelName || 'unknown',
    os_version: Device.osVersion || 'unknown',
    app_version: Constants.expoConfig?.version || '1.0.0',
    device_id: Constants.deviceId || 'unknown',
    locale: 'tr-TR'
  };
}

async function getIpAddress(): Promise<string> {
  try {
    return await Network.getIpAddressAsync();
  } catch (err) {
    console.error('Failed to get IP:', err);
    return 'unknown';
  }
}
```

---

## 🔒 Security Best Practices

### **1. PIN Hashing**

```typescript
// PIN'ler asla plain text olarak saklanmaz
// Supabase'de bcrypt ile hash'lenir
// SecureStore'da da hash'lenir

import bcrypt from 'bcryptjs';

async function hashPin(pin: string): Promise<string> {
  return await bcrypt.hash(pin, 10);
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin, hash);
}
```

### **2. RLS Policies**

```sql
-- Policy 1: Kullanıcılar sadece kendi profillerini görebilir
CREATE POLICY "users_view_own_profiles" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "users_update_own_profiles" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Policy 3: Shadow/Real profiller JWT claim'e göre izole edilir
CREATE POLICY "shadow_isolation" ON profiles
  FOR SELECT USING (
    (type = 'shadow' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = true)
    OR
    (type = 'real' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = false)
  );
```

### **3. Token Management**

```typescript
// Token'lar SecureStore'da şifreli olarak saklanır
// Her app restart'ında yeniden validate edilir
// Expired token'lar otomatik temizlenir

async function validateToken(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data.user;
  } catch (err) {
    return false;
  }
}
```

---

## 🚨 Error Handling

### **Auth Errors**

```typescript
const handleAuthError = (error: AuthError) => {
  const errorMap: Record<string, string> = {
    'invalid_credentials': 'E-posta veya şifre yanlış',
    'user_not_found': 'Kullanıcı bulunamadı',
    'email_not_confirmed': 'E-posta doğrulanmamış',
    'user_already_exists': 'Bu e-posta zaten kayıtlı',
    'weak_password': 'Şifre çok zayıf',
    'invalid_email': 'Geçersiz e-posta adresi'
  };

  return errorMap[error.code] || error.message || 'Bilinmeyen hata';
};
```

### **Network Errors**

```typescript
const handleNetworkError = (error: Error) => {
  if (error.message.includes('Network')) {
    return 'İnternet bağlantısı yok';
  }
  if (error.message.includes('timeout')) {
    return 'Bağlantı zaman aşımına uğradı';
  }
  return 'Ağ hatası oluştu';
};
```

---

## 📊 Auth State Diagram

```
┌─────────────────────────────────────┐
│         App Boot                    │
│  - Check SecureStore token          │
│  - Validate Supabase session        │
└────────────┬────────────────────────┘
             │
        ┌────▼────┐
        │ Token?  │
        └────┬────┘
             │
    ┌────────┴────────┐
    │                 │
  YES               NO
    │                 │
    ▼                 ▼
┌─────────┐      ┌──────────┐
│ /home   │      │ (auth)   │
│ (Feed)  │      │ (Login)  │
└─────────┘      └──────────┘
                      │
                 ┌────▼────┐
                 │ Account?│
                 └────┬────┘
                      │
            ┌─────────┴─────────┐
            │                   │
          YES                 NO
            │                   │
            ▼                   ▼
       ┌────────┐          ┌──────────┐
       │ SignIn │          │ Register │
       └────┬───┘          └────┬─────┘
            │                   │
            │            ┌──────▼──────┐
            │            │ Trigger     │
            │            │ Create 2    │
            │            │ Profiles    │
            │            └──────┬──────┘
            │                   │
            │            ┌──────▼──────┐
            │            │ Redirect    │
            │            │ to Login    │
            │            └──────┬──────┘
            │                   │
            └───────────┬───────┘
                        │
                   ┌────▼────┐
                   │ Shadow? │
                   └────┬────┘
                        │
            ┌───────────┴───────────┐
            │                       │
          YES                     NO
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌────────────┐
    │ /home        │        │ Onboarding │
    │ (Shadow)     │        │ (5 steps)  │
    └──────────────┘        └────┬───────┘
                                 │
                            ┌────▼──────┐
                            │ /home      │
                            │ (Feed)     │
                            └────────────┘
```

---

## 🧪 Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Register new account
- [ ] Token persistence after app restart
- [ ] Token expiration handling
- [ ] Shadow mode activation
- [ ] Device info tracking
- [ ] Network error handling
- [ ] Session validation
- [ ] Logout functionality

---

## 📚 Related Documentation

- `docs/mobile/profiles-database-schema.md` - Profiles table structure
- `docs/mobile/onboarding-flow.md` - Onboarding flow details
- `docs/system/domain-flows.md` - User journey flows
- `docs/system/data-platform.md` - Supabase schema

---

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready
