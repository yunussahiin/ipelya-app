---
title: İPELYA Mobil - Storage Security & Public Access
description: Supabase Storage güvenliği, public bucket'lar ve RLS policies
---

# 🔐 Storage Security & Public Access

**Versiyon**: 1.0.0  
**Durum**: 🚀 Production Ready  
**Son Güncelleme**: 19 Kasım 2025

---

## 📋 Genel Bakış

"Public bucket" terimi kafa karışıklığına neden olabilir. Bu dokümanda açıklanmıştır.

---

## 🤔 "Public" Ne Demek?

### **❌ YANLIŞ Anlayış**

```
"Public bucket" = Dışarıdan herkes her şeyi silebilir/değiştirebilir
```

### **✅ DOĞRU Anlayış**

```
"Public bucket" = Dışarıdan herkes OKUYABILIR (READ)
                  Ama yazma/silme için AUTH gerekli
```

---

## 🔓 Public vs Private Buckets

### **Public Bucket**

```
avatars (public: true)

┌─────────────────────────────────────┐
│ Herkes (Auth olmadan)               │
├─────────────────────────────────────┤
│ ✅ Okuyabilir (SELECT)              │
│ ❌ Yazamaz (INSERT)                 │
│ ❌ Silemez (DELETE)                 │
│ ❌ Güncelleyemez (UPDATE)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Authenticated Users                 │
├─────────────────────────────────────┤
│ ✅ Okuyabilir (SELECT)              │
│ ✅ Kendi dosyalarını yazabilir      │
│ ✅ Kendi dosyalarını silebilir      │
│ ✅ Kendi dosyalarını güncelleyebilir│
└─────────────────────────────────────┘
```

### **Private Bucket**

```
private-data (public: false)

┌─────────────────────────────────────┐
│ Herkes (Auth olmadan)               │
├─────────────────────────────────────┤
│ ❌ Okuyamaz (SELECT)                │
│ ❌ Yazamaz (INSERT)                 │
│ ❌ Silemez (DELETE)                 │
│ ❌ Güncelleyemez (UPDATE)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Authenticated Users                 │
├─────────────────────────────────────┤
│ ✅ Okuyabilir (SELECT)              │
│ ✅ Kendi dosyalarını yazabilir      │
│ ✅ Kendi dosyalarını silebilir      │
│ ✅ Kendi dosyalarını güncelleyebilir│
└─────────────────────────────────────┘
```

---

## 🛡️ avatars Bucket Security

### **Mevcut Configuration**

```
Bucket: avatars
Public: ✅ YES (Public Read)
File Size Limit: 2 MB
Allowed MIME Types: image/jpeg, image/png, image/gif, image/webp
```

### **RLS Policies**

```sql
-- Policy 1: Public Read (Herkes okuyabilir)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Policy 2: Authenticated Upload (Sadece kendi klasörüne)
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 3: Authenticated Delete (Sadece kendi dosyaları)
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## ✅ Neden Public Bucket Güvenli?

### **1. RLS Policies Koruması**

```
Herkes okuyabilir ✅
  ↓
Ama yazma/silme için AUTH gerekli ✅
  ↓
Kendi dosyalarını yazabilir ✅
  ↓
Başkasının dosyasını yazamaz ✅
```

### **2. User-Based Folder Structure**

```
avatars/
├── user-1/  ← User 1 sadece buraya yazabilir
│   └── avatar.jpg
├── user-2/  ← User 2 sadece buraya yazabilir
│   └── avatar.jpg
└── user-3/  ← User 3 sadece buraya yazabilir
    └── avatar.jpg
```

**RLS Policy Check:**
```
User 1 upload yapmak istiyor
  ↓
Path: user-2/avatar.jpg
  ↓
auth.uid() = user-1
(storage.foldername(name))[1] = user-2
  ↓
user-1 ≠ user-2 ❌
  ↓
Upload REDDEDILIR ✅
```

### **3. MIME Type Validation**

```
Sadece resim dosyaları kabul edilir:
- image/jpeg ✅
- image/png ✅
- image/gif ✅
- image/webp ✅

Diğer dosyalar reddedilir:
- .exe ❌
- .zip ❌
- .pdf ❌
- .txt ❌
```

### **4. File Size Limit**

```
Maksimum 2MB
  ↓
Büyük dosyalar reddedilir ✅
  ↓
Storage spam'ı önlenir ✅
```

---

## 🎯 Güvenlik Özeti

| Tehdit                             | Kontrol         | Durum     |
| ---------------------------------- | --------------- | --------- |
| Başkasının avatarını silme         | RLS Policy      | ✅ Korundu |
| Başkasının avatarını değiştirme    | RLS Policy      | ✅ Korundu |
| Zararlı dosya yükleme              | MIME Type       | ✅ Korundu |
| Çok büyük dosya yükleme            | File Size Limit | ✅ Korundu |
| Avatarları görememe                | Public Read     | ✅ Tasarım |
| Profil kartlarında avatar gösterme | Public URL      | ✅ Tasarım |

---

## 📊 Public Avatar URL

### **Neden Public URL?**

```
Profil kartlarında avatar göstermek için:

┌─────────────────────────────────┐
│ Profil Kartı                    │
├─────────────────────────────────┤
│ [Avatar Image]                  │
│ https://.../{userId}/avatar.jpg │
│ Display Name                    │
│ Bio                             │
└─────────────────────────────────┘
```

**URL'nin public olması gerekir çünkü:**
1. Herkes profil kartını görebilir
2. Avatar da gösterilmesi gerekir
3. Private URL'ler her istek için auth gerektirir
4. Performance düşer

---

## 🔐 Private Data için Private Bucket

Eğer gizli dosyalar saklamak gerekirse:

```typescript
// Private bucket oluştur
const { data, error } = await supabase.storage.createBucket('private-data', {
  public: false  // ← Private
});

// Sadece authenticated users okuyabilir
// URL'ler temporary (1 saat geçerli)
const { data } = await supabase.storage
  .from('private-data')
  .createSignedUrl('user-1/document.pdf', 3600);
```

---

## 🚀 Best Practices

✅ **Public Bucket** - Avatarlar, profil resimleri  
✅ **Private Bucket** - Gizli belgeler, backup'lar  
✅ **RLS Policies** - Her zaman kullan  
✅ **MIME Type Validation** - Server side de kontrol et  
✅ **File Size Limit** - Spam'ı önle  
✅ **User-Based Folders** - Isolation sağla  
✅ **Signed URLs** - Private dosyalar için  

---

## 🔍 Security Audit Checklist

- [x] RLS Policies aktif
- [x] MIME Type validation
- [x] File size limit (2MB)
- [x] User-based folder structure
- [x] Public read access (intentional)
- [x] Authenticated upload/delete
- [x] No wildcard MIME types
- [x] No executable files allowed

---

## 📚 Referanslar

- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
- [RLS Policies](https://supabase.com/docs/guides/storage/security/row-level-security)
- [Signed URLs](https://supabase.com/docs/guides/storage/security/signed-urls)

---

**Son Güncelleme**: 19 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🚀 Production Ready

---

## 💡 Kısa Cevap

**"Public bucket güvenli mi?"**

✅ **EVET**, çünkü:
1. Herkes okuyabilir (bu amaçlı)
2. Ama yazma/silme için AUTH gerekli
3. RLS policies user isolation sağlıyor
4. MIME type ve file size kontrol var
5. Başkasının dosyasını yazamaz/silemez

**Analoji:**
```
Public bucket = Açık kütüphane
  - Herkes kitap okuyabilir ✅
  - Ama kitap almak için kütüphaneci onay gerekli ✅
  - Başkasının kitabını silemez ✅
```
