/**
 * Economy Types
 * Coin sistemi, abonelik ve hediye tipleri
 */

// Coin Balance
export interface CoinBalance {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  createdAt: string;
  updatedAt: string;
}

// Coin Transaction
export interface CoinTransaction {
  id: string;
  userId: string;
  type: 
    | 'purchase' 
    | 'gift_sent' 
    | 'gift_received' 
    | 'subscription' 
    | 'subscription_income' 
    | 'refund' 
    | 'bonus' 
    | 'tip' 
    | 'tip_received';
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
}

// Purchase
export interface Purchase {
  id: string;
  userId: string;
  store: 'apple' | 'google';
  productId: string;
  transactionId: string;
  purchaseToken?: string;
  status: 'pending' | 'validated' | 'failed' | 'refunded';
  coinsGranted?: number;
  priceAmount?: number;
  priceCurrency?: string;
  environment?: string;
  validatedAt?: string;
  createdAt: string;
}

// Gift
export interface Gift {
  id: string;
  senderId: string;
  receiverId: string;
  giftType: 'heart' | 'rose' | 'diamond' | 'crown' | 'star' | 'fire';
  coinCost: number;
  creatorShare: number;
  platformShare: number;
  message?: string;
  postId?: string;
  status: 'sent' | 'received' | 'refunded';
  createdAt: string;
}

// Creator Subscription Tier
export interface CreatorSubscriptionTier {
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
  createdAt: string;
  updatedAt: string;
}

// Creator Subscription
export interface CreatorSubscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  tierId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billingPeriod: 'monthly' | 'yearly';
  coinPrice: number;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string;
  cancelledAt?: string;
  pauseReason?: string;
  createdAt: string;
  updatedAt: string;
  tier?: CreatorSubscriptionTier;
}

// Subscription Payment
export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  subscriberId: string;
  creatorId: string;
  coinAmount: number;
  creatorShare: number;
  platformShare: number;
  periodStart: string;
  periodEnd: string;
  status: 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

// Product Types
export interface CoinProduct {
  id: string;
  coins: number;
  bonus: number;
  price: string;
  popular?: boolean;
}

export interface PlatformSubscription {
  id: string;
  period: 'monthly' | 'yearly';
  price: string;
}

export interface GiftType {
  id: string;
  name: string;
  cost: number;
  emoji: string;
}

// Earnings
export interface CreatorEarnings {
  period: string;
  earnings: {
    subscriptions: number;
    gifts: number;
    total: number;
  };
  subscribers: {
    active: number;
    total: number;
  };
  balance: {
    balance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
  tiers: {
    id: string;
    name: string;
    coinPriceMonthly: number;
    subscriberCount: number;
  }[];
  dailyEarnings: {
    date: string;
    subscriptions: number;
    gifts: number;
    total: number;
  }[];
}
