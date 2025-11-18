---
title: İPELYA Mobil - Profile Features & Implementation
description: Profile sayfası özellikleri, Vibe Preferences, Avatar Upload, Device History ve Security
---

# 🎨 İPELYA Mobil - Profile Features

**Versiyon**: 1.0.0  
**Durum**: 🚀 In Development  
**Son Güncelleme**: 19 Kasım 2025

---

## 📋 Genel Bakış

Profile yapılandırması, kullanıcının kişisel bilgilerini, tercihlerini ve güvenlik ayarlarını yönetmesini sağlar. Dual identity (real + shadow) sistemi ile entegre çalışır.

---

## 🎯 Yapılacak Özellikler

### **Tier 1: MVP (Kritik)**

#### 1. **Vibe Preferences** 
- Onboarding'de seçilen vibe'ları düzenleme
- Vibe seçenekleri: Masum, Dominant, Girl Next Door, Romantik, Gizemli
- Her vibe'ın renk, emoji ve açıklaması
- Favori vibe seçimi
- Real-time preview

#### 2. **Avatar Upload**
- Image picker (kamera/galeri)
- Crop & resize
- Supabase storage'a yükleme
- Placeholder fallback

#### 3. **Follower/Following Lists**
- Takipçi listesi
- Takip edilen listesi
- Unfollow/block seçenekleri
- Search & filter

### **Tier 2: Post-MVP (Önemli)**

#### 4. **Device History**
- Giriş yapılan cihazlar
- Platform, model, OS, IP
- Son giriş zamanı
- Cihazı çıkart

#### 5. **Privacy Settings**
- Profil görünürlüğü
- Arama sonuçlarında göster/gizle
- Mesaj alabilecek kişiler

#### 6. **Creator Badge Management**
- Creator olmak için başvuru
- Onay durumu
- Creator dashboard erişimi

### **Tier 3: Advanced**

#### 7. **Profile Analytics**
- Profil görüntülenme sayısı
- Takipçi artış grafiği
- En aktif saatler

#### 8. **Social Links**
- Instagram, Twitter, TikTok
- Doğrulama badge'i

---

## 🎨 Vibe Preferences - UI/UX Detayları

### **Vibe Seçenekleri**

```typescript
const vibes = [
  {
    id: "innocent",
    label: "Masum",
    emoji: "😇",
    color: ["#ffd3f3", "#ffa9d7"],
    description: "Tatlı, naif ve oyuncu"
  },
  {
    id: "dominant",
    label: "Dominant",
    emoji: "👑",
    color: ["#10142a", "#501437"],
    description: "Güçlü, otoriter ve kontrollü"
  },
  {
    id: "girl_next_door",
    label: "Girl Next Door",
    emoji: "👧",
    color: ["#f2f4ff", "#c5d3ff"],
    description: "Yaklaşılabilir, samimi ve rahat"
  },
  {
    id: "romantic",
    label: "Romantik",
    emoji: "💕",
    color: ["#fff2da", "#ffb581"],
    description: "Duygusal, hassas ve sevecen"
  },
  {
    id: "mysterious",
    label: "Gizemli",
    emoji: "🌙",
    color: ["#140a1b", "#34244a"],
    description: "Gizli, çekici ve merak uyandırıcı"
  }
];
```

### **Layout**

```
┌─────────────────────────────────────┐
│ ← Profili Düzenle                   │
├─────────────────────────────────────┤
│                                     │
│ Vibe Tercihleri                     │
│ Seni en iyi tanımlayan enerjileri   │
│ seç. Birden fazla seçebilirsin.     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 😇 Masum                        │ │
│ │ Tatlı, naif ve oyuncu           │ │
│ │ [✓ Seçili]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👑 Dominant                     │ │
│ │ Güçlü, otoriter ve kontrollü    │ │
│ │ [ Seç ]                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... (diğer vibe'lar)                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Favori Vibe: Masum              │ │
│ │ (Profil kartında gösterilecek)   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Kaydet] [İptal]                    │
└─────────────────────────────────────┘
```

### **Styling (UI/UX Standards)**

- **Card**: Surface color, 16px border-radius, 1px border
- **Selected State**: Accent color background, 2px border
- **Emoji**: 32px, centered
- **Text**: 
  - Label: 16px, bold, textPrimary
  - Description: 14px, textSecondary
- **Spacing**: 16px gap between cards
- **Animation**: 300ms easeInOut on selection

---

## 📊 Database Schema

### **profiles table (Mevcut)**

```sql
id (uuid)
user_id (uuid)
type ('real' | 'shadow')
display_name (text)
avatar_url (text)
bio (text)
gender ('male' | 'female' | 'lgbt')
is_creator (boolean)
shadow_pin_hash (text)
shadow_unlocked (boolean)
last_device_info (jsonb)
last_ip_address (inet)
last_login_at (timestamptz)
device_token (text)
created_at (timestamptz)
updated_at (timestamptz)
```

### **Yeni Kolonlar (Yapılacak)**

```sql
-- Vibe Preferences
vibe_preferences (jsonb) -- ["innocent", "dominant", "romantic"]
favorite_vibe (text) -- "innocent"

-- Avatar
avatar_storage_path (text) -- "avatars/user_id/filename"

-- Privacy
profile_visibility (text) -- "public" | "private" | "followers_only"
searchable (boolean) -- Arama sonuçlarında göster
allow_messages_from (text) -- "anyone" | "followers" | "none"

-- Creator
is_creator_verified (boolean)
creator_application_status (text) -- "pending" | "approved" | "rejected"

-- Analytics
profile_views_count (integer)
followers_count (integer)
following_count (integer)
```

---

## 🔗 API Endpoints (Supabase)

### **Vibe Preferences Güncelleme**

```typescript
// POST /rest/v1/profiles
// Update vibe preferences
const { error } = await supabase
  .from('profiles')
  .update({
    vibe_preferences: ['innocent', 'romantic'],
    favorite_vibe: 'innocent'
  })
  .eq('user_id', userId)
  .eq('type', 'real');
```

### **Avatar Upload**

```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/${filename}`, file);

// Update profile
await supabase
  .from('profiles')
  .update({ avatar_url: publicUrl })
  .eq('user_id', userId)
  .eq('type', 'real');
```

---

## 📁 File Structure

```
apps/mobile/app/(profile)/
├── index.tsx              (Profile View)
├── edit.tsx               (Profile Edit)
├── shadow-pin.tsx         (Shadow PIN)
└── vibe-preferences.tsx   (Vibe Preferences) ← NEW

apps/mobile/src/
├── components/profile/
│   ├── VibeCard.tsx       (Vibe selection card)
│   ├── VibeSelector.tsx   (Vibe selector component)
│   └── AvatarUploader.tsx (Avatar upload)
├── hooks/
│   ├── useProfileUpdate.ts
│   └── useVibePreferences.ts
└── services/
    └── profile.service.ts
```

---

## 🎯 Implementation Checklist

### **Vibe Preferences**
- [ ] Vibe seçim UI'ı tasarla
- [ ] Multiple selection logic
- [ ] Favorite vibe seçimi
- [ ] Supabase update
- [ ] Real-time preview
- [ ] Error handling
- [ ] Loading states

### **Avatar Upload**
- [ ] Image picker
- [ ] Crop/resize
- [ ] Storage upload
- [ ] URL update
- [ ] Fallback avatar

### **Follower/Following**
- [ ] List UI
- [ ] Pagination
- [ ] Search/filter
- [ ] Action buttons

---

## 🚀 Geliştirme Sırası

1. **Vibe Preferences** (Bu hafta)
2. **Avatar Upload** (Sonraki hafta)
3. **Follower/Following Lists** (2 hafta sonra)
4. **Device History** (Post-MVP)
5. **Privacy Settings** (Post-MVP)

---

**Son Güncelleme**: 19 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: 🚀 Ready to Start
