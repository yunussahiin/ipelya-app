/**
 * useCreatorEarnings Hook
 * Creator gelir raporu için veri çekme ve yönetim hook'u
 * 
 * Özellikler:
 * - Toplam kazanç (coin + TL)
 * - Tier bazlı breakdown
 * - Günlük trend data
 * - İşlem geçmişi
 * - Coin/TL kur bilgisi
 * - Realtime subscription
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export type EarningsPeriod = '7d' | '30d' | '90d' | '180d' | '365d' | 'all';
export type TransactionType = 'all' | 'subscription' | 'gift' | 'payout';

export interface CoinRate {
  rate: number;
  updatedAt: string;
  isLocked: boolean;
}

export interface TierEarning {
  tier_id: string;
  tier_name: string;
  subscriber_count: number;
  total_coins: number;
}

export interface DailyTrend {
  day: string;
  total_coins: number;
  subscription_coins: number;
  gift_coins: number;
}

export interface Transaction {
  id: string;
  type: 'subscription' | 'gift' | 'payout' | 'adjustment' | 'ppv' | 'refund';
  amount: number;
  description: string;
  metadata?: {
    from_user?: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    tier_name?: string;
    gift_name?: string;
  };
  created_at: string;
}

export interface Balance {
  total_earned: number;
  total_withdrawn: number;
  pending_payout: number;
  available_balance: number;
}

export interface EarningsData {
  totalCoins: number;
  totalTL: number;
  subscriptionCoins: number;
  giftCoins: number;
  tierBreakdown: TierEarning[];
  dailyTrend: DailyTrend[];
  bestDay: DailyTrend | null;
  transactions: Transaction[];
  hasMoreTransactions: boolean;
  coinRate: CoinRate;
  balance: Balance;
}

export function useCreatorEarnings() {
  const [period, setPeriod] = useState<EarningsPeriod>('30d');
  const [transactionFilter, setTransactionFilter] = useState<TransactionType>('all');
  const [data, setData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionPage, setTransactionPage] = useState(1);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadEarnings = useCallback(async (resetTransactions = true) => {
    setIsLoading(true);
    setError(null);
    if (resetTransactions) setTransactionPage(1);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('get-creator-earnings', {
        body: { 
          period,
          transactionFilter,
          transactionPage: resetTransactions ? 1 : transactionPage,
          transactionLimit: 20
        }
      });

      if (fnError) throw fnError;

      setData(result);
    } catch (err: any) {
      logger.error('Creator earnings load error', err, { tag: 'Earnings' });
      setError(err.message || 'Failed to load earnings');
    } finally {
      setIsLoading(false);
    }
  }, [period, transactionFilter, transactionPage]);

  // Daha fazla işlem yükle
  const loadMoreTransactions = useCallback(async () => {
    if (!data?.hasMoreTransactions || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = transactionPage + 1;

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('get-creator-earnings', {
        body: { 
          period,
          transactionFilter,
          transactionPage: nextPage,
          transactionLimit: 20,
          transactionsOnly: true
        }
      });

      if (fnError) throw fnError;

      setData(prev => prev ? {
        ...prev,
        transactions: [...prev.transactions, ...result.transactions],
        hasMoreTransactions: result.hasMoreTransactions
      } : null);

      setTransactionPage(nextPage);
    } catch {
      // Load more error - silent
    } finally {
      setIsLoadingMore(false);
    }
  }, [data, isLoadingMore, period, transactionFilter, transactionPage]);

  // Period veya filter değişince yeniden yükle
  useEffect(() => {
    loadEarnings(true);
  }, [period, transactionFilter]);

  // Realtime subscription
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const channel = supabase
        .channel(`creator-earnings-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'creator_transactions',
            filter: `creator_id=eq.${session.user.id}`
          },
          () => {
            loadEarnings(false);
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loadEarnings]);

  // Coin'i TL'ye çevir
  const coinsToTL = useCallback((coins: number): number => {
    if (!data?.coinRate) return coins * 0.5; // Fallback
    return coins * data.coinRate.rate;
  }, [data?.coinRate]);

  // Format helpers
  const formatCoins = useCallback((coins: number): string => {
    return coins.toLocaleString('tr-TR');
  }, []);

  const formatTL = useCallback((amount: number): string => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    period,
    transactionFilter,
    changePeriod: setPeriod,
    changeTransactionFilter: setTransactionFilter,
    loadMoreTransactions,
    refresh: () => loadEarnings(true),
    coinsToTL,
    formatCoins,
    formatTL,
  };
}
