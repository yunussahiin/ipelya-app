/**
 * useTierTemplates Hook
 * Tier şablonlarını ve avantajları veritabanından çeker
 * 
 * Veritabanı tabloları:
 * - tier_templates: Tier şablonları (Bronze, Silver, Gold, Diamond, VIP)
 * - tier_benefits: Standart avantajlar
 * 
 * Edge functions:
 * - get-tier-templates: Şablonları avantaj detaylarıyla getirir
 * 
 * Fallback:
 * - Veritabanına erişilemezse products.ts'deki statik liste kullanılır
 * 
 * @example
 * const { templates, benefits, groupedBenefits, isLoading } = useTierTemplates();
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TIER_BENEFITS, SUGGESTED_TIER_TEMPLATES, TierBenefitId } from '@/services/iap/products';

export interface TierBenefit {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'content' | 'communication' | 'perks';
  has_limit?: boolean;
  limit_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recommended_tier_level?: string;
  is_active: boolean;
  sort_order: number;
}

export interface TierTemplate {
  id: string;
  name: string;
  description?: string;
  suggested_coin_price_monthly: number;
  suggested_coin_price_yearly?: number;
  emoji: string;
  color: string;
  gradient_start: string;
  gradient_end: string;
  gradientColors: [string, string];
  default_benefit_ids: string[];
  benefits: TierBenefit[];
  recommended_for?: 'beginner' | 'intermediate' | 'advanced' | 'premium';
  sort_order: number;
  is_active: boolean;
}

export function useTierTemplates() {
  const [templates, setTemplates] = useState<TierTemplate[]>([]);
  const [benefits, setBenefits] = useState<TierBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-tier-templates', {
        body: { activeOnly: true, withBenefits: true }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setTemplates(data.templates || []);
        setBenefits(data.allBenefits || []);
      } else {
        throw new Error(data?.error || 'Şablonlar yüklenemedi');
      }
    } catch (err: any) {
      console.error('Load tier templates error:', err);
      setError(err.message);
      
      // Fallback: Local data kullan
      const fallbackTemplates = SUGGESTED_TIER_TEMPLATES.map(t => ({
        id: t.name.toLowerCase(),
        name: t.name,
        suggested_coin_price_monthly: t.coinPrice,
        suggested_coin_price_yearly: t.coinPrice * 10,
        emoji: t.emoji,
        color: t.color,
        gradient_start: t.gradientColors[0],
        gradient_end: t.gradientColors[1],
        gradientColors: t.gradientColors,
        default_benefit_ids: t.benefitIds,
        benefits: t.benefitIds.map(id => {
          const b = TIER_BENEFITS.find(b => b.id === id);
          return b ? { ...b, is_active: true, sort_order: 0 } : null;
        }).filter(Boolean) as TierBenefit[],
        sort_order: 0,
        is_active: true,
      }));
      
      setTemplates(fallbackTemplates);
      setBenefits(TIER_BENEFITS.map(b => ({ ...b, is_active: true, sort_order: 0 })) as TierBenefit[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kategoriye göre avantajları grupla
  const groupedBenefits = {
    content: benefits.filter(b => b.category === 'content'),
    communication: benefits.filter(b => b.category === 'communication'),
    perks: benefits.filter(b => b.category === 'perks'),
  };

  // Tier seviyesine göre önerilen avantajları getir
  const getRecommendedBenefits = (tierLevel: string) => {
    const levels = ['bronze', 'silver', 'gold', 'diamond', 'vip'];
    const tierIndex = levels.indexOf(tierLevel);
    
    return benefits.filter(b => {
      const benefitIndex = levels.indexOf(b.recommended_tier_level || 'bronze');
      return benefitIndex <= tierIndex;
    });
  };

  return {
    templates,
    benefits,
    groupedBenefits,
    isLoading,
    error,
    refresh: loadData,
    getRecommendedBenefits,
  };
}

// Tek bir avantaj bilgisi almak için helper
export function useTierBenefit(benefitId: string) {
  const { benefits } = useTierTemplates();
  return benefits.find(b => b.id === benefitId);
}
