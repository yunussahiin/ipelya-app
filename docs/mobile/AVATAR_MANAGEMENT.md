---
title: İPELYA Mobil - Avatar Management System
description: Avatar upload, storage, and management system using Supabase Storage
---

# 🖼️ Avatar Management System

**Versiyon**: 1.0.0  
**Durum**: 🚀 In Development  
**Son Güncelleme**: 19 Kasım 2025

---

## 📋 Genel Bakış

Avatar Management System, kullanıcıların profil fotoğraflarını yönetmesini sağlar. Supabase Storage ile entegre çalışarak güvenli, hızlı ve ölçeklenebilir bir çözüm sunar.

**Özellikler:**
- 📸 Kamera veya galeriden fotoğraf seçme
- 🖼️ Otomatik görüntü sıkıştırma ve optimizasyon
- 💾 Supabase Storage'a yükleme
- 🔄 Profil veritabanına otomatik güncelleme
- 🗑️ Eski fotoğrafları otomatik silme
- ⚡ Hata yönetimi ve retry mekanizması

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────┐
│         Avatar Upload Flow              │
├─────────────────────────────────────────┤
│                                         │
│  1. User picks/takes photo              │
│         ↓                               │
│  2. Image validation                    │
│         ↓                               │
│  3. Image compression (512x512)         │
│         ↓                               │
│  4. Upload to Supabase Storage          │
│         ↓                               │
│  5. Get public URL                      │
│         ↓                               │
│  6. Update profile in database          │
│         ↓                               │
│  7. Delete old avatar (optional)        │
│         ↓                               │
│  ✅ Success callback                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

```
apps/mobile/
├── src/
│   ├── services/
│   │   └── avatar.service.ts          ← Core avatar operations
│   ├── hooks/
│   │   └── useAvatarUpload.ts         ← React hook for upload state
│   └── components/
│       └── profile/
│           └── AvatarUploader.tsx     ← UI component
└── app/
    └── (profile)/
        └── edit.tsx                   ← Integration point
```

---

## 🔧 API Reference

### `avatar.service.ts`

#### `initializeAvatarBucket()`
Supabase Storage'da avatar bucket'ını oluşturur (varsa atlar).

```typescript
await initializeAvatarBucket();
```

#### `uploadAvatar(options: AvatarUploadOptions)`
Fotoğrafı Supabase Storage'a yükler.

```typescript
const result = await uploadAvatar({
  userId: "user-123",
  file: {
    uri: "file:///path/to/image.jpg",
    name: "avatar.jpg",
    type: "image/jpeg"
  },
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.8,
  upsert: true
});

// Result
{
  success: true,
  url: "https://...",
  path: "user-123/avatar_1234567890.jpg"
}
```

#### `updateProfileAvatar(userId: string, avatarUrl: string)`
Profil veritabanında avatar URL'sini günceller.

```typescript
const result = await updateProfileAvatar("user-123", "https://...");
```

#### `deleteAvatar(path: string)`
Storage'dan eski avatarı siler.

```typescript
const result = await deleteAvatar("user-123/old_avatar.jpg");
```

#### `uploadAndUpdateAvatar(userId: string, file: File, oldPath?: string)`
Yükleme, güncelleme ve silmeyi bir işlemde yapar.

```typescript
const result = await uploadAndUpdateAvatar(
  "user-123",
  { uri: "...", name: "avatar.jpg", type: "image/jpeg" },
  "user-123/old_avatar.jpg"
);
```

---

### `useAvatarUpload()` Hook

React hook'u avatar upload state'ini yönetir.

```typescript
const {
  loading,        // Image picker açılıyor
  uploading,      // Upload işlemi devam ediyor
  error,          // Hata mesajı
  avatarUrl,      // Yüklenen avatar URL'si
  avatarPath,     // Storage path
  pickImage,      // Galeriden seç
  takePhoto,      // Fotoğraf çek
  uploadAvatar,   // Manuel yükleme
  clearError,     // Hata temizle
  reset           // State sıfırla
} = useAvatarUpload();
```

---

### `AvatarUploader` Component

Hazır UI component'i.

```typescript
<AvatarUploader
  currentAvatarUrl={profile.avatar_url}
  onUploadSuccess={(url) => console.log("Uploaded:", url)}
  onUploadError={(error) => console.error("Error:", error)}
/>
```

---

## 📊 Database Schema

### `profiles` table

```sql
-- Yeni kolona gerek yok, avatar_url zaten var
avatar_url (text) -- Supabase Storage public URL
avatar_storage_path (text) -- Storage path (opsiyonel)
```

---

## 🔐 Supabase Storage Configuration

### Bucket: `avatars`

```typescript
{
  public: true,                    // Public read access
  fileSizeLimit: 5242880,          // 5MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ]
}
```

### RLS Policy (Public Read)

```sql
-- Allow public read
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 🎯 Integration Example

### Profile Edit Sayfasında Kullanım

```typescript
import { AvatarUploader } from "@/components/profile/AvatarUploader";

export default function ProfileEditScreen() {
  const [profile, setProfile] = useState(null);

  return (
    <ScrollView>
      <AvatarUploader
        currentAvatarUrl={profile?.avatar_url}
        onUploadSuccess={(url) => {
          setProfile({ ...profile, avatar_url: url });
        }}
        onUploadError={(error) => {
          Alert.alert("Hata", error);
        }}
      />
    </ScrollView>
  );
}
```

---

## 🛠️ Configuration

### Constraints

| Parametre | Değer | Açıklama |
|-----------|-------|----------|
| Max File Size | 5MB | Supabase Storage limiti |
| Max Width | 512px | Sıkıştırma sonrası |
| Max Height | 512px | Sıkıştırma sonrası |
| Compression Quality | 0.8 | JPEG kalitesi (0-1) |
| Cache Control | 3600s | 1 saat cache |

### Allowed MIME Types

- `image/jpeg` - JPEG
- `image/png` - PNG
- `image/gif` - GIF
- `image/webp` - WebP

---

## 🚀 Deployment Checklist

- [ ] Supabase Storage bucket oluştur
- [ ] RLS policies ayarla
- [ ] avatar.service.ts import et
- [ ] useAvatarUpload hook'u test et
- [ ] AvatarUploader component'i entegre et
- [ ] Profile edit sayfasında test et
- [ ] Error handling test et
- [ ] Large file upload test et

---

## 📝 Error Handling

### Olası Hatalar

| Hata | Çözüm |
|------|-------|
| "Invalid file type" | Sadece JPG, PNG, GIF, WebP kabul edilir |
| "File too large" | 5MB'dan küçük dosya seç |
| "Permission denied" | Kamera/galeri izni ver |
| "Upload failed" | İnternet bağlantısını kontrol et |
| "Failed to generate URL" | Supabase Storage durumunu kontrol et |

---

## 🔄 Future Enhancements

1. **Image Cropping** - Crop tool entegrasyonu
2. **Multiple Avatars** - Avatar geçmişi
3. **Avatar Filters** - Filtre uygulaması
4. **CDN Optimization** - Cloudflare entegrasyonu
5. **Batch Upload** - Birden fazla fotoğraf
6. **Avatar Analytics** - Upload istatistikleri

---

## 📚 Referanslar

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Image Manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)

---

**Son Güncelleme**: 19 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🚀 Ready for Integration
