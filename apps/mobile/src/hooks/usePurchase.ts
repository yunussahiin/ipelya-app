/**
 * usePurchase Hook
 * expo-iap entegrasyonu ile coin satın alma
 */

import { useEffect, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useIAP, type PurchaseError, type Purchase } from 'expo-iap';
import { supabase } from '@/lib/supabaseClient';
import { COIN_PRODUCTS, PLATFORM_SUBSCRIPTION_PRODUCTS } from '@/services/iap/products';
import { useEconomyStore } from '@/store/economy.store';
import { logger } from '@/utils/logger';

export function usePurchase() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProductId, setProcessingProductId] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<{ productId: string } | null>(null);
  const { refreshBalance } = useEconomyStore();

  const {
    connected,
    products,
    subscriptions,
    fetchProducts,
    requestPurchase,
    getAvailablePurchases,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase) => processPurchase(purchase),
    onPurchaseError: (error) => handleError(error as unknown as PurchaseError),
  });

  // Ürünleri yükle
  useEffect(() => {
    if (!connected) return;

    const loadProducts = async () => {
      try {
        // Coin paketleri
        await fetchProducts({
          skus: COIN_PRODUCTS.map(p => p.id),
          type: 'in-app',
        });
        // Platform abonelikleri
        await fetchProducts({
          skus: PLATFORM_SUBSCRIPTION_PRODUCTS.map(p => p.id),
          type: 'subs',
        });
      } catch (error) {
        logger.error('Products load error', error, { tag: 'Purchase' });
      }
    };

    loadProducts();
  }, [connected, fetchProducts]);

  const processPurchase = async (purchase: Purchase) => {
    try {
      // Server-side validation
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          receipt: (purchase as unknown as { transactionReceipt?: string }).transactionReceipt || purchase.transactionId,
          productId: purchase.productId,
          transactionId: purchase.transactionId,
          purchaseToken: (purchase as unknown as { purchaseToken?: string }).purchaseToken,
        },
      });

      if (error || !data?.isValid) {
        Alert.alert('Hata', 'Satın alma doğrulanamadı.');
        setIsProcessing(false);
        return;
      }

      // Finish transaction
      const isConsumable = COIN_PRODUCTS.some(p => p.id === purchase.productId);
      await finishTransaction({ purchase, isConsumable });

      // Refresh balance
      await refreshBalance();

      Alert.alert('Başarılı', `${data.coinsGranted} coin hesabınıza eklendi!`);
      setIsProcessing(false);
    } catch (error) {
      logger.error('Process purchase error', error, { tag: 'Purchase' });
      setIsProcessing(false);
    }
  };

  const handleError = (error: PurchaseError) => {
    setIsProcessing(false);
    setProcessingProductId(null);
    
    const errorCode = String(error.code || '');
    if (errorCode.includes('cancelled') || errorCode.includes('cancel')) {
      // Sessiz - kullanıcı iptal etti
      return;
    }
    if (errorCode.includes('network')) {
      Alert.alert('Bağlantı Hatası', 'İnternet bağlantınızı kontrol edin.');
      return;
    }
    if (errorCode.includes('unavailable')) {
      Alert.alert('Hata', 'Bu ürün şu anda mevcut değil.');
      return;
    }
    if (errorCode.includes('payment') || errorCode.includes('invalid')) {
      Alert.alert('Ödeme Hatası', 'Ödeme yönteminizi kontrol edin.');
      return;
    }
    Alert.alert('Hata', 'Satın alma başarısız oldu.');
  };

  // Coin satın alma
  const purchaseCoin = useCallback(async (productId: string) => {
    if (!connected) {
      Alert.alert('Hata', 'Store bağlantısı yok. Lütfen tekrar deneyin.');
      return;
    }

    setIsProcessing(true);
    setProcessingProductId(productId);
    try {
      await requestPurchase({
        request: {
          ios: { sku: productId },
          android: { skus: [productId] },
        },
        type: 'in-app',
      });
    } catch (error) {
      handleError(error as PurchaseError);
    }
  }, [connected, requestPurchase]);

  // Alias for backward compatibility
  const buyCoins = purchaseCoin;

  // Platform abonelik satın alma
  const purchaseSubscription = useCallback(async (subscriptionId: string) => {
    if (!connected) {
      Alert.alert('Hata', 'Store bağlantısı yok. Lütfen tekrar deneyin.');
      return;
    }

    const subscription = subscriptions.find(s => s.id === subscriptionId);

    setIsProcessing(true);
    setProcessingProductId(subscriptionId);
    try {
      await requestPurchase({
        request: {
          ios: { sku: subscriptionId },
          android: {
            skus: [subscriptionId],
            subscriptionOffers: (subscription as { subscriptionOfferDetails?: Array<{ offerToken: string }> })?.subscriptionOfferDetails?.map((offer) => ({
              sku: subscriptionId,
              offerToken: offer.offerToken,
            })) || [],
          },
        },
        type: 'subs',
      });
      setActiveSubscription({ productId: subscriptionId });
    } catch (error) {
      handleError(error as PurchaseError);
    }
  }, [connected, subscriptions, requestPurchase]);

  // Alias for backward compatibility
  const buySubscription = purchaseSubscription;

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      setIsProcessing(true);
      await getAvailablePurchases();
      await refreshBalance();
      Alert.alert('Başarılı', 'Satın almalar geri yüklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Geri yükleme başarısız.');
    } finally {
      setIsProcessing(false);
    }
  }, [getAvailablePurchases, refreshBalance]);

  return {
    connected,
    products,
    subscriptions,
    isProcessing,
    processingProductId,
    activeSubscription,
    purchaseCoin,
    purchaseSubscription,
    buyCoins,
    buySubscription,
    restorePurchases,
  };
}
