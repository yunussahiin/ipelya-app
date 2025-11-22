# Shadow Profil Sistemi - Genel Bakış

## 🎯 Amaç

Shadow profil, kullanıcıların gerçek kimliklerini gizleyerek anonim bir şekilde platform üzerinde hareket etmelerini sağlayan bir özelliktir.

## 🔑 Temel Kavramlar

### Dual Profile Sistemi

Her kullanıcı iki profile sahiptir:

1. **Real Profile** - Gerçek kimlik
   - Kullanıcı kaydı sırasında oluşturulur
   - Real username, display name, avatar
   - Onboarding verileri (bio, gender, vibe, etc.)
   - Gerçek aktiviteler ve bağlantılar

2. **Shadow Profile** - Anonim kimlik
   - Onboarding tamamlandığında otomatik oluşturulur
   - Shadow username (örn: `shadow_9143806b`)
   - Ayrı avatar, bio, display name
   - Shadow aktiviteleri ve bağlantılar

### Auth ve Session Yönetimi

**Önemli:** Auth session kaybedilmez!

```
User Login → Session (user_id: abc123)
  ├─ Real Profile (user_id: abc123, type: real)
  └─ Shadow Profile (user_id: abc123, type: shadow)
```

- Aynı `user_id` kullanılır
- Sadece `profile type` değişir
- Session aynı kalır
- Token yenilenmez

## 🔐 Güvenlik

### PIN ile Koruma

- Shadow profile'a geçiş **Shadow PIN** ile korunur
- PIN onboarding Step 3'te belirlenir
- SHA-256 ile hash'lenir
- Database'de `shadow_pin_hash` olarak saklanır

### Biometric Desteği

- Face ID / Touch ID / Fingerprint
- PIN'e alternatif veya ek olarak kullanılır
- Onboarding Step 3'te etkinleştirilir

## 📊 Database Yapısı

### profiles Tablosu

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  type TEXT CHECK (type IN ('real', 'shadow')),
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  shadow_profile_active BOOLEAN DEFAULT false,
  shadow_pin_hash TEXT,
  shadow_pin_created_at TIMESTAMPTZ,
  biometric_enabled BOOLEAN DEFAULT false,
  biometric_type TEXT,
  shadow_unlocked BOOLEAN DEFAULT false,
  -- ... diğer alanlar
);
```

### Örnek Veri

**Real Profile:**
```json
{
  "user_id": "9143806b-1467-4a82-af7d-195239dc0a77",
  "type": "real",
  "username": "yunussahin38",
  "display_name": "Yunus Şahin",
  "shadow_profile_active": true,
  "shadow_pin_hash": "03ac67...",
  "biometric_enabled": true,
  "biometric_type": "face_id"
}
```

**Shadow Profile:**
```json
{
  "user_id": "9143806b-1467-4a82-af7d-195239dc0a77",
  "type": "shadow",
  "username": "shadow_9143806b",
  "display_name": "Gizli Kullanıcı",
  "is_active": true
}
```

## 🔄 Geçiş Akışı

### Real → Shadow Geçiş

```
1. Kullanıcı "Shadow Mode'a Geç" butonuna basar
2. PIN/Biometric prompt gösterilir
3. PIN doğrulanır (SHA-256 hash karşılaştırması)
4. Başarılı → shadow_unlocked = true
5. Session'daki active_profile_type = "shadow" olarak güncellenir
6. UI shadow profile'a geçer
```

### Shadow → Real Geçiş

```
1. Kullanıcı "Normal Mode'a Dön" butonuna basar
2. PIN/Biometric prompt gösterilir (güvenlik için)
3. PIN doğrulanır
4. Başarılı → shadow_unlocked = false
5. Session'daki active_profile_type = "real" olarak güncellenir
6. UI real profile'a geçer
```

## 🎭 Shadow Profil Capabilities

### Tam Yetkiler (Full Shadow)

Shadow profile'da kullanıcı **tüm işlemleri** yapabilir:

#### ✅ Okuma İşlemleri
- Feed görüntüleme
- Post görüntüleme
- Mesaj okuma
- Kullanıcı profilleri görüntüleme
- Arama yapma

#### ✅ Yazma İşlemleri
- Post paylaşma
- Yorum yapma
- Mesaj gönderme
- Beğenme/favorileme
- Takip etme/takipten çıkma

#### ✅ Profil Yönetimi
- Shadow username değiştirme
- Shadow avatar yükleme
- Shadow bio güncelleme
- Shadow display name değiştirme

#### ❌ Kısıtlamalar
- Real profile'daki veriler görünmez
- Real profile'daki takipçiler/takip edilenler görünmez
- Real profile'daki mesajlar görünmez
- Shadow aktiviteleri real profile'a bağlı değil

## 📱 Kullanıcı Deneyimi

### Görünürlük

**Diğer kullanıcılar için:**
- Shadow profile normal bir kullanıcı gibi görünür
- Shadow username görünür (`shadow_9143806b`)
- Shadow avatar ve bio görünür
- Real kimlik gizli kalır

**Kullanıcı için:**
- Hangi modda olduğu her zaman bellidir
- Mode geçişi kolayca yapılabilir
- Her mod ayrı bir "kimlik" gibi davranır

## 🔒 Gizlilik ve Güvenlik

### Veri İzolasyonu

- Real ve shadow profil verileri **tamamen ayrı**
- RLS policies ile korunur
- Cross-profile veri erişimi yok

### Audit Log

- Tüm shadow geçişleri loglanır
- Hangi IP'den, hangi cihazdan geçiş yapıldığı kaydedilir
- Güvenlik analizi için kullanılır

## 🚀 Sonraki Adımlar

1. [Teknik Implementasyon](./IMPLEMENTATION.md)
2. [API Referansı](./API.md)
3. [UI/UX Akışı](./UX-FLOW.md)
4. [Güvenlik Protokolleri](./SECURITY.md)
