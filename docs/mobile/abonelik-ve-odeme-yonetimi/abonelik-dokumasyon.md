# İpelya Abonelik & Ödeme Sistemi Dokümantasyonu

Bu doküman İpelya mobil uygulaması için **Expo + React Native + Supabase** tabanlı tam ödeme ve token sistemi entegrasyon kılavuzudur.

---

## 📋 İçindekiler

1. [Ekonomi Modeli](#1-ekonomi-modeli)
2. [Kullanılacak Paketler](#2-kullanılacak-paketler)
3. [Uygulama Mimarisi](#3-uygulama-mimarisi)
4. [Veritabanı Şeması](#4-veritabanı-şeması)
5. [Store Ürün Tanımları](#5-store-ürün-tanımları)
6. [Satın Alma Akışı](#6-satın-alma-akışı)
7. [Sunucu Tarafı Doğrulama](#7-sunucu-tarafı-doğrulama)
8. [Creator Abonelik Sistemi](#8-creator-abonelik-sistemi)
9. [Hediye Sistemi](#9-hediye-sistemi)
10. [Animasyonlar](#10-animasyonlar)
11. [Güvenlik & Fraud Koruması](#11-güvenlik--fraud-koruması)
12. [Realtime Entegrasyonu](#12-realtime-entegrasyonu)

---

## 1. Ekonomi Modeli

### 1.1 Hibrit Sistem Özeti

```
┌─────────────────────────────────────────────────────────────────┐
│                     İpelya Ekonomi Sistemi                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. COIN SATIN ALMA (App Store/Google Play)                     │
│     ├── ₺29.99  → 100 Coin                                      │
│     ├── ₺129.99 → 550 Coin (+50 bonus)                          │
│     └── ₺249.99 → 1150 Coin (+150 bonus)                        │
│                                                                  │
│  2. PLATFORM ABONELİKLERİ (Sabit - App Store/Google Play)       │
│     ├── Premium Aylık: ₺79.99/ay                                │
│     └── Premium Yıllık: ₺599.99/yıl                             │
│     → Reklamsız, özel rozetler, öncelikli destek                │
│                                                                  │
│  3. CREATOR ABONELİKLERİ (Coin ile - Dinamik Fiyat)             │
│     ├── Creator kendi tier'larını oluşturur                     │
│     ├── Fiyatı Coin cinsinden belirler (10-10000 Coin/ay)       │
│     ├── Her ay otomatik Coin düşer                              │
│     └── Yetersiz Coin → Abonelik askıya alınır                  │
│                                                                  │
│  4. HEDİYELER (Coin ile)                                        │
│     ├── Heart: 10 Coin                                          │
│     ├── Rose: 25 Coin                                           │
│     ├── Diamond: 100 Coin                                       │
│     └── Crown: 500 Coin                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Neden Hibrit Model?

| Özellik           | App Store/Google Play              | Coin Sistemi                    |
| ----------------- | ---------------------------------- | ------------------------------- |
| **Fiyatlandırma** | Sabit (Apple/Google belirler)      | Dinamik (Creator belirler)      |
| **Komisyon**      | %15-30                             | Platform kontrolünde            |
| **Esneklik**      | Düşük                              | Yüksek                          |
| **Kullanım**      | Platform abonelikleri, coin satışı | Creator abonelikleri, hediyeler |

### 1.3 Gelir Paylaşımı

| Kaynak           | Creator Payı | Platform Payı |
| ---------------- | ------------ | ------------- |
| Creator Abonelik | %80          | %20           |
| Hediye           | %70          | %30           |
| Tip              | %85          | %15           |

---

## 2. Kullanılacak Paketler

### 2.1 Store İçi Ödemeler (iOS & Android)

| Paket        | Açıklama                             | Dokümantasyon                                        |
| ------------ | ------------------------------------ | ---------------------------------------------------- |
| **expo-iap** | Expo için resmi IAP çözümü (v2.7.0+) | [Expo IAP Docs](https://hyochan.github.io/expo-iap/) |

> **Not:** `expo-iap` Open IAP specification'a uyumlu, unified API sağlıyor. Hem iOS hem Android için tek API.

### 2.2 Sunucu Tarafı Doğrulama

| Platform   | API                       | Kullanım                  |
| ---------- | ------------------------- | ------------------------- |
| **Apple**  | App Store Server API v2   | JWS transaction doğrulama |
| **Google** | Google Play Developer API | purchaseToken doğrulama   |

### 2.3 Animasyonlar

| Paket                          | Kullanım                               |
| ------------------------------ | -------------------------------------- |
| **@shopify/react-native-skia** | Canvas animasyonları, hediye efektleri |
| **react-native-reanimated**    | UI animasyonları, gesture handling     |

### 2.4 Supabase

| Özellik                | Kullanım                           |
| ---------------------- | ---------------------------------- |
| **Edge Functions**     | Receipt doğrulama, token işlemleri |
| **Realtime Broadcast** | Hediye bildirimleri                |
| **PostgreSQL RPC**     | Atomik token işlemleri             |

---

## 3. Uygulama Mimarisi

### 3.1 Frontend Yapısı (İpelya Mobile)

```
apps/mobile/src/
├── components/
│   └── store/
│       ├── SubscriptionCard.tsx
│       ├── TokenPackageCard.tsx
│       ├── GiftSelector.tsx
│       └── GiftAnimations/
│           ├── index.tsx
│           ├── HeartBurst.tsx
│           └── CrystalExplosion.tsx
├── hooks/
│   ├── useSubscription.ts
│   ├── useTokenBalance.ts
│   ├── usePurchase.ts
│   └── useGiftSend.ts
├── services/
│   └── iap/
│       ├── index.ts
│       ├── products.ts
│       └── validation.ts
└── store/
    └── economy.store.ts
```

### 3.2 Backend Yapısı (Supabase Edge Functions)

```
supabase/functions/
├── verify-purchase/          # Apple & Google receipt doğrulama
├── grant-tokens/             # Token ekleme
├── buy-coins/                # Coin satın alma (mevcut)
├── send-gift/                # Hediye gönderimi
├── webhook-apple/            # Apple Server Notifications v2
├── webhook-google/           # Google RTDN
└── subscription-status/      # Abonelik durumu
```

---

## 4. Veritabanı Şeması

### 4.1 Mevcut Tablolar

| Tablo           | Açıklama                                                       |
| --------------- | -------------------------------------------------------------- |
| `profiles`      | Kullanıcı profilleri                                           |
| `subscriptions` | Creator abonelikleri (subscriber_id, creator_id, tier, status) |

### 4.2 Yeni Tablolar

#### `coin_balances`

```sql
CREATE TABLE coin_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

#### `purchases`

```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  store TEXT NOT NULL CHECK (store IN ('apple', 'google')),
  product_id TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  purchase_token TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'failed', 'refunded')),
  coins_granted INTEGER,
  price_amount NUMERIC(10,2),
  price_currency TEXT DEFAULT 'TRY',
  environment TEXT DEFAULT 'production',
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `coin_transactions`

```sql
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'gift_sent', 'gift_received', 'subscription', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `gifts`

```sql
CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  gift_type TEXT NOT NULL,
  coin_cost INTEGER NOT NULL,
  message TEXT,
  post_id UUID REFERENCES posts(id),
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Atomik RPC Fonksiyonları

```sql
-- Coin düşürme
CREATE OR REPLACE FUNCTION decrement_coin_balance(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current INTEGER;
  v_new INTEGER;
BEGIN
  SELECT balance INTO v_current FROM coin_balances WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_current IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Balance not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_current < p_amount THEN
    RETURN QUERY SELECT false, v_current, 'Insufficient balance'::TEXT;
    RETURN;
  END IF;
  
  v_new := v_current - p_amount;
  
  UPDATE coin_balances SET balance = v_new, lifetime_spent = lifetime_spent + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO coin_transactions (user_id, type, amount, balance_after, reference_id)
  VALUES (p_user_id, p_type, -p_amount, v_new, p_reference_id);
  
  RETURN QUERY SELECT true, v_new, NULL::TEXT;
END;
$$;

-- Coin ekleme
CREATE OR REPLACE FUNCTION increment_coin_balance(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new INTEGER;
BEGIN
  INSERT INTO coin_balances (user_id, balance, lifetime_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = coin_balances.balance + p_amount,
      lifetime_earned = coin_balances.lifetime_earned + p_amount,
      updated_at = now()
  RETURNING balance INTO v_new;
  
  INSERT INTO coin_transactions (user_id, type, amount, balance_after, reference_id)
  VALUES (p_user_id, p_type, p_amount, v_new, p_reference_id);
  
  RETURN QUERY SELECT true, v_new;
END;
$$;
```

---

## 5. Store Ürün Tanımları

### 5.1 Coin Paketleri

| Product ID          | Coin | Bonus | Fiyat   |
| ------------------- | ---- | ----- | ------- |
| `ipelya_coins_100`  | 100  | 0     | ₺29.99  |
| `ipelya_coins_500`  | 500  | +50   | ₺129.99 |
| `ipelya_coins_1000` | 1000 | +150  | ₺249.99 |

### 5.2 Platform Abonelikleri

| Product ID               | Periyot | Fiyat       |
| ------------------------ | ------- | ----------- |
| `ipelya_premium_monthly` | Aylık   | ₺79.99/ay   |
| `ipelya_premium_yearly`  | Yıllık  | ₺599.99/yıl |

### 5.3 Ürün Konfigürasyonu

```typescript
// apps/mobile/src/services/iap/products.ts
export const COIN_PRODUCTS = [
  { id: 'ipelya_coins_100', coins: 100, bonus: 0 },
  { id: 'ipelya_coins_500', coins: 500, bonus: 50, popular: true },
  { id: 'ipelya_coins_1000', coins: 1000, bonus: 150 },
] as const;

export const SUBSCRIPTION_PRODUCTS = [
  { id: 'ipelya_premium_monthly', period: 'monthly' },
  { id: 'ipelya_premium_yearly', period: 'yearly' },
] as const;
```

---

## 6. Satın Alma Akışı

> **Detaylı Rehber:** [expo-iap-rehberi.md](./expo-iap-rehberi.md)

### 6.1 Kurulum

```bash
npx expo install expo-iap
```

### 6.2 useIAP Hook ile Modern Yaklaşım (Önerilen)

```typescript
// apps/mobile/src/hooks/usePurchase.ts
import { useEffect, useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useIAP, finishTransaction, PurchaseError } from 'expo-iap';
import { supabase } from '@/lib/supabase';
import { COIN_PRODUCTS, SUBSCRIPTION_PRODUCTS } from '@/services/iap/products';

export function usePurchase() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    connected,
    products,
    subscriptions,
    currentPurchase,
    currentPurchaseError,
    requestProducts,
    requestPurchase,
    getAvailablePurchases,
  } = useIAP();

  // Ürünleri yükle
  useEffect(() => {
    if (!connected) return;

    const loadProducts = async () => {
      try {
        // Coin paketleri
        await requestProducts({
          skus: COIN_PRODUCTS.map(p => p.id),
          type: 'inapp',
        });
        // Abonelikler
        await requestProducts({
          skus: SUBSCRIPTION_PRODUCTS.map(p => p.id),
          type: 'subs',
        });
      } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
      }
    };

    loadProducts();
  }, [connected]);

  // Purchase listener
  useEffect(() => {
    if (currentPurchaseError) {
      handleError(currentPurchaseError);
      setIsProcessing(false);
      return;
    }

    if (currentPurchase) {
      processPurchase(currentPurchase);
    }
  }, [currentPurchase, currentPurchaseError]);

  const processPurchase = async (purchase: any) => {
    try {
      // Server-side validation
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          receipt: purchase.transactionReceipt,
          productId: purchase.productId,
          transactionId: purchase.transactionId,
          purchaseToken: purchase.purchaseToken,
        },
      });

      if (error || !data.isValid) {
        Alert.alert('Hata', 'Satın alma doğrulanamadı.');
        setIsProcessing(false);
        return;
      }

      // Finish transaction (ÖNEMLİ!)
      const isConsumable = COIN_PRODUCTS.some(p => p.id === purchase.productId);
      await finishTransaction({ purchase, isConsumable });

      Alert.alert('Başarılı', 'Satın alma tamamlandı!');
      setIsProcessing(false);
    } catch (error) {
      console.error('Process purchase error:', error);
      setIsProcessing(false);
    }
  };

  const handleError = (error: PurchaseError) => {
    switch (error.code) {
      case 'E_USER_CANCELLED':
        // Sessiz - kullanıcı iptal etti
        break;
      case 'E_NETWORK_ERROR':
        Alert.alert('Bağlantı Hatası', 'İnternet bağlantınızı kontrol edin.');
        break;
      default:
        Alert.alert('Hata', 'Satın alma başarısız oldu.');
    }
  };

  // Coin satın alma
  const buyCoins = useCallback(async (productId: string) => {
    if (!connected) {
      Alert.alert('Hata', 'Store bağlantısı yok.');
      return;
    }

    setIsProcessing(true);
    try {
      await requestPurchase({
        request: {
          ios: { sku: productId },
          android: { skus: [productId] },
        },
        type: 'inapp',
      });
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [connected, requestPurchase]);

  // Abonelik satın alma
  const buySubscription = useCallback(async (subscriptionId: string) => {
    if (!connected) {
      Alert.alert('Hata', 'Store bağlantısı yok.');
      return;
    }

    const subscription = subscriptions.find(s => s.id === subscriptionId);

    setIsProcessing(true);
    try {
      await requestPurchase({
        request: {
          ios: { sku: subscriptionId },
          android: {
            skus: [subscriptionId],
            subscriptionOffers: subscription?.subscriptionOfferDetails?.map(offer => ({
              sku: subscriptionId,
              offerToken: offer.offerToken,
            })) || [],
          },
        },
        type: 'subs',
      });
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [connected, subscriptions, requestPurchase]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      const purchases = await getAvailablePurchases();
      for (const purchase of purchases) {
        const { data } = await supabase.functions.invoke('verify-purchase', {
          body: { ...purchase },
        });
        if (data?.isValid) {
          // Grant purchase
        }
      }
      Alert.alert('Başarılı', 'Satın almalar geri yüklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Geri yükleme başarısız.');
    }
  }, [getAvailablePurchases]);

  return {
    connected,
    products,
    subscriptions,
    isProcessing,
    buyCoins,
    buySubscription,
    restorePurchases,
  };
}
```

### 6.3 Ürün Konfigürasyonu

```typescript
// apps/mobile/src/services/iap/products.ts
export const COIN_PRODUCTS = [
  { id: 'ipelya_coins_100', coins: 100, bonus: 0 },
  { id: 'ipelya_coins_500', coins: 500, bonus: 50, popular: true },
  { id: 'ipelya_coins_1000', coins: 1000, bonus: 150 },
] as const;

export const SUBSCRIPTION_PRODUCTS = [
  { id: 'ipelya_premium_monthly', period: 'monthly' },
  { id: 'ipelya_premium_yearly', period: 'yearly' },
] as const;

export type CoinProductId = typeof COIN_PRODUCTS[number]['id'];
export type SubscriptionProductId = typeof SUBSCRIPTION_PRODUCTS[number]['id'];
```

### 6.4 Önemli Notlar

> ⚠️ **finishTransaction Zorunlu!**
> - `finishTransaction` çağrılmazsa iOS'ta para iade edilir
> - Android'de satın alma pending kalır ve tekrar satın alınamaz

> ⚠️ **Server-Side Validation Zorunlu!**
> - Client-side validation güvenli değildir
> - Her zaman backend'de receipt doğrulaması yapın

---

## 7. Sunucu Tarafı Doğrulama

### 7.1 verify-purchase Edge Function

```typescript
// supabase/functions/verify-purchase/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization");
  const { data: { user } } = await supabase.auth.getUser(authHeader?.replace("Bearer ", ""));
  
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const { receipt, productId, purchaseToken, transactionId } = await req.json();

  // Duplicate check
  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("transaction_id", transactionId)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ isValid: false, error: "Already processed" }), { headers: corsHeaders });
  }

  // Platform detection & validation
  const isApple = !purchaseToken;
  let isValid = false;
  let validationResult: any = null;

  if (isApple) {
    validationResult = await validateAppleReceipt(receipt);
    isValid = validationResult.isValid;
  } else {
    validationResult = await validateGooglePurchase(productId, purchaseToken);
    isValid = validationResult.isValid;
  }

  // Record purchase
  const { data: purchase } = await supabase.from("purchases").insert({
    user_id: user.id,
    store: isApple ? "apple" : "google",
    product_id: productId,
    transaction_id: transactionId,
    purchase_token: purchaseToken,
    status: isValid ? "validated" : "failed",
    validated_at: isValid ? new Date().toISOString() : null,
  }).select().single();

  // Grant coins if valid
  if (isValid) {
    const coinsToGrant = getCoinsForProduct(productId);
    await supabase.rpc("increment_coin_balance", {
      p_user_id: user.id,
      p_amount: coinsToGrant,
      p_type: "purchase",
      p_reference_id: purchase.id,
    });
  }

  return new Response(JSON.stringify({ isValid, coinsGranted: isValid ? getCoinsForProduct(productId) : 0 }), { headers: corsHeaders });
});

function getCoinsForProduct(productId: string): number {
  const products: Record<string, number> = {
    ipelya_coins_100: 100,
    ipelya_coins_500: 550,
    ipelya_coins_1000: 1150,
  };
  return products[productId] || 0;
}

async function validateAppleReceipt(receipt: string) {
  // App Store Server API v2 implementation
  // TODO: Implement with Apple's JWS verification
  return { isValid: true };
}

async function validateGooglePurchase(productId: string, purchaseToken: string) {
  // Google Play Developer API implementation
  // TODO: Implement with Google API
  return { isValid: true };
}
```

---

## 8. Creator Abonelik Sistemi

Creator'ların kendi abonelik tier'larını oluşturup, Coin cinsinden fiyatlandırma yapabildiği sistem.

### 8.1 Sistem Özeti

```
┌─────────────────────────────────────────────────────────────────┐
│                    Creator Abonelik Akışı                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Creator tier oluşturur (Bronze: 50 Coin/ay)                 │
│  2. User abonelik başlatır → 50 Coin düşer                      │
│  3. Creator'a %80 = 40 Coin eklenir                             │
│  4. Her ay otomatik yenileme (Cron job)                         │
│  5. Yetersiz bakiye → Abonelik askıya alınır                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Önerilen Tier Şablonları

| Tier        | Önerilen Coin/Ay | TL Karşılığı | Özellikler           |
| ----------- | ---------------- | ------------ | -------------------- |
| **Bronze**  | 50 Coin          | ~₺15         | Özel içerikler       |
| **Silver**  | 150 Coin         | ~₺45         | Bronze + DM erişimi  |
| **Gold**    | 300 Coin         | ~₺90         | Silver + Canlı yayın |
| **Diamond** | 500 Coin         | ~₺150        | Gold + 1-1 görüşme   |
| **Custom**  | 10-10000 Coin    | ₺3-₺3000     | Creator belirler     |

### 8.3 Veritabanı Şeması

#### `creator_subscription_tiers` - Creator Tier'ları

```sql
CREATE TABLE creator_subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Bronze", "Silver", "Gold"
  description TEXT,
  coin_price_monthly INTEGER NOT NULL,   -- Aylık coin fiyatı (10-10000)
  coin_price_yearly INTEGER,             -- Yıllık coin fiyatı (opsiyonel, indirimli)
  benefits JSONB DEFAULT '[]',           -- ["Özel içerikler", "DM erişimi"]
  max_subscribers INTEGER,               -- Limit (opsiyonel)
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_coin_price CHECK (coin_price_monthly >= 10 AND coin_price_monthly <= 10000)
);

CREATE INDEX idx_creator_tiers_creator ON creator_subscription_tiers(creator_id);
```

#### `creator_subscriptions` - Kullanıcı Abonelikleri

```sql
CREATE TABLE creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES creator_subscription_tiers(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  coin_price INTEGER NOT NULL,           -- Abonelik anındaki fiyat (sabit kalır)
  started_at TIMESTAMPTZ DEFAULT now(),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  pause_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(subscriber_id, creator_id)      -- Bir creator'a tek abonelik
);

CREATE INDEX idx_creator_subs_subscriber ON creator_subscriptions(subscriber_id);
CREATE INDEX idx_creator_subs_creator ON creator_subscriptions(creator_id);
CREATE INDEX idx_creator_subs_next_billing ON creator_subscriptions(next_billing_at) WHERE status = 'active';
```

#### `subscription_payments` - Ödeme Geçmişi

```sql
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES creator_subscriptions(id),
  subscriber_id UUID NOT NULL REFERENCES auth.users(id),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  coin_amount INTEGER NOT NULL,
  creator_share INTEGER NOT NULL,        -- Creator'a giden (%80)
  platform_share INTEGER NOT NULL,       -- Platform payı (%20)
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sub_payments_subscription ON subscription_payments(subscription_id);
```

### 8.4 Edge Functions

#### `subscribe-to-creator` - Abonelik Başlatma

```typescript
// supabase/functions/subscribe-to-creator/index.ts
serve(async (req) => {
  const supabase = createClient(/* ... */);
  const { creatorId, tierId, billingPeriod } = await req.json();

  // Tier bilgisini al
  const { data: tier } = await supabase
    .from("creator_subscription_tiers")
    .select("*")
    .eq("id", tierId)
    .eq("is_active", true)
    .single();

  if (!tier) {
    return new Response(JSON.stringify({ error: "Tier not found" }), { status: 404 });
  }

  // Fiyatı hesapla
  const coinPrice = billingPeriod === "yearly" 
    ? (tier.coin_price_yearly || tier.coin_price_monthly * 10) // Yıllık %17 indirim
    : tier.coin_price_monthly;

  // Coin düş
  const { data: result } = await supabase.rpc("decrement_coin_balance", {
    p_user_id: user.id,
    p_amount: coinPrice,
    p_type: "subscription",
  });

  if (!result[0].success) {
    return new Response(JSON.stringify({ error: result[0].error_message }), { status: 400 });
  }

  // Creator'a payını ekle
  const creatorShare = Math.floor(coinPrice * 0.80);
  await supabase.rpc("increment_coin_balance", {
    p_user_id: creatorId,
    p_amount: creatorShare,
    p_type: "subscription_income",
  });

  // Abonelik oluştur
  const periodEnd = billingPeriod === "yearly"
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { data: subscription } = await supabase
    .from("creator_subscriptions")
    .insert({
      subscriber_id: user.id,
      creator_id: creatorId,
      tier_id: tierId,
      billing_period: billingPeriod,
      coin_price: coinPrice,
      current_period_end: periodEnd.toISOString(),
      next_billing_at: periodEnd.toISOString(),
    })
    .select()
    .single();

  // Ödeme kaydı
  await supabase.from("subscription_payments").insert({
    subscription_id: subscription.id,
    subscriber_id: user.id,
    creator_id: creatorId,
    coin_amount: coinPrice,
    creator_share: creatorShare,
    platform_share: coinPrice - creatorShare,
    period_start: new Date().toISOString(),
    period_end: periodEnd.toISOString(),
  });

  return new Response(JSON.stringify({ success: true, subscription }));
});
```

#### `process-subscription-renewals` - Otomatik Yenileme (Cron)

```typescript
// supabase/functions/process-subscription-renewals/index.ts
// Bu function her gün çalışır (Supabase Cron veya external cron)
serve(async (req) => {
  const supabase = createClient(/* ... */);

  // Yenilenmesi gereken abonelikleri bul
  const { data: subscriptions } = await supabase
    .from("creator_subscriptions")
    .select("*, tier:creator_subscription_tiers(*)")
    .eq("status", "active")
    .lte("next_billing_at", new Date().toISOString());

  for (const sub of subscriptions || []) {
    // Bakiye kontrol
    const { data: balance } = await supabase
      .from("coin_balances")
      .select("balance")
      .eq("user_id", sub.subscriber_id)
      .single();

    if (!balance || balance.balance < sub.coin_price) {
      // Yetersiz bakiye - askıya al
      await supabase
        .from("creator_subscriptions")
        .update({ status: "paused", pause_reason: "insufficient_balance" })
        .eq("id", sub.id);

      // Bildirim gönder
      await supabase.functions.invoke("send-notification", {
        body: {
          userId: sub.subscriber_id,
          type: "subscription_paused",
          title: "Abonelik Askıya Alındı",
          body: `Yetersiz bakiye nedeniyle aboneliğiniz askıya alındı.`,
        },
      });
      continue;
    }

    // Yenile
    const creatorShare = Math.floor(sub.coin_price * 0.80);

    await supabase.rpc("decrement_coin_balance", {
      p_user_id: sub.subscriber_id,
      p_amount: sub.coin_price,
      p_type: "subscription",
    });

    await supabase.rpc("increment_coin_balance", {
      p_user_id: sub.creator_id,
      p_amount: creatorShare,
      p_type: "subscription_income",
    });

    const nextBilling = sub.billing_period === "yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await supabase
      .from("creator_subscriptions")
      .update({
        current_period_start: sub.current_period_end,
        current_period_end: nextBilling.toISOString(),
        next_billing_at: nextBilling.toISOString(),
      })
      .eq("id", sub.id);
  }

  return new Response(JSON.stringify({ processed: subscriptions?.length || 0 }));
});
```

### 8.5 Frontend Hooks

```typescript
// apps/mobile/src/hooks/useCreatorSubscription.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export function useCreatorSubscription() {
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = useCallback(async (creatorId: string, tierId: string, billingPeriod: 'monthly' | 'yearly') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-to-creator', {
        body: { creatorId, tierId, billingPeriod },
      });

      if (error) throw error;
      Alert.alert('Başarılı', 'Abonelik başlatıldı!');
      return data.subscription;
    } catch (error: any) {
      if (error.message?.includes('Insufficient')) {
        Alert.alert('Yetersiz Bakiye', 'Coin satın alarak bakiyenizi artırabilirsiniz.');
      } else {
        Alert.alert('Hata', 'Abonelik başlatılamadı.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancel = useCallback(async (subscriptionId: string) => {
    const { error } = await supabase
      .from('creator_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (!error) {
      Alert.alert('İptal Edildi', 'Aboneliğiniz dönem sonunda sona erecek.');
    }
  }, []);

  return { subscribe, cancel, isLoading };
}
```

---

## 9. Hediye Sistemi

### 9.1 Hediye Tipleri

| Gift Type | Coin Cost | Animasyon      |
| --------- | --------- | -------------- |
| `heart`   | 10        | HeartBurst     |
| `rose`    | 25        | RoseFloat      |
| `diamond` | 100       | DiamondRain    |
| `crown`   | 500       | CrownExplosion |

### 9.2 send-gift Edge Function

```typescript
// supabase/functions/send-gift/index.ts
serve(async (req) => {
  const supabase = createClient(/* ... */);
  const { receiverId, giftType, message, postId } = await req.json();
  
  const giftCosts: Record<string, number> = {
    heart: 10, rose: 25, diamond: 100, crown: 500,
  };
  
  const cost = giftCosts[giftType];
  if (!cost) return new Response(JSON.stringify({ error: "Invalid gift" }), { status: 400 });

  // Atomik coin düşürme
  const { data: result } = await supabase.rpc("decrement_coin_balance", {
    p_user_id: user.id,
    p_amount: cost,
    p_type: "gift_sent",
  });

  if (!result[0].success) {
    return new Response(JSON.stringify({ error: result[0].error_message }), { status: 400 });
  }

  // Hediye kaydı
  const { data: gift } = await supabase.from("gifts").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    gift_type: giftType,
    coin_cost: cost,
    message,
    post_id: postId,
  }).select().single();

  // Alıcıya coin ekle (creator payı)
  await supabase.rpc("increment_coin_balance", {
    p_user_id: receiverId,
    p_amount: Math.floor(cost * 0.7), // %70 creator'a
    p_type: "gift_received",
    p_reference_id: gift.id,
  });

  // Realtime broadcast
  const channel = supabase.channel(`gifts:${receiverId}`);
  await channel.send({
    type: "broadcast",
    event: "gift_received",
    payload: { giftType, senderId: user.id, message },
  });

  return new Response(JSON.stringify({ success: true, gift }));
});
```

---

## 10. Animasyonlar

### 10.1 React Native Skia ile Hediye Animasyonu

```typescript
// apps/mobile/src/components/store/GiftAnimations/HeartBurst.tsx
import { Canvas, Circle, Group, useValue, runTiming } from "@shopify/react-native-skia";
import { useEffect } from "react";

interface HeartBurstProps {
  onComplete?: () => void;
}

export function HeartBurst({ onComplete }: HeartBurstProps) {
  const progress = useValue(0);

  useEffect(() => {
    runTiming(progress, 1, { duration: 1500 }, () => {
      onComplete?.();
    });
  }, []);

  return (
    <Canvas style={{ width: 200, height: 200 }}>
      <Group>
        <Circle cx={100} cy={100} r={40} color="#FF69B4" opacity={progress} />
      </Group>
    </Canvas>
  );
}
```

---

## 11. Güvenlik & Fraud Koruması

### 11.1 Temel Kurallar

- ✅ Her receipt `purchases` tablosunda tutulur
- ✅ Aynı `transaction_id` tekrar işlenmez
- ✅ Apple/Google server validation zorunlu
- ✅ Token işlemleri tamamen server-side
- ✅ Token düşürme SQL RPC ile atomik

### 11.2 Double-Spend Koruması

```sql
-- Unique constraint on transaction_id
CREATE UNIQUE INDEX idx_purchases_transaction ON purchases(store, transaction_id);
```

### 11.3 Rate Limiting

- Dakikada max 5 satın alma denemesi
- Saatte max 20 hediye gönderimi

---

## 12. Realtime Entegrasyonu

### 12.1 Hediye Bildirimi Dinleme

```typescript
// apps/mobile/src/hooks/useGiftNotifications.ts
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function useGiftNotifications(onGiftReceived: (gift: any) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`gifts:${user.id}`)
      .on("broadcast", { event: "gift_received" }, (payload) => {
        onGiftReceived(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
```

---

## 📚 İlgili Dökümanlar

| Döküman                                                                    | Açıklama                           |
| -------------------------------------------------------------------------- | ---------------------------------- |
| [expo-iap-rehberi.md](./expo-iap-rehberi.md)                               | expo-iap detaylı kullanım kılavuzu |
| [abonelik-todo-list.md](./abonelik-todo-list.md)                           | Implementasyon adımları            |
| [teknik-analiz-iap-kutuphaneleri.md](./teknik-analiz-iap-kutuphaneleri.md) | Kütüphane karşılaştırması          |

---

## 📚 Harici Referanslar

- [Expo IAP Documentation](https://hyochan.github.io/expo-iap/)
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Apple App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Google Play Developer API](https://developers.google.com/android-publisher)
