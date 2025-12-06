/**
 * useCreatorRealtime Hook
 * Creator için realtime subscriptions yönetimi
 * 
 * Bu hook aşağıdaki tabloları dinler:
 * - creator_transactions: Yeni kazançlar
 * - payout_requests: Ödeme durumu değişiklikleri
 * - payment_methods: Ödeme yöntemi onay durumları
 * - creator_kyc_profiles: KYC durum değişiklikleri
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/auth.store';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type CreatorEventType = 
  | 'new_earning'
  | 'payout_status_changed'
  | 'payment_method_verified'
  | 'kyc_status_changed';

export interface CreatorRealtimeEvent {
  type: CreatorEventType;
  data: any;
  timestamp: string;
}

interface UseCreatorRealtimeOptions {
  onNewEarning?: (transaction: any) => void;
  onPayoutStatusChanged?: (request: any) => void;
  onPaymentMethodVerified?: (method: any) => void;
  onKYCStatusChanged?: (status: any) => void;
  onAnyEvent?: (event: CreatorRealtimeEvent) => void;
  enabled?: boolean;
}

export function useCreatorRealtime(options: UseCreatorRealtimeOptions = {}) {
  const user = useAuthStore((s) => s.user);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const {
    onNewEarning,
    onPayoutStatusChanged,
    onPaymentMethodVerified,
    onKYCStatusChanged,
    onAnyEvent,
    enabled = true
  } = options;

  const handleEvent = useCallback((type: CreatorEventType, data: any) => {
    const event: CreatorRealtimeEvent = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    // Specific handlers
    switch (type) {
      case 'new_earning':
        onNewEarning?.(data);
        break;
      case 'payout_status_changed':
        onPayoutStatusChanged?.(data);
        break;
      case 'payment_method_verified':
        onPaymentMethodVerified?.(data);
        break;
      case 'kyc_status_changed':
        onKYCStatusChanged?.(data);
        break;
    }

    // Generic handler
    onAnyEvent?.(event);
  }, [onNewEarning, onPayoutStatusChanged, onPaymentMethodVerified, onKYCStatusChanged, onAnyEvent]);

  useEffect(() => {
    if (!user?.id || !enabled) return;

    // Create a single channel for all creator events
    const channel = supabase
      .channel(`creator:${user.id}`)
      // Listen for new transactions (earnings)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creator_transactions',
          filter: `creator_id=eq.${user.id}`
        },
        (payload) => {
          handleEvent('new_earning', payload.new);
        }
      )
      // Listen for payout request status changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payout_requests',
          filter: `creator_id=eq.${user.id}`
        },
        (payload) => {
          handleEvent('payout_status_changed', payload.new);
        }
      )
      // Listen for payment method verification
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_methods',
          filter: `creator_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status !== payload.old?.status) {
            handleEvent('payment_method_verified', payload.new);
          }
        }
      )
      // Listen for KYC status changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_kyc_profiles',
          filter: `creator_id=eq.${user.id}`
        },
        (payload) => {
          handleEvent('kyc_status_changed', payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, enabled, handleEvent]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return {
    unsubscribe,
    isSubscribed: !!channelRef.current
  };
}
