/**
 * Live Gifts Hook
 * Hediye gönderme ve animasyon yönetimi
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  coinPrice: number;
  animationType: 'float' | 'burst' | 'rain';
}

export interface GiftEvent {
  id: string;
  gift: Gift;
  senderName: string;
  senderAvatar?: string;
  quantity: number;
  timestamp: number;
}

interface UseLiveGiftsOptions {
  sessionId: string | null;
  onGiftReceived?: (event: GiftEvent) => void;
}

// Predefined gift types
const GIFTS: Gift[] = [
  { id: 'heart', name: 'Kalp', emoji: '❤️', coinPrice: 10, animationType: 'float' },
  { id: 'star', name: 'Yıldız', emoji: '⭐', coinPrice: 25, animationType: 'burst' },
  { id: 'fire', name: 'Ateş', emoji: '🔥', coinPrice: 50, animationType: 'burst' },
  { id: 'diamond', name: 'Elmas', emoji: '💎', coinPrice: 100, animationType: 'burst' },
  { id: 'crown', name: 'Taç', emoji: '👑', coinPrice: 200, animationType: 'rain' },
  { id: 'rocket', name: 'Roket', emoji: '🚀', coinPrice: 500, animationType: 'rain' },
];

export function useLiveGifts(options: UseLiveGiftsOptions) {
  const { sessionId, onGiftReceived } = options;

  const [giftQueue, setGiftQueue] = useState<GiftEvent[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send gift
  const sendGift = useCallback(async (giftId: string, quantity: number = 1) => {
    if (!sessionId) {
      setError('Session ID gerekli');
      return false;
    }

    const gift = GIFTS.find((g) => g.id === giftId);
    if (!gift) {
      setError('Geçersiz hediye');
      return false;
    }

    setIsSending(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-live-gift', {
        body: {
          sessionId,
          giftId,
          quantity,
          coinAmount: gift.coinPrice * quantity,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Hediye gönderilemedi');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hediye gönderme hatası';
      setError(message);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [sessionId]);

  // Realtime gift subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`live_gifts:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_gifts',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newGift = payload.new as {
            id: string;
            gift_id: string;
            sender_id: string;
            quantity: number;
            created_at: string;
          };

          // Get sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', newGift.sender_id)
            .eq('type', 'real')
            .single();

          const gift = GIFTS.find((g) => g.id === newGift.gift_id);
          if (!gift) return;

          const giftEvent: GiftEvent = {
            id: newGift.id,
            gift,
            senderName: senderProfile?.display_name || 'Kullanıcı',
            senderAvatar: senderProfile?.avatar_url,
            quantity: newGift.quantity,
            timestamp: Date.now(),
          };

          setGiftQueue((prev) => [...prev, giftEvent]);
          onGiftReceived?.(giftEvent);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, onGiftReceived]);

  // Remove gift from queue after animation
  const removeGift = useCallback((giftId: string) => {
    setGiftQueue((prev) => prev.filter((g) => g.id !== giftId));
  }, []);

  // Clear all gifts
  const clearGifts = useCallback(() => {
    setGiftQueue([]);
  }, []);

  return {
    gifts: GIFTS,
    giftQueue,
    isSending,
    error,
    sendGift,
    removeGift,
    clearGifts,
  };
}
