---
title: OAuth & Deep Linking - Implementasyon Özeti
description: Yapılan değişikliklerin özeti ve dosya yapısı (Supabase docs'a referans)
---

# 📋 OAuth & Deep Linking - Implementasyon Özeti

**Tarih**: 22 Kasım 2025  
**Sprint**: Sprint 1 - Auth Screens  
**Durum**: ✅ Tamamlandı

> 📚 **Supabase Docs**: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
> 
> Bu dokümantasyon, Supabase resmi docs'unda mevcut olan örnekleri referans alır ve proje spesifik implementasyonları açıklar.

---

## 🎯 Yapılanlar

### 1. **Supabase Client Güncellemesi**
- ✅ AppState listener eklendi (ön/arka plan yönetimi)
- ✅ Token auto-refresh setup
- ✅ AsyncStorage integration
- ✅ processLock configuration

**Dosya**: `src/lib/supabaseClient.ts`

```typescript
// AppState listener - Uygulamanın ön/arka plana gelmesini dinle
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
```

---

### 2. **OAuth Service Oluşturuldu**
- ✅ Google OAuth flow
- ✅ Magic Link flow
- ✅ Deep linking URL parser
- ✅ Session creation from URL

**Dosya**: `src/services/oauth.service.ts`

**Fonksiyonlar:**
- `getRedirectUrl()` - Deep link URL'i oluştur
- `signInWithGoogle()` - Google OAuth flow
- `signInWithMagicLink()` - Magic link gönder
- `createSessionFromUrl()` - URL'den session oluştur

---

### 3. **useAuthActions Hook Güncellemesi**
- ✅ `signInWithGoogleOAuth()` eklendi
- ✅ `signInWithMagicLinkEmail()` eklendi
- ✅ Device info tracking
- ✅ Error handling

**Dosya**: `src/hooks/useAuthActions.ts`

```typescript
// Hook'tan kullanım
const { signInWithGoogleOAuth, signInWithMagicLinkEmail } = useAuthActions();

// Google OAuth
await signInWithGoogleOAuth();

// Magic Link
await signInWithMagicLinkEmail("user@example.com");
```

---

### 4. **Deep Linking Setup**
- ✅ App layout'a deep link listener eklendi
- ✅ OAuth callback handling
- ✅ Session creation from deep link

**Dosya**: `app/_layout.tsx`

```typescript
// Deep linking for OAuth callbacks
useEffect(() => {
  const url = Linking.useURL();
  if (url != null) {
    console.log("🔗 Deep link alındı:", url);
    createSessionFromUrl(url).catch((error) => {
      console.error("❌ Deep link session oluşturma hatası:", error);
    });
  }
}, []);
```

---

### 5. **Paketler Eklendi**
- ✅ `expo-auth-session` - OAuth flow
- ✅ `expo-web-browser` - Tarayıcı açma
- ✅ `expo-linking` - Deep linking

```bash
npx expo install expo-auth-session expo-web-browser expo-linking
```

---

### 6. **Dokumentasyon Oluşturuldu**
- ✅ `OAUTH_DEEP_LINKING.md` - Detaylı rehber
- ✅ `.env.example` - Environment variables template

---

## 📁 Dosya Yapısı

```
apps/mobile/
├── src/
│   ├── lib/
│   │   └── supabaseClient.ts          ✅ UPDATED - AppState listener
│   ├── services/
│   │   └── oauth.service.ts           ✅ NEW - OAuth & Magic Link
│   └── hooks/
│       └── useAuthActions.ts          ✅ UPDATED - OAuth methods
├── app/
│   └── _layout.tsx                    ✅ UPDATED - Deep linking
├── .env.example                       ✅ NEW - Env template
└── docs/
    └── mobile/
        ├── OAUTH_DEEP_LINKING.md      ✅ NEW - Detailed guide
        └── OAUTH_IMPLEMENTATION_SUMMARY.md  ✅ NEW - This file
```

---

## 🔄 OAuth Akışı (Özet)

### Google OAuth

```
1. Kullanıcı "Google ile Giriş Yap" butonuna tıklar
   ↓
2. signInWithGoogleOAuth() çağrılır
   ↓
3. Supabase'den OAuth URL alınır
   ↓
4. WebBrowser.openAuthSessionAsync() ile tarayıcı açılır
   ↓
5. Kullanıcı Google hesabı ile giriş yapar
   ↓
6. Google, deep link URL'sine yönlendirir:
   exp://192.168.1.140:8081/oauth-callback?access_token=...
   ↓
7. Uygulama deep link'i yakalar
   ↓
8. createSessionFromUrl() URL'den token'ları çıkarır
   ↓
9. supabase.auth.setSession() ile session oluşturulur
   ↓
10. AsyncStorage'da session kaydedilir
    ↓
11. Device info güncellenir
    ↓
12. Kullanıcı /home'a yönlendirilir
    ↓
13. ✅ Giriş başarılı
```

### Magic Link

```
1. Kullanıcı email girer ve "Magic Link Gönder" butonuna tıklar
   ↓
2. signInWithMagicLinkEmail(email) çağrılır
   ↓
3. supabase.auth.signInWithOtp() çağrılır
   ↓
4. Supabase, email'e magic link gönderir:
   https://your-project.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=exp://...
   ↓
5. Kullanıcı email'de linke tıklar
   ↓
6. Deep link callback alınır
   ↓
7. createSessionFromUrl() session oluşturur
   ↓
8. ✅ Giriş başarılı
```

---

## 🔧 Setup Adımları

### 1. Paketleri Kur
```bash
cd apps/mobile
npx expo install expo-auth-session expo-web-browser expo-linking
```

### 2. Environment Variables Ayarla
```bash
# .env dosyasını oluştur (.env.example'dan kopyala)
cp .env.example .env

# Değerleri doldur:
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Google OAuth Ayarla
1. Google Cloud Console'da proje oluştur
2. OAuth 2.0 credentials oluştur
3. Redirect URI ekle: `exp://192.168.1.140:8081/oauth-callback`
4. Client ID'yi `.env`'ye ekle

### 4. app.json'da Scheme Ekle
```json
{
  "expo": {
    "scheme": "exp",
    "plugins": [
      [
        "expo-auth-session",
        {
          "authorizationEndpoint": "https://accounts.google.com/o/oauth2/v2/auth"
        }
      ]
    ]
  }
}
```

### 5. Uygulamayı Çalıştır
```bash
npx expo start
# iOS simulator'da aç
```

---

## 🧪 Testing

### Google OAuth Test
```bash
# 1. Uygulamayı çalıştır
npx expo start

# 2. iOS simulator'da aç
# 3. Login screen'de "Google ile Giriş Yap" butonuna tıkla
# 4. Tarayıcıda Google login yap
# 5. Uygulamaya geri dön
# 6. /home'a yönlendirildiğini kontrol et
```

### Magic Link Test
```bash
# 1. Login screen'de email gir
# 2. "Magic Link Gönder" butonuna tıkla
# 3. Email'de linke tıkla
# 4. Uygulamaya geri dön
# 5. /home'a yönlendirildiğini kontrol et
```

### Deep Linking Test
```bash
# Terminal'de:
npx uri-scheme open "exp://192.168.1.140:8081/oauth-callback?access_token=test&refresh_token=test"

# Uygulamada deep link handler'ın çalıştığını kontrol et
```

---

## 📊 Kod Örnekleri

### Login Screen'de Kullanım

```typescript
import { useAuthActions } from "@/hooks/useAuthActions";

export default function LoginScreen() {
  const { 
    signIn, 
    signInWithGoogleOAuth,
    signInWithMagicLinkEmail,
    isLoading, 
    error 
  } = useAuthActions();

  return (
    <AuthScreen>
      {/* Email/Password Form */}
      <Pressable onPress={() => signIn(email, password)}>
        <Text>Giriş Yap</Text>
      </Pressable>

      {/* Google OAuth Button */}
      <Pressable 
        onPress={signInWithGoogleOAuth}
        disabled={isLoading}
      >
        <Text>Google ile Giriş Yap</Text>
      </Pressable>

      {/* Magic Link Button */}
      <Pressable 
        onPress={() => signInWithMagicLinkEmail(email)}
        disabled={isLoading}
      >
        <Text>Magic Link Gönder</Text>
      </Pressable>

      {/* Error Display */}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </AuthScreen>
  );
}
```

---

## 🔐 Security Notes

- ✅ Token'lar AsyncStorage'da güvenli şekilde saklanıyor
- ✅ `skipBrowserRedirect: true` - Tarayıcıyı manuel kontrol
- ✅ `processLock` - Concurrent requests'i yönet
- ✅ `autoRefreshToken: true` - Token'ı otomatik yenile
- ✅ Deep link URL'si validate ediliyor
- ✅ Error messages console'da log'lanıyor

---

## 📝 Sonraki Adımlar

### Sprint 1 Devamı
- [ ] Onboarding screen (5-step flow) geliştir
- [ ] Register → Onboarding flow'u bağla
- [ ] Login screen styling'i düzelt

### Sprint 2+
- [ ] Apple OAuth ekle (iOS)
- [ ] Facebook OAuth ekle
- [ ] OAuth provider seçimi UI'ı
- [ ] Rate limiting (brute force protection)
- [ ] Session timeout yönetimi

---

## 📚 Referanslar

- **Detaylı Rehber**: `docs/mobile/OAUTH_DEEP_LINKING.md`
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Expo Auth Session**: https://docs.expo.dev/versions/latest/sdk/auth-session/
- **Deep Linking**: https://docs.expo.dev/guides/linking/

---

## ✅ Checklist

- [x] Supabase client AppState listener
- [x] OAuth service oluşturuldu
- [x] useAuthActions hook güncellemesi
- [x] Deep linking setup
- [x] Paketler eklendi
- [x] Dokumentasyon yazıldı
- [x] .env.example oluşturuldu
- [ ] Google OAuth credentials setup (user action)
- [ ] Login screen'de OAuth buttons (next step)
- [ ] Onboarding screen (next step)

---

**Son Güncelleme**: 22 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Tamamlandı
