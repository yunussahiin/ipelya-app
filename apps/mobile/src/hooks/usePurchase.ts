/**
 * usePurchase Hook
 * expo-iap entegrasyonu ile coin satın alma
 */

import { useEffect, useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useIAP, finishTransaction, PurchaseError } from 'expo-iap';
import { supabase } from '@/lib/supabaseClient';
import { COIN_PRODUCTS, PLATFORM_SUBSCRIPTION_PRODUCTS, getTotalCoins } from '@/services/iap/products';
import { useEconomyStore } from '@/store/economy.store';

export function usePurchase() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { refreshBalance } = useEconomyStore();

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
        // Platform abonelikleri
        await requestProducts({
          skus: PLATFORM_SUBSCRIPTION_PRODUCTS.map(p => p.id),
          type: 'subs',
        });
      } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
      }
    };

    loadProducts();
  }, [connected, requestProducts]);

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
      case 'E_ITEM_UNAVAILABLE':
        Alert.alert('Hata', 'Bu ürün şu anda mevcut değil.');
        break;
      case 'E_PAYMENT_INVALID':
        Alert.alert('Ödeme Hatası', 'Ödeme yönteminizi kontrol edin.');
        break;
      default:
        Alert.alert('Hata', 'Satın alma başarısız oldu.');
    }
  };

  // Coin satın alma
  const buyCoins = useCallback(async (productId: string) => {
    if (!connected) {
      Alert.alert('Hata', 'Store bağlantısı yok. Lütfen tekrar deneyin.');
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
      handleError(error as PurchaseError);
    }
  }, [connected, requestPurchase]);

  // Platform abonelik satın alma
  const buySubscription = useCallback(async (subscriptionId: string) => {
    if (!connected) {
      Alert.alert('Hata', 'Store bağlantısı yok. Lütfen tekrar deneyin.');
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
      handleError(error as PurchaseError);
    }
  }, [connected, subscriptions, requestPurchase]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      setIsProcessing(true);
      const purchases = await getAvailablePurchases();
      
      for (const purchase of purchases) {
        const { data } = await supabase.functions.invoke('verify-purchase', {
          body: {
            receipt: purchase.transactionReceipt,
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            purchaseToken: purchase.purchaseToken,
          },
        });
        
        if (data?.isValid) {
          await finishTransaction({ purchase, isConsumable: false });
        }
      }
      
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
    buyCoins,
    buySubscription,
    restorePurchases,
  };
}
