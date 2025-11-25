# Authentication Sistemi - Genel Bakış 🔐

## İçindekiler

1. [Desteklenen Yöntemler](#desteklenen-yöntemler)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Dosya Yapısı](#dosya-yapısı)
4. [Akış Diyagramı](#akış-diyagramı)
5. [Implementasyon Durumu](#implementasyon-durumu)

---

## Desteklenen Yöntemler

İpelya mobil uygulaması aşağıdaki authentication yöntemlerini destekler:

| Yöntem             | Platform     | Durum   | Açıklama                    |
| ------------------ | ------------ | ------- | --------------------------- |
| **Email/Password** | iOS, Android | ✅ Aktif | Klasik email + şifre girişi |
| **Google OAuth**   | iOS, Android | ✅ Aktif | Google hesabı ile giriş     |
| **Apple Sign-In**  | iOS          | ✅ Aktif | Apple ID ile giriş          |
| **Magic Link**     | iOS, Android | ✅ Aktif | Email ile tek tıkla giriş   |

---

## Teknoloji Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React Native/Expo)                               │
│  ─────────────────────────────                              │
│  • @invertase/react-native-apple-authentication (Apple)     │
│  • expo-auth-session (OAuth flow)                           │
│  • expo-web-browser (Browser redirect)                      │
│  • expo-secure-store (Token storage)                        │
│                                                              │
│  Backend (Supabase)                                         │
│  ─────────────────────────────                              │
│  • Supabase Auth (Identity management)                      │
│  • OAuth providers (Google, Apple)                          │
│  • JWT tokens (Session management)                          │
│  • RLS policies (Row-level security)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Dosya Yapısı

```
apps/mobile/src/
├── hooks/
│   └── useAuthActions.ts        # Auth actions hook
├── services/
│   ├── oauth.service.ts         # OAuth implementations
│   └── secure-store.service.ts  # Token storage
├── store/
│   └── auth.store.ts            # Zustand auth state
└── lib/
    └── supabaseClient.ts        # Supabase client

apps/mobile/app/(auth)/
├── login.tsx                    # Login screen
├── register.tsx                 # Register screen
└── onboarding/                  # Onboarding flow
```

---

## Akış Diyagramı

### Email/Password Flow

```
1. Kullanıcı email + şifre girer
         │
         ▼
2. supabase.auth.signInWithPassword()
         │
         ▼
3. Session token alınır
         │
         ▼
4. Token SecureStore'a kaydedilir
         │
         ▼
5. Device info güncellenir
         │
         ▼
6. Onboarding durumu kontrol edilir
         │
         ├─ Incomplete → Onboarding'e yönlendir
         └─ Complete → Home'a yönlendir
```

### OAuth Flow (Google/Apple)

```
1. Kullanıcı OAuth butonuna tıklar
         │
         ▼
2. Provider-specific flow başlar
   ├─ Google: WebBrowser.openAuthSessionAsync()
   └─ Apple: appleAuth.performRequest()
         │
         ▼
3. Provider'dan token alınır
         │
         ▼
4. Supabase'e token gönderilir
   ├─ Google: supabase.auth.setSession()
   └─ Apple: supabase.auth.signInWithIdToken()
         │
         ▼
5. Session oluşturulur
         │
         ▼
6. Token SecureStore'a kaydedilir
         │
         ▼
7. Home'a yönlendir
```

---

## Implementasyon Durumu

### ✅ Tamamlanan

| Özellik                 | Dosya                     | Açıklama                 |
| ----------------------- | ------------------------- | ------------------------ |
| Email/Password Login    | `useAuthActions.ts`       | `signIn()` fonksiyonu    |
| Email/Password Register | `useAuthActions.ts`       | `signUp()` fonksiyonu    |
| Google OAuth            | `oauth.service.ts`        | `signInWithGoogle()`     |
| Apple Sign-In           | `oauth.service.ts`        | `signInWithApple()`      |
| Magic Link              | `oauth.service.ts`        | `signInWithMagicLink()`  |
| Token Storage           | `secure-store.service.ts` | SecureStore kullanımı    |
| Device Info Tracking    | `useAuthActions.ts`       | Login sonrası güncelleme |
| Onboarding Integration  | `useAuthActions.ts`       | Step-based routing       |

### ⏳ Planlandı

| Özellik             | Öncelik | Açıklama                         |
| ------------------- | ------- | -------------------------------- |
| Biometric Login     | Orta    | Face ID/Touch ID ile hızlı giriş |
| Session Refresh     | Düşük   | Token yenileme mekanizması       |
| Multi-device Logout | Düşük   | Tüm cihazlardan çıkış            |

---

## Dökümanlar

- **[APPLE-SIGN-IN.md](./APPLE-SIGN-IN.md)** - Apple Sign-In detaylı implementasyon
- **[GOOGLE-OAUTH.md](./GOOGLE-OAUTH.md)** - Google OAuth detaylı implementasyon (planlandı)
- **[MAGIC-LINK.md](./MAGIC-LINK.md)** - Magic Link detaylı implementasyon (planlandı)

---

## Güvenlik

### Token Storage

```typescript
// SecureStore kullanımı (iOS Keychain, Android Keystore)
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('session_token', token);
const token = await SecureStore.getItemAsync('session_token');
```

### RLS Policies

- Kullanıcılar sadece kendi verilerine erişebilir
- Auth token her request'te doğrulanır
- Session timeout: 7 gün (Supabase default)

---

**Son Güncelleme:** 2025-11-25
