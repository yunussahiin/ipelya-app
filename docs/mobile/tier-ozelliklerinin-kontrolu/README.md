# Tier Özelliklerinin Kontrolü

Bu dokümantasyon, creator abonelik tier'larındaki avantajların (benefits) nasıl kontrol edileceğini, kullanıcı ve creator tarafında nasıl yönetileceğini açıklar.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari](#mimari)
3. [Mobile App Implementasyonu](#mobile-app-implementasyonu)
4. [Edge Functions](#edge-functions)
5. [Web Ops Panel](#web-ops-panel)
6. [Kullanım Senaryoları](#kullanım-senaryoları)

---

## 🎯 Genel Bakış

### Amaç

Tier benefit kontrolü sistemi şu soruları yanıtlar:
- **User tarafı:** "Bu creator'ın özel hikayelerini görebilir miyim?"
- **Creator tarafı:** "Bu kullanıcı bana DM atabilir mi?"
- **Sistem tarafı:** "Bu kullanıcının aylık sesli mesaj hakkı doldu mu?"

### Temel Kavramlar

| Kavram            | Açıklama                                                          |
| ----------------- | ----------------------------------------------------------------- |
| **Benefit**       | Tier'a dahil olan tek bir avantaj (örn: `exclusive_stories`)      |
| **Tier**          | Avantajlar paketi (örn: Gold = 6 avantaj)                         |
| **Subscription**  | Kullanıcının bir creator'a aktif aboneliği                        |
| **Benefit Check** | Kullanıcının belirli bir avantaja erişimi olup olmadığını kontrol |
| **Usage Limit**   | Bazı avantajların kullanım limiti (örn: ayda 1 sesli mesaj)       |

### Benefit Kategorileri

```
📺 İçerik (content)
├── exclusive_stories     - Özel Hikayeler
├── exclusive_broadcast   - Özel Broadcast Kanalı
├── archive_access        - Arşiv Erişimi
├── media_packages        - Özel Foto/Video Paketleri
├── personal_video        - Kişisel Video Mesaj (aylık limit)
├── weekly_summary        - Haftalık Abone Özeti
└── subscriber_surprises  - Abone Sürprizleri (aylık limit)

💬 İletişim (communication)
├── voice_message         - Sesli Mesaj (aylık limit)
├── dm_access             - DM Gönderimi
├── priority_dm           - Öncelikli DM
├── mini_group_chat       - Mini Grup Sohbeti
└── vip_question          - VIP Soru Hakkı

🎁 Ekstra (perks)
├── early_notifications   - Erken Duyuru
├── premium_badge         - Premium Rozet
├── special_stickers      - Özel Stickerlar
└── birthday_message      - Doğum Günü Mesajı
```

---

## 🏗️ Mimari

### Veri Akışı

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
├─────────────────────────────────────────────────────────────────┤
│  useTierBenefitCheck Hook                                        │
│  ├── hasBenefit(creatorId, benefitId) → boolean                 │
│  ├── getBenefitsFor(creatorId) → string[]                       │
│  ├── canUseBenefit(creatorId, benefitId) → {allowed, remaining} │
│  └── useBenefit(creatorId, benefitId) → void                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EDGE FUNCTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│  check-tier-benefit                                              │
│  ├── Abonelik kontrolü                                          │
│  ├── Benefit varlık kontrolü                                    │
│  ├── Limit kontrolü (varsa)                                     │
│  └── Kullanım kaydı                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
├─────────────────────────────────────────────────────────────────┤
│  creator_subscriptions     - Aktif abonelikler                  │
│  creator_subscription_tiers - Tier tanımları + benefits         │
│  tier_benefit_usage        - Limitli benefit kullanım kayıtları │
│  tier_benefits             - Standart benefit tanımları         │
└─────────────────────────────────────────────────────────────────┘
```

### Veritabanı Şeması

#### Yeni Tablo: `tier_benefit_usage`

```sql
CREATE TABLE public.tier_benefit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES creator_subscriptions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  creator_id UUID NOT NULL REFERENCES profiles(user_id),
  benefit_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscription_id, benefit_id, period_start)
);

-- Index for fast lookups
CREATE INDEX idx_benefit_usage_lookup 
ON tier_benefit_usage(user_id, creator_id, benefit_id, period_end);
```

---

## 📱 Mobile App Implementasyonu

### 1. useTierBenefitCheck Hook

**Dosya:** `/src/hooks/useTierBenefitCheck.ts`

```typescript
/**
 * useTierBenefitCheck Hook
 * Tier benefit erişim kontrolü
 * 
 * Kullanım:
 * const { hasBenefit, canUseBenefit, useBenefit } = useTierBenefitCheck();
 * 
 * // Basit kontrol
 * if (hasBenefit(creatorId, 'exclusive_stories')) {
 *   // Özel hikayeleri göster
 * }
 * 
 * // Limitli benefit kontrolü
 * const { allowed, remaining } = await canUseBenefit(creatorId, 'voice_message');
 * if (allowed) {
 *   await useBenefit(creatorId, 'voice_message');
 * }
 */
```

### 2. Kullanım Örnekleri

#### Özel Hikayeleri Gösterme

```typescript
// StoryViewer.tsx
const { hasBenefit } = useTierBenefitCheck();

const canViewExclusiveStory = (story: Story) => {
  if (!story.isExclusive) return true;
  return hasBenefit(story.creatorId, 'exclusive_stories');
};
```

#### DM Gönderme Kontrolü

```typescript
// ChatScreen.tsx
const { hasBenefit } = useTierBenefitCheck();

const canSendDM = hasBenefit(creatorId, 'dm_access');
const hasPriorityDM = hasBenefit(creatorId, 'priority_dm');
```

#### Sesli Mesaj Gönderme (Limitli)

```typescript
// VoiceMessageButton.tsx
const { canUseBenefit, useBenefit } = useTierBenefitCheck();

const handleSendVoiceMessage = async () => {
  const { allowed, remaining } = await canUseBenefit(creatorId, 'voice_message');
  
  if (!allowed) {
    showToast({
      type: 'warning',
      message: 'Limit Doldu',
      description: 'Bu ay için sesli mesaj hakkınız kalmadı.'
    });
    return;
  }
  
  // Sesli mesaj gönder
  await sendVoiceMessage();
  
  // Kullanımı kaydet
  await useBenefit(creatorId, 'voice_message');
  
  showToast({
    type: 'info',
    message: `Kalan hak: ${remaining - 1}`
  });
};
```

---

## 🔧 Edge Functions

### check-tier-benefit

**Endpoint:** `POST /functions/v1/check-tier-benefit`

**Request:**
```json
{
  "creatorId": "uuid",
  "benefitId": "exclusive_stories",
  "action": "check" | "use"
}
```

**Response:**
```json
{
  "success": true,
  "hasAccess": true,
  "benefit": {
    "id": "exclusive_stories",
    "name": "Özel Hikayeler",
    "hasLimit": false
  },
  "subscription": {
    "id": "uuid",
    "tierName": "Gold",
    "status": "active"
  },
  "usage": null
}
```

**Limitli Benefit Response:**
```json
{
  "success": true,
  "hasAccess": true,
  "benefit": {
    "id": "voice_message",
    "name": "Sesli Mesaj",
    "hasLimit": true,
    "limitType": "monthly",
    "maxUsage": 5
  },
  "usage": {
    "current": 2,
    "remaining": 3,
    "periodEnd": "2025-01-01T00:00:00Z"
  }
}
```

---

## 🌐 Web Ops Panel

### Abone Yönetimi Sayfası

**Route:** `/ops/subscriptions`

#### Özellikler:
- Tüm aktif abonelikleri listele
- Creator veya subscriber'a göre filtrele
- Abonelik detaylarını görüntüle
- Benefit kullanım istatistikleri
- Manuel abonelik iptali/uzatma

### Benefit Kullanım Analizi

**Route:** `/ops/analytics/benefit-usage`

#### Metrikler:
- En çok kullanılan benefit'ler
- Limit dolum oranları
- Creator bazlı kullanım
- Zaman bazlı trendler

---

## 📊 Kullanım Senaryoları

### Senaryo 1: Özel Hikaye Görüntüleme

```
User: Story'ye tıklar
  ↓
App: story.isExclusive kontrolü
  ↓
App: hasBenefit(creatorId, 'exclusive_stories')
  ↓
Hook: Cached subscription kontrolü
  ↓
Result: true → Story gösterilir
         false → "Abone ol" CTA gösterilir
```

### Senaryo 2: Sesli Mesaj Gönderme

```
User: Sesli mesaj butonuna tıklar
  ↓
App: canUseBenefit(creatorId, 'voice_message')
  ↓
Edge Function: check-tier-benefit çağrılır
  ↓
DB: tier_benefit_usage kontrolü
  ↓
Result: {allowed: true, remaining: 3}
  ↓
User: Mesajı gönderir
  ↓
App: useBenefit(creatorId, 'voice_message')
  ↓
Edge Function: Kullanım kaydedilir
```

### Senaryo 3: Premium Rozet Gösterimi

```
User: Yorum yazar
  ↓
App: hasBenefit(creatorId, 'premium_badge')
  ↓
Result: true → Yorum yanında rozet gösterilir
```

---

## 📁 Dosya Yapısı

```
/apps/mobile/src/
├── hooks/
│   ├── useTierBenefitCheck.ts      # Ana benefit kontrol hook'u
│   ├── useCreatorSubscription.ts   # Mevcut (güncellendi)
│   └── useTierTemplates.ts         # Mevcut
├── services/
│   └── benefitService.ts           # Benefit işlemleri servisi
├── components/
│   └── common/
│       ├── BenefitGate.tsx         # Conditional render component
│       └── SubscribePrompt.tsx     # Abone ol CTA
└── types/
    └── benefit.types.ts            # Benefit type tanımları

/supabase/functions/
├── check-tier-benefit/
│   └── index.ts
└── get-benefit-usage/
    └── index.ts

/apps/web/app/ops/(private)/
├── subscriptions/
│   ├── page.tsx                    # Abonelik listesi
│   └── [id]/page.tsx               # Abonelik detay
└── analytics/
    └── benefit-usage/
        └── page.tsx                # Kullanım analizi
```

---

## 🔄 Sonraki Adımlar

1. [ ] `tier_benefit_usage` tablosu oluştur
2. [ ] `useTierBenefitCheck` hook'u implement et
3. [ ] `check-tier-benefit` edge function deploy et
4. [ ] `BenefitGate` component oluştur
5. [ ] Web Ops abonelik yönetimi sayfası
6. [ ] Benefit kullanım analizi dashboard

---

## 📝 İlgili Dökümanlar

- [Tier Benefits System](../abonelik-ve-odeme-yonetimi/tier-benefits-system.md)
- [Creator Subscription Flow](../abonelik-ve-odeme-yonetimi/creator-subscription-flow.md)
