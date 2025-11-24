/**
 * Feed Store (Zustand)
 * 
 * Amaç: Feed global state management
 * 
 * State:
 * - selectedTab: Aktif tab (feed, trending, following)
 * - filters: Vibe & intent filters
 * - refreshing: Pull to refresh durumu
 * 
 * Actions:
 * - setSelectedTab: Tab değiştir
 * - setFilters: Filter uygula
 * - clearFilters: Filter'ları temizle
 * - setRefreshing: Refreshing durumunu güncelle
 * 
 * Kullanım:
 * const { selectedTab, setSelectedTab } = useFeedStore();
 */

import { create } from 'zustand';
import type { VibeType, IntentType } from '@ipelya/types';

interface FeedFilters {
  vibe?: VibeType;
  intent?: IntentType;
}

interface FeedState {
  // Tab selection
  selectedTab: 'feed' | 'trending' | 'following';
  setSelectedTab: (tab: 'feed' | 'trending' | 'following') => void;
  
  // Filters
  filters: FeedFilters;
  setFilters: (filters: Partial<FeedFilters>) => void;
  clearFilters: () => void;
  
  // Refreshing
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  // Initial state
  selectedTab: 'feed',
  filters: {},
  refreshing: false,
  
  // Actions
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  
  clearFilters: () => set({ filters: {} }),
  
  setRefreshing: (refreshing) => set({ refreshing }),
}));
