/**
 * useCreatorSubscription Hook
 * Creator'lara abonelik işlemleri
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { useEconomyStore } from '@/store/economy.store';
import { logger } from '@/utils/logger';

export interface CreatorSubscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  tierId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billingPeriod: 'monthly' | 'yearly';
  coinPrice: number;
  startedAt: string;
  currentPeriodEnd: string;
  nextBillingAt: string;
  tier?: CreatorTier;
}

export interface CreatorTier {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  coinPriceMonthly: number;
  coinPriceYearly?: number;
  benefits: string[];
  maxSubscribers?: number;
  isActive: boolean;
}

export function useCreatorSubscription() {
  const { refreshBalance } = useEconomyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mySubscriptions, setMySubscriptions] = useState<CreatorSubscription[]>([]);

  // Kullanıcının aboneliklerini yükle
  const loadMySubscriptions = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const userId = session.user.id;

    try {
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select(`
          *,
          tier:creator_subscription_tiers!left(*)
        `)
        .eq('subscriber_id', userId)
        .in('status', ['active', 'paused']);

      if (error) throw error;

      setMySubscriptions(
        data?.map((sub) => ({
          id: sub.id,
          subscriberId: sub.subscriber_id,
          creatorId: sub.creator_id,
          tierId: sub.tier_id,
          status: sub.status,
          billingPeriod: sub.billing_period,
          coinPrice: sub.coin_price,
          startedAt: sub.started_at,
          currentPeriodEnd: sub.current_period_end,
          nextBillingAt: sub.next_billing_at,
          tier: sub.tier ? {
            id: sub.tier.id,
            creatorId: sub.tier.creator_id,
            name: sub.tier.name,
            description: sub.tier.description,
            coinPriceMonthly: sub.tier.coin_price_monthly,
            coinPriceYearly: sub.tier.coin_price_yearly,
            benefits: sub.tier.benefits || [],
            maxSubscribers: sub.tier.max_subscribers,
            isActive: sub.tier.is_active,
          } : undefined,
        })) || []
      );
    } catch (error) {
      logger.error('Load subscriptions error', error, { tag: 'Subscription' });
    }
  }, [user?.id]);

  useEffect(() => {
    loadMySubscriptions();
  }, [loadMySubscriptions]);

  // Creator'a abone ol
  const subscribe = useCallback(async (
    creatorId: string,
    tierId: string,
    billingPeriod: 'monthly' | 'yearly' = 'monthly'
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-to-creator', {
        body: { creatorId, tierId, billingPeriod },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Abonelik başlatılamadı');
      }

      await refreshBalance();
      await loadMySubscriptions();

      Alert.alert('Başarılı', 'Abonelik başlatıldı!');
      return data.subscription;
    } catch (error: any) {
      const message = error.message || 'Abonelik başlatılamadı';
      if (message.includes('Insufficient')) {
        Alert.alert(
          'Yetersiz Bakiye',
          'Coin satın alarak bakiyenizi artırabilirsiniz.',
          [
            { text: 'Coin Satın Al', onPress: () => {} },
            { text: 'İptal', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Hata', message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance, loadMySubscriptions]);

  // Aboneliği iptal et
  const cancel = useCallback(async (subscriptionId?: string, creatorId?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-creator-subscription', {
        body: { subscriptionId, creatorId },
      });

      if (error) throw error;

      await loadMySubscriptions();

      Alert.alert(
        'İptal Edildi',
        `Aboneliğiniz ${data.periodEnd ? new Date(data.periodEnd).toLocaleDateString('tr-TR') : 'dönem sonunda'} sona erecek.`
      );
      return data.subscription;
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'İptal işlemi başarısız');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadMySubscriptions]);

  // Belirli bir creator'a abone mi kontrol et
  const isSubscribedTo = useCallback((creatorId: string) => {
    return mySubscriptions.some(
      (sub) => sub.creatorId === creatorId && sub.status === 'active'
    );
  }, [mySubscriptions]);

  // Belirli bir creator'a abonelik bilgisini getir
  const getSubscriptionFor = useCallback((creatorId: string) => {
    return mySubscriptions.find((sub) => sub.creatorId === creatorId);
  }, [mySubscriptions]);

  return {
    isLoading,
    mySubscriptions,
    subscribe,
    cancel,
    isSubscribedTo,
    getSubscriptionFor,
    refreshSubscriptions: loadMySubscriptions,
  };
}
