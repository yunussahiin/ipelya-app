# Web Ops Panel - Abonelik ve Benefit Yönetimi

Bu döküman, Web Ops panelinde abonelik yönetimi ve benefit analizi için yapılacak işlemleri açıklar.

---

## 📋 Yapılacak Sayfalar

### 1. Abonelik Yönetimi

**Route:** `/ops/subscriptions`

#### Özellikler

| Özellik           | Açıklama                                          |
| ----------------- | ------------------------------------------------- |
| Abonelik Listesi  | Tüm aktif/pasif abonelikleri listele              |
| Filtreleme        | Creator, subscriber, tier, status'a göre filtrele |
| Arama             | Username veya ID ile ara                          |
| Detay Görüntüleme | Abonelik detaylarını modal'da göster              |
| Manuel İşlemler   | İptal, uzatma, tier değiştirme                    |

#### API Routes

```
GET  /api/ops/subscriptions
GET  /api/ops/subscriptions/[id]
POST /api/ops/subscriptions/[id]/cancel
POST /api/ops/subscriptions/[id]/extend
POST /api/ops/subscriptions/[id]/change-tier
```

#### Sayfa Yapısı

```tsx
// /app/ops/(private)/subscriptions/page.tsx

interface SubscriptionListItem {
  id: string;
  subscriber: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  creator: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  tier: {
    id: string;
    name: string;
    emoji: string;
    coinPriceMonthly: number;
  };
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billingPeriod: 'monthly' | 'yearly';
  startedAt: string;
  currentPeriodEnd: string;
  totalPaid: number;
  benefitUsage: {
    benefitId: string;
    current: number;
    max: number;
  }[];
}
```

---

### 2. Abonelik Detay Sayfası

**Route:** `/ops/subscriptions/[id]`

#### Gösterilecek Bilgiler

**Genel Bilgiler:**
- Subscriber ve Creator profilleri
- Tier bilgisi ve fiyat
- Abonelik durumu ve tarihleri
- Toplam ödenen coin

**Benefit Kullanımı:**
- Her limitli benefit için kullanım durumu
- Progress bar ile görsel gösterim
- Kullanım geçmişi

**İşlem Geçmişi:**
- Ödeme geçmişi
- Tier değişiklikleri
- Duraklatma/devam ettirme

**Aksiyonlar:**
- Aboneliği iptal et
- Süreyi uzat
- Tier değiştir
- Benefit limitini sıfırla

---

### 3. Benefit Kullanım Analizi

**Route:** `/ops/analytics/benefit-usage`

#### Dashboard Kartları

```tsx
// İstatistik kartları
<div className="grid grid-cols-4 gap-4">
  <StatCard 
    title="Toplam Kullanım" 
    value={totalUsage} 
    trend="+12%" 
  />
  <StatCard 
    title="Limit Dolum Oranı" 
    value="23%" 
    description="Limitine ulaşan kullanıcılar" 
  />
  <StatCard 
    title="En Popüler Benefit" 
    value="Sesli Mesaj" 
    icon="🎤" 
  />
  <StatCard 
    title="Aktif Abonelik" 
    value={activeSubscriptions} 
  />
</div>
```

#### Grafikler

1. **Benefit Kullanım Dağılımı** (Pie Chart)
   - Her benefit'in toplam kullanım yüzdesi

2. **Zaman Bazlı Kullanım** (Line Chart)
   - Günlük/haftalık/aylık kullanım trendi

3. **Creator Bazlı Kullanım** (Bar Chart)
   - En çok benefit kullanılan creator'lar

4. **Limit Dolum Oranları** (Horizontal Bar)
   - Her benefit için limit dolum yüzdesi

#### Tablo: Detaylı Kullanım

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Subscriber</TableHead>
      <TableHead>Creator</TableHead>
      <TableHead>Benefit</TableHead>
      <TableHead>Kullanım</TableHead>
      <TableHead>Periyot Sonu</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {usages.map(usage => (
      <TableRow key={usage.id}>
        <TableCell>{usage.subscriber.username}</TableCell>
        <TableCell>{usage.creator.username}</TableCell>
        <TableCell>
          <span>{usage.benefit.emoji}</span>
          {usage.benefit.name}
        </TableCell>
        <TableCell>
          <Progress value={(usage.current / usage.max) * 100} />
          <span>{usage.current}/{usage.max}</span>
        </TableCell>
        <TableCell>{formatDate(usage.periodEnd)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 4. Creator Aboneleri Sayfası

**Route:** `/ops/creators/[id]/subscribers`

#### Özellikler

- Creator'ın tüm abonelerini listele
- Tier dağılımı grafiği
- Gelir analizi
- Churn rate (iptal oranı)
- Benefit kullanım özeti

---

## 🔧 API Routes Implementasyonu

### GET /api/ops/subscriptions

```typescript
// /app/api/ops/subscriptions/route.ts

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = createAdminSupabaseClient();
  const { searchParams } = new URL(req.url);
  
  const status = searchParams.get('status');
  const creatorId = searchParams.get('creatorId');
  const subscriberId = searchParams.get('subscriberId');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = supabase
    .from('creator_subscriptions')
    .select(`
      *,
      subscriber:profiles!subscriber_id(user_id, username, display_name, avatar_url),
      creator:profiles!creator_id(user_id, username, display_name, avatar_url),
      tier:creator_subscription_tiers(*)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }
  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }
  if (subscriberId) {
    query = query.eq('subscriber_id', subscriberId);
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    subscriptions: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}
```

### GET /api/ops/subscriptions/[id]

```typescript
// /app/api/ops/subscriptions/[id]/route.ts

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminSupabaseClient();
  const { id } = await params;

  // Abonelik detayı
  const { data: subscription, error } = await supabase
    .from('creator_subscriptions')
    .select(`
      *,
      subscriber:profiles!subscriber_id(*),
      creator:profiles!creator_id(*),
      tier:creator_subscription_tiers(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Benefit kullanımları
  const { data: usages } = await supabase
    .from('tier_benefit_usage')
    .select('*')
    .eq('subscription_id', id)
    .gte('period_end', new Date().toISOString());

  // Ödeme geçmişi
  const { data: payments } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('subscription_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    subscription,
    benefitUsages: usages || [],
    paymentHistory: payments || []
  });
}
```

### POST /api/ops/subscriptions/[id]/cancel

```typescript
// /app/api/ops/subscriptions/[id]/cancel/route.ts

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminSupabaseClient();
  const { id } = await params;
  const { reason, immediate = false } = await req.json();

  const updateData: any = {
    status: immediate ? 'cancelled' : 'active',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason
  };

  if (!immediate) {
    // Dönem sonunda iptal
    updateData.cancel_at_period_end = true;
  }

  const { data, error } = await supabase
    .from('creator_subscriptions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('admin_audit_logs').insert({
    action: 'subscription_cancelled',
    target_type: 'subscription',
    target_id: id,
    details: { reason, immediate }
  });

  return NextResponse.json({ success: true, subscription: data });
}
```

### GET /api/ops/analytics/benefit-usage

```typescript
// /app/api/ops/analytics/benefit-usage/route.ts

export async function GET(req: NextRequest) {
  const supabase = createAdminSupabaseClient();
  const { searchParams } = new URL(req.url);
  
  const period = searchParams.get('period') || '30d';
  const creatorId = searchParams.get('creatorId');

  // Toplam kullanım istatistikleri
  const { data: stats } = await supabase.rpc('get_benefit_usage_stats', {
    p_period: period,
    p_creator_id: creatorId
  });

  // Benefit bazlı dağılım
  const { data: distribution } = await supabase
    .from('tier_benefit_usage')
    .select('benefit_id, usage_count')
    .gte('created_at', getDateFromPeriod(period));

  // Zaman bazlı trend
  const { data: trend } = await supabase.rpc('get_benefit_usage_trend', {
    p_period: period,
    p_creator_id: creatorId
  });

  return NextResponse.json({
    stats,
    distribution: aggregateByBenefit(distribution),
    trend
  });
}
```

---

## 📊 Veritabanı Fonksiyonları

### get_benefit_usage_stats

```sql
CREATE OR REPLACE FUNCTION get_benefit_usage_stats(
  p_period TEXT DEFAULT '30d',
  p_creator_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_date TIMESTAMPTZ;
BEGIN
  start_date := CASE p_period
    WHEN '7d' THEN NOW() - INTERVAL '7 days'
    WHEN '30d' THEN NOW() - INTERVAL '30 days'
    WHEN '90d' THEN NOW() - INTERVAL '90 days'
    ELSE NOW() - INTERVAL '30 days'
  END;

  SELECT json_build_object(
    'totalUsage', COALESCE(SUM(usage_count), 0),
    'uniqueUsers', COUNT(DISTINCT user_id),
    'uniqueCreators', COUNT(DISTINCT creator_id),
    'avgUsagePerUser', ROUND(AVG(usage_count), 2),
    'limitReachedCount', COUNT(*) FILTER (WHERE usage_count >= max_usage)
  ) INTO result
  FROM tier_benefit_usage
  WHERE created_at >= start_date
    AND (p_creator_id IS NULL OR creator_id = p_creator_id);

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### get_benefit_usage_trend

```sql
CREATE OR REPLACE FUNCTION get_benefit_usage_trend(
  p_period TEXT DEFAULT '30d',
  p_creator_id UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  total_usage BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    SUM(usage_count)::BIGINT as total_usage,
    COUNT(DISTINCT user_id)::BIGINT as unique_users
  FROM tier_benefit_usage
  WHERE created_at >= CASE p_period
    WHEN '7d' THEN NOW() - INTERVAL '7 days'
    WHEN '30d' THEN NOW() - INTERVAL '30 days'
    WHEN '90d' THEN NOW() - INTERVAL '90 days'
    ELSE NOW() - INTERVAL '30 days'
  END
  AND (p_creator_id IS NULL OR creator_id = p_creator_id)
  GROUP BY DATE(created_at)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 UI Bileşenleri

### SubscriptionStatusBadge

```tsx
function SubscriptionStatusBadge({ status }: { status: string }) {
  const variants = {
    active: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    paused: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    expired: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  };

  return (
    <Badge className={variants[status]}>
      {status === 'active' && '✓ Aktif'}
      {status === 'paused' && '⏸ Duraklatıldı'}
      {status === 'cancelled' && '✕ İptal'}
      {status === 'expired' && '⏰ Süresi Doldu'}
    </Badge>
  );
}
```

### BenefitUsageProgress

```tsx
function BenefitUsageProgress({ 
  benefitId, 
  current, 
  max 
}: { 
  benefitId: string; 
  current: number; 
  max: number; 
}) {
  const percentage = (current / max) * 100;
  const benefit = BENEFIT_INFO[benefitId];

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{benefit?.emoji} {benefit?.name}</span>
        <span className="text-muted-foreground">{current}/{max}</span>
      </div>
      <Progress 
        value={percentage} 
        className={percentage >= 100 ? 'bg-red-200' : ''} 
      />
    </div>
  );
}
```

---

## 📁 Dosya Yapısı

```
/apps/web/
├── app/
│   ├── api/ops/
│   │   ├── subscriptions/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── cancel/route.ts
│   │   │       ├── extend/route.ts
│   │   │       └── change-tier/route.ts
│   │   └── analytics/
│   │       └── benefit-usage/route.ts
│   └── ops/(private)/
│       ├── subscriptions/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       └── analytics/
│           └── benefit-usage/page.tsx
├── components/ops/
│   ├── subscriptions/
│   │   ├── SubscriptionTable.tsx
│   │   ├── SubscriptionDetail.tsx
│   │   ├── SubscriptionActions.tsx
│   │   └── SubscriptionStatusBadge.tsx
│   └── analytics/
│       ├── BenefitUsageChart.tsx
│       ├── BenefitDistributionPie.tsx
│       └── BenefitUsageProgress.tsx
└── lib/types/
    └── subscription.ts
```

---

## 🔄 Sonraki Adımlar

1. [ ] API routes oluştur
2. [ ] Subscriptions list sayfası
3. [ ] Subscription detail sayfası
4. [ ] Benefit usage analytics sayfası
5. [ ] Sidebar'a menü ekle
6. [ ] Veritabanı fonksiyonları oluştur
