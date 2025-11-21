# iOS App Signing Setup Guide

## Overview
Bu rehber, iOS uygulamanızı App Store'a göndermek için gerekli sertifika ve provisioning profile setup'ını açıklar.

## Adımlar

### 1. EAS Credentials Oluştur
```bash
cd apps/mobile
eas login
eas credentials
```

Komut çalıştırıldığında:
- **Platform:** iOS seç
- **Profile:** production seç
- **Action:** "Create new" seç (veya mevcut credentials'ı kullan)

EAS otomatik olarak:
- Distribution Certificate oluşturur
- Provisioning Profile oluşturur
- Apple Developer Account'la senkronize eder

### 2. Local Credentials İndir (Opsiyonel)
Eğer credentials'ı local olarak tutmak istersen:

```bash
eas credentials
# Select iOS
# Select production
# Select "credentials.json: Upload/Download credentials between EAS servers and your local json"
# Select "Download credentials from EAS to credentials.json"
```

### 3. credentials.json Yapılandır
`credentials.json.example` dosyasından `credentials.json` oluştur:

```bash
cp credentials.json.example credentials.json
```

Sonra dosyayı düzenle:
```json
{
  "ios": {
    "provisioningProfilePath": "ios/certs/profile.mobileprovision",
    "distributionCertificate": {
      "path": "ios/certs/dist-cert.p12",
      "password": "YOUR_CERTIFICATE_PASSWORD"
    }
  }
}
```

### 4. Sertifika ve Profile'ı Yerleştir
- Distribution Certificate (.p12): `ios/certs/dist-cert.p12`
- Provisioning Profile (.mobileprovision): `ios/certs/profile.mobileprovision`

### 5. Production Build Oluştur
```bash
eas build --platform ios --profile production
```

### 6. App Store'a Gönder
```bash
eas submit --platform ios --latest
```

## Güvenlik Notları

⚠️ **credentials.json asla git'e commit etme!**
- `.gitignore` zaten `credentials.json` exclude ediyor
- Sertifika dosyaları `ios/certs/` klasöründe ignore ediliyor

## Troubleshooting

### "Provisioning profile doesn't support the Associated Domains capability"
- Apple Developer'da provisioning profile'ı güncelle
- Capabilities'i kontrol et

### "Certificate not found"
- `eas credentials` ile credentials'ı yeniden indir
- Dosya yollarını kontrol et

### "Invalid certificate password"
- `credentials.json`'daki password'ü kontrol et
- EAS Dashboard'dan credentials'ı sıfırla

## Kaynaklar
- https://docs.expo.dev/app-signing/app-credentials/
- https://docs.expo.dev/build/eas-json/
- https://docs.expo.dev/submit/ios/
