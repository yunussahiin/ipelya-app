# Shadow Profil Sistemi

## 📖 Dokümantasyon

Bu klasör Shadow Profil sisteminin kapsamlı dokümantasyonunu içerir.

### 📚 Dokümantasyon İçeriği

1. **[OVERVIEW.md](./OVERVIEW.md)** - Genel Bakış
   - Shadow profil nedir?
   - Neden gerekli?
   - Nasıl çalışır?
   - Auth ve session yönetimi
   - Database yapısı

2. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Teknik Implementasyon
   - Hook'lar (`useShadowMode`, `useShadowProfile`)
   - Store (Zustand state management)
   - Components (Toggle, PIN Modal, Profile Editor)
   - Utilities (Crypto, PIN hash/verify)
   - Database functions & RLS policies

3. **[UX-FLOW.md](./UX-FLOW.md)** - UI/UX Akışı
   - Kullanıcı deneyimi prensipleri
   - Ana ekran tasarımı
   - Mode geçiş akışları
   - UI components
   - Animasyonlar

4. **[SECURITY.md](./SECURITY.md)** - Güvenlik Protokolleri
   - PIN güvenliği
   - Biometric authentication
   - RLS policies
   - Audit logging
   - Anomaly detection
   - Incident response

## 🎯 Hızlı Başlangıç

### Shadow Profil Nedir?

Shadow profil, kullanıcıların **gerçek kimliklerini gizleyerek** anonim bir şekilde platform üzerinde hareket etmelerini sağlayan bir özelliktir.

### Temel Özellikler

- ✅ **Dual Profile System** - Her kullanıcı 2 profile sahip (real + shadow)
- ✅ **PIN Protected** - Shadow mode geçişi PIN ile korunur
- ✅ **Biometric Support** - Face ID / Touch ID / Fingerprint desteği
- ✅ **Full Capabilities** - Shadow profilde tüm işlemler yapılabilir
- ✅ **Data Isolation** - Real ve shadow verileri tamamen ayrı
- ✅ **No Auth Loss** - Session kaybedilmez, sadece profile type değişir

### Kullanım Senaryoları

1. **Anonim Gezinme** - Gerçek kimlik gizli kalır
2. **Gizli Aktivite** - Shadow profilde yaptıkları real profile bağlı değil
3. **Privacy Protection** - Real profile verileri görünmez
4. **Alternative Identity** - Farklı bir persona ile hareket et

## 🚀 Implementasyon Durumu

### ✅ Tamamlanan

- [x] Database schema (profiles table)
- [x] Onboarding Step 3 (PIN + Biometric)
- [x] Shadow profile creation
- [x] PIN hashing (SHA-256)
- [x] Basic store structure

### ⏳ Devam Eden

- [ ] useShadowMode hook
- [ ] Shadow toggle UI
- [ ] PIN verification modal
- [ ] Profile switching logic
- [ ] RLS policies
- [ ] Audit logging

### 📋 Yapılacaklar

- [ ] Shadow profile editor
- [ ] Session timeout
- [ ] Rate limiting
- [ ] Anomaly detection
- [ ] Security monitoring
- [ ] Testing (unit + integration)
- [ ] Performance optimization

## 📂 Dosya Yapısı

```
apps/mobile/src/
├── hooks/
│   ├── useShadowMode.ts          # ⏳ TODO
│   └── useShadowProfile.ts       # ⏳ TODO
├── store/
│   └── shadow.store.ts           # ✅ Basic structure exists
├── components/
│   ├── ShadowToggle.tsx          # ⏳ TODO
│   ├── ShadowPinModal.tsx        # ⏳ TODO
│   └── ShadowProfileEditor.tsx   # ⏳ TODO
└── utils/
    └── crypto.ts                 # ✅ hashPin exists
```

## 🔐 Güvenlik Öncelikleri

1. **PIN Hashing** - SHA-256 ile hash'le, plain text saklanmasın
2. **Rate Limiting** - Brute force saldırılarını önle
3. **Audit Logging** - Tüm geçişleri logla
4. **RLS Policies** - Database seviyesinde koruma
5. **Session Management** - Timeout ve hijacking önleme

## 📊 Database Schema

### profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  type TEXT CHECK (type IN ('real', 'shadow')),
  username TEXT UNIQUE,
  
  -- Shadow Mode Fields
  shadow_profile_active BOOLEAN DEFAULT false,
  shadow_pin_hash TEXT,
  shadow_pin_created_at TIMESTAMPTZ,
  shadow_unlocked BOOLEAN DEFAULT false,
  biometric_enabled BOOLEAN DEFAULT false,
  biometric_type TEXT,
  
  -- ... other fields
);
```

## 🎨 UI Preview

### Normal Mode → Shadow Mode

```
👤 Real Profile          🎭 Shadow Profile
@yunussahin38     →      @shadow_9143806b
                PIN/Biometric
                Verification
```

## 📞 İletişim

- **Tech Lead:** [Adınız]
- **Security:** security@ipelya.com
- **Documentation:** [Bu klasör]

## 📝 Notlar

- Auth session **asla** kaybedilmez
- Aynı `user_id`, farklı `profile type`
- Shadow mode'da **tam yetki** var
- Real ve shadow **tamamen izole**

## 🔗 İlgili Dokümantasyon

- [Onboarding Sistemi](../onboarding/)
- [Auth & Security](../auth/)
- [Database Schema](../database/)
- [API Reference](../api/)

---

**Son Güncelleme:** 22 Kasım 2025, 03:58 AM
