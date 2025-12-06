/**
 * usePayoutRequests Hook
 * Creator ödeme talepleri yönetimi
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export type PayoutStatus = 'pending' | 'in_review' | 'approved' | 'paid' | 'rejected' | 'cancelled';

export interface PayoutRequest {
  id: string;
  coin_amount: number;
  tl_amount: number;
  locked_rate: number;
  rate_locked_at: string;
  status: PayoutStatus;
  rejection_reason?: string;
  paid_at?: string;
  payment_reference?: string;
  is_auto_created: boolean;
  created_at: string;
  paymentMethodType: 'bank' | 'crypto';
  paymentMethodDisplayName: string;
}

export function usePayoutRequests() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PayoutRequest | null>(null);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-payout-requests');
      if (fnError) throw fnError;

      setRequests(data.requests || []);
      setPendingRequest(data.pendingRequest || null);
      setWithdrawableBalance(data.withdrawableBalance || 0);
    } catch (err: any) {
      logger.error('Payout requests load error', err, { tag: 'Payout' });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();

    // Realtime subscription
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const channel = supabase
        .channel(`payout-requests-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payout_requests',
            filter: `creator_id=eq.${session.user.id}`
          },
          () => {
            loadRequests();
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
  }, [loadRequests]);

  const createRequest = async (data: {
    coinAmount: number;
    paymentMethodId: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('create-payout-request', {
        body: data
      });
      if (fnError) throw fnError;

      await loadRequests();
      return { success: true, request: result.request };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const { error: fnError } = await supabase.functions.invoke('cancel-payout-request', {
        body: { requestId }
      });
      if (fnError) throw fnError;
      await loadRequests();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    requests,
    pendingRequest,
    withdrawableBalance,
    hasPendingRequest: !!pendingRequest,
    isLoading,
    isSubmitting,
    error,
    createRequest,
    cancelRequest,
    refresh: loadRequests,
  };
}
