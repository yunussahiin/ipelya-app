---
title: İPELYA Mobil Uygulaması - Dokümantasyon
description: Mobil uygulamanın tüm teknik dokümantasyonu ve rehberi
---

# 📱 İPELYA Mobil Uygulaması - Dokümantasyon

Mobil uygulamanın tüm teknik detaylarını, mimarisini ve geliştirme rehberini içerir.

---

## 📚 Dokümantasyon Dosyaları

### **1. Profiles Database Schema** 📊
**Dosya**: `profiles-database-schema.md`

Profiles tablosunun yapısı, RLS politikaları ve mobil entegrasyonunu detaylı olarak anlatır.

**İçerik:**
- Tablo yapısı ve kolonlar
- Constraints ve indexes
- Otomatik triggers
- RLS policies
- Device info JSON formatı
- TypeScript tipleri
- Güvenlik notları

**Kime Yardımcı:**
- Backend developers (DB schema)
- Mobile developers (integration)
- Security team (RLS policies)

---

### **2. Onboarding Flow** 🎯
**Dosya**: `onboarding-flow.md`

Auth, signup, login ve onboarding ekranlarının detaylı planı.

**İçerik:**
- Auth flow diyagramı
- Login ekranı detayları
- Register ekranı detayları
- useAuthActions hook
- 5-step onboarding flow
- State management (Zustand)
- Database schema
- RLS policies
- Automatic triggers
- Geliştirme checklist

**Kime Yardımcı:**
- Mobile developers (UI implementation)
- Product managers (flow planning)
- QA engineers (testing)

---

### **3. Auth Implementation Guide** 🔐
**Dosya**: `auth-implementation-guide.md`

Auth sistemi, shadow mode, device tracking ve security best practices.

**İçerik:**
- Auth system overview
- Authentication flow
- Sign in flow
- Sign up flow
- SecureStore integration
- Dual identity system
- Shadow mode activation
- Device tracking
- Security best practices
- Error handling
- Auth state diagram
- Testing checklist

**Kime Yardımcı:**
- Mobile developers (implementation)
- Security engineers (best practices)
- QA engineers (testing)

---

## 🗂️ Dosya Yapısı

```
docs/mobile/
├── README.md (bu dosya)
├── profiles-database-schema.md
├── onboarding-flow.md
└── auth-implementation-guide.md
```

---

## 🚀 Hızlı Başlangıç

### **Yeni Developer İçin**

1. **Başla**: `README.md` (bu dosya)
2. **Anla**: `profiles-database-schema.md` - Database yapısını öğren
3. **Implement**: `auth-implementation-guide.md` - Auth sistemi nasıl çalışır
4. **Build**: `onboarding-flow.md` - Onboarding ekranlarını geliştir

### **Spesifik Görevler**

**Auth ekranları geliştiriyorum:**
→ `auth-implementation-guide.md` + `onboarding-flow.md`

**Onboarding ekranları geliştiriyorum:**
→ `onboarding-flow.md` + `profiles-database-schema.md`

**Database schema anlamak istiyorum:**
→ `profiles-database-schema.md`

**Shadow mode implementasyonu:**
→ `auth-implementation-guide.md` (Dual Identity System)

---

## 🔑 Temel Kavramlar

### **Dual Identity (Real + Shadow)**

Her kullanıcı 2 profile'a sahiptir:

- **Real Profile** (`type='real'`)
  - Gerçek kimlik
  - Public profile
  - Creator dashboard erişimi

- **Shadow Profile** (`type='shadow'`)
  - Gizli kimlik
  - PIN ile korunan
  - Özel içerik erişimi

### **Auth Flow**

```
App Boot → Check Token → Login/Register → Device Info → Onboarding → Home
```

### **Device Tracking**

Her login'de kaydedilen bilgiler:
- Platform (iOS/Android)
- Model (iPhone 15 Pro, etc.)
- OS Version
- App Version
- Device ID
- IP Address
- Login Time

### **RLS (Row Level Security)**

Tüm profil verileri RLS ile korunur:
- Kullanıcılar sadece kendi verilerine erişebilir
- Shadow/Real profiller JWT claim'e göre izole edilir

---

## 📊 Database Tables

### **profiles**
Kullanıcı profil bilgileri (real + shadow)

| Kolon              | Tip         | Açıklama           |
| ------------------ | ----------- | ------------------ |
| `id`               | uuid        | Primary key        |
| `user_id`          | uuid        | Auth user ID       |
| `type`             | text        | 'real' \| 'shadow' |
| `display_name`     | text        | Görünen ad         |
| `avatar_url`       | text        | Avatar URL         |
| `bio`              | text        | Biyografi          |
| `gender`           | text        | Cinsiyet           |
| `shadow_pin_hash`  | text        | PIN hash           |
| `last_device_info` | jsonb       | Device metadata    |
| `last_login_at`    | timestamptz | Son login          |

### **profile_vibes**
Vibe tercihleri

### **embeddings_profiles**
pgvector embeddings (recommendation engine)

### **social_firewall_rules**
Sosyal firewall kuralları

---

## 🔐 Security

### **PIN Hashing**
- PIN'ler asla plain text olarak saklanmaz
- Supabase'de bcrypt ile hash'lenir
- SecureStore'da da hash'lenir

### **Token Management**
- Token'lar SecureStore'da şifreli olarak saklanır
- Her app restart'ında validate edilir
- Expired token'lar otomatik temizlenir

### **RLS Policies**
- Kullanıcılar sadece kendi verilerine erişebilir
- Shadow/Real profiller JWT claim'e göre izole edilir
- Creator-only veriler korunur

---

## 🛠️ Tech Stack

### **Frontend**
- Expo + React Native
- expo-router (file-system routing)
- Zustand (state management)
- React Query (server state)
- React Hook Form + Zod (form validation)

### **Backend**
- Supabase PostgreSQL
- Supabase Auth
- Edge Functions (Deno)
- Supabase Storage
- Supabase Realtime

### **Security**
- expo-secure-store (token storage)
- bcryptjs (PIN hashing)
- RLS policies (data protection)

---

## 📝 Yazım Kuralları

### **Dosya Adlandırması**
- kebab-case: `onboarding-flow.md`
- Türkçe başlık: `# İPELYA Mobil - Onboarding Flow`

### **Kod Blokları**
```typescript
// Kod örneği
const example = () => {
  console.log("Hello");
};
```

### **Diyagramlar**
ASCII diyagramlar veya Mermaid kullanılır:
```
┌─────────┐
│ Start   │
└────┬────┘
     │
     ▼
┌─────────┐
│ Process │
└────┬────┘
     │
     ▼
┌─────────┐
│ End     │
└─────────┘
```

---

## 🔗 İlgili Dokümantasyon

### **Sistem Mimarisi**
- `docs/system/application-architecture.md` - Genel mimari
- `docs/system/data-platform.md` - Supabase şeması
- `docs/system/domain-flows.md` - Kullanıcı akışları

### **Teknoloji Stack**
- `docs/tech/geneltech-stack.md` - Tech stack detayları
- `docs/tech/ İPELYA – UÇTAN UCA APP FLOW.md` - Detaylı akışlar

### **Mobil Sayfalar**
- `docs/mobile-pages-roadmap.md` - Sayfa yapısı ve yol haritası

---

## 📋 Geliştirme Checklist

### **Phase 1: Auth System**
- [x] Login ekranı
- [x] Register ekranı
- [x] useAuthActions hook
- [ ] Onboarding ekranları (5 step)
- [ ] Shadow mode UI

### **Phase 2: Profile Management**
- [ ] Profile edit ekranı
- [ ] Avatar upload
- [ ] Vibe preferences
- [ ] Device history

### **Phase 3: Security**
- [ ] Anti-screenshot logging
- [ ] Social firewall
- [ ] DMCA management
- [ ] Security alerts

### **Phase 4: Testing**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Security audit

---

## 🚨 Sık Sorulan Sorular

**S: Shadow mode nasıl çalışır?**
A: Her kullanıcı 2 profile'a sahiptir. Shadow profile PIN ile korunur ve JWT claim'e göre izole edilir. Bkz: `auth-implementation-guide.md`

**S: Device info neden kaydediliyor?**
A: Security analizi, cihaz takibi ve fraud detection için. Bkz: `profiles-database-schema.md`

**S: Onboarding kaç adımdan oluşur?**
A: 5 adım: Profil → Vibe → Shadow PIN → Privacy → Complete. Bkz: `onboarding-flow.md`

**S: PIN'ler nasıl saklanır?**
A: bcrypt ile hash'lenir, asla plain text olarak saklanmaz. Bkz: `auth-implementation-guide.md`

**S: RLS nedir?**
A: Row Level Security - Supabase'in veri koruma mekanizması. Kullanıcılar sadece kendi verilerine erişebilir. Bkz: `profiles-database-schema.md`

---

## 📞 İletişim & Destek

- **Technical Questions**: Bkz ilgili dokümantasyon dosyası
- **Bug Reports**: GitHub issues
- **Feature Requests**: Product team

---

## 📊 Dokümantasyon İstatistikleri

| Dosya                          | Satır     | Konu                    |
| ------------------------------ | --------- | ----------------------- |
| `profiles-database-schema.md`  | 335       | Database schema         |
| `onboarding-flow.md`           | 450+      | Auth & onboarding       |
| `auth-implementation-guide.md` | 400+      | Auth system             |
| **TOPLAM**                     | **1185+** | **Mobil auth & profil** |

---

## 🔄 Güncelleme Tarihi

- **Son Güncelleme**: 18 Kasım 2025
- **Versiyon**: 1.0.0
- **Durum**: ✅ Production Ready

---

## 📖 Okuma Sırası Önerisi

1. **Bu dosya** (README.md) - Genel bakış
2. `profiles-database-schema.md` - Database yapısı
3. `auth-implementation-guide.md` - Auth sistemi
4. `onboarding-flow.md` - Onboarding detayları

---

**Başarılı geliştirmeler! 🚀**
