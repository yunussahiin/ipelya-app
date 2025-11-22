---
title: OAuth & Deep Linking - Implementasyon Rehberi
description: Google OAuth ve Magic Link ile giriş sistemi (Supabase docs'a referans)
---

# 🔐 OAuth & Deep Linking - Implementasyon Rehberi

**Oluşturulma Tarihi**: 22 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready

> ⚠️ **Not**: Bu dokümantasyon, Supabase resmi docs'unda mevcut olan örnekleri referans alır.
> Detaylı bilgi için: https://supabase.com/docs/guides/auth/native-mobile-deep-linking

---

## 📋 İçerik

1. [Genel Bakış](#genel-bakış)
2. [Supabase Docs Referansları](#supabase-docs-referansları)
3. [Proje Spesifik Setup](#proje-spesifik-setup)
4. [Google OAuth Akışı](#google-oauth-akışı)
5. [Magic Link Akışı](#magic-link-akışı)
6. [Deep Linking](#deep-linking)
7. [Hata Yönetimi](#hata-yönetimi)
8. [Testing](#testing)

---

## 📚 Referanslar

### Supabase Docs
- **Deep Linking**: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- **React Native Auth**: https://supabase.com/docs/guides/auth/quickstarts/react-native
- **OAuth Providers**: https://supabase.com/docs/guides/auth/social-login
- **Magic Link**: https://supabase.com/docs/guides/auth/auth-magic-link
- **Session Management**: https://supabase.com/docs/reference/javascript/auth-onauthstatechange

### Expo Docs
- **Auth Session**: https://docs.expo.dev/versions/latest/sdk/auth-session/
- **Web Browser**: https://docs.expo.dev/versions/latest/sdk/webbrowser/
- **Deep Linking**: https://docs.expo.dev/guides/linking/

### Proje Dosyaları
- **OAuth Service**: `src/services/oauth.service.ts`
- **useAuthActions Hook**: `src/hooks/useAuthActions.ts`
- **Supabase Client**: `src/lib/supabaseClient.ts`
- **App Layout**: `app/_layout.tsx`

**Önemli**: Supabase docs'ta zaten detaylı React Native örnekleri mevcut. Bu dokümantasyon, proje spesifik implementasyonları ve best practices'leri içerir.

---

## 🎯 Genel Bakış

### Neden OAuth?

- ✅ Kullanıcı şifre saklamıyor (daha güvenli)
- ✅ Google hesabı ile hızlı giriş
- ✅ Sosyal giriş (gelecekte: Apple, Facebook)
- ✅ Supabase tarafından yönetiliyor

### Neden Magic Link?

- ✅ Email-only giriş (şifre yok)
- ✅ Güvenli ve basit
- ✅ Fallback seçeneği

---

## 🔧 Proje Spesifik Setup

Bu bölüm, proje spesifik implementasyonları açıklar. Genel bilgi için Supabase docs'a bakınız.

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Login Screen    │         │  OAuth Service   │         │
│  │                  │────────▶│                  │         │
│  │  - Email/Pass    │         │  - Google OAuth  │         │
│  │  - Google Button │         │  - Magic Link    │         │
│  │  - Magic Link    │         │  - Deep Linking  │         │
│  └──────────────────┘         └──────────────────┘         │
│                                        │                    │
│                                        ▼                    │
│                          ┌──────────────────────┐           │
│                          │  Supabase Auth       │           │
│                          │  (JWT + Session)     │           │
│                          └──────────────────────┘           │
│                                        │                    │
│                                        ▼                    │
│                          ┌──────────────────────┐           │
│                          │  AsyncStorage        │           │
│                          │  (Session Persist)   │           │
│                          └──────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                                        │
         ▼                                        ▼
    ┌─────────┐                            ┌──────────┐
    │ Google  │                            │ Browser  │
    │ OAuth   │                            │ (OAuth)  │
    └─────────┘                            └──────────┘
         │                                        │
         └────────────────────┬───────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Deep Link URL   │
                    │  exp://...       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  App Callback    │
                    │  (Session Create)│
                    └──────────────────┘
```

---

## 🔧 Setup

### 1. Paketleri Kur

```bash
npx expo install expo-auth-session expo-web-browser expo-linking
```

### 2. Supabase Client Ayarla

**Detaylı bilgi**: https://supabase.com/docs/guides/auth/quickstarts/react-native

```typescript
// src/lib/supabaseClient.ts
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,        // Session'ı telefonun hafızasında sakla
    autoRefreshToken: true,        // Token'ı otomatik yenile
    persistSession: true,          // Oturumu kaydet
    detectSessionInUrl: false,     // Mobile'da URL detection'ı kapat
    lock: processLock,             // Concurrent requests'i yönet
  },
});

// AppState listener - Uygulamanın ön/arka plana gelmesini dinle
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();  // Ön plana geldi
    } else {
      supabase.auth.stopAutoRefresh();   // Arka plana gitti
    }
  });
}
```

### 3. app.json'da Scheme Ekle

**Detaylı bilgi**: https://supabase.com/docs/guides/auth/native-mobile-deep-linking

```json
{
  "expo": {
    "scheme": "exp"
  }
}
```

### 4. Supabase Dashboard'da Redirect URI Ekle

1. Supabase Dashboard → Auth → URL Configuration
2. "Additional Redirect URLs" bölümüne ekle: `exp://192.168.1.140:8081/oauth-callback`

### 5. Google OAuth Ayarla

**Detaylı bilgi**: https://supabase.com/docs/guides/auth/social-login/auth-google

1. Google Cloud Console'da proje oluştur
2. OAuth 2.0 credentials oluştur
3. Authorized redirect URIs'ye ekle: `https://your-project.supabase.co/auth/v1/callback`
4. Client ID'yi `.env`'ye ekle

---

## 🔐 Google OAuth Akışı

### Adım 1: OAuth Service Oluştur

```typescript
// src/services/oauth.service.ts
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabaseClient";

WebBrowser.maybeCompleteAuthSession();

export const getRedirectUrl = () => {
  return makeRedirectUri({
    scheme: "exp",
    path: "oauth-callback",
  });
};

export const signInWithGoogle = async () => {
  try {
    const redirectUrl = getRedirectUrl();
    console.log("🔵 Google OAuth başlatılıyor...");

    // Supabase'den OAuth URL'i al
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Tarayıcıyı manuel aç
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("OAuth URL alınamadı");

    // Tarayıcıda Google login sayfasını aç
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (result.type === "success") {
      // URL'den session oluştur
      const session = await createSessionFromUrl(result.url);
      return session;
    } else if (result.type === "cancel") {
      throw new Error("OAuth iptal edildi");
    }
  } catch (error) {
    console.error("❌ Google OAuth hatası:", error);
    throw error;
  }
};

export const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(`OAuth error: ${errorCode}`);
  if (!params.access_token) throw new Error("Access token bulunamadı");

  const { data, error } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });

  if (error) throw error;
  return data.session;
};
```

### Adım 2: Hook'ta Kullan

```typescript
// src/hooks/useAuthActions.ts
import { signInWithGoogle } from "@/services/oauth.service";

export function useAuthActions() {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogleOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await signInWithGoogle();
      
      if (session?.access_token && session.user) {
        // Session'ı kaydet
        await saveSession(session.access_token);
        setSession(session.access_token);
        
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
          .eq("user_id", session.user.id)
          .eq("type", "real");
        
        router.replace("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google OAuth hatası");
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogleOAuth, isLoading, error };
}
```

### Adım 3: Login Screen'de Kullan

```typescript
// app/(auth)/login.tsx
import { useAuthActions } from "@/hooks/useAuthActions";

export default function LoginScreen() {
  const { signInWithGoogleOAuth, isLoading, error } = useAuthActions();

  return (
    <AuthScreen>
      {/* Email/Password form */}
      
      {/* Google OAuth Button */}
      <Pressable 
        onPress={signInWithGoogleOAuth}
        disabled={isLoading}
      >
        <Text>Google ile Giriş Yap</Text>
      </Pressable>
    </AuthScreen>
  );
}
```

---

## 📧 Magic Link Akışı

### Adım 1: Magic Link Service

```typescript
// src/services/oauth.service.ts
export const signInWithMagicLink = async (email: string) => {
  try {
    const redirectUrl = getRedirectUrl();

    console.log("📧 Magic link gönderiliyor:", email);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;
    console.log("✅ Magic link email'e gönderildi");
    return true;
  } catch (error) {
    console.error("❌ Magic link hatası:", error);
    throw error;
  }
};
```

### Adım 2: Hook'ta Kullan

```typescript
export function useAuthActions() {
  const signInWithMagicLinkEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithMagicLink(email);
      // Başarı mesajı göster
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Magic link hatası");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithMagicLinkEmail };
}
```

---

## 🔗 Deep Linking

### Nedir?

Deep linking, tarayıcıdan uygulamaya geri dönüş mekanizmasıdır.

```
Kullanıcı "Google ile Giriş Yap" butonuna tıklar
         ▼
Tarayıcıda Google login sayfası açılır
         ▼
Kullanıcı Google hesabı ile giriş yapar
         ▼
Google, uygulamaya geri yönlendirir:
exp://192.168.1.140:8081/oauth-callback?access_token=...&refresh_token=...
         ▼
Uygulama URL'den token'ları alır
         ▼
Session oluşturulur ve /home'a yönlendirilir
```

### Setup

**app/_layout.tsx'de:**

```typescript
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { createSessionFromUrl } from "@/services/oauth.service";

function AppStack() {
  // Setup deep linking for OAuth callbacks
  useEffect(() => {
    const url = Linking.useURL();
    if (url != null) {
      console.log("🔗 Deep link alındı:", url);
      createSessionFromUrl(url).catch((error) => {
        console.error("❌ Deep link session oluşturma hatası:", error);
      });
    }
  }, []);

  return <Stack />;
}
```

---

## 🚨 Hata Yönetimi

### Hata Türleri

| Hata                      | Sebep                        | Çözüm                            |
| ------------------------- | ---------------------------- | -------------------------------- |
| `OAuth URL alınamadı`     | Supabase bağlantı sorunu     | Env variables kontrol et         |
| `Access token bulunamadı` | URL parsing hatası           | Deep linking URL'sini kontrol et |
| `OAuth iptal edildi`      | Kullanıcı tarayıcıyı kapattı | Kullanıcıya bilgi ver            |
| `Token süresi doldu`      | Session expired              | Auto-refresh kontrol et          |

### Error Handling

```typescript
try {
  const session = await signInWithGoogle();
} catch (error) {
  if (error.message.includes("OAuth")) {
    // OAuth hatası
    showAlert("Google giriş başarısız oldu");
  } else if (error.message.includes("token")) {
    // Token hatası
    showAlert("Oturum oluşturulamadı");
  } else {
    // Bilinmeyen hata
    showAlert("Bir hata oluştu, lütfen tekrar deneyin");
  }
}
```

---

## 🧪 Testing

### Manual Testing

1. **Google OAuth Test:**
   ```bash
   npx expo start
   # iOS simulator'da çalıştır
   # "Google ile Giriş Yap" butonuna tıkla
   # Tarayıcıda Google login yap
   # Uygulamaya geri dön
   # /home'a yönlendirildiğini kontrol et
   ```

2. **Magic Link Test:**
   ```bash
   # Login screen'de email gir
   # "Magic Link Gönder" butonuna tıkla
   # Email'de linke tıkla
   # Uygulamaya geri dön
   # /home'a yönlendirildiğini kontrol et
   ```

3. **Deep Linking Test:**
   ```bash
   # Terminal'de:
   npx uri-scheme open "exp://192.168.1.140:8081/oauth-callback?access_token=test&refresh_token=test"
   # Uygulamada deep link handler'ın çalıştığını kontrol et
   ```

### Debugging

```typescript
// Console logs
console.log("🔵 Google OAuth başlatılıyor...");
console.log("🌐 Tarayıcı açılıyor...");
console.log("🔗 Deep link alındı:", url);
console.log("✅ OAuth session başarıyla oluşturuldu");
console.log("❌ Google OAuth hatası:", error);

// Supabase logs
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);
  console.log("Session:", session);
});
```

---

## 📊 Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                   Google OAuth Akışı                        │
└─────────────────────────────────────────────────────────────┘

1. Kullanıcı "Google ile Giriş Yap" butonuna tıklar
   │
   ▼
2. signInWithGoogle() çağrılır
   │
   ▼
3. Supabase'den OAuth URL alınır
   │
   ▼
4. WebBrowser.openAuthSessionAsync() ile tarayıcı açılır
   │
   ▼
5. Kullanıcı Google hesabı ile giriş yapar
   │
   ▼
6. Google, deep link URL'sine yönlendirir
   exp://192.168.1.140:8081/oauth-callback?access_token=...
   │
   ▼
7. Uygulama deep link'i yakalar
   │
   ▼
8. createSessionFromUrl() URL'den token'ları çıkarır
   │
   ▼
9. supabase.auth.setSession() ile session oluşturulur
   │
   ▼
10. AsyncStorage'da session kaydedilir
    │
    ▼
11. Kullanıcı /home'a yönlendirilir
    │
    ▼
12. ✅ Giriş başarılı
```

---

## 🔐 Security Best Practices

- ✅ `skipBrowserRedirect: true` - Tarayıcıyı manuel aç
- ✅ `AsyncStorage` - Session'ı güvenli şekilde sakla
- ✅ `processLock` - Concurrent requests'i yönet
- ✅ `autoRefreshToken: true` - Token'ı otomatik yenile
- ✅ Deep link URL'sini validate et
- ✅ Error messages'ı log'la ama kullanıcıya gösterme

---

## 📝 Sonraki Adımlar

- [ ] Apple OAuth ekle (iOS)
- [ ] Facebook OAuth ekle
- [ ] OAuth provider seçimi UI'ı
- [ ] Magic link email template'i özelleştir
- [ ] Rate limiting ekle (brute force protection)
- [ ] Session timeout yönetimi

---

**Son Güncelleme**: 22 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready
