# Internal Distribution Setup Guide

## Genel Bakış

Internal Distribution, EAS Build'in sağladığı bir özellik. Takımınızla uygulamayı test etmek için **paylaşılabilir URL'ler** oluşturur. Kullanıcılar bu URL'den doğrudan cihazlarına kurabilirler.

**Avantajları:**
- ✅ Hızlı test dağıtımı
- ✅ App Store/Play Store'a gitmesine gerek yok
- ✅ Paylaşılabilir URL'ler (32 karakterli UUID)
- ✅ Takım üyeleri kolayca kurabiliyor
- ✅ Sınırsız build sayısı

---

## Kurulum

### 1. EAS Credentials Oluştur

```bash
cd apps/mobile
eas login
eas credentials
```

**Adımlar:**
- Platform: **iOS** seç
- Profile: **preview** veya **internal** seç
- Action: "Create new" seç

EAS otomatik olarak:
- Distribution Certificate oluşturur
- Ad Hoc Provisioning Profile oluşturur
- Apple Developer Account'la senkronize eder

### 2. iOS Cihazları Kaydet

Ad Hoc provisioning'de cihazlar önceden kayıtlı olmalı.

#### Yeni Cihaz Ekle
```bash
eas device:create
```

**Komut çalıştırıldığında:**
1. Cihaz türü seç (iPhone, iPad, Mac)
2. UDID gir (cihazdan alınabilir)
3. Cihaz adı gir (opsiyonel)

#### Cihazları Listele
```bash
eas device:list
```

Kayıtlı tüm cihazları gösterir.

#### Cihaz Sil
```bash
eas device:delete
```

Cihazı Expo hesabından ve Apple Developer Portal'dan kaldırır.

#### Cihaz Adlandır
```bash
eas device:rename
```

UDID yerine anlaşılır isim gösterir.

**⚠️ Dikkat:** Apple, Ad Hoc Distribution için **maksimum 100 cihaz/yıl** sınırı koyar.

---

## Build Oluşturma

### Preview Build (Test Amaçlı)
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Internal Build (Dedicated Profile)
```bash
eas build --platform ios --profile internal
eas build --platform android --profile internal
```

### Her İki Platform İçin
```bash
eas build --platform all --profile internal
```

**Build başarılı olunca:**
- Paylaşılabilir URL oluşturulur
- Takım üyeleri URL'den doğrudan kurabiliyor
- Varsayılan olarak kimlik doğrulaması gereksiz

---

## Platform Farklılıkları

### Android (APK)

```json
"android": {
  "buildType": "apk"
}
```

**Özellikler:**
- Doğrudan cihaza kurulabilir
- Play Store'a gitmesine gerek yok
- Kullanıcı güvenlik uyarısını kabul etmeli
- Sınırsız cihaz sayısı
- Yeni cihaz eklemek için rebuild gereksiz

**Kurulum:**
1. URL'yi paylaş
2. Kullanıcı URL'den APK'yı indir
3. Güvenlik uyarısını kabul et
4. Otomatik olarak kurulur

### iOS (Ad Hoc Provisioning)

```json
"ios": {
  "simulator": false,
  "provisioning": "adhoc"
}
```

**Özellikler:**
- Cihazın **UDID**'si kayıtlı olmalı
- Maksimum **100 cihaz/yıl** (Apple sınırı)
- Yeni cihaz eklenirse rebuild gerekir
- Ücretli Apple Developer hesabı zorunlu

**Kurulum:**
1. Cihazı `eas device:create` ile kaydet
2. Build oluştur: `eas build --platform ios --profile internal`
3. URL'yi paylaş
4. Kullanıcı URL'den doğrudan kurabiliyor

---

## Build Listeleme & Yönetim

### Internal Distribution Build'lerini Listele
```bash
eas build:list --distribution internal
```

### Belirli Platform
```bash
eas build:list --distribution internal --platform ios
```

### JSON Formatında
```bash
eas build:list --distribution internal --json
```

### Belirli Profil
```bash
eas build:list --distribution internal --build-profile preview
```

### Filtreleme Seçenekleri
```bash
eas build:list \
  --distribution internal \
  --platform ios \
  --status finished \
  --limit 20
```

**Status Değerleri:**
- `new` - Yeni oluşturulan
- `in-queue` - Sırada bekleyen
- `in-progress` - Yapılmakta
- `finished` - Tamamlanan
- `errored` - Hatalı
- `canceled` - İptal edilen

---

## CI/CD Otomasyonu

### Non-Interactive Mode

```bash
eas build --platform ios --profile internal --non-interactive
```

**Kullanım Alanları:**
- GitHub Actions
- GitLab CI
- Jenkins
- Diğer CI/CD sistemleri

**Dikkat:** Ad Hoc provisioning'de yeni cihaz eklenemez. Cihaz eklemek için interaktif build gerekir.

### GitHub Actions Örneği

```yaml
name: Internal Distribution Build

on:
  push:
    branches: [develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS
        run: |
          cd apps/mobile
          eas build --platform ios --profile internal --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
      
      - name: Build Android
        run: |
          cd apps/mobile
          eas build --platform android --profile internal --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
```

---

## Güvenlik

### Varsayılan Davranış
- URL'ye sahip herkes kurabiliyor
- 32 karakterli UUID ile güvenlik sağlanıyor

### Kimlik Doğrulaması Zorunlu Kılma

Proje ayarlarında:
1. https://expo.dev/accounts/[account]/projects/[project]/settings
2. "Unauthenticated access to internal builds" devre dışı bırak
3. Artık Expo hesabı ile giriş zorunlu

---

## Workflow: Adım Adım

### Senaryo 1: Yeni Cihaz Ekleyip Build Oluşturma

```bash
# 1. Yeni cihaz kaydet
eas device:create

# 2. Build oluştur (cihaz otomatik provisioning profile'a eklenir)
eas build --platform ios --profile internal

# 3. Build tamamlandığında URL'yi al
# Terminal'da gösterilir veya:
eas build:list --distribution internal --limit 1

# 4. URL'yi takıma paylaş
```

### Senaryo 2: Mevcut Cihazlara Build Dağıt

```bash
# 1. Build oluştur (cihazlar zaten kayıtlı)
eas build --platform all --profile internal

# 2. URL'yi paylaş
# Takım üyeleri doğrudan kurabiliyor
```

### Senaryo 3: CI/CD ile Otomatik Build

```bash
# 1. GitHub Actions'da trigger et (push to develop)
# 2. Otomatik build oluşturulur
# 3. Build URL'si Slack'e gönderilir (webhook ile)
# 4. Takım URL'den kurabiliyor
```

---

## Troubleshooting

### "Provisioning profile doesn't support the Associated Domains capability"

**Çözüm:**
```bash
# Credentials'ı sıfırla
eas credentials

# Yeni provisioning profile oluştur
eas build --platform ios --profile internal
```

### "Device not registered"

**Çözüm:**
```bash
# Cihazı kaydet
eas device:create

# Build oluştur (cihaz provisioning profile'a eklenir)
eas build --platform ios --profile internal
```

### "Certificate not found"

**Çözüm:**
```bash
# Credentials'ı yeniden indir
eas credentials

# Seç: iOS → internal → credentials.json: Download
```

### "Invalid certificate password"

**Çözüm:**
```bash
# EAS Dashboard'dan credentials'ı sıfırla
# https://expo.dev/accounts/[account]/projects/[project]/credentials

# Yeni credentials oluştur
eas credentials
```

### Build Başarısız Oldu

**Çözüm:**
```bash
# Logs'u kontrol et
eas build:list --distribution internal --json

# Detaylı hata mesajı için EAS Dashboard'u kontrol et
# https://expo.dev/accounts/[account]/projects/[project]/builds
```

---

## Kaynaklar

- [Expo Internal Distribution Docs](https://docs.expo.dev/build/internal-distribution/)
- [EAS Build Tutorial](https://docs.expo.dev/tutorial/eas/internal-distribution-builds/)
- [EAS CLI Reference](https://docs.expo.dev/eas-cli/introduction/)
- [iOS App Signing](https://docs.expo.dev/app-signing/app-credentials/)
- [Apple Ad Hoc Distribution](https://help.apple.com/xcode/mac/current/)

---

## Hızlı Referans

### Komutlar

```bash
# Cihaz yönetimi
eas device:create          # Yeni cihaz ekle
eas device:list            # Cihazları listele
eas device:rename          # Cihaz adlandır
eas device:delete          # Cihaz sil

# Build oluşturma
eas build --platform ios --profile internal
eas build --platform android --profile internal
eas build --platform all --profile internal

# Build listeleme
eas build:list --distribution internal
eas build:list --distribution internal --platform ios

# Credentials
eas credentials            # Credentials yönet
eas login                  # Expo'ya giriş yap
```

### eas.json Profilleri

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "provisioning": "adhoc" }
    },
    "internal": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "provisioning": "adhoc" }
    },
    "production": {
      "distribution": "store",
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

---

**Son Güncelleme:** Nov 22, 2025
