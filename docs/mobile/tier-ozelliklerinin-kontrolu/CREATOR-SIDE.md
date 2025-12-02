# Creator Tarafı - Abone ve Benefit Yönetimi

Bu döküman, creator'ların abonelerini ve benefit kullanımlarını nasıl yöneteceğini açıklar.

---

## 📱 Creator Dashboard

### Abone Özeti Kartı

Creator'ın ana dashboard'unda gösterilecek özet bilgiler:

```typescript
interface SubscriberSummary {
  totalSubscribers: number;      // Toplam aktif abone
  newThisMonth: number;          // Bu ay yeni abone
  churnThisMonth: number;        // Bu ay iptal eden
  monthlyRevenue: number;        // Aylık gelir (coin)
  tierDistribution: {            // Tier dağılımı
    bronze: number;
    silver: number;
    gold: number;
    diamond: number;
    vip: number;
  };
}
```

### UI Tasarımı

```
┌─────────────────────────────────────────────┐
│  👥 Abonelerim                              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │   247   │  │  +23    │  │  -5     │     │
│  │ Toplam  │  │ Bu Ay   │  │ İptal   │     │
│  └─────────┘  └─────────┘  └─────────┘     │
│                                             │
│  Tier Dağılımı                              │
│  🥉 Bronze  ████████████░░░░  45%  (111)   │
│  🥈 Silver  ██████░░░░░░░░░░  25%  (62)    │
│  🥇 Gold    ████░░░░░░░░░░░░  18%  (44)    │
│  💎 Diamond ██░░░░░░░░░░░░░░   8%  (20)    │
│  👑 VIP     █░░░░░░░░░░░░░░░   4%  (10)    │
│                                             │
│  Bu Ay Gelir: 🪙 45,230                     │
│                                             │
│  [Tüm Aboneleri Gör →]                      │
└─────────────────────────────────────────────┘
```

---

## 📋 Abone Listesi Ekranı

**Route:** `/creator/subscribers`

### Özellikler

| Özellik        | Açıklama                       |
| -------------- | ------------------------------ |
| Liste Görünümü | Tüm aboneleri listele          |
| Tier Filtresi  | Bronze/Silver/Gold/Diamond/VIP |
| Sıralama       | Tarih, tier, kullanım          |
| Arama          | Username ile ara               |
| Detay          | Abone profiline git            |

### Hook: useCreatorSubscribers

```typescript
/**
 * useCreatorSubscribers Hook
 * Creator'ın abonelerini yönetir
 * 
 * @example
 * const { 
 *   subscribers, 
 *   summary, 
 *   isLoading,
 *   filterByTier,
 *   searchSubscriber 
 * } = useCreatorSubscribers();
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Subscriber {
  id: string;
  oderId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  tier: {
    id: string;
    name: string;
    emoji: string;
  };
  subscribedAt: string;
  currentPeriodEnd: string;
  status: 'active' | 'paused';
  totalPaid: number;
  benefitUsage: {
    benefitId: string;
    current: number;
    max: number;
  }[];
}

export function useCreatorSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [summary, setSummary] = useState<SubscriberSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const loadSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-creator-subscribers', {
        body: { tierFilter: filter }
      });

      if (error) throw error;

      setSubscribers(data.subscribers);
      setSummary(data.summary);
    } catch (err) {
      console.error('Load subscribers error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const filterByTier = (tierName: string | null) => {
    setFilter(tierName);
  };

  const searchSubscriber = async (query: string) => {
    if (!query.trim()) {
      loadSubscribers();
      return;
    }

    const filtered = subscribers.filter(s => 
      s.username.toLowerCase().includes(query.toLowerCase()) ||
      s.displayName.toLowerCase().includes(query.toLowerCase())
    );
    setSubscribers(filtered);
  };

  return {
    subscribers,
    summary,
    isLoading,
    filterByTier,
    searchSubscriber,
    refresh: loadSubscribers
  };
}
```

---

## 👤 Abone Detay Ekranı

**Route:** `/creator/subscribers/[id]`

### Gösterilecek Bilgiler

```
┌─────────────────────────────────────────────┐
│  ← Abone Detayı                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────┐                                   │
│  │ 👤   │  @username                        │
│  │      │  Display Name                     │
│  └──────┘  🥇 Gold Tier                     │
│                                             │
├─────────────────────────────────────────────┤
│  Abonelik Bilgileri                         │
│                                             │
│  Başlangıç    : 15 Kasım 2024               │
│  Dönem Sonu   : 15 Aralık 2024              │
│  Toplam Ödeme : 🪙 1,800                    │
│  Durum        : ✓ Aktif                     │
│                                             │
├─────────────────────────────────────────────┤
│  Benefit Kullanımı (Bu Dönem)               │
│                                             │
│  🎤 Sesli Mesaj                             │
│  ████████░░░░░░░░  3/5 kullanıldı           │
│                                             │
│  🎬 Kişisel Video                           │
│  ████████████████  1/1 kullanıldı           │
│                                             │
│  📖 Özel Hikayeler                          │
│  ✓ Erişim var (limitsiz)                    │
│                                             │
│  📡 Broadcast Kanalı                        │
│  ✓ Erişim var (limitsiz)                    │
│                                             │
├─────────────────────────────────────────────┤
│  Aksiyonlar                                 │
│                                             │
│  [💬 Mesaj Gönder]  [🎁 Bonus Ver]          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎁 Bonus Benefit Verme

Creator'lar abonelerine ekstra benefit hakkı verebilir:

### UI Flow

```
1. Abone detay ekranında "Bonus Ver" butonuna tıkla
2. Benefit seç (sadece limitli olanlar)
3. Miktar gir (1-10 arası)
4. Onay mesajı göster
5. Bonus ver
```

### Hook: useGiveBonusBenefit

```typescript
/**
 * Creator'ın abonesine bonus benefit vermesi
 */
export function useGiveBonusBenefit() {
  const [isLoading, setIsLoading] = useState(false);

  const giveBonusBenefit = async (
    subscriberId: string,
    benefitId: string,
    amount: number
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('give-bonus-benefit', {
        body: { subscriberId, benefitId, amount }
      });

      if (error) throw error;

      return { success: true, newLimit: data.newLimit };
    } catch (err) {
      console.error('Give bonus error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { giveBonusBenefit, isLoading };
}
```

---

## 📊 Creator Analytics

### Benefit Kullanım İstatistikleri

Creator'ın abonelerinin benefit kullanım özeti:

```typescript
interface CreatorBenefitStats {
  benefitId: string;
  benefitName: string;
  emoji: string;
  totalUsage: number;           // Toplam kullanım
  uniqueUsers: number;          // Kaç abone kullandı
  avgUsagePerUser: number;      // Ortalama kullanım
  limitReachedCount: number;    // Limite ulaşan abone sayısı
  trend: 'up' | 'down' | 'stable';
}
```

### UI Tasarımı

```
┌─────────────────────────────────────────────┐
│  📊 Benefit Kullanım Analizi                │
├─────────────────────────────────────────────┤
│                                             │
│  Bu Ay                                      │
│                                             │
│  🎤 Sesli Mesaj                             │
│  ├── Toplam: 156 kullanım                   │
│  ├── Kullanan: 45 abone                     │
│  ├── Ortalama: 3.5/abone                    │
│  └── Limite ulaşan: 12 abone                │
│                                             │
│  🎬 Kişisel Video                           │
│  ├── Toplam: 23 kullanım                    │
│  ├── Kullanan: 23 abone                     │
│  ├── Ortalama: 1/abone                      │
│  └── Limite ulaşan: 23 abone                │
│                                             │
│  📖 Özel Hikayeler                          │
│  └── 187 görüntülenme (limitsiz)            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔔 Creator Bildirimleri

### Abone Olayları

Creator'a gönderilecek bildirimler:

| Olay            | Bildirim                                   |
| --------------- | ------------------------------------------ |
| Yeni abone      | "🎉 @username Gold tier'a abone oldu!"      |
| Tier yükseltme  | "⬆️ @username Silver'dan Gold'a yükseldi!"  |
| Abonelik iptali | "😢 @username aboneliğini iptal etti"       |
| Dönem yenileme  | "🔄 @username aboneliğini yeniledi"         |
| Limit dolumu    | "📊 5 aboneniz sesli mesaj limitine ulaştı" |

### Haftalık Özet

```
┌─────────────────────────────────────────────┐
│  📈 Haftalık Abone Özeti                    │
├─────────────────────────────────────────────┤
│                                             │
│  Bu hafta:                                  │
│  • +12 yeni abone                           │
│  • -3 iptal                                 │
│  • 🪙 8,450 gelir                           │
│                                             │
│  En aktif tier: Gold (45% kullanım)         │
│  En çok kullanılan: Sesli Mesaj             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Edge Functions

### get-creator-subscribers

```typescript
// Endpoint: POST /functions/v1/get-creator-subscribers

interface Request {
  tierFilter?: string;
  page?: number;
  limit?: number;
}

interface Response {
  success: boolean;
  subscribers: Subscriber[];
  summary: SubscriberSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### give-bonus-benefit

```typescript
// Endpoint: POST /functions/v1/give-bonus-benefit

interface Request {
  subscriberId: string;
  benefitId: string;
  amount: number;  // 1-10
}

interface Response {
  success: boolean;
  newLimit: number;
  message: string;
}
```

---

## 📁 Dosya Yapısı

```
/apps/mobile/src/
├── screens/creator/
│   ├── SubscribersScreen.tsx       # Abone listesi
│   ├── SubscriberDetailScreen.tsx  # Abone detay
│   └── SubscriberAnalyticsScreen.tsx
├── components/creator/
│   ├── SubscriberCard.tsx
│   ├── SubscriberSummary.tsx
│   ├── BenefitUsageCard.tsx
│   ├── TierDistributionChart.tsx
│   └── GiveBonusModal.tsx
└── hooks/
    ├── useCreatorSubscribers.ts
    ├── useSubscriberDetail.ts
    ├── useGiveBonusBenefit.ts
    └── useCreatorBenefitStats.ts
```

---

## 🔄 Sonraki Adımlar

1. [ ] `useCreatorSubscribers` hook implement et
2. [ ] `SubscribersScreen` oluştur
3. [ ] `SubscriberDetailScreen` oluştur
4. [ ] `get-creator-subscribers` edge function deploy et
5. [ ] `give-bonus-benefit` edge function deploy et
6. [ ] Creator dashboard'a özet kartı ekle
7. [ ] Bildirim entegrasyonu
