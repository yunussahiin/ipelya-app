# EAS Update Kurulum Rehberi

Bu döküman, İPELYA mobil uygulamasında `expo-updates` kütüphanesinin nasıl kurulacağını ve yapılandırılacağını açıklar.

## Genel Bakış

EAS Update, uygulamanızın JavaScript kodunu App Store veya Play Store üzerinden yeni bir sürüm yayınlamadan güncellemenizi sağlar. Bu özellik "Over-The-Air (OTA)" güncellemeler olarak bilinir.

### Ne Zaman Kullanılır?
- **Uygun:** JavaScript, TypeScript, stil değişiklikleri, görsel asset güncellemeleri
- **Uygun Değil:** Native kod değişiklikleri, yeni native modül eklemeleri

---

## Mevcut Durum

İPELYA projesinde `expo-updates` **zaten yüklü**:

```json
// apps/mobile/package.json
"expo-updates": "~29.0.13"
```

Ancak konfigürasyon eksik. Aşağıdaki adımları tamamlamamız gerekiyor.

---

## Adım 1: EAS CLI Kurulumu

EAS CLI'yi global olarak kurun (eğer yoksa):

```bash
npm install -g eas-cli
```

EAS hesabınıza giriş yapın:

```bash
eas login
```

---

## Adım 2: Proje Konfigürasyonu

### 2.1 EAS Update'i Yapılandır

Mobile klasöründe aşağıdaki komutu çalıştırın:

```bash
cd apps/mobile
eas update:configure
```

Bu komut otomatik olarak:
- `app.json`'a `updates.url` ve `runtimeVersion` ekler
- `eas.json`'a `channel` property'lerini ekler (zaten mevcut)

### 2.2 app.json Güncellemesi

`apps/mobile/app.json` dosyasına aşağıdaki konfigürasyonları ekleyin:

```json
{
  "expo": {
    "name": "ipelya-app",
    "slug": "ipelya-app",
    "version": "1.0.1",
    
    // ... mevcut ayarlar ...
    
    // EAS Update konfigürasyonu - EKLENECEK
    "updates": {
      "enabled": true,
      "url": "https://u.expo.dev/ef2464e9-74a9-4b09-9ff6-a936e9cdc65a",
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_LOAD"
    },
    
    // Runtime version - EKLENECEK
    "runtimeVersion": {
      "policy": "appVersion"
    },
    
    // ... diğer ayarlar ...
  }
}
```

### 2.3 Konfigürasyon Seçenekleri

| Özellik                          | Değer                            | Açıklama                              |
| -------------------------------- | -------------------------------- | ------------------------------------- |
| `updates.enabled`                | `true`                           | Updates özelliğini aktifleştirir      |
| `updates.url`                    | `https://u.expo.dev/{projectId}` | EAS Update sunucu URL'i               |
| `updates.fallbackToCacheTimeout` | `0`                              | Güncelleme kontrolü için timeout (ms) |
| `updates.checkAutomatically`     | `ON_LOAD`                        | Otomatik kontrol stratejisi           |
| `runtimeVersion.policy`          | `appVersion`                     | Runtime version stratejisi            |

### 2.4 Runtime Version Politikaları

| Politika        | Açıklama                                | Ne Zaman Kullanılır                         |
| --------------- | --------------------------------------- | ------------------------------------------- |
| `appVersion`    | `version` alanını kullanır (örn: 1.0.1) | App Store/Play Store sürümleri için         |
| `nativeVersion` | `version(buildNumber)` formatı          | Her build farklı runtime istediğinde        |
| `fingerprint`   | Otomatik hash hesaplaması               | Native kod değişikliklerini otomatik algıla |
| `sdkVersion`    | Expo SDK versiyonu                      | Managed workflow için                       |

**Önerimiz:** İPELYA için `appVersion` politikasını kullanın çünkü:
- Her App Store sürümünde `version` zaten güncelleniyor
- Basit ve anlaşılır
- Güncelleme uyumluluğunu kontrol etmek kolay

---

## Adım 3: eas.json Doğrulama

`apps/mobile/eas.json` dosyanızda channel'ların doğru ayarlandığını kontrol edin:

```json
{
  "build": {
    "development": {
      "channel": "development"
    },
    "preview": {
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

✅ Bu ayarlar zaten mevcut.

---

## Adım 4: Native Dosyaları Kontrol Et

### iOS (ios/ipelya/Supporting/Expo.plist)

`eas update:configure` komutu çalıştırıldığında otomatik eklenir:

```xml
<key>EXUpdatesURL</key>
<string>https://u.expo.dev/ef2464e9-74a9-4b09-9ff6-a936e9cdc65a</string>
<key>EXUpdatesRuntimeVersion</key>
<string>1.0.1</string>
<key>EXUpdatesRequestHeaders</key>
<dict>
  <key>expo-channel-name</key>
  <string>production</string>
</dict>
```

### Android (android/app/src/main/AndroidManifest.xml)

```xml
<meta-data 
  android:name="expo.modules.updates.EXPO_UPDATE_URL" 
  android:value="https://u.expo.dev/ef2464e9-74a9-4b09-9ff6-a936e9cdc65a"/>
<meta-data 
  android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" 
  android:value="@string/expo_runtime_version"/>
```

> **Not:** CNG (Continuous Native Generation) kullanıyorsanız bu dosyalar `npx expo prebuild` ile otomatik oluşturulur.

---

## Adım 5: İlk Build Oluşturma

EAS Update'in çalışması için önce bir build oluşturmanız gerekir:

### Development Build (Test için)

```bash
cd apps/mobile
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build (App Store için)

```bash
cd apps/mobile
eas build --profile production --platform ios
eas build --profile production --platform android
```

---

## Adım 6: Doğrulama

Konfigürasyonun doğru olduğunu kontrol edin:

```bash
# Proje bilgilerini görüntüle
eas project:info

# Build konfigürasyonunu doğrula
eas build:inspect --platform ios --profile production
```

---

## Sorun Giderme

### Hata: "Missing runtime version"

```bash
# app.json'da runtimeVersion ekli mi kontrol edin
# Ya da fingerprint politikası kullanın:
"runtimeVersion": {
  "policy": "fingerprint"
}
```

### Hata: "Updates URL not configured"

```bash
# eas update:configure komutunu tekrar çalıştırın
eas update:configure
```

### Native dosyalar güncellenmiyor

```bash
# Native dosyaları yeniden oluşturun
npx expo prebuild --clean
```

---

## Sonraki Adım

Kurulum tamamlandıktan sonra [USAGE.md](./USAGE.md) dökümanına geçerek güncellemelerin nasıl gönderileceğini ve kullanılacağını öğrenin.

---

## Referanslar

- [EAS Update Dokümantasyonu](https://docs.expo.dev/eas-update/introduction/)
- [expo-updates API Referansı](https://docs.expo.dev/versions/latest/sdk/updates/)
- [Runtime Versions](https://docs.expo.dev/distribution/runtime-versions/)
