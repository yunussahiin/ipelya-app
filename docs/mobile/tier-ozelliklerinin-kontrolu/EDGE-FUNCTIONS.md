# Edge Functions - Tier Benefit Kontrolü

Bu döküman, tier benefit kontrolü için gerekli edge function'ları açıklar.

---

## 📦 check-tier-benefit

### Amaç
Kullanıcının belirli bir creator'a ait tier benefit'e erişimi olup olmadığını kontrol eder ve limitli benefit'ler için kullanım kaydı tutar.

### Endpoint
`POST /functions/v1/check-tier-benefit`

### Request Body

```typescript
interface CheckTierBenefitRequest {
  creatorId: string;      // Creator'ın user_id'si
  benefitId: string;      // Kontrol edilecek benefit ID
  action: 'check' | 'use'; // Sadece kontrol veya kullanım kaydı
}
```

### Response

```typescript
interface CheckTierBenefitResponse {
  success: boolean;
  hasAccess: boolean;
  benefit?: {
    id: string;
    name: string;
    emoji: string;
    hasLimit: boolean;
    limitType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    maxUsage?: number;
  };
  subscription?: {
    id: string;
    tierId: string;
    tierName: string;
    status: 'active' | 'paused' | 'cancelled';
  };
  usage?: {
    current: number;
    max: number;
    remaining: number;
    periodStart: string;
    periodEnd: string;
  };
  reason?: 'no_subscription' | 'benefit_not_included' | 'limit_reached' | 'subscription_paused';
  error?: string;
}
```

### Implementasyon

```typescript
// supabase/functions/check-tier-benefit/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Limitli benefit tanımları
const LIMITED_BENEFITS: Record<string, { limitType: string; defaultMax: number }> = {
  voice_message: { limitType: 'monthly', defaultMax: 5 },
  personal_video: { limitType: 'monthly', defaultMax: 1 },
  subscriber_surprises: { limitType: 'monthly', defaultMax: 1 },
};

// Period hesaplama
function getPeriodBounds(limitType: string): { start: Date; end: Date } {
  const now = new Date();
  let start: Date, end: Date;

  switch (limitType) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case 'monthly':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
  }

  return { start, end };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // Auth kontrolü
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { creatorId, benefitId, action = 'check' } = await req.json();

    if (!creatorId || !benefitId) {
      return new Response(
        JSON.stringify({ success: false, error: "creatorId and benefitId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aktif abonelik kontrolü
    const { data: subscription, error: subError } = await supabaseClient
      .from('creator_subscriptions')
      .select(`
        id,
        status,
        tier_id,
        tier:creator_subscription_tiers(
          id,
          name,
          benefits
        )
      `)
      .eq('subscriber_id', user.id)
      .eq('creator_id', creatorId)
      .in('status', ['active', 'paused'])
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: false,
          reason: 'no_subscription'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (subscription.status === 'paused') {
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: false,
          reason: 'subscription_paused',
          subscription: {
            id: subscription.id,
            tierId: subscription.tier_id,
            tierName: subscription.tier?.name,
            status: subscription.status
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Benefit tier'a dahil mi?
    const tierBenefits = subscription.tier?.benefits || [];
    if (!tierBenefits.includes(benefitId)) {
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: false,
          reason: 'benefit_not_included',
          subscription: {
            id: subscription.id,
            tierId: subscription.tier_id,
            tierName: subscription.tier?.name,
            status: subscription.status
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Benefit bilgisini al
    const { data: benefitData } = await supabaseClient
      .from('tier_benefits')
      .select('*')
      .eq('id', benefitId)
      .single();

    const benefit = benefitData || {
      id: benefitId,
      name: benefitId,
      emoji: '✨',
      hasLimit: !!LIMITED_BENEFITS[benefitId]
    };

    // Limitli benefit değilse direkt erişim ver
    if (!LIMITED_BENEFITS[benefitId]) {
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: true,
          benefit: {
            id: benefit.id,
            name: benefit.name,
            emoji: benefit.emoji,
            hasLimit: false
          },
          subscription: {
            id: subscription.id,
            tierId: subscription.tier_id,
            tierName: subscription.tier?.name,
            status: subscription.status
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limitli benefit - kullanım kontrolü
    const limitConfig = LIMITED_BENEFITS[benefitId];
    const { start: periodStart, end: periodEnd } = getPeriodBounds(limitConfig.limitType);

    // Admin client for usage table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Mevcut kullanımı kontrol et
    let { data: usageRecord } = await supabaseAdmin
      .from('tier_benefit_usage')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('benefit_id', benefitId)
      .gte('period_end', periodStart.toISOString())
      .single();

    // Kayıt yoksa oluştur
    if (!usageRecord) {
      const { data: newUsage, error: insertError } = await supabaseAdmin
        .from('tier_benefit_usage')
        .insert({
          subscription_id: subscription.id,
          user_id: user.id,
          creator_id: creatorId,
          benefit_id: benefitId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          usage_count: 0,
          max_usage: limitConfig.defaultMax
        })
        .select()
        .single();

      if (insertError) {
        console.error('Usage insert error:', insertError);
      }
      usageRecord = newUsage;
    }

    const currentUsage = usageRecord?.usage_count || 0;
    const maxUsage = usageRecord?.max_usage || limitConfig.defaultMax;
    const remaining = Math.max(0, maxUsage - currentUsage);

    // action: 'use' ise kullanımı artır
    if (action === 'use' && remaining > 0) {
      await supabaseAdmin
        .from('tier_benefit_usage')
        .update({ 
          usage_count: currentUsage + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', usageRecord.id);
    }

    const finalRemaining = action === 'use' ? Math.max(0, remaining - 1) : remaining;

    return new Response(
      JSON.stringify({
        success: true,
        hasAccess: remaining > 0,
        benefit: {
          id: benefit.id,
          name: benefit.name,
          emoji: benefit.emoji,
          hasLimit: true,
          limitType: limitConfig.limitType,
          maxUsage: maxUsage
        },
        subscription: {
          id: subscription.id,
          tierId: subscription.tier_id,
          tierName: subscription.tier?.name,
          status: subscription.status
        },
        usage: {
          current: action === 'use' ? currentUsage + 1 : currentUsage,
          max: maxUsage,
          remaining: finalRemaining,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString()
        },
        reason: remaining === 0 ? 'limit_reached' : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 📦 get-benefit-usage

### Amaç
Kullanıcının tüm limitli benefit kullanımlarını getirir.

### Endpoint
`POST /functions/v1/get-benefit-usage`

### Request Body

```typescript
interface GetBenefitUsageRequest {
  creatorId?: string;  // Opsiyonel - belirli creator için
}
```

### Response

```typescript
interface GetBenefitUsageResponse {
  success: boolean;
  usages: Array<{
    creatorId: string;
    creatorUsername: string;
    benefitId: string;
    benefitName: string;
    current: number;
    max: number;
    remaining: number;
    periodEnd: string;
  }>;
}
```

---

## 🗄️ Veritabanı Migration

```sql
-- tier_benefit_usage tablosu
CREATE TABLE IF NOT EXISTS public.tier_benefit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES creator_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  benefit_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscription_id, benefit_id, period_start)
);

-- Indexes
CREATE INDEX idx_benefit_usage_lookup 
ON tier_benefit_usage(user_id, creator_id, benefit_id, period_end);

CREATE INDEX idx_benefit_usage_subscription 
ON tier_benefit_usage(subscription_id);

-- RLS
ALTER TABLE tier_benefit_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can read own usage"
ON tier_benefit_usage FOR SELECT
USING (auth.uid() = user_id);

-- Creators can read usage for their subscribers
CREATE POLICY "Creators can read subscriber usage"
ON tier_benefit_usage FOR SELECT
USING (auth.uid() = creator_id);

-- Only service role can insert/update
CREATE POLICY "Service role can manage usage"
ON tier_benefit_usage FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tier_benefit_usage;
ALTER TABLE tier_benefit_usage REPLICA IDENTITY FULL;
```

---

## 🔄 Cron Job: Kullanım Sıfırlama

Limitli benefit'lerin periyodik sıfırlanması için cron job gerekli değil - her periyot için yeni kayıt oluşturulur. Eski kayıtlar temizlik için:

```sql
-- Eski kullanım kayıtlarını temizle (30 günden eski)
DELETE FROM tier_benefit_usage 
WHERE period_end < NOW() - INTERVAL '30 days';
```

Bu işlem için `pg_cron`  cron job kullanılabilir.
