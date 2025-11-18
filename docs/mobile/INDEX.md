---
title: İPELYA Mobil Dokümantasyon - İndeks
description: Tüm mobil dokümantasyonun merkezi indeksi
---

# 📑 İPELYA Mobil Dokümantasyon - İndeks

Mobil uygulamanın tüm teknik dokümantasyonunun merkezi indeksi.

**Oluşturulma Tarihi**: 18 Kasım 2025  
**Toplam Dosya**: 6 dokümantasyon  
**Toplam Satır**: 2000+  
**Durum**: ✅ Production Ready

---

## 📚 Dokümantasyon Dosyaları

### **1. 🚀 README.md** - Ana Rehber
**Başlangıç noktası - Tüm dokümantasyonun özeti**

- 📖 Hızlı başlangıç rehberi
- 🔑 Temel kavramlar
- 📊 Database tables
- 🔐 Security overview
- 🛠️ Tech stack
- 📝 Yazım kuralları

**Okuma Süresi**: 10-15 dakika  
**Kime Yardımcı**: Herkes (başlangıç)

**Başla**: `docs/mobile/README.md`

---

### **2. 💾 profiles-database-schema.md** - Database Referansı
**Profiles tablosunun detaylı şeması ve yapısı**

- 📊 Tablo yapısı (15 kolon)
- 🔐 Constraints ve indexes
- ⚙️ Otomatik triggers (2)
- 🛡️ RLS policies (3)
- 📱 Device info JSON
- 💻 TypeScript tipleri
- 🔒 Güvenlik notları

**Okuma Süresi**: 20-25 dakika  
**Kime Yardımcı**: Backend devs, DBAs, Security

**Başla**: `docs/mobile/profiles-database-schema.md`

---

### **3. 🔐 auth-implementation-guide.md** - Auth Sistemi
**Auth, shadow mode, device tracking ve security**

- 🎯 Auth system overview
- 🔄 Authentication flow (detaylı)
- 🔑 Sign in/up flow (kod)
- 🔐 SecureStore integration
- 👥 Dual identity system
- 🔓 Shadow mode activation
- 📱 Device tracking
- 🔒 Security best practices
- 🚨 Error handling
- 📊 Auth state diagram
- 🧪 Testing checklist

**Okuma Süresi**: 25-30 dakika  
**Kime Yardımcı**: Mobile devs, Security, QA

**Başla**: `docs/mobile/auth-implementation-guide.md`

---

### **4. 🎯 onboarding-flow.md** - Onboarding & Auth Screens
**Login, register ve 5-step onboarding ekranları**

- 🔄 Auth flow diyagramı
- 🔐 Login screen detayları
- 📝 Register screen detayları
- 🎣 useAuthActions hook
- 🎯 5-step onboarding flow
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

**Okuma Süresi**: 30-35 dakika  
**Kime Yardımcı**: Mobile devs, UI/UX, QA

**Başla**: `docs/mobile/onboarding-flow.md`

---

### **5. ⚡ QUICK_REFERENCE.md** - Hızlı Referans
**Sık kullanılan bilgiler ve kod örnekleri**

- 🎯 Hangi dokümantasyonu okumalıyım?
- 📊 Mevcut sayfa yapısı (28 sayfa)
- 🎯 Yapılması gereken sayfalar (12+)
- 🔐 Auth flow (hızlı özet)
- 💾 Database tables (referans)
- 🔐 RLS policies (referans)
- 📱 Device info JSON
- 🔑 Zustand stores
- 🛠️ Sık kullanılan kodlar
- 🔒 Security checklist
- 🚀 Geliştirme sırası
- 📞 Sık sorulan sorular

**Okuma Süresi**: 5-10 dakika  
**Kime Yardımcı**: Herkes (hızlı referans)

**Başla**: `docs/mobile/QUICK_REFERENCE.md`

---

### **6. 📑 INDEX.md** - Bu Dosya
**Tüm dokümantasyonun merkezi indeksi**

---

## 🗺️ Dokümantasyon Haritası

```
START HERE
    ↓
README.md (Ana Rehber)
    ↓
    ├─→ profiles-database-schema.md (Database)
    │       ↓
    │   (Tablo yapısı, RLS, triggers)
    │
    ├─→ auth-implementation-guide.md (Auth)
    │       ↓
    │   (Login, register, security)
    │
    ├─→ onboarding-flow.md (UI)
    │       ↓
    │   (5-step flow, screens)
    │
    └─→ QUICK_REFERENCE.md (Hızlı Ref)
            ↓
        (Kod örnekleri, checklist)
```

---

## 🎯 Görev Bazlı Rehber

### **"Yeni başlıyorum"**
1. README.md (10 min)
2. QUICK_REFERENCE.md (5 min)
3. Diğer dosyaları ihtiyaç duyduğunda oku

### **"Auth ekranları geliştiriyorum"**
1. auth-implementation-guide.md (25 min)
2. onboarding-flow.md (30 min)
3. QUICK_REFERENCE.md (5 min)

### **"Onboarding geliştiriyorum"**
1. onboarding-flow.md (30 min)
2. profiles-database-schema.md (20 min)
3. auth-implementation-guide.md (25 min)

### **"Database schema anlamak istiyorum"**
1. profiles-database-schema.md (25 min)
2. QUICK_REFERENCE.md (5 min)

### **"Shadow mode implementasyonu"**
1. auth-implementation-guide.md - Dual Identity System (10 min)
2. profiles-database-schema.md - RLS Policies (10 min)
3. QUICK_REFERENCE.md (5 min)

### **"Hızlı referans lazım"**
1. QUICK_REFERENCE.md (5 min)

---

## 📊 Dokümantasyon İstatistikleri

| Dosya                        | Boyut       | Satır     | Konu             | Okuma          |
| ---------------------------- | ----------- | --------- | ---------------- | -------------- |
| README.md                    | 8.9 KB      | 350+      | Ana rehber       | 10-15 min      |
| profiles-database-schema.md  | 10 KB       | 335       | Database         | 20-25 min      |
| auth-implementation-guide.md | 16.4 KB     | 400+      | Auth             | 25-30 min      |
| onboarding-flow.md           | 23.5 KB     | 450+      | Onboarding       | 30-35 min      |
| QUICK_REFERENCE.md           | 12 KB       | 350+      | Hızlı ref        | 5-10 min       |
| INDEX.md                     | 8 KB        | 250+      | İndeks           | 5 min          |
| **TOPLAM**                   | **78.8 KB** | **2135+** | **Mobil sistem** | **95-115 min** |

---

## 🔑 Temel Konular

### **Sayfa Yapısı**
- 28 mevcut sayfa
- 12+ yapılması gereken sayfa
- Tier'lere göre öncelik

**Dosya**: `docs/mobile-pages-roadmap.md`

### **Database**
- Profiles tablosu (15 kolon)
- 3 RLS policy
- 2 automatic trigger
- Device tracking

**Dosya**: `profiles-database-schema.md`

### **Auth Flow**
- Login/Register
- Token management
- SecureStore integration
- Device info tracking

**Dosya**: `auth-implementation-guide.md`

### **Onboarding**
- 5-step flow
- Form validation
- State management
- Database integration

**Dosya**: `onboarding-flow.md`

### **Security**
- PIN hashing (bcrypt)
- RLS policies
- Token management
- Shadow/Real isolation

**Dosya**: Tüm dosyalarda

---

## 🚀 Başlangıç Adımları

### **Gün 1: Temel Bilgiler**
- [ ] README.md oku (15 min)
- [ ] QUICK_REFERENCE.md oku (10 min)
- [ ] Temel kavramları anla

### **Gün 2: Database**
- [ ] profiles-database-schema.md oku (25 min)
- [ ] Tablo yapısını anla
- [ ] RLS policies'i anla

### **Gün 3: Auth**
- [ ] auth-implementation-guide.md oku (30 min)
- [ ] Auth flow'u anla
- [ ] Security best practices'i anla

### **Gün 4: Onboarding**
- [ ] onboarding-flow.md oku (35 min)
- [ ] 5-step flow'u anla
- [ ] Kod örneklerini inceле

### **Gün 5: Geliştirmeye Başla**
- [ ] İlk ekranı geliştir
- [ ] QUICK_REFERENCE.md'ye referans ver
- [ ] Sorularını dokümantasyonda ara

---

## 💡 İpuçları

### **Hızlı Başlamak İçin**
1. QUICK_REFERENCE.md'yi oku
2. İlgili bölümü bulunca detaylı dosyaya git
3. Kod örneklerini kopyala ve adapt et

### **Derinlemesine Anlamak İçin**
1. README.md'den başla
2. Sırasıyla tüm dosyaları oku
3. Kod örneklerini çalıştır ve test et

### **Sorun Çözmek İçin**
1. QUICK_REFERENCE.md'deki "Sık Sorulan Sorular"'a bak
2. İlgili dokümantasyon dosyasını oku
3. Kod örneklerini kontrol et

---

## 🔗 Dosya Yolları

```
/Users/yunussahin/ipelya-app/
├── docs/
│   ├── mobile-pages-roadmap.md
│   └── mobile/
│       ├── INDEX.md (bu dosya)
│       ├── README.md
│       ├── QUICK_REFERENCE.md
│       ├── profiles-database-schema.md
│       ├── onboarding-flow.md
│       └── auth-implementation-guide.md
└── MOBILE_DOCS_SUMMARY.md
```

---

## 📞 Hızlı Bağlantılar

| Soru                  | Dosya                        | Bölüm               |
| --------------------- | ---------------------------- | ------------------- |
| Nereden başlamalıyım? | README.md                    | Hızlı Başlangıç     |
| Database nedir?       | profiles-database-schema.md  | Tablo Yapısı        |
| Auth nasıl çalışır?   | auth-implementation-guide.md | Authentication Flow |
| Onboarding nedir?     | onboarding-flow.md           | 5-Step Onboarding   |
| Hızlı referans        | QUICK_REFERENCE.md           | Tüm Bölümler        |
| Sayfa yapısı          | mobile-pages-roadmap.md      | Mevcut Sayfalar     |

---

## ✅ Checklist

- [x] README.md - Ana rehber
- [x] profiles-database-schema.md - Database
- [x] auth-implementation-guide.md - Auth
- [x] onboarding-flow.md - Onboarding
- [x] QUICK_REFERENCE.md - Hızlı referans
- [x] INDEX.md - İndeks (bu dosya)
- [x] MOBILE_DOCS_SUMMARY.md - Özet

---

## 🎯 Sonraki Adımlar

1. **Bugün**: README.md oku
2. **Yarın**: Görevine uygun dosyayı oku
3. **Gün 3+**: Geliştirmeye başla

---

## 📝 Notlar

- Tüm dokümantasyon **Markdown** formatında
- Kod örnekleri **TypeScript** ile
- Diyagramlar **ASCII** formatında
- Tüm dosyalar **production-ready**

---

## 🚀 Başarılı Geliştirmeler!

Herhangi bir sorunuz varsa, ilgili dokümantasyon dosyasına bakınız.

---

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready

---

**Tüm dokümantasyon hazır! 📚✅**
