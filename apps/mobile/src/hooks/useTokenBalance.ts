/**
 * useTokenBalance Hook
 * Kullanıcının coin bakiyesini yönetir
 */

import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useEconomyStore } from '@/store/economy.store';

export function useTokenBalance() {
  const [userId, setUserId] = useState<string | null>(null);
  const { 
    balance, 
    lifetimeEarned, 
    lifetimeSpent, 
    isLoading, 
    setBalance, 
    setLoading,
    refreshBalance 
  } = useEconomyStore();

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      if (session?.user?.id) {
        refreshBalance();
      }
    });
  }, [refreshBalance]);

  // Realtime bakiye güncellemelerini dinle
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`balance:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coin_balances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            setBalance(data.balance, data.lifetime_earned, data.lifetime_spent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setBalance]);

  // Bakiyenin yeterli olup olmadığını kontrol et
  const hasEnoughBalance = useCallback((amount: number) => {
    return balance >= amount;
  }, [balance]);

  // Bakiyeyi formatla
  const formattedBalance = useCallback(() => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(1)}M`;
    }
    if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K`;
    }
    return balance.toString();
  }, [balance]);

  return {
    balance,
    lifetimeEarned,
    lifetimeSpent,
    isLoading,
    hasEnoughBalance,
    formattedBalance,
    refreshBalance,
  };
}
