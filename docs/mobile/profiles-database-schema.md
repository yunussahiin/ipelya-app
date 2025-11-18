# İpelya Mobil - Profiles Database Schema

## Genel Bakış

`profiles` tablosu, İpelya uygulamasının temel kullanıcı profil yapısını oluşturur. Her kullanıcı için **dual identity** (real + shadow) sistemini destekler ve cihaz takibi özellikleri içerir.

---

## Tablo Yapısı

### `profiles`

| Kolon                  | Tip           | Açıklama                                    |
| ---------------------- | ------------- | ------------------------------------------- |
| `id`                   | `uuid`        | Primary key, otomatik oluşturulur           |
| `user_id`              | `uuid`        | `auth.users.id` foreign key, CASCADE delete |
| `type`                 | `text`        | `'real'` veya `'shadow'` - Profil tipi      |
| `username`             | `text`        | Unique kullanıcı adı                        |
| `display_name`         | `text`        | Görünen ad                                  |
| `avatar_url`           | `text`        | Profil fotoğrafı URL'i                      |
| `bio`                  | `text`        | Kullanıcı biyografisi                       |
| `is_creator`           | `boolean`     | Creator hesabı mı? (default: false)         |
| `shadow_pin_hash`      | `text`        | Shadow mode için bcrypt hash'lenmiş PIN     |
| `shadow_unlocked`      | `boolean`     | Shadow mode aktif mi? (default: false)      |
| `gender`               | `text`        | `'male'`, `'female'`, veya `'lgbt'`         |
| **`last_device_info`** | `jsonb`       | Son giriş yapılan cihaz bilgileri           |
| **`last_ip_address`**  | `inet`        | Son giriş IP adresi                         |
| **`last_login_at`**    | `timestamptz` | Son giriş zamanı                            |
| **`device_token`**     | `text`        | Push notification token (FCM/APNS)          |
| `created_at`           | `timestamptz` | Kayıt oluşturulma zamanı                    |
| `updated_at`           | `timestamptz` | Son güncelleme zamanı                       |

### Constraints

- **UNIQUE**: `(user_id, type)` - Her user için sadece 1 real + 1 shadow profile
- **UNIQUE**: `username` - Kullanıcı adları benzersiz olmalı
- **CHECK**: `type IN ('real', 'shadow')`
- **CHECK**: `gender IN ('male', 'female', 'lgbt')`

---

## Device Info JSON Yapısı

`last_device_info` kolonu aşağıdaki formatı kullanır:

```json
{
  "platform": "ios",           // "ios" | "android" | "web"
  "model": "iPhone 15 Pro",    // Cihaz modeli
  "os_version": "17.2",        // İşletim sistemi versiyonu
  "app_version": "1.0.0",      // Uygulama versiyonu
  "device_id": "uuid-string",  // Unique device identifier (opsiyonel)
  "locale": "tr-TR"            // Dil ayarı (opsiyonel)
}
```

---

## Otomatik Trigger'lar

### 1. `on_auth_user_created` (Auth User → Real Profile)

Yeni bir kullanıcı `auth.users` tablosuna kaydolduğunda otomatik olarak `type='real'` profile oluşturur:

```sql
CREATE OR REPLACE FUNCTION create_real_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, type, username, display_name, gender)
  VALUES (
    NEW.id,
    'real',
    split_part(NEW.email, '@', 1), -- email'den username türet
    split_part(NEW.email, '@', 1),
    'male' -- default
  )
  ON CONFLICT (user_id, type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. `update_profiles_updated_at` (Auto Update Timestamp)

Her `UPDATE` işleminde `updated_at` kolonunu otomatik günceller:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Row Level Security (RLS) Policies

### Policy 1: `users_view_own_profiles`

Kullanıcılar sadece kendi profillerini görebilir:

```sql
CREATE POLICY "users_view_own_profiles" ON profiles
  FOR SELECT USING (user_id = auth.uid());
```

### Policy 2: `users_update_own_profiles`

Kullanıcılar sadece kendi profillerini güncelleyebilir:

```sql
CREATE POLICY "users_update_own_profiles" ON profiles
  FOR UPDATE USING (user_id = auth.uid());
```

### Policy 3: `shadow_isolation`

Shadow ve real profiller JWT claim'e göre izole edilir:

```sql
CREATE POLICY "shadow_isolation" ON profiles
  FOR SELECT USING (
    (type = 'shadow' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = true)
    OR
    (type = 'real' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = false)
  );
```

**Açıklama:**
- Shadow mode aktifken (`shadow_mode: true` JWT claim), sadece `type='shadow'` profiller görünür
- Real mode'da (`shadow_mode: false` veya yok), sadece `type='real'` profiller görünür

---

## Mobil Uygulama Entegrasyonu

### 1. Kayıt Sonrası Profile Güncelleme

```typescript
import { supabase } from '@/lib/supabaseClient';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

async function updateProfileAfterSignup(userId: string) {
  const deviceInfo = {
    platform: Device.osName?.toLowerCase() || 'unknown',
    model: Device.modelName || 'unknown',
    os_version: Device.osVersion || 'unknown',
    app_version: Constants.expoConfig?.version || '1.0.0',
    device_id: Constants.deviceId,
    locale: 'tr-TR'
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: 'Yeni Kullanıcı',
      gender: 'male',
      last_device_info: deviceInfo,
      last_login_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('type', 'real');

  if (error) console.error('Profile update error:', error);
}
```

### 2. Login Sırasında Device Info Güncelleme

```typescript
import * as Network from 'expo-network';

async function updateDeviceInfoOnLogin(userId: string) {
  const ipAddress = await Network.getIpAddressAsync();
  
  const deviceInfo = {
    platform: Device.osName?.toLowerCase() || 'unknown',
    model: Device.modelName || 'unknown',
    os_version: Device.osVersion || 'unknown',
    app_version: Constants.expoConfig?.version || '1.0.0',
    device_id: Constants.deviceId,
    locale: 'tr-TR'
  };

  await supabase
    .from('profiles')
    .update({
      last_device_info: deviceInfo,
      last_ip_address: ipAddress,
      last_login_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('type', 'real');
}
```

### 3. Push Notification Token Kaydetme

```typescript
import * as Notifications from 'expo-notifications';

async function registerPushToken(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status === 'granted') {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    await supabase
      .from('profiles')
      .update({ device_token: token })
      .eq('user_id', userId)
      .eq('type', 'real');
  }
}
```

---

## Shadow Profile Oluşturma

Shadow profile oluşturmak için Edge Function kullanılır:

```typescript
// Edge Function: enable-shadow-mode
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function enableShadowMode(userId: string, pin: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const pinHash = await bcrypt.hash(pin, 10);

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      type: 'shadow',
      username: `shadow_${userId.slice(0, 8)}`,
      display_name: 'Shadow Profile',
      shadow_pin_hash: pinHash,
      shadow_unlocked: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## Indexes

Performans için oluşturulan indexler:

```sql
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_type ON profiles(type);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_creator ON profiles(is_creator) WHERE is_creator = true;
```

---

## TypeScript Tipleri

`packages/types/src/database.types.ts` dosyasında otomatik oluşturulmuş tipler:

```typescript
import { Database } from '@ipelya/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Kullanım örneği
const profile: Profile = {
  id: 'uuid',
  user_id: 'uuid',
  type: 'real',
  username: 'johndoe',
  display_name: 'John Doe',
  avatar_url: null,
  bio: null,
  is_creator: false,
  shadow_pin_hash: null,
  shadow_unlocked: false,
  gender: 'male',
  last_device_info: {
    platform: 'ios',
    model: 'iPhone 15 Pro',
    os_version: '17.2',
    app_version: '1.0.0'
  },
  last_ip_address: '192.168.1.1',
  last_login_at: '2025-01-01T00:00:00Z',
  device_token: 'ExponentPushToken[xxx]',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};
```

---

## Güvenlik Notları

1. **PIN Hash**: Shadow mode PIN'leri asla plain text olarak saklanmaz, bcrypt ile hash'lenir
2. **RLS**: Tüm profil verileri RLS ile korunur, kullanıcılar sadece kendi verilerine erişebilir
3. **Shadow Isolation**: JWT claim bazlı izolasyon sayesinde real ve shadow profiller birbirinden tamamen ayrı
4. **Device Token**: Push notification token'ları güvenli şekilde saklanır ve sadece ilgili kullanıcı erişebilir
5. **IP Tracking**: IP adresleri `inet` tipinde saklanır, güvenlik analizi için kullanılabilir

---

## Sıradaki Adımlar

1. **Shadow Mode Toggle**: Mobil uygulamaya shadow mode açma/kapama UI'ı ekle
2. **Device History**: Kullanıcının tüm cihaz geçmişini gösteren tablo ekle
3. **Security Alerts**: Yeni cihazdan giriş yapıldığında bildirim gönder
4. **Profile Analytics**: Kullanıcı davranış analitiği için ek kolonlar ekle

---

**Son Güncelleme**: 18 Kasım 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready
