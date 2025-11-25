# Apple Sign-In - Detaylı Implementasyon 🍎

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mevcut Implementasyon](#mevcut-implementasyon)
3. [Kütüphane Karşılaştırması](#kütüphane-karşılaştırması)
4. [Teknik Detaylar](#teknik-detaylar)
5. [Supabase Entegrasyonu](#supabase-entegrasyonu)
6. [UI Implementasyonu](#ui-implementasyonu)
7. [Konfigürasyon](#konfigürasyon)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Genel Bakış

İpelya, Apple Sign-In için **`@invertase/react-native-apple-authentication`** kütüphanesini kullanır. Bu kütüphane, Expo'nun kendi `expo-apple-authentication` paketine göre daha fazla özellik ve Android desteği sunar.

### Neden Apple Sign-In?

| Sebep                     | Açıklama                                                    |
| ------------------------- | ----------------------------------------------------------- |
| **App Store Zorunluluğu** | Sosyal login sunan uygulamalar Apple Sign-In sunmak zorunda |
| **Kullanıcı Güveni**      | Apple'ın gizlilik odaklı yaklaşımı                          |
| **Hızlı Giriş**           | Face ID/Touch ID ile tek tıkla giriş                        |
| **Email Gizleme**         | Kullanıcılar gerçek email'lerini gizleyebilir               |

### Platform Desteği

| Platform    | Durum    | Açıklama                                  |
| ----------- | -------- | ----------------------------------------- |
| **iOS**     | ✅ Aktif  | Native Apple Sign-In                      |
| **Android** | ⚠️ Mümkün | Web-based flow (henüz implement edilmedi) |

---

## Mevcut Implementasyon

### Kullanılan Kütüphane

```json
// package.json
{
  "dependencies": {
    "@invertase/react-native-apple-authentication": "^2.5.0"
  }
}
```

### Service Layer

```typescript
// apps/mobile/src/services/oauth.service.ts

import { Platform } from "react-native";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { supabase } from "@/lib/supabaseClient";

export const signInWithApple = async () => {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In sadece iOS'ta kullanılabilir");
  }

  try {
    console.log("🍎 Apple Sign-In başlatılıyor...");

    // 1. Apple Sign-In request'i yap
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    // 2. Credential state'i kontrol et
    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user
    );

    // 3. Authorized ise Supabase'e gönder
    if (
      credentialState === appleAuth.State.AUTHORIZED &&
      appleAuthRequestResponse.identityToken &&
      appleAuthRequestResponse.authorizationCode
    ) {
      console.log("✅ Apple Sign-In başarılı");

      // 4. Supabase'e Apple token'ını gönder
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: appleAuthRequestResponse.identityToken,
        nonce: appleAuthRequestResponse.nonce,
        access_token: appleAuthRequestResponse.authorizationCode,
      });

      if (error) throw error;

      console.log("✅ Apple OAuth session oluşturuldu");
      return data.session;
    } else {
      throw new Error("Apple Sign-In başarısız oldu");
    }
  } catch (error) {
    console.error("❌ Apple Sign-In hatası:", error);
    throw error;
  }
};
```

### Hook Layer

```typescript
// apps/mobile/src/hooks/useAuthActions.ts

const signInWithAppleOAuth = async () => {
  setLoading(true);
  setError(null);
  try {
    console.log("🍎 Apple Sign-In başlatılıyor...");
    const session = await signInWithApple();
    
    if (session?.access_token && session.user) {
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
      
      console.log("✅ Apple Sign-In başarılı");
      router.replace("/home");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Apple Sign-In hatası";
    console.error("❌ Apple Sign-In hatası:", errorMessage);
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

---

## Kütüphane Karşılaştırması

### `@invertase/react-native-apple-authentication` vs `expo-apple-authentication`

| Özellik                   | @invertase          | expo-apple-authentication   |
| ------------------------- | ------------------- | --------------------------- |
| **iOS Desteği**           | ✅                   | ✅                           |
| **Android Desteği**       | ✅ (Web-based)       | ❌                           |
| **Native Button**         | ✅ AppleButton       | ✅ AppleAuthenticationButton |
| **Credential State**      | ✅                   | ✅                           |
| **Revocation Listener**   | ✅                   | ✅                           |
| **Supabase Entegrasyonu** | ✅ signInWithIdToken | ✅ signInWithIdToken         |
| **Expo Managed Workflow** | ✅                   | ✅                           |
| **Config Plugin**         | ❌ (Manual setup)    | ✅ (Otomatik)                |

### Neden @invertase Tercih Edildi?

1. **Android Desteği** - Gelecekte Android'de de Apple Sign-In sunulabilir
2. **Daha Fazla Kontrol** - Credential state, revocation listener
3. **Aktif Bakım** - Düzenli güncellemeler
4. **Firebase Uyumluluğu** - Gelecekte Firebase kullanılırsa hazır

---

## Teknik Detaylar

### Apple Authentication Response

```typescript
interface AppleAuthRequestResponse {
  // Benzersiz kullanıcı ID'si (her app için farklı)
  user: string;
  
  // JWT formatında identity token
  identityToken: string | null;
  
  // Server-side doğrulama için authorization code
  authorizationCode: string | null;
  
  // Kullanıcı adı (sadece ilk girişte)
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null;
  
  // Kullanıcı email'i (sadece ilk girişte)
  email: string | null;
  
  // Gerçek kullanıcı mı? (bot detection)
  realUserStatus: number;
  
  // Nonce (replay attack önleme)
  nonce: string;
  
  // State (CSRF önleme)
  state: string | null;
}
```

### Credential States

```typescript
enum AppleAuthCredentialState {
  REVOKED = 0,      // Kullanıcı izni iptal etti
  AUTHORIZED = 1,   // Kullanıcı yetkili
  NOT_FOUND = 2,    // Kullanıcı bulunamadı
  TRANSFERRED = 3,  // Kullanıcı başka team'e transfer edildi
}
```

### Requested Scopes

```typescript
enum AppleAuthScope {
  EMAIL = 0,      // Kullanıcı email'i
  FULL_NAME = 1,  // Kullanıcı adı soyadı
}
```

---

## Supabase Entegrasyonu

### signInWithIdToken Kullanımı

```typescript
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: "apple",
  token: appleAuthRequestResponse.identityToken,  // JWT token
  nonce: appleAuthRequestResponse.nonce,          // Nonce (opsiyonel)
  access_token: appleAuthRequestResponse.authorizationCode, // Auth code
});
```

### Supabase Dashboard Konfigürasyonu

1. **Supabase Dashboard** → **Authentication** → **Providers**
2. **Apple** provider'ı etkinleştir
3. Gerekli bilgileri gir:
   - **Service ID** (Apple Developer Console'dan)
   - **Team ID** (Apple Developer Console'dan)
   - **Key ID** (Apple Developer Console'dan)
   - **Private Key** (.p8 dosyası içeriği)

### Apple Developer Console Konfigürasyonu

1. **Identifiers** → App ID oluştur/seç
2. **Sign in with Apple** capability'sini etkinleştir
3. **Keys** → Sign in with Apple key oluştur
4. Key'i indir (.p8 dosyası)

---

## UI Implementasyonu

### Native AppleButton (Mevcut Implementasyon)

```typescript
// apps/mobile/app/(auth)/login.tsx

import { AppleButton } from "@invertase/react-native-apple-authentication";

{/* Apple Sign-In Button (iOS only) - Native Button */}
{Platform.OS === "ios" && (
  <View style={styles.appleButtonContainer}>
    <AppleButton
      buttonStyle={AppleButton.Style.BLACK}
      buttonType={AppleButton.Type.SIGN_IN}
      style={styles.appleButton}
      onPress={handleAppleSignIn}
    />
  </View>
)}

// Styles
appleButtonContainer: {
  width: "100%",
  height: 50,
  marginBottom: 12
},
appleButton: {
  width: "100%",
  height: 50
}
```

> **Not:** Native AppleButton, Apple'ın Human Interface Guidelines'a uygun resmi butondur. App Store onayı için önerilir.

### Alternatif: Expo Native Button

```typescript
// expo-apple-authentication'ın native button'u
import * as AppleAuthentication from 'expo-apple-authentication';

<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={8}
  style={{ width: 200, height: 44 }}
  onPress={handleAppleSignIn}
/>
```

### Button Style Karşılaştırması

| Style             | Görünüm                       | Kullanım        |
| ----------------- | ----------------------------- | --------------- |
| **BLACK**         | Siyah arka plan, beyaz yazı   | Açık tema       |
| **WHITE**         | Beyaz arka plan, siyah yazı   | Koyu tema       |
| **WHITE_OUTLINE** | Beyaz arka plan, siyah border | Minimal tasarım |

---

## Konfigürasyon

### app.config.ts

```typescript
// apps/mobile/app.config.ts

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ios: {
    bundleIdentifier: "com.ipelya.mobile",
    usesAppleSignIn: true, // ✅ Apple Sign-In capability etkinleştirildi
    // ...
  },
});
```

> **Not:** `usesAppleSignIn: true` ayarı, EAS Build sırasında otomatik olarak Xcode'da "Sign in with Apple" capability'sini ekler.

### Xcode Capability (Development Build)

1. Xcode'da projeyi aç
2. **Signing & Capabilities** sekmesine git
3. **+ Capability** → **Sign in with Apple** ekle

### EAS Build Konfigürasyonu

```json
// eas.json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

---

## Troubleshooting

### Sorun: "Apple Sign-In başarısız oldu"

**Olası Sebepler:**

1. **Credential state AUTHORIZED değil**
```typescript
// Kontrol et
const credentialState = await appleAuth.getCredentialStateForUser(user);
console.log('Credential state:', credentialState);
// 0: REVOKED, 1: AUTHORIZED, 2: NOT_FOUND
```

2. **identityToken veya authorizationCode null**
```typescript
if (!appleAuthRequestResponse.identityToken) {
  console.error('Identity token alınamadı');
}
```

3. **Supabase Apple provider konfigürasyonu eksik**
- Dashboard'da Apple provider'ı kontrol et
- Service ID, Team ID, Key ID, Private Key doğru mu?

### Sorun: "Kullanıcı email/isim alamıyorum"

**Açıklama:** Apple, kullanıcı bilgilerini sadece **ilk giriş**te verir. Sonraki girişlerde bu bilgiler null gelir.

**Çözüm:**
```typescript
// İlk girişte bilgileri kaydet
if (appleAuthRequestResponse.fullName?.givenName) {
  await supabase
    .from('profiles')
    .update({
      display_name: `${appleAuthRequestResponse.fullName.givenName} ${appleAuthRequestResponse.fullName.familyName}`
    })
    .eq('user_id', session.user.id);
}
```

### Sorun: "Simulator'da çalışmıyor"

**Açıklama:** Apple Sign-In simulator'da çalışır ancak gerçek Apple ID gerektirir.

**Çözüm:**
1. Simulator'da Apple ID ile giriş yap (Settings → Sign in)
2. Veya fiziksel cihazda test et

### Sorun: "Android'de çalışmıyor"

**Açıklama:** Mevcut implementasyon sadece iOS'u destekler.

**Çözüm (Gelecek):**
```typescript
// Android için web-based flow
if (Platform.OS === 'android') {
  appleAuthAndroid.configure({
    clientId: 'com.ipelya.mobile.android',
    redirectUri: 'https://ipelya.com/auth/callback',
    responseType: appleAuthAndroid.ResponseType.ALL,
    scope: appleAuthAndroid.Scope.ALL,
    nonce: uuid(),
    state: uuid(),
  });
  
  const response = await appleAuthAndroid.signIn();
  // response.id_token'ı Supabase'e gönder
}
```

---

## Best Practices

### 1. Credential State Listener

```typescript
// App başlangıcında credential state değişikliklerini dinle
useEffect(() => {
  if (Platform.OS !== 'ios') return;
  
  const unsubscribe = appleAuth.onCredentialRevoked(async () => {
    console.warn('Apple credential revoked!');
    // Kullanıcıyı logout yap
    await signOut();
  });
  
  return () => unsubscribe();
}, []);
```

### 2. İlk Giriş Bilgilerini Kaydet

```typescript
// İlk girişte email ve isim kaydet
if (appleAuthRequestResponse.email) {
  // Bu bilgi sadece ilk girişte gelir!
  await saveUserInfo({
    email: appleAuthRequestResponse.email,
    fullName: appleAuthRequestResponse.fullName,
  });
}
```

### 3. Error Handling

```typescript
try {
  const session = await signInWithApple();
} catch (error) {
  if (error.code === 'ERR_REQUEST_CANCELED') {
    // Kullanıcı iptal etti - sessizce geç
    return;
  }
  // Diğer hatalar için kullanıcıya bilgi ver
  setError('Apple Sign-In başarısız oldu');
}
```

### 4. Loading State

```typescript
// Apple Sign-In sırasında loading göster
const [isAppleLoading, setAppleLoading] = useState(false);

const handleAppleSignIn = async () => {
  setAppleLoading(true);
  try {
    await signInWithAppleOAuth();
  } finally {
    setAppleLoading(false);
  }
};
```

---

## Özet

| Konu                  | Durum        | Açıklama                   |
| --------------------- | ------------ | -------------------------- |
| iOS Implementasyonu   | ✅ Tamamlandı | @invertase kütüphanesi     |
| Supabase Entegrasyonu | ✅ Tamamlandı | signInWithIdToken          |
| Custom Button         | ✅ Tamamlandı | Pressable component        |
| Native Button         | 📋 Opsiyonel  | AppleButton kullanılabilir |
| Android Desteği       | 📋 Backlog    | Web-based flow planlandı   |
| Credential Listener   | 📋 Backlog    | Revocation handling        |

---

**İlgili Dosyalar:**
- `apps/mobile/src/services/oauth.service.ts` - Apple Sign-In implementasyonu
- `apps/mobile/src/hooks/useAuthActions.ts` - Auth hook
- `apps/mobile/app/(auth)/login.tsx` - Login UI
- `apps/mobile/package.json` - Dependencies

**Kaynaklar:**
- [Expo Apple Authentication Docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [@invertase/react-native-apple-authentication](https://github.com/invertase/react-native-apple-authentication)
- [Supabase Apple Auth](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Sign-In Guidelines](https://developer.apple.com/sign-in-with-apple/get-started/)
