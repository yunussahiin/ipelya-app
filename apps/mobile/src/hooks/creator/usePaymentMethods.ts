/**
 * usePaymentMethods Hook
 * Creator ödeme yöntemleri yönetimi
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type PaymentMethodType = 'bank' | 'crypto';
export type PaymentMethodStatus = 'pending' | 'approved' | 'rejected';
export type CryptoNetwork = 'TRC20' | 'ERC20' | 'BEP20';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  displayName: string;
  isDefault: boolean;
  status: PaymentMethodStatus;
  rejectionReason?: string;
  details: {
    bank_name?: string;
    iban?: string;
    account_holder?: string;
    crypto_network?: CryptoNetwork;
    wallet_address?: string;
  };
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-payment-methods');
      if (fnError) throw fnError;
      setMethods(data.methods || []);
    } catch (err: any) {
      console.error('[usePaymentMethods] Load error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const addBankAccount = async (data: {
    bankName: string;
    bankCode?: string;
    iban: string;
    accountHolder: string;
    isDefault?: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const { error: fnError } = await supabase.functions.invoke('add-payment-method', {
        body: { type: 'bank', ...data }
      });
      if (fnError) throw fnError;
      await loadMethods();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCryptoWallet = async (data: {
    cryptoNetwork: CryptoNetwork;
    walletAddress: string;
    isDefault?: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const { error: fnError } = await supabase.functions.invoke('add-payment-method', {
        body: { type: 'crypto', ...data }
      });
      if (fnError) throw fnError;
      await loadMethods();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const setAsDefault = async (methodId: string) => {
    try {
      const { error: fnError } = await supabase.functions.invoke('update-payment-method', {
        body: { methodId, isDefault: true }
      });
      if (fnError) throw fnError;
      await loadMethods();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteMethod = async (methodId: string) => {
    try {
      const { error: fnError } = await supabase.functions.invoke('delete-payment-method', {
        body: { methodId }
      });
      if (fnError) throw fnError;
      await loadMethods();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const approvedMethods = methods.filter(m => m.status === 'approved');
  const pendingMethods = methods.filter(m => m.status === 'pending');
  const rejectedMethods = methods.filter(m => m.status === 'rejected');
  const hasApprovedMethod = approvedMethods.length > 0;

  return {
    methods,
    approvedMethods,
    pendingMethods,
    rejectedMethods,
    hasApprovedMethod,
    isLoading,
    isSubmitting,
    error,
    addBankAccount,
    addCryptoWallet,
    setAsDefault,
    deleteMethod,
    refresh: loadMethods,
  };
}
