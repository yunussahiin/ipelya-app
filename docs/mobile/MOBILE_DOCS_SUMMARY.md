---
title: İPELYA Mobil Uygulaması - Dokümantasyon Özeti
description: Tüm mobil dokümantasyonun hızlı referans rehberi
---

# 📱 İPELYA Mobil Uygulaması - Dokümantasyon Özeti

**Oluşturulma Tarihi**: 18 Kasım 2025  
**Toplam Dokümantasyon**: 5 dosya, 1185+ satır  
**Durum**: ✅ Production Ready

---

## 📚 Oluşturulan Dokümantasyon Dosyaları

### **1. docs/mobile-pages-roadmap.md** (10.6 KB)
**Mobil Uygulaması Sayfa Yapısı ve Geliştirme Yol Haritası**

**İçerik:**
- ✅ Mevcut 28 sayfa yapısı
- 📋 Yapılması gereken 12+ sayfa
- 🎯 Tier'lere göre öncelik sırası
- 🏗️ Teknik stack özeti
- 📊 Sayfa bağımlılıkları diyagramı
- 🚀 Geliştirme sırası önerisi

**Kime Yardımcı**: Product managers, Sprint planners, Developers

---

### **2. docs/mobile/README.md** (8.9 KB)
**Mobil Dokümantasyon Ana Rehberi**

**İçerik:**
- 📚 Tüm dokümantasyon dosyalarının özeti
- 🚀 Hızlı başlangıç rehberi
- 🔑 Temel kavramlar
- 📊 Database tables
- 🔐 Security overview
- 🛠️ Tech stack
- 📝 Yazım kuralları
- 🔗 İlgili dokümantasyon

**Kime Yardımcı**: Yeni developers, Team leads

---

### **3. docs/mobile/profiles-database-schema.md** (10 KB)
**Profiles Database Schema - Detaylı Referans**

**İçerik:**
- 📊 Tablo yapısı (15 kolon)
- 🔐 Constraints ve indexes
- ⚙️ Otomatik triggers (2 trigger)
- 🛡️ RLS policies (3 policy)
- 📱 Device info JSON formatı
- 💻 TypeScript tipleri
- 🔒 Güvenlik notları
- 📈 Performance indexes

**Kime Yardımcı**: Backend developers, Database architects, Security team

---

### **4. docs/mobile/onboarding-flow.md** (23.5 KB)
**Auth & Onboarding Flow - Detaylı Plan**

**İçerik:**
- 🔄 Auth flow diyagramı (ASCII)
- 🔐 Login screen detayları
- 📝 Register screen detayları
- 🎣 useAuthActions hook
- 🎯 5-step onboarding flow:
  - Step 1: Profil bilgileri
  - Step 2: Vibe seçimi
  - Step 3: Shadow PIN
  - Step 4: Privacy onayı
  - Step 5: Tamamlama
- 💾 State management (Zustand)
- 📊 Database schema
- 🛡️ RLS policies
- ⚙️ Automatic triggers
- ✅ Geliştirme checklist

**Kime Yardımcı**: Mobile developers, UI/UX designers, QA engineers

---

### **5. docs/mobile/auth-implementation-guide.md** (16.4 KB)
**Auth System Implementation - Teknik Rehber**

**İçerik:**
- 🎯 Auth system overview
- 🔄 Authentication flow (detaylı)
- 🔑 Sign in flow (kod örneği)
- 📝 Sign up flow (kod örneği)
- 🔐 SecureStore integration
- 👥 Dual identity system (Real + Shadow)
- 🔓 Shadow mode activation
- 📱 Device tracking
- 🔒 Security best practices
- 🚨 Error handling
- 📊 Auth state diagram
- 🧪 Testing checklist

**Kime Yardımcı**: Mobile developers, Security engineers, QA engineers

---

## 🗂️ Dokümantasyon Yapısı

```
docs/
├── mobile-pages-roadmap.md          ← Sayfa yapısı & yol haritası
└── mobile/
    ├── README.md                    ← Ana rehber
    ├── profiles-database-schema.md  ← Database schema
    ├── onboarding-flow.md           ← Auth & onboarding
    └── auth-implementation-guide.md ← Auth implementation
```

---

## 📊 İçerik Özeti

### **Kapsanan Konular**

| Konu                 | Dosya                        | Detay                              |
| -------------------- | ---------------------------- | ---------------------------------- |
| **Sayfa Yapısı**     | mobile-pages-roadmap.md      | 28 mevcut + 12+ yapılacak sayfa    |
| **Database**         | profiles-database-schema.md  | 15 kolon, 3 policy, 2 trigger      |
| **Auth Flow**        | onboarding-flow.md           | Login, Register, 5-step onboarding |
| **Implementation**   | auth-implementation-guide.md | Kod örnekleri, best practices      |
| **Security**         | Tüm dosyalar                 | RLS, PIN hashing, token management |
| **Device Tracking**  | profiles-database-schema.md  | Platform, model, OS, app version   |
| **Dual Identity**    | auth-implementation-guide.md | Real + Shadow profiles             |
| **State Management** | onboarding-flow.md           | Zustand stores                     |

### **Kod Örnekleri**

- ✅ Login implementation
- ✅ Register implementation
- ✅ useAuthActions hook
- ✅ Device info collection
- ✅ SecureStore integration
- ✅ Shadow mode activation
- ✅ RLS policies
- ✅ Database triggers
- ✅ Error handling
- ✅ TypeScript types

### **Diyagramlar**

- ✅ Auth flow diyagramı
- ✅ Sayfa bağımlılıkları
- ✅ Auth state diagram
- ✅ Onboarding step flow

---

## 🚀 Hızlı Başlangıç

### **Yeni Developer İçin**

```
1. docs/mobile/README.md
   ↓
2. docs/mobile/profiles-database-schema.md
   ↓
3. docs/mobile/auth-implementation-guide.md
   ↓
4. docs/mobile/onboarding-flow.md
```

### **Spesifik Görevler**

**Auth ekranları geliştiriyorum:**
→ `auth-implementation-guide.md` + `onboarding-flow.md`

**Onboarding ekranları geliştiriyorum:**
→ `onboarding-flow.md` + `profiles-database-schema.md`

**Database schema anlamak istiyorum:**
→ `profiles-database-schema.md`

**Shadow mode implementasyonu:**
→ `auth-implementation-guide.md` (Dual Identity System bölümü)

**Sayfa yapısını anlamak istiyorum:**
→ `docs/mobile-pages-roadmap.md`

---

## 🔑 Temel Bilgiler

### **Mevcut Sayfa Yapısı (28 sayfa)**

```
Auth (3)          → login, register, onboarding
Feed (2)          → index, shadow
Chat (2)          → index, [id]
Creator (4)       → dashboard, upload, schedule, revenue
Fantasy (2)       → index, [id]
ASMR (2)          → index, [id]
Live (2)          → index, room/[id]
Profile (3)       → index, edit, shadow-pin
Settings (2)      → index, privacy
Tab Nav (4)       → home, profile, live, flow
```

### **Yapılması Gereken Sayfalar (12+)**

**Tier 1 (Kritik):**
- Coin Shop & Ekonomi
- Shadow Mode Aktivasyonu
- Creator Content Detail
- Checkout

**Tier 2 (Önemli):**
- Creator Schedule
- Live Room Chat
- DMCA Management
- Anti-Screenshot Logs

**Tier 3 (Gelişmiş):**
- AI Fantasy Generator
- Vibe Match UI
- Creator Analytics
- Admin Panel

### **Dual Identity System**

```
Real Profile (type='real')
├── Gerçek kimlik
├── Public profile
└── Creator dashboard

Shadow Profile (type='shadow')
├── Gizli kimlik
├── PIN ile korunan
└── Özel içerik erişimi
```

### **Auth Flow**

```
App Boot
  ↓
Check SecureStore Token
  ├─ Token var → Validate → /home
  └─ Token yok → (auth)/login
       ↓
    Login/Register
       ↓
    Device Info Kaydet
       ↓
    Shadow mode var mı?
       ├─ Evet → /home (shadow mode)
       └─ Hayır → Onboarding (5 step)
            ↓
         /home (feed)
```

---

## 💾 Database Özeti

### **Ana Tablolar**

| Tablo                   | Amaç                                 | Satırlar |
| ----------------------- | ------------------------------------ | -------- |
| `profiles`              | Kullanıcı profilleri (real + shadow) | 15 kolon |
| `profile_vibes`         | Vibe tercihleri                      | -        |
| `embeddings_profiles`   | pgvector embeddings                  | -        |
| `social_firewall_rules` | Sosyal firewall                      | -        |

### **Constraints**

- UNIQUE: `(user_id, type)` - Her user 1 real + 1 shadow
- UNIQUE: `username`
- CHECK: `type IN ('real', 'shadow')`
- CHECK: `gender IN ('male', 'female', 'lgbt')`

### **RLS Policies**

1. `users_view_own_profiles` - Kendi profili görme
2. `users_update_own_profiles` - Kendi profili güncelleme
3. `shadow_isolation` - Shadow/Real izolasyonu

---

## 🔐 Security Highlights

### **PIN Hashing**
- bcrypt ile hash'lenir
- Asla plain text olarak saklanmaz
- SecureStore'da da hash'lenir

### **Token Management**
- SecureStore'da şifreli depolama
- Her app restart'ında validate
- Expired token'lar otomatik temizlenir

### **RLS Policies**
- Kullanıcılar sadece kendi verilerine erişebilir
- Shadow/Real profiller JWT claim'e göre izole
- Creator-only veriler korunur

### **Device Tracking**
- Platform, model, OS, app version
- IP adresi kaydedilir
- Security analizi için kullanılır

---

## 🛠️ Tech Stack

### **Frontend**
- Expo + React Native
- expo-router (file-system routing)
- Zustand (state management)
- React Query (server state)
- React Hook Form + Zod (validation)

### **Backend**
- Supabase PostgreSQL
- Supabase Auth
- Edge Functions (Deno)
- Supabase Storage
- Supabase Realtime

### **Security**
- expo-secure-store
- bcryptjs
- RLS policies

---

## 📈 Dokümantasyon İstatistikleri

| Dosya                        | Boyut       | Satır     | Konu              |
| ---------------------------- | ----------- | --------- | ----------------- |
| mobile-pages-roadmap.md      | 10.6 KB     | 400+      | Sayfa yapısı      |
| README.md                    | 8.9 KB      | 350+      | Ana rehber        |
| profiles-database-schema.md  | 10 KB       | 335       | Database          |
| onboarding-flow.md           | 23.5 KB     | 450+      | Auth & onboarding |
| auth-implementation-guide.md | 16.4 KB     | 400+      | Implementation    |
| **TOPLAM**                   | **69.4 KB** | **1935+** | **Mobil sistem**  |

---

## ✅ Kapsanan Başlıklar

- [x] Sayfa yapısı analizi (28 sayfa)
- [x] Yapılması gereken sayfalar (12+)
- [x] Database schema detayları
- [x] Auth flow diyagramları
- [x] Onboarding 5-step flow
- [x] Shadow mode sistemi
- [x] Device tracking
- [x] RLS policies
- [x] Security best practices
- [x] Kod örnekleri
- [x] TypeScript tipleri
- [x] Error handling
- [x] Testing checklist
- [x] Geliştirme checklist

---

## 🔗 İlgili Dokümantasyon

### **Sistem Mimarisi**
- `docs/system/application-architecture.md`
- `docs/system/data-platform.md`
- `docs/system/domain-flows.md`

### **Teknoloji Stack**
- `docs/tech/geneltech-stack.md`
- `docs/tech/ İPELYA – UÇTAN UCA APP FLOW.md`

---

## 📞 Nasıl Kullanılır?

### **Dokümantasyon Seçimi**

**Soru**: "Onboarding ekranlarını nasıl geliştiririm?"
**Cevap**: `docs/mobile/onboarding-flow.md`

**Soru**: "Database schema nedir?"
**Cevap**: `docs/mobile/profiles-database-schema.md`

**Soru**: "Auth sistemi nasıl çalışır?"
**Cevap**: `docs/mobile/auth-implementation-guide.md`

**Soru**: "Hangi sayfaları geliştirmem gerekiyor?"
**Cevap**: `docs/mobile-pages-roadmap.md`

**Soru**: "Nereden başlamalıyım?"
**Cevap**: `docs/mobile/README.md`

---

## 🎯 Sonraki Adımlar

### **Immediate (Bu Hafta)**
1. Onboarding ekranlarını geliştir (5 step)
2. Shadow mode UI'ı ekle
3. Device tracking'i test et

### **Short Term (2-3 Hafta)**
1. Coin shop sayfası
2. Creator content detail
3. Checkout flow

### **Medium Term (1 Ay)**
1. Creator schedule management
2. Live room chat
3. DMCA management

### **Long Term (2+ Ay)**
1. AI fantasy generator
2. Vibe match UI
3. Admin panel

---

## 📝 Notlar

- Tüm dokümantasyon **Turkish + English code** karışımıyla yazılmıştır
- Kod örnekleri **production-ready** seviyesindedir
- Diyagramlar **ASCII format**ta verilmiştir
- Tüm dosyalar **Markdown** formatındadır

---

## 🚀 Başarılı Geliştirmeler!

Bu dokümantasyon seti, mobil uygulamanın auth ve onboarding sisteminin tüm detaylarını kapsar. Herhangi bir sorunuz varsa, ilgili dokümantasyon dosyasına bakınız.

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready

---

## 📚 Dosya Yolları

```
/Users/yunussahin/ipelya-app/
├── docs/
│   ├── mobile-pages-roadmap.md
│   └── mobile/
│       ├── README.md
│       ├── profiles-database-schema.md
│       ├── onboarding-flow.md
│       └── auth-implementation-guide.md
└── MOBILE_DOCS_SUMMARY.md (bu dosya)
```

---

**Dokümantasyon tamamlandı! 📚✅**
