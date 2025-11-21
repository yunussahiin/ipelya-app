# Phase 8.2: EAS Setup & Credentials - Detaylı Rehber

## 📋 Genel Bakış

Push notifications'ın fiziksel cihazda çalışması için:
- **iOS:** Apple Push Notification service (APNs)
- **Android:** Firebase Cloud Messaging (FCM)

credentials'ları EAS'e yüklemeniz gerekir.

---

## 🎯 Sıra

### 1️⃣ Firebase Setup (Android FCM)
### 2️⃣ Apple Developer Setup (iOS APNs)
### 3️⃣ EAS Credentials Upload
### 4️⃣ Development Build Oluşturma
### 5️⃣ Fiziksel Cihazda Test

---

## 1️⃣ Firebase Setup (Android FCM)

### Adım 1.1: Firebase Projesi Oluştur

1. [Firebase Console](https://console.firebase.google.com) açın
2. **"Yeni proje oluştur"** tıklayın
3. Proje adı: `ipelya-mobile` (veya benzeri)
4. Google Analytics'i etkinleştir (opsiyonel)
5. **"Proje oluştur"** tıklayın

### Adım 1.2: Android Uygulaması Ekle

1. Firebase Console'da proje açın
2. **"Android uygulaması ekle"** tıklayın
3. Paket adı: `com.ipelya.mobile` (app.json'daki package ile aynı)
4. Uygulama takma adı: `ipelya-mobile`
5. Debug SHA-1 (opsiyonel, şimdilik boş bırakabilirsiniz)
6. **"Uygulamayı kaydet"** tıklayın

### Adım 1.3: google-services.json İndir

1. Firebase Console'da **"google-services.json"** dosyasını indirin
2. Dosyayı şu konuma kopyalayın:
   ```
   apps/mobile/google-services.json
   ```

### Adım 1.4: FCM Server Key Bul

1. Firebase Console → **Proje Ayarları** (⚙️)
2. **"Cloud Messaging"** sekmesine git
3. **"Server API Key"** kopyala (bu key'i sonra kullanacağız)

---

## 2️⃣ Apple Developer Setup (iOS APNs)

### Adım 2.1: Apple Developer Account

1. [Apple Developer](https://developer.apple.com) hesabınız olmalı
2. Hesabınız **"Team Agent"** veya **"Admin"** rolüne sahip olmalı

### Adım 2.2: App ID Oluştur

1. Apple Developer → **"Certificates, Identifiers & Profiles"**
2. **"Identifiers"** → **"+"** tıklayın
3. **"App IDs"** seçin
4. **"Explicit"** seçin (Wildcard değil)
5. Bundle ID: `com.ipelya.mobile` (app.json'daki bundleIdentifier ile aynı)
6. Capabilities'de **"Push Notifications"** etkinleştir
7. **"Continue"** → **"Register"** tıklayın

### Adım 2.3: Push Notification Certificate Oluştur

1. **"Certificates"** → **"+"** tıklayın
2. **"Apple Push Notification service SSL (Sandbox & Production)"** seçin
3. **"Continue"** tıklayın
4. Önceki adımda oluşturduğunuz App ID'yi seçin
5. **"Continue"** tıklayın
6. **CSR (Certificate Signing Request) Dosyası Oluştur:**
   - Mac'te **"Keychain Access"** açın
   - **"Keychain Access"** → **"Certificate Assistant"** → **"Request a Certificate from a Certificate Authority"**
   - Email: Apple Developer hesabınız
   - Common Name: `ipelya-push-cert`
   - **"Save to disk"** seçin
   - CSR dosyasını kaydedin
7. Apple Developer'a geri dönün, CSR dosyasını upload edin
8. **"Continue"** tıklayın
9. Certificate'i indirin (`.cer` dosyası)

### Adım 2.4: Certificate'i .p8 Formatına Dönüştür

Apple, `.p8` formatında key'i tercih eder. Alternatif olarak:

1. Apple Developer → **"Keys"** → **"+"** tıklayın
2. **"App Store Connect API"** seçin
3. **"Configure"** tıklayın
4. **"Create"** tıklayın
5. Key ID'yi kopyalayın
6. `.p8` dosyasını indirin (sadece bir kez indirebilirsiniz!)
7. Dosyayı güvenli bir yere kaydedin

---

## 3️⃣ EAS Credentials Upload

### Adım 3.1: EAS CLI Login

```bash
npx eas-cli@latest login
```

### Adım 3.2: Android Credentials Setup

```bash
npx eas-cli@latest credentials configure --platform android
```

Sorular:
1. **"What would you like to do?"** → **"Set up a new Android app"**
2. **"Keystore type"** → **"JKS"** (default)
3. **"Keystore password"** → Güçlü bir şifre girin
4. **"Key alias"** → `ipelya-key`
5. **"Key password"** → Keystore password ile aynı

### Adım 3.3: Android FCM Credentials

```bash
npx eas-cli@latest credentials configure --platform android
```

Sorular:
1. **"What would you like to do?"** → **"Set up FCM credentials"**
2. **"google-services.json"** dosyasını seçin (apps/mobile/google-services.json)

Veya manuel olarak:

```bash
npx eas-cli@latest credentials configure --platform android
# "Set up FCM credentials" seçin
# Server API Key'i girin (Firebase Console'dan aldığınız)
```

### Adım 3.4: iOS Credentials Setup

```bash
npx eas-cli@latest credentials configure --platform ios
```

Sorular:
1. **"What would you like to do?"** → **"Set up a new iOS app"**
2. **"Apple Team ID"** → Apple Developer hesabınızdan bulun
3. **"Bundle ID"** → `com.ipelya.mobile`
4. **"Push Notification Certificate"** → `.p8` dosyasını upload edin
5. **"Key ID"** → Apple Developer'dan aldığınız Key ID
6. **"Team ID"** → Apple Developer Team ID

---

## 4️⃣ Development Build Oluşturma

### Adım 4.1: iOS Development Build

```bash
npx eas-cli@latest build:dev --platform ios
```

Bu komut:
- Development build oluşturur
- Simulator'a yüklenebilir
- Push notifications'ı test edebilirsiniz

Çıktı:
```
✅ Build başarılı!
📱 iOS Simulator için: eas-update-link
🔗 Cihaza yüklemek için: eas-build-link
```

### Adım 4.2: Android Development Build

```bash
npx eas-cli@latest build:dev --platform android
```

Çıktı:
```
✅ Build başarılı!
📱 APK indirme linki: eas-build-link
```

### Adım 4.3: Fiziksel Cihaza Yükleme

**iOS:**
```bash
# Build tamamlandıktan sonra
eas build:dev --platform ios --wait
# Cihaza yüklemek için Xcode veya Apple Configurator kullanın
```

**Android:**
```bash
# APK'yı indirin ve cihaza yükleyin
adb install -r path/to/app.apk
```

---

## 5️⃣ Fiziksel Cihazda Test

### Adım 5.1: Cihazda Uygulamayı Çalıştır

1. Uygulamayı açın
2. **"Bildirim İzni"** istemini kabul edin
3. Device token'ı database'de kontrol edin:

```sql
SELECT * FROM device_tokens 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

### Adım 5.2: Test Bildirimi Gönder

**Edge Function'dan test:**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "user-id",
    "type": "test",
    "title": "Test Bildirimi",
    "body": "Bu bir test bildirimidir"
  }'
```

### Adım 5.3: Bildirim Kontrol Listesi

- [ ] Bildirim izni istendi mi?
- [ ] Device token kaydedildi mi?
- [ ] Ön plan bildirimi gösterildi mi?
- [ ] Arka plan bildirimi alındı mı?
- [ ] Bildirime tıklandığında deep link çalıştı mı?
- [ ] Bildirim database'de kaydedildi mi?

---

## 🔧 Sorun Giderme

### Problem: "FCM credentials not found"

**Çözüm:**
```bash
npx eas-cli@latest credentials configure --platform android
# FCM credentials'ı yeniden setup et
```

### Problem: "APNs certificate expired"

**Çözüm:**
1. Apple Developer'da yeni certificate oluştur
2. EAS'e yeniden upload et:
```bash
npx eas-cli@latest credentials configure --platform ios
```

### Problem: "Device token not registered"

**Çözüm:**
1. Bildirim izni verildi mi kontrol et
2. Logs'u kontrol et:
```bash
npx eas-cli@latest logs --platform ios
```

### Problem: "Bildirim alınmıyor"

**Kontrol Listesi:**
1. Device token database'de var mı?
2. Notification preferences push_enabled = true mi?
3. Quiet hours'lar geçti mi?
4. Edge Function çalışıyor mu?
5. Firebase/APNs credentials doğru mu?

---

## 📊 Credentials Durumu Kontrol

```bash
# Tüm credentials'ı listele
npx eas-cli@latest credentials list

# Spesifik platform
npx eas-cli@latest credentials list --platform ios
npx eas-cli@latest credentials list --platform android
```

---

## 🔐 Güvenlik Notları

1. **Server API Key:** Asla public'e expose etme
2. **APNs Certificate:** `.p8` dosyasını güvenli tut
3. **Keystore Password:** Güçlü ve karmaşık olmalı
4. **EAS Secrets:** Hassas bilgileri `.env.local`'de sakla

---

## 📝 Gerekli Dosyalar

```
apps/mobile/
├── app.json (bundleIdentifier, package name)
├── google-services.json (Android FCM)
└── .env.local (EXPO_ACCESS_TOKEN, vb.)
```

---

## ✅ Kontrol Listesi

- [ ] Firebase projesi oluşturuldu
- [ ] google-services.json indirildi
- [ ] Apple Developer App ID oluşturuldu
- [ ] APNs certificate oluşturuldu
- [ ] EAS credentials upload edildi
- [ ] iOS development build oluşturuldu
- [ ] Android development build oluşturuldu
- [ ] Fiziksel cihazda test edildi
- [ ] Device token kaydedildi
- [ ] Test bildirimi gönderildi

---

**Sonraki Adım:** Phase 8.3 - Unit Tests & Integration Tests
