# iOS Device Management for Internal Distribution

## Genel Bakış

iOS'ta Internal Distribution için Ad Hoc Provisioning kullanılır. Bu, cihazların önceden kayıtlı olmasını gerektirir.

**Önemli Limitler:**
- ⚠️ Maksimum **100 cihaz/yıl** (Apple sınırı)
- ⚠️ Yeni cihaz eklenirse rebuild gerekir
- ⚠️ Ücretli Apple Developer hesabı zorunlu

---

## UDID Nedir?

**UDID** (Unique Device Identifier), her iOS cihazının benzersiz tanımlayıcısıdır.

### UDID'yi Nasıl Bulunur?

#### Yöntem 1: Xcode ile

```bash
# Mac'te Xcode aç
open /Applications/Xcode.app

# Menü: Window → Devices and Simulators
# Cihazı seç → UDID'yi kopyala
```

#### Yöntem 2: Apple Configurator 2 ile

```bash
# Mac App Store'dan indir
# Cihazı bağla → UDID'yi kopyala
```

#### Yöntem 3: iTunes ile

```bash
# iTunes'u aç
# Cihazı bağla
# "Serial Number" yerine "UDID" göster
# (Shift+Cmd+I tuşlarına basarak toggle et)
```

#### Yöntem 4: Web Tabanlı

```bash
# https://www.udidgenerator.com/ ziyaret et
# Cihazı bağla → UDID'yi al
```

---

## Cihaz Kayıt Süreci

### 1. Cihaz Ekle

```bash
cd apps/mobile
eas device:create
```

**Etkileşimli Adımlar:**

```
? What type of device do you want to register?
❯ iPhone
  iPad
  Mac

? Enter the UDID of your device:
> (UDID'yi yapıştır)

? Enter a name for your device:
> (Örn: "Yunus's iPhone 15")
```

**Sonuç:**
- Cihaz Expo hesabına kaydedilir
- Apple Developer Portal'a eklenir
- Provisioning profile'a dahil edilir

### 2. Cihazları Listele

```bash
eas device:list
```

**Çıktı Örneği:**
```
Devices registered for Ad Hoc provisioning:

┌─────────────────────────────────────────────────────────────┐
│ Identifier                                                  │
├─────────────────────────────────────────────────────────────┤
│ 00008110-001A1D0E1234A567 (Yunus's iPhone 15)              │
│ 00008120-001B2E0F2345B678 (Test iPad)                      │
│ 00008130-001C3F1G3456C789 (Dev iPhone 14)                  │
└─────────────────────────────────────────────────────────────┘
```

### 3. Cihaz Adlandır

```bash
eas device:rename
```

**Kullanım:**
```
? Select a device to rename:
❯ 00008110-001A1D0E1234A567 (Yunus's iPhone 15)
  00008120-001B2E0F2345B678 (Test iPad)

? Enter a new name for this device:
> Yunus's iPhone 15 Pro Max
```

### 4. Cihaz Sil

```bash
eas device:delete
```

**Uyarı:**
```
? Select a device to delete:
❯ 00008110-001A1D0E1234A567 (Yunus's iPhone 15)

? Do you want to disable this device on the Apple Developer Portal?
❯ Yes
  No
```

**Dikkat:** Devre dışı cihazlar yine 100 cihaz limitine sayılır!

---

## Build Oluşturma Süreci

### Adım 1: Cihazları Kaydet

```bash
eas device:create
# Tüm takım üyelerinin cihazlarını ekle
```

### Adım 2: Build Oluştur

```bash
eas build --platform ios --profile internal
```

**Build sırasında:**
1. EAS, kayıtlı cihazları alır
2. Ad Hoc Provisioning Profile oluşturur
3. Sertifikaları imzalar
4. Build'i oluşturur

### Adım 3: URL'yi Paylaş

```bash
# Build tamamlandığında URL'yi al
eas build:list --distribution internal --limit 1 --json
```

**Çıktı:**
```json
{
  "builds": [
    {
      "id": "build-id-123",
      "status": "finished",
      "artifacts": {
        "buildUrl": "https://expo.dev/artifacts/eas/..."
      }
    }
  ]
}
```

### Adım 4: Cihaza Kur

Kullanıcı URL'ye erişince:
1. "Install" butonuna basıyor
2. Uygulama cihaza kurulur
3. Güven ayarlarında uygulamayı onaylaması gerekebilir

---

## Takım Yönetimi

### Tüm Takım Üyelerinin Cihazlarını Ekle

```bash
# Takım üyelerine UDID'lerini sor
# Her birini kaydet

eas device:create  # 1. üye
eas device:create  # 2. üye
eas device:create  # 3. üye
```

### Cihaz Listesini Paylaş

```bash
# Takıma göster
eas device:list
```

**Takım üyeleri:**
- Kendi cihazlarının UDID'sini bulur
- Sana gönderir
- Sen `eas device:create` ile eklersin

### Yeni Üye Ekleme

```bash
# Yeni üyenin UDID'sini al
eas device:create

# Build oluştur
eas build --platform ios --profile internal

# URL'yi paylaş
```

---

## Cihaz Limitlerini Yönetme

### 100 Cihaz Limitine Yaklaşıyorsanız

```bash
# Kullanılmayan cihazları sil
eas device:delete

# Devre dışı cihazları Apple Developer Portal'dan kaldır
# https://developer.apple.com/account/resources/devices/
```

### Yıllık Limit Sıfırlanması

- Apple, her **takvim yılında** 100 cihaz limitini sıfırlar
- Ocak 1'de limit otomatik olarak sıfırlanır
- Devre dışı cihazlar da sayılır!

---

## Troubleshooting

### "Device not registered"

**Hata:**
```
Error: Device not registered for Ad Hoc provisioning
```

**Çözüm:**
```bash
# Cihazı kaydet
eas device:create

# Build oluştur (cihaz provisioning profile'a eklenir)
eas build --platform ios --profile internal
```

### "Provisioning profile doesn't support the Associated Domains capability"

**Hata:**
```
Error: Provisioning profile doesn't support the Associated Domains capability
```

**Çözüm:**
```bash
# Credentials'ı sıfırla
eas credentials

# Seç: iOS → internal → Create new

# Build oluştur
eas build --platform ios --profile internal
```

### "Device limit exceeded"

**Hata:**
```
Error: You have reached the maximum number of devices (100)
```

**Çözüm:**
```bash
# Kullanılmayan cihazları sil
eas device:delete

# Veya yıl sonuna kadar bekle (Ocak 1'de sıfırlanır)
```

### "UDID Invalid"

**Hata:**
```
Error: Invalid UDID format
```

**Çözüm:**
- UDID'nin doğru olduğundan emin ol
- Format: `00008110-001A1D0E1234A567` (40 karakter)
- Boşluk veya özel karakter olmamalı

### Build Başarısız Oldu

**Çözüm:**
```bash
# Logs'u kontrol et
eas build:list --distribution internal --json

# Detaylı hata mesajı için EAS Dashboard'u kontrol et
# https://expo.dev/accounts/[account]/projects/[project]/builds
```

---

## Best Practices

### ✅ Yapılması Gerekenler

- ✅ Cihazları anlaşılır isimlerle adlandır
- ✅ Düzenli olarak kullanılmayan cihazları sil
- ✅ Takım üyeleriyle UDID'leri paylaş
- ✅ Build oluşturmadan önce cihazları kaydet
- ✅ Yıl sonunda cihaz listesini temizle

### ❌ Yapılmaması Gerekenler

- ❌ Aynı UDID'yi iki kez kaydetme
- ❌ Yanlış UDID'yle cihaz ekleme
- ❌ Devre dışı cihazları silmeden limit aşma
- ❌ Credentials'ı paylaşma
- ❌ Sertifika dosyalarını git'e commit etme

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

# Credentials
eas credentials            # Credentials yönet
```

### UDID Bulma

```bash
# Xcode
open /Applications/Xcode.app
# Window → Devices and Simulators → UDID kopyala

# Web
https://www.udidgenerator.com/
```

### Kaynaklar

- [Expo Device Management](https://docs.expo.dev/build/internal-distribution/#managing-devices)
- [Apple Ad Hoc Distribution](https://help.apple.com/xcode/mac/current/)
- [Apple Developer Account](https://developer.apple.com/account/)

---

**Son Güncelleme:** Nov 22, 2025
