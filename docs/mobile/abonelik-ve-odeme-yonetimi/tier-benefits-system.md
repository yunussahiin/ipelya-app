# Tier Benefits (Avantajlar) Sistemi

Bu doküman, creator abonelik tier'larında kullanılan avantaj sistemini açıklar.

---

## 📊 Genel Bakış

Tier Benefits sistemi, creator'ların abonelerine sunabileceği standart avantajları tanımlar. Bu avantajlar:
- **Veritabanında saklanır** (`tier_benefits` tablosu)
- **Web Ops panelinden yönetilebilir**
- **Mobile app'te fallback listesi bulunur**
- **Sistemde kontrol edilebilir** (örn: `hasBenefit('dm_access')`)

---

## 🗂️ Avantaj Kategorileri

### 📺 İçerik (content)

| ID                     | İsim                      | Açıklama                                                            | Emoji | Limit    |
| ---------------------- | ------------------------- | ------------------------------------------------------------------- | ----- | -------- |
| `exclusive_stories`    | Özel Hikayeler            | Sadece abonelerin görebileceği özel story paylaşımları              | 📖     | -        |
| `exclusive_broadcast`  | Özel Broadcast Kanalı     | Sadece abonelerin erişebildiği özel yayın kanalı                    | 📡     | -        |
| `archive_access`       | Arşiv Erişimi             | Geçmiş özel içeriklere ve silinmiş paylaşımlara erişim              | 🗄️     | -        |
| `media_packages`       | Özel Foto/Video Paketleri | Creator'ın sadece abonelere verdiği özel media paketleri            | 📦     | -        |
| `personal_video`       | Kişisel Video Mesaj       | Ayda 1 kez abonelere özel hazırlanmış kişisel video mesajı          | 🎬     | Aylık    |
| `weekly_summary`       | Haftalık Abone Özeti      | Creator'ın haftalık olarak abonelere özel kısa bir özet paylaşması  | 📋     | Haftalık |
| `subscriber_surprises` | Abone Sürprizleri         | Ayda 1 kez rastgele bonus içerik (özel foto, voice note, mini vlog) | 🎁     | Aylık    |

### 💬 İletişim (communication)

| ID                | İsim                   | Açıklama                                                      | Emoji | Limit |
| ----------------- | ---------------------- | ------------------------------------------------------------- | ----- | ----- |
| `voice_message`   | Sesli Mesaj Gönderimi  | Creator'ın abonelere DM'den özel ses kaydı göndermesi         | 🎤     | Aylık |
| `dm_access`       | Creator'a DM Gönderimi | DM atan abonelere daha hızlı dönüş yapılması                  | 💬     | -     |
| `priority_dm`     | Öncelikli DM           | Mesajlarınız öncelikli olarak görülür                         | ⚡     | -     |
| `mini_group_chat` | Mini Grup Sohbeti      | Sadece abonelerden oluşan küçük özel sohbet gruplarına erişim | 👥     | -     |
| `vip_question`    | VIP Soru Hakkı         | Canlı yayınlarda soru sorabilme                               | ❓     | -     |

### 🎁 Ekstra (perks)

| ID                    | İsim                         | Açıklama                                                           | Emoji | Limit |
| --------------------- | ---------------------------- | ------------------------------------------------------------------ | ----- | ----- |
| `early_notifications` | Erken Duyuru Bildirimleri    | Yeni içerik, canlı yayın veya etkinliği herkesten önce öğrenme     | 🔔     | -     |
| `premium_badge`       | Premium Profil Rozeti        | Abonenin profilinde daha özel ve dikkat çekici bir rozet görünmesi | 👑     | -     |
| `special_stickers`    | Özel Sticker ve Reaksiyonlar | Sadece abonelerin kullanabildiği özel emoji/sticker setleri        | 🎨     | -     |
| `birthday_message`    | Özel Gün Kutlaması           | Doğum günü gibi özel günlerde creator'dan kişisel mesaj            | 🎂     | -     |

---

## 🗄️ Veritabanı Şeması

### `tier_benefits` Tablosu

```sql
CREATE TABLE public.tier_benefits (
  id TEXT PRIMARY KEY,                    -- Benzersiz ID (örn: 'exclusive_stories')
  name TEXT NOT NULL,                     -- Görünen isim
  description TEXT NOT NULL,              -- Açıklama
  emoji TEXT NOT NULL,                    -- Emoji ikonu
  category TEXT NOT NULL,                 -- 'content' | 'communication' | 'perks'
  has_limit BOOLEAN DEFAULT FALSE,        -- Limit var mı?
  limit_type TEXT,                        -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  is_active BOOLEAN DEFAULT TRUE,         -- Aktif mi?
  sort_order INTEGER DEFAULT 0,           -- Sıralama
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

- **SELECT**: Herkes okuyabilir
- **INSERT/UPDATE/DELETE**: Sadece admin (web ops paneli)

---

## 🔌 Edge Functions

### `get-tier-benefits`

Tüm avantajları getirir.

**Request:**
```json
{
  "category": "content",     // Opsiyonel: 'content' | 'communication' | 'perks'
  "activeOnly": true         // Opsiyonel: Sadece aktif olanlar (default: true)
}
```

**Response:**
```json
{
  "success": true,
  "benefits": [...],
  "grouped": {
    "content": [...],
    "communication": [...],
    "perks": [...]
  },
  "total": 16
}
```

---

## 📱 Mobile App Entegrasyonu

### Fallback Listesi

`/apps/mobile/src/services/iap/products.ts` dosyasında `TIER_BENEFITS` array'i bulunur. Bu liste:
- Veritabanına erişilemediğinde kullanılır
- Type safety sağlar
- Offline çalışmayı destekler

### Kullanım

```typescript
import { TIER_BENEFITS, TierBenefitId, getBenefitById } from '@/services/iap/products';

// Benefit bilgisi al
const benefit = getBenefitById('exclusive_stories');
// { id: 'exclusive_stories', name: 'Özel Hikayeler', emoji: '📖', ... }

// Tier'da benefit var mı kontrol et
const hasBenefit = (tierId: string, benefitId: TierBenefitId) => {
  const tier = getTierById(tierId);
  return tier?.benefits?.includes(benefitId);
};
```

---

## 🌐 Web Ops Paneli Entegrasyonu

### API Endpoint'leri

```typescript
// Tüm avantajları getir
GET /api/ops/tier-benefits

// Avantaj güncelle
PATCH /api/ops/tier-benefits/:id
{
  "name": "Yeni İsim",
  "description": "Yeni açıklama",
  "is_active": false
}

// Yeni avantaj ekle
POST /api/ops/tier-benefits
{
  "id": "new_benefit",
  "name": "Yeni Avantaj",
  "description": "Açıklama",
  "emoji": "🆕",
  "category": "perks"
}

// Avantaj sil (soft delete - is_active = false)
DELETE /api/ops/tier-benefits/:id
```

---

## 🔄 Tier Şablonları

Creator'lar için hazır tier şablonları:

| Tier          | Fiyat        | Avantajlar                                                 |
| ------------- | ------------ | ---------------------------------------------------------- |
| **Bronze** 🥉  | 50 coin/ay   | Özel Hikayeler, Erken Duyuru                               |
| **Silver** 🥈  | 150 coin/ay  | + Özel Broadcast, DM Erişimi                               |
| **Gold** 🥇    | 300 coin/ay  | + Arşiv Erişimi, Öncelikli DM, Premium Rozet               |
| **Diamond** 💎 | 500 coin/ay  | + Media Paketleri, VIP Soru, Özel Sticker                  |
| **VIP** 👑     | 1000 coin/ay | + Kişisel Video, Sesli Mesaj, Mini Grup, Doğum Günü Mesajı |

---

## ✅ Avantaj Kontrol Sistemi

### Sistemde Kontrol Edilebilir Avantajlar

| Avantaj               | Kontrol Noktası   | Açıklama                                  |
| --------------------- | ----------------- | ----------------------------------------- |
| `exclusive_stories`   | Story görüntüleme | Özel story'leri sadece aboneler görebilir |
| `exclusive_broadcast` | Broadcast kanalı  | Özel kanala sadece aboneler katılabilir   |
| `dm_access`           | DM gönderimi      | Abone olmayanlar DM gönderemez            |
| `priority_dm`         | DM sıralaması     | Öncelikli DM'ler üstte gösterilir         |
| `premium_badge`       | Profil görünümü   | Abone rozetini göster                     |
| `special_stickers`    | Mesaj gönderimi   | Özel sticker'ları kullanabilir            |

### Örnek Kontrol Kodu

```typescript
// Story görüntüleme kontrolü
async function canViewStory(userId: string, storyId: string): Promise<boolean> {
  const story = await getStory(storyId);
  
  if (!story.is_exclusive) return true;
  
  const subscription = await getUserSubscription(userId, story.creator_id);
  if (!subscription) return false;
  
  return subscription.benefits.includes('exclusive_stories');
}
```

---

## 📝 Notlar

1. **Limit Sistemi**: `has_limit` ve `limit_type` alanları ile bazı avantajlar sınırlandırılabilir
2. **Soft Delete**: Avantajlar silinmez, `is_active = false` yapılır
3. **Sıralama**: `sort_order` ile UI'da gösterim sırası belirlenir
4. **Fallback**: Veritabanına erişilemezse mobile app'teki liste kullanılır

---

## 🌐 Web Ops Panel Entegrasyonu

### Oluşturulan Veritabanı Tabloları

#### 1. `tier_benefits` - Avantajlar Tablosu
```sql
CREATE TABLE public.tier_benefits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT NOT NULL, -- 'content' | 'communication' | 'perks'
  has_limit BOOLEAN DEFAULT FALSE,
  limit_type TEXT, -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  recommended_tier_level TEXT, -- 'bronze' | 'silver' | 'gold' | 'diamond' | 'vip'
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### 2. `tier_templates` - Tier Şablonları Tablosu
```sql
CREATE TABLE public.tier_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  suggested_coin_price_monthly INTEGER NOT NULL,
  suggested_coin_price_yearly INTEGER,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  gradient_start TEXT NOT NULL,
  gradient_end TEXT NOT NULL,
  default_benefit_ids TEXT[] NOT NULL DEFAULT '{}',
  recommended_for TEXT, -- 'beginner' | 'intermediate' | 'advanced' | 'premium'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Oluşturulan Edge Functions

| Function             | Açıklama                                                       |
| -------------------- | -------------------------------------------------------------- |
| `get-tier-benefits`  | Tüm avantajları getirir (kategoriye göre filtreleme destekler) |
| `get-tier-templates` | Tier şablonlarını avantaj detaylarıyla birlikte getirir        |

### Web Ops Panel İçin Gerekli API Route'ları

Next.js projesinde aşağıdaki API route'larını oluşturmanız gerekiyor:

#### `/app/api/ops/tier-benefits/route.ts`
```typescript
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Tüm avantajları getir
export async function GET() {
  const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from('tier_benefits')
    .select('*')
    .order('sort_order');
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ benefits: data });
}

// POST - Yeni avantaj ekle
export async function POST(req: NextRequest) {
  const supabase = createAdminSupabaseClient();
  const body = await req.json();
  
  const { data, error } = await supabase
    .from('tier_benefits')
    .insert(body)
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ benefit: data });
}
```

#### `/app/api/ops/tier-benefits/[id]/route.ts`
```typescript
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH - Avantaj güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminSupabaseClient();
  const { id } = await params;
  const body = await req.json();
  
  const { data, error } = await supabase
    .from('tier_benefits')
    .update(body)
    .eq('id', id)
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ benefit: data });
}

// DELETE - Avantaj devre dışı bırak (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminSupabaseClient();
  const { id } = await params;
  
  const { error } = await supabase
    .from('tier_benefits')
    .update({ is_active: false })
    .eq('id', id);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

### Web Ops Panel Sayfaları Yapısı

```
/app/ops/
├── tier-management/
│   ├── page.tsx              # Ana tier yönetim sayfası
│   ├── benefits/
│   │   └── page.tsx          # Avantaj yönetimi
│   └── templates/
│       └── page.tsx          # Şablon yönetimi
```

### Tier Şablonları Yönetimi

Creator'lar tier oluştururken:
1. **Şablon seçer** (Bronze, Silver, Gold, Diamond, VIP)
2. **Fiyatı kendisi belirler** (önerilen fiyat gösterilir)
3. **Avantajları düzenleyebilir** (varsayılan avantajlar seçili gelir)

Web Ops panelinden:
- Şablon isimleri değiştirilebilir
- Önerilen fiyatlar güncellenebilir
- Varsayılan avantajlar değiştirilebilir
- Yeni şablonlar eklenebilir
- Şablonlar devre dışı bırakılabilir

---

## 🔄 Güncelleme Geçmişi

| Tarih      | Güncelleme                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| 2025-12-02 | İlk versiyon oluşturuldu                                                                                |
| 2025-12-02 | 16 standart avantaj tanımlandı                                                                          |
| 2025-12-02 | `tier_benefits` tablosu ve `get-tier-benefits` edge function oluşturuldu                                |
| 2025-12-02 | `tier_templates` tablosu ve `get-tier-templates` edge function oluşturuldu                              |
| 2025-12-02 | Web Ops panel entegrasyon dokümantasyonu eklendi                                                        |
| 2025-12-02 | Creator tier oluşturma akışı güncellendi (şablon seçimi zorunlu, fiyat kullanıcı tarafından belirlenir) |
