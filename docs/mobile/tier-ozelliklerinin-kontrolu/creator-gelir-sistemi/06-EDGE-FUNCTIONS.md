# Edge Functions - Creator Gelir Sistemi

Bu döküman, creator gelir sistemi için gerekli edge function'ları açıklar.

---

## 📋 Function Listesi

| Function                      | Açıklama                           | Caller        |
| ----------------------------- | ---------------------------------- | ------------- |
| `get-creator-earnings`        | Gelir raporu ve istatistikler      | Mobile        |
| `get-payment-methods`         | Ödeme yöntemlerini listele         | Mobile        |
| `add-payment-method`          | Yeni ödeme yöntemi ekle            | Mobile        |
| `update-payment-method`       | Ödeme yöntemini güncelle           | Mobile        |
| `delete-payment-method`       | Ödeme yöntemini sil                | Mobile        |
| `get-payout-requests`         | Ödeme taleplerini listele          | Mobile        |
| `create-payout-request`       | Yeni ödeme talebi oluştur          | Mobile        |
| `cancel-payout-request`       | Ödeme talebini iptal et            | Mobile        |
| `get-auto-payout-settings`    | Otomatik ödeme ayarlarını al       | Mobile        |
| `update-auto-payout-settings` | Otomatik ödeme ayarlarını güncelle | Mobile        |
| `get-kyc-status`              | KYC durumunu al                    | Mobile        |
| `submit-kyc-application`      | KYC başvurusu gönder               | Mobile        |
| `verify-kyc-documents`        | KYC belgelerini doğrula (OCR+Face) | Internal/Cron |
| `process-auto-payouts`        | Otomatik ödemeleri işle            | Cron          |

> **Not:** KYC doğrulama için detaylı mimari ve OCR/Face Match microservice yapısı için [04-KYC-DOGRULAMA.md](./04-KYC-DOGRULAMA.md) dökümanına bakın.

---

## 1️⃣ get-creator-earnings

Creator'ın gelir raporunu ve istatistiklerini döndürür.

```typescript
// /supabase/functions/get-creator-earnings/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  period: '7d' | '30d' | '90d' | '180d' | '365d' | 'all';
  transactionFilter: 'all' | 'subscription' | 'gift' | 'payout';
  transactionPage: number;
  transactionLimit: number;
  transactionsOnly?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      period = '30d', 
      transactionFilter = 'all',
      transactionPage = 1,
      transactionLimit = 20,
      transactionsOnly = false
    }: RequestBody = await req.json();

    // Period'a göre tarih hesapla
    const getPeriodDate = (p: string): Date | null => {
      const now = new Date();
      switch (p) {
        case '7d': return new Date(now.setDate(now.getDate() - 7));
        case '30d': return new Date(now.setDate(now.getDate() - 30));
        case '90d': return new Date(now.setDate(now.getDate() - 90));
        case '180d': return new Date(now.setDate(now.getDate() - 180));
        case '365d': return new Date(now.setDate(now.getDate() - 365));
        default: return null;
      }
    };

    const periodDate = getPeriodDate(period);

    // Sadece işlemler isteniyorsa
    if (transactionsOnly) {
      let query = supabase
        .from('creator_transactions')
        .select(`
          id, type, amount, description, source_type, source_id,
          rate_at_time, tl_equivalent, metadata, created_at
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (periodDate) {
        query = query.gte('created_at', periodDate.toISOString());
      }

      if (transactionFilter !== 'all') {
        query = query.eq('type', transactionFilter);
      }

      const offset = (transactionPage - 1) * transactionLimit;
      query = query.range(offset, offset + transactionLimit);

      const { data: transactions, error: txError } = await query;

      if (txError) throw txError;

      return new Response(
        JSON.stringify({
          transactions,
          hasMoreTransactions: transactions?.length === transactionLimit + 1,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Güncel kuru al
    const { data: rateData } = await supabase
      .from('coin_rates')
      .select('rate, effective_from')
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    const coinRate = {
      rate: rateData?.rate || 0.5,
      updatedAt: rateData?.effective_from || new Date().toISOString(),
    };

    // Bakiye özeti
    const { data: balance } = await supabase
      .from('creator_balances')
      .select('total_earned, total_withdrawn, pending_payout, available_balance')
      .eq('creator_id', user.id)
      .single();

    // Gelir dağılımı (subscription vs gift)
    let earningsQuery = supabase
      .from('creator_transactions')
      .select('type, amount')
      .eq('creator_id', user.id)
      .gt('amount', 0);

    if (periodDate) {
      earningsQuery = earningsQuery.gte('created_at', periodDate.toISOString());
    }

    const { data: earningsData } = await earningsQuery;

    const subscriptionCoins = earningsData
      ?.filter(t => t.type === 'subscription')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const giftCoins = earningsData
      ?.filter(t => t.type === 'gift')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalCoins = subscriptionCoins + giftCoins;

    // Tier bazlı breakdown
    const { data: tierBreakdown } = await supabase.rpc('get_tier_earnings_breakdown', {
      p_creator_id: user.id,
      p_period_date: periodDate?.toISOString() || null
    });

    // Günlük trend (son 7 gün)
    const { data: dailyTrend } = await supabase.rpc('get_daily_earnings_trend', {
      p_creator_id: user.id,
      p_days: 7
    });

    // En iyi gün
    const bestDay = dailyTrend?.reduce((best: any, day: any) => 
      day.coins > (best?.coins || 0) ? day : best, null);

    // Son işlemler
    let txQuery = supabase
      .from('creator_transactions')
      .select(`
        id, type, amount, description, source_type, source_id,
        rate_at_time, tl_equivalent, metadata, created_at
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(transactionLimit + 1);

    if (periodDate) {
      txQuery = txQuery.gte('created_at', periodDate.toISOString());
    }

    if (transactionFilter !== 'all') {
      txQuery = txQuery.eq('type', transactionFilter);
    }

    const { data: transactions } = await txQuery;

    // İşlem detaylarını zenginleştir
    const enrichedTransactions = await Promise.all(
      (transactions || []).slice(0, transactionLimit).map(async (tx) => {
        let fromUser = null;
        
        if (tx.metadata?.from_user_id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .eq('user_id', tx.metadata.from_user_id)
            .eq('type', 'real')
            .single();
          
          if (userData) {
            fromUser = {
              id: userData.user_id,
              username: userData.username,
              avatarUrl: userData.avatar_url,
            };
          }
        }

        return {
          ...tx,
          fromUser,
        };
      })
    );

    return new Response(
      JSON.stringify({
        // Özet
        totalCoins,
        totalTL: totalCoins * coinRate.rate,
        
        // Dağılım
        subscriptionCoins,
        giftCoins,
        
        // Tier breakdown
        tierBreakdown: tierBreakdown || [],
        
        // Trend
        dailyTrend: dailyTrend || [],
        bestDay,
        
        // İşlemler
        transactions: enrichedTransactions,
        hasMoreTransactions: (transactions?.length || 0) > transactionLimit,
        
        // Kur
        coinRate,
        
        // Bakiye
        balance: {
          totalEarned: balance?.total_earned || 0,
          totalWithdrawn: balance?.total_withdrawn || 0,
          pendingPayout: balance?.pending_payout || 0,
          availableBalance: balance?.available_balance || 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 2️⃣ get-payment-methods

```typescript
// /supabase/functions/get-payment-methods/index.ts

serve(async (req) => {
  // ... auth check ...

  const { data: methods, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('creator_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Formatla
  const formattedMethods = methods.map(m => ({
    id: m.id,
    type: m.type,
    displayName: m.type === 'bank' 
      ? `${m.bank_name} (****${m.iban.slice(-4)})`
      : `${m.crypto_network} (****${m.wallet_address.slice(-4)})`,
    isDefault: m.is_default,
    status: m.status,
    rejectionReason: m.rejection_reason,
    details: m.type === 'bank' ? {
      bankName: m.bank_name,
      bankCode: m.bank_code,
      iban: m.iban,
      accountHolder: m.account_holder,
    } : {
      network: m.crypto_network,
      walletAddress: m.wallet_address,
    },
    createdAt: m.created_at,
  }));

  return new Response(
    JSON.stringify({ methods: formattedMethods }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

---

## 3️⃣ add-payment-method

```typescript
// /supabase/functions/add-payment-method/index.ts

serve(async (req) => {
  // ... auth check ...

  const { type, ...details } = await req.json();

  // Validasyon
  if (type === 'bank') {
    if (!details.iban || !details.accountHolder || !details.bankName) {
      return new Response(
        JSON.stringify({ error: 'Missing required bank details' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // IBAN formatı kontrolü
    const ibanRegex = /^TR\d{24}$/;
    const cleanIban = details.iban.replace(/\s/g, '').toUpperCase();
    if (!ibanRegex.test(cleanIban)) {
      return new Response(
        JSON.stringify({ error: 'Invalid IBAN format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } else if (type === 'crypto') {
    if (!details.network || !details.walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required crypto details' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Mevcut yöntem sayısı kontrolü (max 5)
  const { count } = await supabase
    .from('payment_methods')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id);

  if ((count || 0) >= 5) {
    return new Response(
      JSON.stringify({ error: 'Maximum 5 payment methods allowed' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Insert
  const insertData = {
    creator_id: user.id,
    type,
    status: 'pending',
    is_default: details.isDefault || false,
    ...(type === 'bank' ? {
      bank_name: details.bankName,
      bank_code: details.bankCode,
      iban: details.iban.replace(/\s/g, '').toUpperCase(),
      account_holder: details.accountHolder.toUpperCase(),
    } : {
      crypto_network: details.network,
      wallet_address: details.walletAddress,
    }),
  };

  const { data: method, error } = await supabase
    .from('payment_methods')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      return new Response(
        JSON.stringify({ error: 'This payment method already exists' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    throw error;
  }

  return new Response(
    JSON.stringify({ success: true, method }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

---

## 4️⃣ create-payout-request

```typescript
// /supabase/functions/create-payout-request/index.ts

serve(async (req) => {
  // ... auth check ...

  const { coinAmount, paymentMethodId } = await req.json();

  // Validasyonlar
  if (!coinAmount || !paymentMethodId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (coinAmount < 500) {
    return new Response(
      JSON.stringify({ error: 'Minimum payout is 500 coins' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Ödeme yöntemi kontrolü
  const { data: method } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', paymentMethodId)
    .eq('creator_id', user.id)
    .eq('status', 'approved')
    .single();

  if (!method) {
    return new Response(
      JSON.stringify({ error: 'Payment method not found or not approved' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Bakiye kontrolü
  const { data: balance } = await supabase
    .from('creator_balances')
    .select('available_balance')
    .eq('creator_id', user.id)
    .single();

  if (!balance || balance.available_balance < coinAmount) {
    return new Response(
      JSON.stringify({ error: 'Insufficient balance' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Bekleyen talep kontrolü
  const { data: pendingRequest } = await supabase
    .from('payout_requests')
    .select('id')
    .eq('creator_id', user.id)
    .in('status', ['pending', 'in_review'])
    .single();

  if (pendingRequest) {
    return new Response(
      JSON.stringify({ error: 'You already have a pending payout request' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // KYC kontrolü
  const { data: kycProfile } = await supabase
    .from('creator_kyc_profiles')
    .select('level, status, monthly_payout_limit')
    .eq('creator_id', user.id)
    .single();

  if (!kycProfile || kycProfile.status !== 'approved') {
    return new Response(
      JSON.stringify({ error: 'KYC verification required' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Güncel kuru al
  const { data: rateData } = await supabase
    .from('coin_rates')
    .select('rate')
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();

  const currentRate = rateData?.rate || 0.5;
  const tlAmount = coinAmount * currentRate;

  // Aylık limit kontrolü
  if (tlAmount > kycProfile.monthly_payout_limit) {
    return new Response(
      JSON.stringify({ error: `Monthly limit exceeded. Your limit: ₺${kycProfile.monthly_payout_limit}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Talebi oluştur (transaction ile)
  const { data: request, error: requestError } = await supabase.rpc('create_payout_request', {
    p_creator_id: user.id,
    p_coin_amount: coinAmount,
    p_payment_method_id: paymentMethodId,
  });

  if (requestError) throw requestError;

  // Talep detayını al
  const { data: createdRequest } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('id', request)
    .single();

  return new Response(
    JSON.stringify({ success: true, request: createdRequest }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

---

## 5️⃣ get-kyc-status

```typescript
// /supabase/functions/get-kyc-status/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // KYC profil kontrolü
    const { data: kycProfile } = await supabase
      .from('creator_kyc_profiles')
      .select(`
        level,
        status,
        verified_name,
        monthly_payout_limit,
        last_application_id,
        verified_at
      `)
      .eq('creator_id', user.id)
      .single();

    // Profil yoksa not_started
    if (!kycProfile) {
      return new Response(
        JSON.stringify({
          level: 'none',
          status: 'not_started',
          profile: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Son başvuru bilgilerini al
    let lastApplication = null;
    if (kycProfile.last_application_id) {
      const { data: app } = await supabase
        .from('kyc_applications')
        .select('id, level, status, rejection_reason, created_at, reviewed_at')
        .eq('id', kycProfile.last_application_id)
        .single();
      lastApplication = app;
    }

    // Pending başvuru var mı?
    const { data: pendingApp } = await supabase
      .from('kyc_applications')
      .select('id, created_at')
      .eq('creator_id', user.id)
      .eq('status', 'pending')
      .single();

    return new Response(
      JSON.stringify({
        level: kycProfile.level || 'none',
        status: pendingApp ? 'pending' : kycProfile.status,
        profile: {
          verifiedName: kycProfile.verified_name,
          monthlyPayoutLimit: kycProfile.monthly_payout_limit,
          verifiedAt: kycProfile.verified_at,
        },
        lastApplication,
        pendingApplication: pendingApp,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 7️⃣ submit-kyc-application

```typescript
// /supabase/functions/submit-kyc-application/index.ts

serve(async (req) => {
  // ... auth check ...

  const { 
    firstName, lastName, birthDate, idNumber,
    idFrontPath, idBackPath, selfiePath 
  } = await req.json();

  // Validasyon
  if (!firstName || !lastName || !birthDate || !idFrontPath || !idBackPath || !selfiePath) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Mevcut pending başvuru kontrolü
  const { data: existingApp } = await supabase
    .from('kyc_applications')
    .select('id')
    .eq('creator_id', user.id)
    .eq('status', 'pending')
    .single();

  if (existingApp) {
    return new Response(
      JSON.stringify({ error: 'You already have a pending KYC application' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Signed URL'ler oluştur (backend'de kullanım için)
  const { data: idFrontUrl } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(idFrontPath, 3600);

  const { data: idBackUrl } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(idBackPath, 3600);

  const { data: selfieUrl } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(selfiePath, 3600);

  // Başvuru oluştur
  const { data: application, error } = await supabase
    .from('kyc_applications')
    .insert({
      creator_id: user.id,
      level: 'basic',
      status: 'pending',
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      id_number: idNumber,
      id_front_path: idFrontPath,
      id_back_path: idBackPath,
      selfie_path: selfiePath,
    })
    .select()
    .single();

  if (error) throw error;

  // Otomatik doğrulama başlat (async)
  // Background job veya queue ile yapılabilir
  fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-kyc-documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ applicationId: application.id }),
  }).catch(err => console.error('Auto verification trigger failed:', err));

  return new Response(
    JSON.stringify({ success: true, application }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

---

## 8️⃣ process-auto-payouts (Cron Job)

```typescript
// /supabase/functions/process-auto-payouts/index.ts

// Bu function haftalık cron job olarak çalışır
// Supabase Dashboard > Database > Extensions > pg_cron ile schedule edilir

serve(async (req) => {
  // Service key kontrolü (sadece internal call)
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Auto-payout aktif creator'ları al
  const { data: autoSettings, error: settingsError } = await supabase
    .from('auto_payout_settings')
    .select(`
      creator_id,
      minimum_coin_amount,
      payment_method_id,
      payment_methods!inner(status)
    `)
    .eq('is_enabled', true)
    .eq('payment_methods.status', 'approved');

  if (settingsError) {
    console.error('Failed to get auto payout settings:', settingsError);
    return new Response(JSON.stringify({ error: settingsError.message }), { status: 500 });
  }

  const results = [];

  for (const setting of autoSettings || []) {
    try {
      // Bakiyeyi kontrol et
      const { data: balance } = await supabase
        .from('creator_balances')
        .select('available_balance')
        .eq('creator_id', setting.creator_id)
        .single();

      if (!balance || balance.available_balance < setting.minimum_coin_amount) {
        results.push({
          creatorId: setting.creator_id,
          status: 'skipped',
          reason: 'Insufficient balance',
        });
        continue;
      }

      // Bekleyen talep var mı kontrol et
      const { data: pendingRequest } = await supabase
        .from('payout_requests')
        .select('id')
        .eq('creator_id', setting.creator_id)
        .in('status', ['pending', 'in_review'])
        .single();

      if (pendingRequest) {
        results.push({
          creatorId: setting.creator_id,
          status: 'skipped',
          reason: 'Has pending request',
        });
        continue;
      }

      // Güncel kuru al
      const { data: rateData } = await supabase
        .from('coin_rates')
        .select('rate')
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      const currentRate = rateData?.rate || 0.5;

      // Talep oluştur
      const { data: request, error: requestError } = await supabase
        .from('payout_requests')
        .insert({
          creator_id: setting.creator_id,
          payment_method_id: setting.payment_method_id,
          coin_amount: balance.available_balance,
          tl_amount: balance.available_balance * currentRate,
          locked_rate: currentRate,
          rate_locked_at: new Date().toISOString(),
          is_auto_created: true,
        })
        .select('id')
        .single();

      if (requestError) {
        results.push({
          creatorId: setting.creator_id,
          status: 'error',
          reason: requestError.message,
        });
        continue;
      }

      // Pending payout güncelle
      await supabase
        .from('creator_balances')
        .update({
          pending_payout: balance.available_balance,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', setting.creator_id);

      results.push({
        creatorId: setting.creator_id,
        status: 'created',
        requestId: request.id,
        coinAmount: balance.available_balance,
      });

    } catch (err) {
      results.push({
        creatorId: setting.creator_id,
        status: 'error',
        reason: err.message,
      });
    }
  }

  // Log sonuçları
  console.log('Auto payout results:', JSON.stringify(results));

  return new Response(
    JSON.stringify({ 
      success: true, 
      processed: results.length,
      results 
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

---

## 📊 Database Functions (RPC)

### get_tier_earnings_breakdown

```sql
CREATE OR REPLACE FUNCTION get_tier_earnings_breakdown(
    p_creator_id UUID,
    p_period_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    tier_id UUID,
    tier_name TEXT,
    tier_emoji TEXT,
    subscriber_count BIGINT,
    coin_per_subscriber BIGINT,
    total_coins BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tier_id,
        t.name as tier_name,
        COALESCE((t.metadata->>'emoji')::TEXT, '🎯') as tier_emoji,
        COUNT(DISTINCT ct.source_id)::BIGINT as subscriber_count,
        COALESCE(t.coin_price_monthly, 0)::BIGINT as coin_per_subscriber,
        COALESCE(SUM(ct.amount), 0)::BIGINT as total_coins
    FROM creator_subscription_tiers t
    LEFT JOIN creator_transactions ct ON 
        ct.creator_id = p_creator_id 
        AND ct.type = 'subscription'
        AND ct.metadata->>'tier_id' = t.id::TEXT
        AND (p_period_date IS NULL OR ct.created_at >= p_period_date)
    WHERE t.creator_id = p_creator_id
    GROUP BY t.id, t.name, t.metadata, t.coin_price_monthly
    ORDER BY total_coins DESC;
END;
$$ LANGUAGE plpgsql STABLE;
```

### get_daily_earnings_trend

```sql
CREATE OR REPLACE FUNCTION get_daily_earnings_trend(
    p_creator_id UUID,
    p_days INT DEFAULT 7
)
RETURNS TABLE (
    date DATE,
    coins BIGINT,
    label TEXT
) AS $$
DECLARE
    day_names TEXT[] := ARRAY['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
BEGIN
    RETURN QUERY
    WITH dates AS (
        SELECT generate_series(
            CURRENT_DATE - (p_days - 1),
            CURRENT_DATE,
            '1 day'::INTERVAL
        )::DATE as day
    )
    SELECT 
        d.day as date,
        COALESCE(SUM(ct.amount), 0)::BIGINT as coins,
        day_names[EXTRACT(DOW FROM d.day)::INT + 1] as label
    FROM dates d
    LEFT JOIN creator_transactions ct ON 
        ct.creator_id = p_creator_id
        AND ct.amount > 0
        AND DATE(ct.created_at) = d.day
    GROUP BY d.day
    ORDER BY d.day;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## ✅ Deployment Checklist

### Edge Functions

- [ ] `get-creator-earnings` deploy
- [ ] `get-payment-methods` deploy
- [ ] `add-payment-method` deploy
- [ ] `update-payment-method` deploy
- [ ] `delete-payment-method` deploy
- [ ] `get-payout-requests` deploy
- [ ] `create-payout-request` deploy
- [ ] `cancel-payout-request` deploy
- [ ] `get-auto-payout-settings` deploy
- [ ] `update-auto-payout-settings` deploy
- [ ] `get-kyc-status` deploy
- [ ] `submit-kyc-application` deploy
- [ ] `verify-kyc-documents` deploy
- [ ] `process-auto-payouts` deploy

### Database Functions

- [ ] `get_current_coin_rate()` function
- [ ] `get_tier_earnings_breakdown()` function
- [ ] `get_daily_earnings_trend()` function
- [ ] `create_payout_request()` function

### Cron Jobs

- [ ] `process-auto-payouts` - Her Pazartesi 10:00
- [ ] `verify-kyc-documents` - Her 5 dakikada pending başvuruları kontrol et (opsiyonel)
- [ ] pg_cron extension aktif

### Environment Variables

- [ ] `SUPABASE_URL` - Supabase proje URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- [ ] `CRON_SECRET` - Cron job authentication için
- [ ] `KYC_MICROSERVICE_URL` - OCR/Face Match servisi URL (opsiyonel)
