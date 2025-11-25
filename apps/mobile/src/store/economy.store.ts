/**
 * Economy Store
 * Zustand ile coin bakiyesi ve ekonomi state yönetimi
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

interface EconomyState {
  // Balance
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  isLoading: boolean;

  // Actions
  setBalance: (balance: number, lifetimeEarned: number, lifetimeSpent: number) => void;
  setLoading: (loading: boolean) => void;
  refreshBalance: () => Promise<void>;
  addCoins: (amount: number) => void;
  subtractCoins: (amount: number) => boolean;
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  // Initial state
  balance: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
  isLoading: false,

  // Set balance
  setBalance: (balance, lifetimeEarned, lifetimeSpent) => {
    set({ balance, lifetimeEarned, lifetimeSpent });
  },

  // Set loading
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Refresh balance from server
  refreshBalance: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, isLoading: false });
        return;
      }

      const { data, error } = await supabase.rpc('get_user_balance', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Balance fetch error:', error);
        set({ isLoading: false });
        return;
      }

      if (data && data.length > 0) {
        set({
          balance: data[0].balance || 0,
          lifetimeEarned: data[0].lifetime_earned || 0,
          lifetimeSpent: data[0].lifetime_spent || 0,
          isLoading: false,
        });
      } else {
        set({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, isLoading: false });
      }
    } catch (error) {
      console.error('Balance refresh error:', error);
      set({ isLoading: false });
    }
  },

  // Add coins (optimistic update)
  addCoins: (amount) => {
    set((state) => ({
      balance: state.balance + amount,
      lifetimeEarned: state.lifetimeEarned + amount,
    }));
  },

  // Subtract coins (optimistic update)
  subtractCoins: (amount) => {
    const currentBalance = get().balance;
    if (currentBalance < amount) {
      return false;
    }
    set((state) => ({
      balance: state.balance - amount,
      lifetimeSpent: state.lifetimeSpent + amount,
    }));
    return true;
  },
}));
