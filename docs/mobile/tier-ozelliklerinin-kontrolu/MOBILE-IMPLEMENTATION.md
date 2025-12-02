# Mobile App - Tier Benefit Kontrolü Implementasyonu

Bu döküman, mobile app'te tier benefit kontrolünün nasıl implement edileceğini detaylı olarak açıklar.

---

## 📦 Oluşturulacak Dosyalar

### 1. Type Tanımları

**Dosya:** `/src/types/benefit.types.ts`

```typescript
/**
 * Tier Benefit Type Definitions
 */

// Benefit ID'leri
export type TierBenefitId = 
  // İçerik
  | 'exclusive_stories'
  | 'exclusive_broadcast'
  | 'archive_access'
  | 'media_packages'
  | 'personal_video'
  | 'weekly_summary'
  | 'subscriber_surprises'
  // İletişim
  | 'voice_message'
  | 'dm_access'
  | 'priority_dm'
  | 'mini_group_chat'
  | 'vip_question'
  // Ekstra
  | 'early_notifications'
  | 'premium_badge'
  | 'special_stickers'
  | 'birthday_message';

// Limit türleri
export type BenefitLimitType = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Benefit bilgisi
export interface TierBenefit {
  id: TierBenefitId;
  name: string;
  description: string;
  emoji: string;
  category: 'content' | 'communication' | 'perks';
  hasLimit: boolean;
  limitType?: BenefitLimitType;
  maxUsage?: number;
}

// Kullanım durumu
export interface BenefitUsage {
  benefitId: TierBenefitId;
  current: number;
  max: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
  canUse: boolean;
}

// Benefit kontrol sonucu
export interface BenefitCheckResult {
  hasAccess: boolean;
  benefit?: TierBenefit;
  usage?: BenefitUsage;
  subscription?: {
    id: string;
    tierName: string;
    status: 'active' | 'paused' | 'cancelled';
  };
  reason?: 'no_subscription' | 'benefit_not_included' | 'limit_reached' | 'subscription_paused';
}

// Cached subscription with benefits
export interface CachedSubscription {
  creatorId: string;
  tierId: string;
  tierName: string;
  benefits: TierBenefitId[];
  status: 'active' | 'paused';
  expiresAt: string;
}
```

---

### 2. Ana Hook: useTierBenefitCheck

**Dosya:** `/src/hooks/useTierBenefitCheck.ts`

```typescript
/**
 * useTierBenefitCheck Hook
 * 
 * Tier benefit erişim kontrolü için ana hook.
 * Subscription cache'i kullanarak hızlı kontrol sağlar.
 * Limitli benefit'ler için edge function çağırır.
 * 
 * @example
 * const { hasBenefit, canUseBenefit, useBenefit, getBenefitsFor } = useTierBenefitCheck();
 * 
 * // Basit kontrol (cached)
 * if (hasBenefit(creatorId, 'exclusive_stories')) {
 *   showExclusiveContent();
 * }
 * 
 * // Limitli benefit kontrolü (API call)
 * const result = await canUseBenefit(creatorId, 'voice_message');
 * if (result.canUse) {
 *   await sendVoiceMessage();
 *   await useBenefit(creatorId, 'voice_message');
 * }
 */

import { useCallback, useMemo } from 'react';
import { useCreatorSubscription } from './useCreatorSubscription';
import { supabase } from '@/lib/supabaseClient';
import { 
  TierBenefitId, 
  BenefitCheckResult, 
  BenefitUsage,
  CachedSubscription 
} from '@/types/benefit.types';

// Limitli benefit'ler ve varsayılan limitleri
const LIMITED_BENEFITS: Record<TierBenefitId, { limitType: string; defaultMax: number }> = {
  voice_message: { limitType: 'monthly', defaultMax: 5 },
  personal_video: { limitType: 'monthly', defaultMax: 1 },
  subscriber_surprises: { limitType: 'monthly', defaultMax: 1 },
};

export function useTierBenefitCheck() {
  const { mySubscriptions, isSubscribedTo, getSubscriptionFor } = useCreatorSubscription();

  /**
   * Cached subscription'ları benefit lookup için hazırla
   */
  const subscriptionCache = useMemo(() => {
    const cache = new Map<string, CachedSubscription>();
    
    mySubscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.tier) {
        cache.set(sub.creatorId, {
          creatorId: sub.creatorId,
          tierId: sub.tierId,
          tierName: sub.tier.name,
          benefits: sub.tier.benefits as TierBenefitId[],
          status: sub.status,
          expiresAt: sub.currentPeriodEnd,
        });
      }
    });
    
    return cache;
  }, [mySubscriptions]);

  /**
   * Basit benefit kontrolü (cached, senkron)
   * Limitli benefit'ler için canUseBenefit kullanın
   */
  const hasBenefit = useCallback((
    creatorId: string, 
    benefitId: TierBenefitId
  ): boolean => {
    const subscription = subscriptionCache.get(creatorId);
    if (!subscription) return false;
    
    return subscription.benefits.includes(benefitId);
  }, [subscriptionCache]);

  /**
   * Bir creator için tüm benefit'leri getir
   */
  const getBenefitsFor = useCallback((creatorId: string): TierBenefitId[] => {
    const subscription = subscriptionCache.get(creatorId);
    return subscription?.benefits || [];
  }, [subscriptionCache]);

  /**
   * Limitli benefit kullanılabilirlik kontrolü (async)
   */
  const canUseBenefit = useCallback(async (
    creatorId: string,
    benefitId: TierBenefitId
  ): Promise<{ canUse: boolean; usage?: BenefitUsage; reason?: string }> => {
    // Önce basit kontrol
    if (!hasBenefit(creatorId, benefitId)) {
      return { 
        canUse: false, 
        reason: isSubscribedTo(creatorId) ? 'benefit_not_included' : 'no_subscription' 
      };
    }

    // Limitli değilse direkt true
    if (!LIMITED_BENEFITS[benefitId]) {
      return { canUse: true };
    }

    // Edge function ile limit kontrolü
    try {
      const { data, error } = await supabase.functions.invoke('check-tier-benefit', {
        body: { creatorId, benefitId, action: 'check' }
      });

      if (error) throw error;

      return {
        canUse: data.usage?.remaining > 0,
        usage: data.usage,
        reason: data.usage?.remaining === 0 ? 'limit_reached' : undefined
      };
    } catch (err) {
      console.error('Benefit check error:', err);
      // Hata durumunda izin ver (graceful degradation)
      return { canUse: true };
    }
  }, [hasBenefit, isSubscribedTo]);

  /**
   * Limitli benefit kullanımını kaydet
   */
  const useBenefit = useCallback(async (
    creatorId: string,
    benefitId: TierBenefitId
  ): Promise<{ success: boolean; usage?: BenefitUsage }> => {
    if (!LIMITED_BENEFITS[benefitId]) {
      return { success: true };
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-tier-benefit', {
        body: { creatorId, benefitId, action: 'use' }
      });

      if (error) throw error;

      return {
        success: data.success,
        usage: data.usage
      };
    } catch (err) {
      console.error('Benefit use error:', err);
      return { success: false };
    }
  }, []);

  /**
   * Detaylı benefit kontrolü (async)
   */
  const checkBenefit = useCallback(async (
    creatorId: string,
    benefitId: TierBenefitId
  ): Promise<BenefitCheckResult> => {
    const subscription = getSubscriptionFor(creatorId);
    
    if (!subscription) {
      return { hasAccess: false, reason: 'no_subscription' };
    }

    if (subscription.status === 'paused') {
      return { hasAccess: false, reason: 'subscription_paused' };
    }

    const hasBenefitAccess = subscription.tier?.benefits.includes(benefitId);
    
    if (!hasBenefitAccess) {
      return { hasAccess: false, reason: 'benefit_not_included' };
    }

    // Limitli benefit kontrolü
    if (LIMITED_BENEFITS[benefitId]) {
      const { canUse, usage } = await canUseBenefit(creatorId, benefitId);
      return {
        hasAccess: canUse,
        usage,
        subscription: {
          id: subscription.id,
          tierName: subscription.tier?.name || '',
          status: subscription.status
        },
        reason: canUse ? undefined : 'limit_reached'
      };
    }

    return {
      hasAccess: true,
      subscription: {
        id: subscription.id,
        tierName: subscription.tier?.name || '',
        status: subscription.status
      }
    };
  }, [getSubscriptionFor, canUseBenefit]);

  return {
    // Senkron (cached)
    hasBenefit,
    getBenefitsFor,
    
    // Asenkron (API)
    canUseBenefit,
    useBenefit,
    checkBenefit,
    
    // Subscription cache
    subscriptionCache,
  };
}
```

---

### 3. BenefitGate Component

**Dosya:** `/src/components/common/BenefitGate.tsx`

```typescript
/**
 * BenefitGate Component
 * 
 * Conditional rendering based on tier benefit access.
 * Shows content if user has benefit, otherwise shows fallback or subscribe prompt.
 * 
 * @example
 * <BenefitGate 
 *   creatorId={creatorId} 
 *   benefitId="exclusive_stories"
 *   fallback={<SubscribePrompt creatorId={creatorId} />}
 * >
 *   <ExclusiveStoryContent />
 * </BenefitGate>
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useTierBenefitCheck } from '@/hooks/useTierBenefitCheck';
import { TierBenefitId } from '@/types/benefit.types';
import { Ionicons } from '@expo/vector-icons';

interface BenefitGateProps {
  creatorId: string;
  benefitId: TierBenefitId;
  children: ReactNode;
  fallback?: ReactNode;
  showLockIcon?: boolean;
  onSubscribePress?: () => void;
}

export function BenefitGate({
  creatorId,
  benefitId,
  children,
  fallback,
  showLockIcon = true,
  onSubscribePress,
}: BenefitGateProps) {
  const { colors } = useTheme();
  const { hasBenefit } = useTierBenefitCheck();

  const hasAccess = hasBenefit(creatorId, benefitId);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback: Lock overlay
  return (
    <View style={styles.lockedContainer}>
      {children}
      <View style={[styles.lockOverlay, { backgroundColor: colors.background + 'E6' }]}>
        {showLockIcon && (
          <View style={[styles.lockIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="lock-closed" size={24} color={colors.accent} />
          </View>
        )}
        <Text style={[styles.lockText, { color: colors.textPrimary }]}>
          Bu içerik abonelere özel
        </Text>
        {onSubscribePress && (
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: colors.accent }]}
            onPress={onSubscribePress}
          >
            <Text style={styles.subscribeText}>Abone Ol</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    position: 'relative',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  subscribeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

---

### 4. LimitedBenefitButton Component

**Dosya:** `/src/components/common/LimitedBenefitButton.tsx`

```typescript
/**
 * LimitedBenefitButton Component
 * 
 * Button for limited benefits with usage tracking.
 * Shows remaining usage and handles limit checks.
 * 
 * @example
 * <LimitedBenefitButton
 *   creatorId={creatorId}
 *   benefitId="voice_message"
 *   onPress={handleSendVoiceMessage}
 *   icon="mic"
 *   label="Sesli Mesaj"
 * />
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useTierBenefitCheck } from '@/hooks/useTierBenefitCheck';
import { TierBenefitId, BenefitUsage } from '@/types/benefit.types';
import { useToast } from '@/components/ui';

interface LimitedBenefitButtonProps {
  creatorId: string;
  benefitId: TierBenefitId;
  onPress: () => Promise<void>;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled?: boolean;
}

export function LimitedBenefitButton({
  creatorId,
  benefitId,
  onPress,
  icon,
  label,
  disabled = false,
}: LimitedBenefitButtonProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { hasBenefit, canUseBenefit, useBenefit } = useTierBenefitCheck();
  
  const [usage, setUsage] = useState<BenefitUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // İlk yüklemede kullanım durumunu kontrol et
  useEffect(() => {
    const checkUsage = async () => {
      if (!hasBenefit(creatorId, benefitId)) {
        setIsChecking(false);
        return;
      }

      const result = await canUseBenefit(creatorId, benefitId);
      setUsage(result.usage || null);
      setIsChecking(false);
    };

    checkUsage();
  }, [creatorId, benefitId, hasBenefit, canUseBenefit]);

  const handlePress = async () => {
    if (isLoading || disabled) return;

    // Benefit erişimi var mı?
    if (!hasBenefit(creatorId, benefitId)) {
      showToast({
        type: 'warning',
        message: 'Erişim Yok',
        description: 'Bu özellik aboneliğinize dahil değil.'
      });
      return;
    }

    // Limit kontrolü
    const { canUse, usage: currentUsage, reason } = await canUseBenefit(creatorId, benefitId);
    
    if (!canUse) {
      showToast({
        type: 'warning',
        message: 'Limit Doldu',
        description: `Bu ay için ${label.toLowerCase()} hakkınız kalmadı.`
      });
      return;
    }

    setIsLoading(true);
    try {
      // Ana işlemi yap
      await onPress();
      
      // Kullanımı kaydet
      const { success, usage: newUsage } = await useBenefit(creatorId, benefitId);
      
      if (success && newUsage) {
        setUsage(newUsage);
        
        if (newUsage.remaining > 0) {
          showToast({
            type: 'info',
            message: `Kalan: ${newUsage.remaining}/${newUsage.max}`
          });
        } else {
          showToast({
            type: 'warning',
            message: 'Son Hakkınızı Kullandınız',
            description: 'Bir sonraki dönemde yenilenecek.'
          });
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Hata',
        description: 'İşlem gerçekleştirilemedi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasAccess = hasBenefit(creatorId, benefitId);
  const canUse = usage ? usage.remaining > 0 : hasAccess;
  const isDisabled = disabled || !hasAccess || !canUse || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: isDisabled ? colors.surface : colors.accent,
          opacity: isDisabled ? 0.6 : 1 
        }
      ]}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {isLoading || isChecking ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Ionicons 
            name={icon} 
            size={20} 
            color={isDisabled ? colors.textMuted : '#fff'} 
          />
          <Text style={[
            styles.label, 
            { color: isDisabled ? colors.textMuted : '#fff' }
          ]}>
            {label}
          </Text>
          {usage && (
            <View style={[styles.badge, { backgroundColor: colors.background }]}>
              <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
                {usage.remaining}/{usage.max}
              </Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
```

---

## 🎯 Kullanım Örnekleri

### Özel Story Kontrolü

```typescript
// screens/StoryViewer.tsx
import { BenefitGate } from '@/components/common/BenefitGate';

function StoryViewer({ story, creatorId }) {
  if (story.isExclusive) {
    return (
      <BenefitGate
        creatorId={creatorId}
        benefitId="exclusive_stories"
        onSubscribePress={() => navigation.navigate('Subscribe', { creatorId })}
      >
        <StoryContent story={story} />
      </BenefitGate>
    );
  }
  
  return <StoryContent story={story} />;
}
```

### DM Ekranında Öncelik Gösterimi

```typescript
// screens/ChatScreen.tsx
import { useTierBenefitCheck } from '@/hooks/useTierBenefitCheck';

function ChatScreen({ creatorId }) {
  const { hasBenefit } = useTierBenefitCheck();
  
  const hasPriorityDM = hasBenefit(creatorId, 'priority_dm');
  
  return (
    <View>
      {hasPriorityDM && (
        <View style={styles.priorityBadge}>
          <Text>⚡ Öncelikli Mesaj</Text>
        </View>
      )}
      <MessageInput />
    </View>
  );
}
```

### Sesli Mesaj Butonu

```typescript
// components/chat/VoiceMessageButton.tsx
import { LimitedBenefitButton } from '@/components/common/LimitedBenefitButton';

function VoiceMessageButton({ creatorId, onSend }) {
  return (
    <LimitedBenefitButton
      creatorId={creatorId}
      benefitId="voice_message"
      onPress={onSend}
      icon="mic"
      label="Sesli Mesaj"
    />
  );
}
```

### Premium Rozet

```typescript
// components/comments/CommentItem.tsx
import { useTierBenefitCheck } from '@/hooks/useTierBenefitCheck';

function CommentItem({ comment, creatorId }) {
  const { hasBenefit } = useTierBenefitCheck();
  
  const showPremiumBadge = hasBenefit(creatorId, 'premium_badge');
  
  return (
    <View style={styles.comment}>
      <Avatar user={comment.user} />
      {showPremiumBadge && <PremiumBadge />}
      <Text>{comment.text}</Text>
    </View>
  );
}
```

---

## 📝 Notlar

1. **Cache Stratejisi:** `hasBenefit` senkron ve cached, `canUseBenefit` async ve güncel
2. **Graceful Degradation:** API hatalarında izin ver, log tut
3. **Realtime:** Subscription değişikliklerinde cache otomatik güncellenir
4. **Performance:** Limitli benefit kontrolü sadece gerektiğinde yapılır
