/**
 * useGiftSend Hook
 * Hediye gönderme işlemleri
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { useEconomyStore } from '@/store/economy.store';
import { GIFT_TYPES, GiftType } from '@/services/iap/products';

interface SendGiftParams {
  receiverId: string;
  giftType: GiftType;
  message?: string;
  postId?: string;
}

interface SendGiftResult {
  success: boolean;
  gift?: any;
  error?: string;
}

export function useGiftSend() {
  const [isSending, setIsSending] = useState(false);
  const { balance, refreshBalance } = useEconomyStore();

  const sendGift = useCallback(async (params: SendGiftParams): Promise<SendGiftResult> => {
    const { receiverId, giftType, message, postId } = params;

    // Validate gift type
    const giftInfo = GIFT_TYPES[giftType];
    if (!giftInfo) {
      return { success: false, error: 'Geçersiz hediye tipi' };
    }

    // Check balance
    if (balance < giftInfo.cost) {
      Alert.alert(
        'Yetersiz Bakiye',
        `Bu hediye için ${giftInfo.cost} coin gerekli. Mevcut bakiyeniz: ${balance} coin.`,
        [
          { text: 'Coin Satın Al', onPress: () => {} }, // TODO: Navigate to store
          { text: 'İptal', style: 'cancel' },
        ]
      );
      return { success: false, error: 'Yetersiz bakiye' };
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-gift', {
        body: { receiverId, giftType, message, postId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Hediye gönderilemedi');
      }

      // Refresh balance
      await refreshBalance();

      return { success: true, gift: data.gift };
    } catch (error: any) {
      const errorMessage = error.message || 'Hediye gönderilemedi';
      Alert.alert('Hata', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSending(false);
    }
  }, [balance, refreshBalance]);

  const getGiftCost = useCallback((giftType: GiftType): number => {
    return GIFT_TYPES[giftType]?.cost || 0;
  }, []);

  const canAffordGift = useCallback((giftType: GiftType): boolean => {
    const cost = getGiftCost(giftType);
    return balance >= cost;
  }, [balance, getGiftCost]);

  return {
    sendGift,
    isSending,
    getGiftCost,
    canAffordGift,
    giftTypes: GIFT_TYPES,
  };
}
