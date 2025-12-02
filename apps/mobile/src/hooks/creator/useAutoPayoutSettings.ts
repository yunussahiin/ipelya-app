/**
 * useAutoPayoutSettings Hook
 * Creator otomatik ödeme ayarları yönetimi
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface AutoPayoutSettings {
  isEnabled: boolean;
  minimumCoinAmount: number;
  paymentMethodId: string | null;
  dayOfWeek: number;
}

export function useAutoPayoutSettings() {
  const [settings, setSettings] = useState<AutoPayoutSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-auto-payout-settings');
      if (fnError) throw fnError;
      
      setSettings(data.settings ? {
        isEnabled: data.settings.is_enabled,
        minimumCoinAmount: data.settings.minimum_coin_amount,
        paymentMethodId: data.settings.payment_method_id,
        dayOfWeek: data.settings.day_of_week
      } : {
        isEnabled: false,
        minimumCoinAmount: 1000,
        paymentMethodId: null,
        dayOfWeek: 1
      });
    } catch (err: any) {
      console.error('[useAutoPayoutSettings] Load error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (data: Partial<AutoPayoutSettings>) => {
    setIsSaving(true);
    try {
      const { error: fnError } = await supabase.functions.invoke('update-auto-payout-settings', {
        body: data
      });
      if (fnError) throw fnError;
      await loadSettings();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAutoPayout = async (enabled: boolean) => {
    return updateSettings({ isEnabled: enabled });
  };

  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings,
    toggleAutoPayout,
    refresh: loadSettings,
  };
}
