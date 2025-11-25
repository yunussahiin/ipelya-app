# expo-iap Kapsamlı Rehber

Bu doküman İpelya projesi için expo-iap kütüphanesinin tam kullanım kılavuzudur.

**Kaynak:** https://hyochan.github.io/expo-iap/

---

## İçindekiler

1. [Kurulum](#1-kurulum)
2. [Temel Kavramlar](#2-temel-kavramlar)
3. [useIAP Hook](#3-useiap-hook)
4. [Ürün Yönetimi](#4-ürün-yönetimi)
5. [Satın Alma İşlemleri](#5-satın-alma-işlemleri)
6. [Transaction Yönetimi](#6-transaction-yönetimi)
7. [Receipt Validation](#7-receipt-validation)
8. [Restore Purchases](#8-restore-purchases)
9. [Error Handling](#9-error-handling)
10. [Troubleshooting](#10-troubleshooting)
11. [Tam Implementasyon Örneği](#11-tam-implementasyon-örneği)

---

## 1. Kurulum

### 1.1 Paket Kurulumu

```bash
# Expo CLI ile kurulum (önerilen)
npx expo install expo-iap

# veya npm ile
npm install expo-iap
```

### 1.2 iOS Konfigürasyonu (Bare Workflow)

```bash
cd ios && pod install
```

### 1.3 Expo Prebuild

```bash
# Temiz build için
npx expo prebuild --clean
```

### 1.4 Android Manifest (Bare Workflow)

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="com.android.vending.BILLING" />
```

### 1.5 Gereksinimler

- Expo SDK 50+
- React Native 0.73+
- Development build (Expo Go desteklenmez)
- App Store Connect / Google Play Console hesabı

---

## 2. Temel Kavramlar

### 2.1 Ürün Tipleri

| Tip     | Açıklama                            | Örnek                              |
| ------- | ----------------------------------- | ---------------------------------- |
| `inapp` | Consumable & Non-consumable ürünler | Coin paketleri, premium özellikler |
| `subs`  | Abonelikler                         | Aylık/yıllık premium               |

### 2.2 TypeScript Tipleri

```typescript
// Ürün tipi
type ProductType = 'inapp' | 'subs';

// Ürün interface
interface Product {
  id: string;
  title: string;
  description: string;
  type: ProductType;
  displayName?: string;
  displayPrice: string;  // "₺29.99"
  currency: string;      // "TRY"
  price?: number;        // 29.99
}

// Purchase interface
interface Purchase {
  productId: string;
  transactionId: string;
  transactionReceipt: string;
  purchaseToken?: string;        // Android
  purchaseState?: 'pending' | 'purchased';
}
```

---

## 3. useIAP Hook

### 3.1 Hook Kullanımı

```typescript
import { useIAP } from 'expo-iap';

function StoreScreen() {
  const {
    connected,           // Store bağlantı durumu
    products,            // Yüklenen ürünler
    subscriptions,       // Yüklenen abonelikler
    currentPurchase,     // Aktif satın alma
    currentPurchaseError,// Satın alma hatası
    availablePurchases,  // Restore edilebilir satın almalar
    
    // Methods
    requestProducts,     // Ürünleri yükle
    requestPurchase,     // Satın alma başlat
    finishTransaction,   // Transaction tamamla
    getAvailablePurchases, // Restore için
  } = useIAP();

  // ...
}
```

### 3.2 Bağlantı Kontrolü

```typescript
const { connected, connectionError } = useIAP();

// Bağlantı hatası kontrolü
if (connectionError) {
  return (
    <View>
      <Text>Store bağlantısı başarısız</Text>
      <Text>{connectionError.message}</Text>
      <Button title="Tekrar Dene" onPress={retryConnection} />
    </View>
  );
}

// Bağlantı bekleniyor
if (!connected) {
  return <LoadingView message="Store'a bağlanılıyor..." />;
}

return <StoreView />;
```

---

## 4. Ürün Yönetimi

### 4.1 Ürünleri Yükleme

```typescript
import { useIAP } from 'expo-iap';

const PRODUCT_IDS = ['ipelya_coins_100', 'ipelya_coins_500', 'ipelya_coins_1000'];
const SUBSCRIPTION_IDS = ['ipelya_premium_monthly', 'ipelya_premium_yearly'];

function useProducts() {
  const { connected, products, subscriptions, requestProducts } = useIAP();

  useEffect(() => {
    if (!connected) return;

    const loadProducts = async () => {
      try {
        // In-app products
        await requestProducts({
          skus: PRODUCT_IDS,
          type: 'inapp',
        });

        // Subscriptions
        await requestProducts({
          skus: SUBSCRIPTION_IDS,
          type: 'subs',
        });
      } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
      }
    };

    loadProducts();
  }, [connected]);

  return { products, subscriptions };
}
```

### 4.2 Ürün Görüntüleme

```typescript
function ProductCard({ product }: { product: Product }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.price}>{product.displayPrice}</Text>
    </View>
  );
}
```

---

## 5. Satın Alma İşlemleri

### 5.1 Consumable Ürün Satın Alma (Coin)

```typescript
import { requestPurchase } from 'expo-iap';
import { Platform } from 'react-native';

const purchaseCoin = async (productId: string) => {
  try {
    await requestPurchase({
      request: {
        ios: {
          sku: productId,
          quantity: 1,
        },
        android: {
          skus: [productId],
        },
      },
      type: 'inapp',
    });
  } catch (error) {
    console.error('Satın alma başarısız:', error);
    throw error;
  }
};
```

### 5.2 Abonelik Satın Alma

```typescript
const purchaseSubscription = async (subscriptionId: string) => {
  const { subscriptions } = useIAP();
  
  // Android için offerToken gerekli
  const subscription = subscriptions.find(s => s.id === subscriptionId);
  
  try {
    await requestPurchase({
      request: {
        ios: {
          sku: subscriptionId,
          appAccountToken: userId, // Server-side validation için
        },
        android: {
          skus: [subscriptionId],
          subscriptionOffers: subscription?.subscriptionOfferDetails?.map(offer => ({
            sku: subscriptionId,
            offerToken: offer.offerToken,
          })) || [],
          obfuscatedAccountIdAndroid: userId,
        },
      },
      type: 'subs',
    });
  } catch (error) {
    console.error('Abonelik satın alma başarısız:', error);
    throw error;
  }
};
```

### 5.3 Platform-Specific Request (Legacy)

```typescript
// Eski API (hala çalışır ama önerilmez)
if (Platform.OS === 'ios') {
  await requestPurchase({
    request: {
      sku: productId,
      andDangerouslyFinishTransactionAutomatically: false,
    },
  });
} else {
  await requestPurchase({
    request: { skus: [productId] },
  });
}
```

---

## 6. Transaction Yönetimi

### 6.1 Purchase Listener

```typescript
function usePurchaseListener() {
  const { currentPurchase, currentPurchaseError, finishTransaction } = useIAP();

  useEffect(() => {
    if (currentPurchaseError) {
      handlePurchaseError(currentPurchaseError);
      return;
    }

    if (currentPurchase) {
      completePurchase(currentPurchase);
    }
  }, [currentPurchase, currentPurchaseError]);

  const completePurchase = async (purchase: Purchase) => {
    try {
      // 1. Server-side validation
      const isValid = await validateOnServer(purchase);

      if (!isValid) {
        console.error('Receipt validation failed');
        return;
      }

      // 2. Grant purchase to user
      await grantPurchaseToUser(purchase);

      // 3. Finish transaction (ÖNEMLİ!)
      await finishTransaction({
        purchase,
        isConsumable: true, // Coin için true, subscription için false
      });

      console.log('Satın alma tamamlandı!');
    } catch (error) {
      console.error('Satın alma tamamlanamadı:', error);
    }
  };
}
```

### 6.2 finishTransaction

```typescript
import { finishTransaction } from 'expo-iap';

// Consumable ürün (tekrar satın alınabilir)
await finishTransaction({
  purchase: currentPurchase,
  isConsumable: true,
});

// Non-consumable veya Subscription
await finishTransaction({
  purchase: currentPurchase,
  isConsumable: false,
});
```

> **ÖNEMLİ:** `finishTransaction` çağrılmazsa:
> - iOS: Kullanıcıya para iade edilir
> - Android: Satın alma pending kalır ve tekrar satın alınamaz

### 6.3 Pending Purchases

```typescript
useEffect(() => {
  if (currentPurchase?.purchaseState === 'pending') {
    // Kullanıcıya bilgi ver (örn: ebeveyn onayı bekliyor)
    Alert.alert(
      'Satın Alma Beklemede',
      'Satın alma işleminiz onay bekliyor.'
    );
  }
}, [currentPurchase]);
```

---

## 7. Receipt Validation

### 7.1 Server-Side Validation (Zorunlu)

```typescript
// ❌ YANLIŞ - Client-side validation güvenli değil
const handlePurchase = async (purchase) => {
  grantPremiumFeature(); // GÜVENLİ DEĞİL!
};

// ✅ DOĞRU - Server-side validation
const handlePurchase = async (purchase) => {
  const isValid = await validateOnServer(purchase);
  if (isValid) {
    await grantPremiumFeature();
    await finishTransaction({ purchase });
  }
};
```

### 7.2 Validation Request

```typescript
const validateOnServer = async (purchase: Purchase): Promise<boolean> => {
  try {
    const response = await fetch('https://your-server.com/validate-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        // Android specific
        purchaseToken: purchase.purchaseToken,
      }),
    });

    const result = await response.json();
    return result.isValid;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};
```

### 7.3 Supabase Edge Function ile Validation

```typescript
// Frontend
const validateOnServer = async (purchase: Purchase) => {
  const { data, error } = await supabase.functions.invoke('verify-purchase', {
    body: {
      receipt: purchase.transactionReceipt,
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      purchaseToken: purchase.purchaseToken,
    },
  });

  if (error) throw error;
  return data.isValid;
};
```

---

## 8. Restore Purchases

### 8.1 Restore İşlemi

```typescript
const { getAvailablePurchases, availablePurchases } = useIAP();

const restorePurchases = async () => {
  try {
    // Satın almaları getir
    await getAvailablePurchases();

    // Her birini validate et ve restore et
    for (const purchase of availablePurchases) {
      const isValid = await validateOnServer(purchase);
      if (isValid) {
        await grantPurchaseToUser(purchase);
      }
    }

    Alert.alert('Başarılı', 'Satın almalarınız geri yüklendi.');
  } catch (error) {
    console.error('Restore failed:', error);
    Alert.alert('Hata', 'Satın almalar geri yüklenemedi.');
  }
};
```

### 8.2 App Başlangıcında Pending Transactions

```typescript
useEffect(() => {
  const checkPendingPurchases = async () => {
    const purchases = await getAvailablePurchases();

    for (const purchase of purchases) {
      if (await isAlreadyProcessed(purchase)) {
        // Zaten işlenmiş, sadece transaction'ı bitir
        await finishTransaction({ purchase });
      } else {
        // İşle ve bitir
        await processPurchase(purchase);
        await finishTransaction({ purchase });
      }
    }
  };

  checkPendingPurchases();
}, []);
```

---

## 9. Error Handling

### 9.1 Error Codes

| Code                    | Açıklama               | Aksiyon                 |
| ----------------------- | ---------------------- | ----------------------- |
| `E_USER_CANCELLED`      | Kullanıcı iptal etti   | Sessiz, mesaj gösterme  |
| `E_NETWORK_ERROR`       | Ağ hatası              | Tekrar dene butonu      |
| `E_ITEM_UNAVAILABLE`    | Ürün mevcut değil      | Ürün listesini güncelle |
| `E_PAYMENT_INVALID`     | Ödeme yöntemi geçersiz | Ayarlara yönlendir      |
| `E_PAYMENT_NOT_ALLOWED` | Ödemeler izinli değil  | Bilgi mesajı            |
| `E_INSUFFICIENT_FUNDS`  | Yetersiz bakiye        | Bilgi mesajı            |

### 9.2 Error Handler

```typescript
import { PurchaseError } from 'expo-iap';

const handlePurchaseError = (error: PurchaseError) => {
  switch (error.code) {
    case 'E_USER_CANCELLED':
      // Sessiz - kullanıcı bilerek iptal etti
      break;
    
    case 'E_NETWORK_ERROR':
      Alert.alert(
        'Bağlantı Hatası',
        'İnternet bağlantınızı kontrol edin.',
        [{ text: 'Tekrar Dene', onPress: retryPurchase }]
      );
      break;
    
    case 'E_ITEM_UNAVAILABLE':
      Alert.alert('Hata', 'Bu ürün şu anda mevcut değil.');
      break;
    
    case 'E_PAYMENT_INVALID':
      Alert.alert(
        'Ödeme Hatası',
        'Ödeme yönteminizi kontrol edin.',
        [{ text: 'Ayarlar', onPress: openPaymentSettings }]
      );
      break;
    
    default:
      Alert.alert('Hata', 'Bir sorun oluştu. Lütfen tekrar deneyin.');
  }
};
```

### 9.3 Try-Catch Pattern

```typescript
// ❌ YANLIŞ
purchaseProduct('product_id');

// ✅ DOĞRU
try {
  await purchaseProduct('product_id');
} catch (error) {
  handlePurchaseError(error);
}
```

---

## 10. Troubleshooting

### 10.1 Yaygın Sorunlar

| Sorun                     | Çözüm                                           |
| ------------------------- | ----------------------------------------------- |
| Ürünler yüklenmiyor       | Store'da ürünler aktif mi kontrol et            |
| `connected` false kalıyor | Development build kullan, Expo Go desteklenmez  |
| Transaction tamamlanmıyor | `finishTransaction` çağrıldığından emin ol      |
| Sandbox test çalışmıyor   | Test hesabı doğru yapılandırılmış mı kontrol et |

### 10.2 Debug Logging

```typescript
useEffect(() => {
  console.log('IAP State:', {
    connected,
    productsCount: products.length,
    subscriptionsCount: subscriptions.length,
    currentPurchase: currentPurchase?.productId,
    error: currentPurchaseError?.message,
  });
}, [connected, products, subscriptions, currentPurchase, currentPurchaseError]);
```

### 10.3 Clean Build

```bash
# Node modules temizle
rm -rf node_modules
npm install

# Expo prebuild temizle
npx expo prebuild --clean

# iOS pods temizle
cd ios && pod deintegrate && pod install
```

---

## 11. Tam Implementasyon Örneği

### 11.1 IAP Service

```typescript
// apps/mobile/src/services/iap/index.ts
import { useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useIAP, finishTransaction, PurchaseError } from 'expo-iap';
import { supabase } from '@/lib/supabase';
import { COIN_PRODUCTS, SUBSCRIPTION_PRODUCTS } from './products';

export function useIAPService() {
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
        await requestProducts({
          skus: COIN_PRODUCTS.map(p => p.id),
          type: 'inapp',
        });
        await requestProducts({
          skus: SUBSCRIPTION_PRODUCTS.map(p => p.id),
          type: 'subs',
        });
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };

    loadProducts();
  }, [connected]);

  // Purchase listener
  useEffect(() => {
    if (currentPurchaseError) {
      handleError(currentPurchaseError);
      return;
    }

    if (currentPurchase) {
      processPurchase(currentPurchase);
    }
  }, [currentPurchase, currentPurchaseError]);

  const processPurchase = async (purchase: any) => {
    try {
      // Server validation
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
        return;
      }

      // Finish transaction
      const isConsumable = COIN_PRODUCTS.some(p => p.id === purchase.productId);
      await finishTransaction({ purchase, isConsumable });

      Alert.alert('Başarılı', 'Satın alma tamamlandı!');
    } catch (error) {
      console.error('Process purchase error:', error);
    }
  };

  const handleError = (error: PurchaseError) => {
    if (error.code === 'E_USER_CANCELLED') return;
    Alert.alert('Hata', 'Satın alma başarısız oldu.');
  };

  // Public methods
  const buyCoins = useCallback(async (productId: string) => {
    await requestPurchase({
      request: {
        ios: { sku: productId },
        android: { skus: [productId] },
      },
      type: 'inapp',
    });
  }, [requestPurchase]);

  const buySubscription = useCallback(async (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    
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
  }, [subscriptions, requestPurchase]);

  const restore = useCallback(async () => {
    try {
      const purchases = await getAvailablePurchases();
      // Process each...
      Alert.alert('Başarılı', 'Satın almalar geri yüklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Geri yükleme başarısız.');
    }
  }, [getAvailablePurchases]);

  return {
    connected,
    products,
    subscriptions,
    buyCoins,
    buySubscription,
    restore,
  };
}
```

### 11.2 Products Config

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

---

## Referanslar

- [expo-iap Official Docs](https://hyochan.github.io/expo-iap/)
- [GitHub Repository](https://github.com/hyochan/expo-iap)
- [Apple StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [Google Play Billing](https://developer.android.com/google/play/billing)
