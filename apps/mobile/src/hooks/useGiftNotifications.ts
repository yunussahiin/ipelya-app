/**
 * useGiftNotifications Hook
 * Realtime hediye bildirimleri
 */

import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

interface GiftNotification {
  giftId: string;
  giftType: string;
  senderId: string;
  message?: string;
  coinAmount: number;
}

interface UseGiftNotificationsOptions {
  onGiftReceived?: (gift: GiftNotification) => void;
}

export function useGiftNotifications(options: UseGiftNotificationsOptions = {}) {
  const { user } = useAuth();
  const userId = user?.id || null;
  
  const [lastGift, setLastGift] = useState<GiftNotification | null>(null);
  const [giftCount, setGiftCount] = useState(0);

  const { onGiftReceived } = options;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`gifts:${userId}`)
      .on('broadcast', { event: 'gift_received' }, (payload) => {
        const gift = payload.payload as GiftNotification;
        
        setLastGift(gift);
        setGiftCount((prev) => prev + 1);
        
        if (onGiftReceived) {
          onGiftReceived(gift);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onGiftReceived]);

  const clearLastGift = useCallback(() => {
    setLastGift(null);
  }, []);

  const resetGiftCount = useCallback(() => {
    setGiftCount(0);
  }, []);

  return {
    lastGift,
    giftCount,
    clearLastGift,
    resetGiftCount,
  };
}
