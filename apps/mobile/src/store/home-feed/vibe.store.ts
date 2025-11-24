/**
 * Vibe Store (Zustand)
 * 
 * Amaç: Kullanıcı mood/vibe state management
 * 
 * State:
 * - currentVibe: Mevcut vibe type
 * - intensity: Vibe intensity (1-5)
 * - expiresAt: Expiration timestamp
 * 
 * Actions:
 * - setVibe: Vibe güncelle
 * - clearVibe: Vibe'ı temizle
 * - isExpired: Expire olmuş mu kontrol et
 * 
 * Kullanım:
 * const { currentVibe, setVibe } = useVibeStore();
 */

import { create } from 'zustand';
import type { VibeType } from '@ipelya/types';

interface VibeState {
  // Vibe data
  currentVibe: VibeType | null;
  intensity: number;
  expiresAt: string | null;
  
  // Actions
  setVibe: (vibe: VibeType, intensity: number) => void;
  clearVibe: () => void;
  isExpired: () => boolean;
}

export const useVibeStore = create<VibeState>((set, get) => ({
  // Initial state
  currentVibe: null,
  intensity: 3,
  expiresAt: null,
  
  // Actions
  setVibe: (vibe, intensity) =>
    set({
      currentVibe: vibe,
      intensity,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }),
  
  clearVibe: () =>
    set({
      currentVibe: null,
      intensity: 3,
      expiresAt: null,
    }),
  
  isExpired: () => {
    const { expiresAt } = get();
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  },
}));
