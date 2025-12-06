# EAS Update - OTA Güncellemeler

İPELYA mobil uygulaması için Over-The-Air (OTA) güncelleme sistemi dökümanları.

---

## 📁 Dökümanlar

| Dosya                  | Açıklama                         |
| ---------------------- | -------------------------------- |
| [SETUP.md](./SETUP.md) | Kurulum ve konfigürasyon rehberi |
| [USAGE.md](./USAGE.md) | Kullanım ve komutlar rehberi     |
| [TODO.md](./TODO.md)   | Yapılacaklar listesi             |

---

## 🚀 Hızlı Başlangıç

### 1. Konfigürasyon

```bash
cd apps/mobile
eas update:configure
```

### 2. app.json Güncellemesi

```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "url": "https://u.expo.dev/ef2464e9-74a9-4b09-9ff6-a936e9cdc65a",
      "checkAutomatically": "ON_LOAD"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### 3. Güncelleme Gönderme

```bash
# Production'a güncelleme gönder
eas update --channel production --message "v1.0.2: Bug fix"
```

---

## 📊 Mevcut Durum

| Özellik                   | Durum                |
| ------------------------- | -------------------- |
| `expo-updates` paketi     | ✅ Yüklü (`~29.0.13`) |
| `eas.json` channel'ları   | ✅ Yapılandırılmış    |
| `app.json` updates config | ❌ Eksik              |
| `runtimeVersion`          | ❌ Eksik              |
| Uygulama içi UI           | ❌ Yapılmadı          |

---

## 🔗 Faydalı Linkler

- [Expo Updates Dokümantasyonu](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Giriş](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions](https://docs.expo.dev/distribution/runtime-versions/)
- [EAS Update Best Practices](https://expo.dev/blog/eas-update-best-practices)

---

## 📝 Proje Bilgileri

- **Project ID:** `ef2464e9-74a9-4b09-9ff6-a936e9cdc65a`
- **Bundle ID:** `com.ipelya.mobile`
- **Current Version:** `1.0.1`
- **Expo SDK:** `54.0.25`
