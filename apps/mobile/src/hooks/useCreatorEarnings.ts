/**
 * useCreatorEarnings Hook
 * Creator gelir istatistikleri
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

export interface EarningsData {
  subscriptions: number;
  gifts: number;
  total: number;
}

export interface SubscriberStats {
  active: number;
  total: number;
}

export interface TierStats {
  id: string;
  name: string;
  coinPriceMonthly: number;
  subscriberCount: number;
}

export interface DailyEarning {
  date: string;
  subscriptions: number;
  gifts: number;
  total: number;
}

export interface CreatorEarningsData {
  period: string;
  earnings: EarningsData;
  subscribers: SubscriberStats;
  balance: {
    balance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
  tiers: TierStats[];
  dailyEarnings: DailyEarning[];
}

export type EarningsPeriod = '7d' | '30d' | '90d' | 'all';

export function useCreatorEarnings(initialPeriod: EarningsPeriod = '30d') {
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<EarningsPeriod>(initialPeriod);
  const [data, setData] = useState<CreatorEarningsData | null>(null);

  const fetchEarnings = useCallback(async (selectedPeriod: EarningsPeriod = period) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-creator-earnings?period=${selectedPeriod}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch earnings');
      }

      const earningsData = await response.json();

      setData({
        period: earningsData.period,
        earnings: earningsData.earnings,
        subscribers: earningsData.subscribers,
        balance: {
          balance: earningsData.balance?.balance || 0,
          lifetimeEarned: earningsData.balance?.lifetime_earned || 0,
          lifetimeSpent: earningsData.balance?.lifetime_spent || 0,
        },
        tiers: earningsData.tiers?.map((tier: any) => ({
          id: tier.id,
          name: tier.name,
          coinPriceMonthly: tier.coin_price_monthly,
          subscriberCount: tier.subscriptions?.[0]?.count || 0,
        })) || [],
        dailyEarnings: earningsData.dailyEarnings || [],
      });
    } catch (error) {
      logger.error('Fetch earnings error', error, { tag: 'Earnings' });
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const changePeriod = useCallback((newPeriod: EarningsPeriod) => {
    setPeriod(newPeriod);
    fetchEarnings(newPeriod);
  }, [fetchEarnings]);

  // Formatted values
  const formattedTotalEarnings = useCallback(() => {
    const total = data?.earnings.total || 0;
    if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M`;
    if (total >= 1000) return `${(total / 1000).toFixed(1)}K`;
    return total.toString();
  }, [data?.earnings.total]);

  const formattedBalance = useCallback(() => {
    const balance = data?.balance.balance || 0;
    if (balance >= 1000000) return `${(balance / 1000000).toFixed(1)}M`;
    if (balance >= 1000) return `${(balance / 1000).toFixed(1)}K`;
    return balance.toString();
  }, [data?.balance.balance]);

  return {
    isLoading,
    period,
    data,
    changePeriod,
    refreshEarnings: fetchEarnings,
    formattedTotalEarnings,
    formattedBalance,
  };
}
