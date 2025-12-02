/**
 * Tier Benefits & Templates TypeScript Types
 * Web Ops Panel için tier yönetim tipleri
 */

// Avantaj kategorileri
export type BenefitCategory = "content" | "communication" | "perks";

// Limit türleri
export type LimitType = "daily" | "weekly" | "monthly" | "yearly";

// Önerilen tier seviyeleri
export type TierLevel = "bronze" | "silver" | "gold" | "diamond" | "vip";

// Şablon hedef kitlesi
export type RecommendedFor = "beginner" | "intermediate" | "advanced" | "premium";

/**
 * Tier Benefit - Avantaj tanımı
 */
export interface TierBenefit {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BenefitCategory;
  has_limit: boolean;
  limit_type: LimitType | null;
  recommended_tier_level: TierLevel | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Tier Template - Şablon tanımı
 */
export interface TierTemplate {
  id: string;
  name: string;
  description: string | null;
  suggested_coin_price_monthly: number;
  suggested_coin_price_yearly: number | null;
  emoji: string;
  color: string;
  gradient_start: string;
  gradient_end: string;
  default_benefit_ids: string[];
  recommended_for: RecommendedFor | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Enriched data (API'den geldiğinde)
  benefits?: TierBenefit[];
}

/**
 * API Response Types
 */
export interface TierBenefitsResponse {
  success: boolean;
  benefits: TierBenefit[];
  grouped: {
    content: TierBenefit[];
    communication: TierBenefit[];
    perks: TierBenefit[];
  };
  total: number;
}

export interface TierTemplatesResponse {
  success: boolean;
  templates: TierTemplate[];
  total: number;
}

export interface SingleBenefitResponse {
  success: boolean;
  benefit: TierBenefit;
}

export interface SingleTemplateResponse {
  success: boolean;
  template: TierTemplate;
}

/**
 * Form/Input Types
 */
export interface CreateBenefitInput {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BenefitCategory;
  has_limit?: boolean;
  limit_type?: LimitType | null;
  recommended_tier_level?: TierLevel | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateBenefitInput {
  name?: string;
  description?: string;
  emoji?: string;
  category?: BenefitCategory;
  has_limit?: boolean;
  limit_type?: LimitType | null;
  recommended_tier_level?: TierLevel | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface CreateTemplateInput {
  id: string;
  name: string;
  description?: string;
  suggested_coin_price_monthly: number;
  suggested_coin_price_yearly?: number;
  emoji: string;
  color: string;
  gradient_start: string;
  gradient_end: string;
  default_benefit_ids?: string[];
  recommended_for?: RecommendedFor;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  suggested_coin_price_monthly?: number;
  suggested_coin_price_yearly?: number;
  emoji?: string;
  color?: string;
  gradient_start?: string;
  gradient_end?: string;
  default_benefit_ids?: string[];
  recommended_for?: RecommendedFor | null;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * UI Helper Types
 */
export const CATEGORY_LABELS: Record<BenefitCategory, string> = {
  content: "İçerik",
  communication: "İletişim",
  perks: "Ekstra",
};

export const CATEGORY_ICONS: Record<BenefitCategory, string> = {
  content: "📺",
  communication: "💬",
  perks: "🎁",
};

export const TIER_LEVEL_LABELS: Record<TierLevel, string> = {
  bronze: "Bronze 🥉",
  silver: "Silver 🥈",
  gold: "Gold 🥇",
  diamond: "Diamond 💎",
  vip: "VIP 👑",
};

export const LIMIT_TYPE_LABELS: Record<LimitType, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
};

export const RECOMMENDED_FOR_LABELS: Record<RecommendedFor, string> = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
  premium: "Premium",
};
