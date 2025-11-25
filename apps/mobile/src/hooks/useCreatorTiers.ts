/**
 * useCreatorTiers Hook
 * Creator'lar için tier yönetimi
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabaseClient';

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
  sortOrder: number;
  subscriberCount?: number;
}

export interface CreateTierParams {
  name: string;
  description?: string;
  coinPriceMonthly: number;
  coinPriceYearly?: number;
  benefits?: string[];
  maxSubscribers?: number;
  sortOrder?: number;
}

export interface UpdateTierParams extends Partial<CreateTierParams> {
  isActive?: boolean;
}

export function useCreatorTiers() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [myTiers, setMyTiers] = useState<CreatorTier[]>([]);

  // Tier'ları yükle
  const loadMyTiers = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-creator-tiers', {
        body: { action: 'list' },
      });

      if (error) throw error;

      setMyTiers(
        data?.tiers?.map((tier: any) => ({
          id: tier.id,
          creatorId: tier.creator_id,
          name: tier.name,
          description: tier.description,
          coinPriceMonthly: tier.coin_price_monthly,
          coinPriceYearly: tier.coin_price_yearly,
          benefits: tier.benefits || [],
          maxSubscribers: tier.max_subscribers,
          isActive: tier.is_active,
          sortOrder: tier.sort_order,
          subscriberCount: tier.subscriber_count?.[0]?.count || 0,
        })) || []
      );
    } catch (error) {
      console.error('Load tiers error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyTiers();
  }, [loadMyTiers]);

  // Yeni tier oluştur
  const createTier = useCallback(async (params: CreateTierParams) => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-creator-tiers', {
        body: {
          action: 'create',
          tierData: {
            name: params.name,
            description: params.description,
            coinPriceMonthly: params.coinPriceMonthly,
            coinPriceYearly: params.coinPriceYearly,
            benefits: params.benefits || [],
            maxSubscribers: params.maxSubscribers,
            sortOrder: params.sortOrder || 0,
          },
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Tier oluşturulamadı');
      }

      await loadMyTiers();
      Alert.alert('Başarılı', 'Tier oluşturuldu!');
      return data.tier;
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Tier oluşturulamadı');
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [loadMyTiers]);

  // Tier güncelle
  const updateTier = useCallback(async (tierId: string, params: UpdateTierParams) => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-creator-tiers', {
        body: {
          action: 'update',
          tierId,
          tierData: {
            name: params.name,
            description: params.description,
            coinPriceMonthly: params.coinPriceMonthly,
            coinPriceYearly: params.coinPriceYearly,
            benefits: params.benefits,
            maxSubscribers: params.maxSubscribers,
            isActive: params.isActive,
            sortOrder: params.sortOrder,
          },
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Tier güncellenemedi');
      }

      await loadMyTiers();
      Alert.alert('Başarılı', 'Tier güncellendi!');
      return data.tier;
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Tier güncellenemedi');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [loadMyTiers]);

  // Tier sil
  const deleteTier = useCallback(async (tierId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-creator-tiers', {
        body: { action: 'delete', tierId },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Tier silinemedi');
      }

      await loadMyTiers();
      Alert.alert('Başarılı', 'Tier silindi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Tier silinemedi');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadMyTiers]);

  // Tier'ı aktif/pasif yap
  const toggleTierActive = useCallback(async (tierId: string, isActive: boolean) => {
    return updateTier(tierId, { isActive });
  }, [updateTier]);

  return {
    isLoading,
    isCreating,
    isUpdating,
    tiers: myTiers,
    myTiers,
    createTier,
    updateTier,
    deleteTier,
    toggleTierActive,
    refreshTiers: loadMyTiers,
    canCreateMore: myTiers.length < 5,
  };
}
