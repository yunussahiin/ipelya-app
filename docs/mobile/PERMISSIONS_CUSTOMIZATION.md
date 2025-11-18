---
title: İPELYA Mobil - Permissions Customization
description: iOS ve Android permission mesajlarını özelleştirme
---

# 🔐 Permissions Customization

**Versiyon**: 1.0.0  
**Durum**: 🚀 Production Ready  
**Son Güncelleme**: 19 Kasım 2025

---

## 📋 Genel Bakış

Expo tarafından gösterilen permission dialog'ları özelleştirilebilir. iOS ve Android için farklı yapılandırma gerekir.

---

## 🎯 Mevcut Özelleştirmeler

### **iOS - Info.plist Descriptions**

```json
{
  "ios": {
    "infoPlist": {
      "NSPhotoLibraryUsageDescription": "Profil fotoğrafı seçmek için galeri erişim izni gerekli",
      "NSCameraUsageDescription": "Profil fotoğrafı çekmek için kamera erişim izni gerekli"
    }
  }
}
```

**Sonuç:**
```
iOS Permission Dialog:
┌─────────────────────────────────────┐
│ "İPELYA" Galeri Erişimi İstiyor    │
├─────────────────────────────────────┤
│ Profil fotoğrafı seçmek için galeri │
│ erişim izni gerekli                 │
│                                     │
│ [İzin Ver]  [Reddet]               │
└─────────────────────────────────────┘
```

---

### **Android - Permissions Array**

```json
{
  "android": {
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

**Sonuç:**
```
Android Permission Dialog:
┌─────────────────────────────────────┐
│ İPELYA şu izinleri istiyor:        │
├─────────────────────────────────────┤
│ ✓ Kamera                            │
│ ✓ Dosyaları oku                     │
│ ✓ Dosyaları yaz                     │
│                                     │
│ [İzin Ver]  [Reddet]               │
└─────────────────────────────────────┘
```

---

## 💬 Hook'ta Custom Error Messages

### **useAvatarUpload.ts**

```typescript
// Galeri izni reddedilirse
if (status !== "granted") {
  if (canAskAgain) {
    setError("Profil fotoğrafı seçmek için galeri erişim izni gerekli");
  } else {
    setError("Galeri erişim izni reddedildi. Ayarlardan izin ver.");
  }
  return;
}
```

**Sonuç:**
```
Kullanıcı "Reddet" tıklarsa:
┌─────────────────────────────────────┐
│ ⚠️ Galeri erişim izni reddedildi.  │
│    Ayarlardan izin ver.             │
└─────────────────────────────────────┘
```

---

## 🔧 Tüm Permission Türleri

### **iOS - Info.plist Keys**

| Key                                   | Açıklama         | Örnek                    |
| ------------------------------------- | ---------------- | ------------------------ |
| `NSPhotoLibraryUsageDescription`      | Galeri erişimi   | "Fotoğraf seçmek için"   |
| `NSCameraUsageDescription`            | Kamera erişimi   | "Fotoğraf çekmek için"   |
| `NSMicrophoneUsageDescription`        | Mikrofon erişimi | "Ses kaydı için"         |
| `NSLocationWhenInUseUsageDescription` | Konum erişimi    | "Konumunuzu görmek için" |
| `NSContactsUsageDescription`          | Kişiler erişimi  | "Kişileri görmek için"   |

---

### **Android - Permissions**

| Permission                                  | Açıklama       |
| ------------------------------------------- | -------------- |
| `android.permission.CAMERA`                 | Kamera erişimi |
| `android.permission.READ_EXTERNAL_STORAGE`  | Dosya okuma    |
| `android.permission.WRITE_EXTERNAL_STORAGE` | Dosya yazma    |
| `android.permission.ACCESS_FINE_LOCATION`   | Kesin konum    |
| `android.permission.ACCESS_COARSE_LOCATION` | Yaklaşık konum |
| `android.permission.READ_CONTACTS`          | Kişiler okuma  |

---

## 📝 app.json Yapısı

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Mesaj",
        "NSCameraUsageDescription": "Mesaj"
      }
    },
    "android": {
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

---

## 🎨 Best Practices

✅ **Açık ve Anlaşılır** - Neden izin gerektiğini açıkla  
✅ **Türkçe Mesajlar** - Kullanıcı dilinde yaz  
✅ **Kısa ve Öz** - Uzun açıklamalar yazma  
✅ **Bağlamsal** - Neyle ilgili olduğunu belirt  
✅ **Consistent** - Tüm izinler için aynı stil  

---

## ❌ Kötü Örnekler

```
❌ "İzin gerekli"
❌ "Sistem izni"
❌ "Lütfen izin ver"
```

---

## ✅ İyi Örnekler

```
✅ "Profil fotoğrafı seçmek için galeri erişim izni gerekli"
✅ "Mesajları göndermek için mikrofon erişim izni gerekli"
✅ "Konumunuzu görmek için konum erişim izni gerekli"
```

---

## 🔄 Runtime Permission Handling

### **iOS (iOS 14+)**

```typescript
const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

if (status === "granted") {
  // İzin verildi
} else if (canAskAgain) {
  // Tekrar sorabilir
  showError("İzin gerekli");
} else {
  // İzin reddedildi ve tekrar sorulamaz
  showError("Ayarlardan izin ver");
}
```

### **Android (Android 6+)**

```typescript
// Android runtime permissions'ı otomatik olarak yönetir
// Expo bunu handle ediyor
```

---

## 🚀 Testing

### **iOS Simulator**

```
Settings > İPELYA > Permissions
  - Photos: Allow
  - Camera: Allow
```

### **Android Emulator**

```
Settings > Apps > İPELYA > Permissions
  - Camera: Allow
  - Storage: Allow
```

---

## 📚 Referanslar

- [Expo Permissions](https://docs.expo.dev/versions/latest/sdk/permissions/)
- [iOS Info.plist Keys](https://developer.apple.com/documentation/bundleresources/information_property_list)
- [Android Permissions](https://developer.android.com/guide/topics/permissions/overview)

---

**Son Güncelleme**: 19 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🚀 Production Ready
