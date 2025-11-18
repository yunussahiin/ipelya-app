---
title: İPELYA Mobil - Storage Architecture & Best Practices
description: Supabase Storage bucket yapısı, klasör organizasyonu ve güvenlik
---

# 🗂️ Storage Architecture

**Versiyon**: 1.0.0  
**Durum**: 🚀 In Production  
**Son Güncelleme**: 19 Kasım 2025

---

## 📋 Genel Bakış

İPELYA mobil uygulaması Supabase Storage'u kullanarak kullanıcı avatarlarını ve medya dosyalarını yönetir. Güvenli, ölçeklenebilir ve performant bir yapı sağlar.

---

## 🪣 Bucket Configuration

### **avatars** Bucket

```
Bucket ID: avatars
Public: ✅ Yes (Public Read)
File Size Limit: 5 MB
Allowed MIME Types: image/jpeg, image/png, image/gif, image/webp
```

#### Konfigürasyon Detayları

| Ayar                | Değer     | Açıklama               |
| ------------------- | --------- | ---------------------- |
| **Bucket Name**     | `avatars` | Değiştirilemez         |
| **Public Access**   | ✅ Enabled | Herkes okuyabilir      |
| **File Size Limit** | 5 MB      | 5242880 bytes          |
| **MIME Types**      | `image/*` | Sadece resim dosyaları |
| **Cache Control**   | 3600s     | 1 saat cache           |

---

## 📁 Klasör Yapısı

### **Temel Yapı**

```
avatars/
├── user-id-1/
│   ├── avatar_1234567890.jpg
│   ├── avatar_1234567891.jpg
│   └── avatar_1234567892.jpg
├── user-id-2/
│   ├── avatar_1234567893.jpg
│   └── avatar_1234567894.jpg
└── user-id-3/
    └── avatar_1234567895.jpg
```

### **Klasör Adlandırması**

```typescript
// Format: {user-id}/{timestamp}.{ext}
const path = `${userId}/${Date.now()}.jpg`;

// Örnek:
// 5905dbac-a6cb-4c12-b2ae-baccaf554976/1734607476123.jpg
```

### **Avantajları**

✅ **User Isolation** - Her kullanıcının kendi klasörü  
✅ **Easy Cleanup** - Kullanıcı silinirse tüm dosyalar silinir  
✅ **Permission Control** - RLS policies ile kontrol  
✅ **Scalability** - Milyonlarca dosya yönetilebilir  
✅ **Analytics** - Kullanıcı başına storage kullanımı  

---

## 🔐 Security & RLS Policies

### **Policy 1: Public Read**

```sql
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

**Açıklama**: Herkes avatarları görebilir (profil kartlarında gösterilmesi için)

---

### **Policy 2: Authenticated Upload**

```sql
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Açıklama**: Sadece kendi klasörüne upload edebilir  
**Örnek**: User `abc123` sadece `abc123/` klasörüne upload edebilir

---

### **Policy 3: Authenticated Update**

```sql
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Açıklama**: Sadece kendi dosyalarını güncelleyebilir

---

### **Policy 4: Authenticated Delete**

```sql
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Açıklama**: Sadece kendi dosyalarını silebilir

---

## 📊 File Organization Strategy

### **Single Avatar Approach** (Mevcut)

```
avatars/
└── user-id/
    └── avatar_latest.jpg  (Her upload üzerine yazılır)
```

**Avantajları:**
- Basit yapı
- Düşük storage kullanımı
- Hızlı erişim

**Dezavantajları:**
- Avatar geçmişi yok
- Rollback imkansız

---

### **Versioned Avatar Approach** (Gelecek)

```
avatars/
└── user-id/
    ├── avatar_1234567890.jpg  (v1)
    ├── avatar_1234567891.jpg  (v2)
    ├── avatar_1234567892.jpg  (v3)
    └── current.json           (Pointer)
```

**Avantajları:**
- Avatar geçmişi
- Rollback imkansız
- Analytics

**Dezavantajları:**
- Daha fazla storage
- Cleanup gerekli

---

## 🚀 Upload Flow

```
┌─────────────────────────────────────┐
│     User picks/takes photo          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  1. Validate MIME type              │
│     ✓ image/jpeg                    │
│     ✓ image/png                     │
│     ✓ image/gif                     │
│     ✓ image/webp                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  2. Check file size (< 5MB)         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  3. Compress image                  │
│     - Max: 512x512                  │
│     - Quality: 0.8                  │
│     - Format: JPEG                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  4. Upload to Storage               │
│     Path: {userId}/{timestamp}.jpg  │
│     Upsert: true                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  5. Get public URL                  │
│     https://.../{userId}/{file}     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  6. Update profile in DB            │
│     avatar_url = public_url         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  7. Delete old avatar (optional)    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  ✅ Success                         │
└─────────────────────────────────────┘
```

---

## 📈 Storage Quotas & Limits

### **Project Level**

```
Global File Size Limit: 50 MB
(Tek dosya maksimum 50MB olabilir)
```

### **Bucket Level**

```
avatars Bucket:
- File Size Limit: 5 MB
- MIME Types: image/jpeg, image/png, image/gif, image/webp
```

### **User Level** (Gelecek)

```
Per-user quota: 50 MB
(Her kullanıcı maksimum 50MB avatar saklayabilir)
```

---

## 🧹 Cleanup & Maintenance

### **Otomatik Cleanup**

```typescript
// Eski avatarı sil (yeni upload sırasında)
await deleteAvatar(oldAvatarPath);
```

### **Manuel Cleanup** (Admin)

```sql
-- Kullanıcı silindiğinde tüm avatarları sil
DELETE FROM storage.objects
WHERE bucket_id = 'avatars'
AND (storage.foldername(name))[1] = 'user-id';
```

### **Orphaned Files Cleanup**

```sql
-- Profilde referans olmayan dosyaları bul
SELECT path
FROM storage.objects
WHERE bucket_id = 'avatars'
AND path NOT IN (
  SELECT avatar_url FROM profiles WHERE avatar_url IS NOT NULL
);
```

---

## 🔄 Future Buckets

### **media** Bucket (Gelecek)

```
media/
├── user-id-1/
│   ├── posts/
│   │   ├── post_1.jpg
│   │   └── post_2.jpg
│   └── stories/
│       ├── story_1.mp4
│       └── story_2.mp4
└── user-id-2/
    └── ...
```

### **documents** Bucket (Gelecek)

```
documents/
├── user-id-1/
│   ├── profile_export.json
│   └── backup_2025-11-19.zip
└── user-id-2/
    └── ...
```

---

## 📊 Monitoring & Analytics

### **Storage Usage Query**

```sql
SELECT 
  (storage.foldername(name))[1] as user_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as total_size_mb
FROM storage.objects
WHERE bucket_id = 'avatars'
GROUP BY user_id
ORDER BY total_size_mb DESC;
```

### **Top Users by Storage**

```sql
SELECT 
  (storage.foldername(name))[1] as user_id,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as size_mb
FROM storage.objects
WHERE bucket_id = 'avatars'
GROUP BY user_id
ORDER BY size_mb DESC
LIMIT 10;
```

---

## 🚀 Best Practices

✅ **Always validate MIME types** - Client ve server side  
✅ **Compress images** - Bandwidth ve storage tasarrufu  
✅ **Use user-based folders** - Security ve organization  
✅ **Implement cleanup** - Eski dosyaları sil  
✅ **Monitor storage** - Quota'ya yaklaşıldığında uyar  
✅ **Use public URLs** - CDN caching için  
✅ **Set cache headers** - Performance için  
✅ **Test RLS policies** - Security için  

---

## 🔗 Referanslar

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization](https://supabase.com/docs/guides/storage/image-transformations)

---

**Son Güncelleme**: 19 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🚀 Production Ready
