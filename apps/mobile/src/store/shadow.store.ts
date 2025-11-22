/**
 * Shadow Mode Store - Zustand State Management
 * 
 * Shadow profil sisteminin client-side state'ini yönetir.
 * - Shadow mode aktif/pasif durumu
 * - PIN ayarlanmış mı kontrolü
 * - Session bilgileri
 * - Loading ve error states
 * 
 * Persistence middleware ile localStorage'a kaydedilir.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Shadow State Interface
 * 
 * @property enabled - Shadow mode aktif mi?
 * @property pinSet - PIN ayarlanmış mı?
 * @property sessionId - Aktif session ID'si
 * @property lastToggleAt - Son mode geçişi zamanı
 * @property loading - İşlem devam ediyor mu?
 * @property error - Son hata mesajı
 */
type ShadowState = {
  // State
  enabled: boolean;
  pinSet: boolean;
  sessionId: string | null;
  lastToggleAt: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  toggle: (next?: boolean) => void;
  setPinState: (pinEnabled: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

/**
 * Shadow Store - Zustand with AsyncStorage Persistence
 * 
 * AsyncStorage'a kaydedilen state:
 * - enabled: Shadow mode aktif mi?
 * - pinSet: PIN ayarlanmış mı?
 * - sessionId: Aktif session ID'si
 * 
 * Kaydedilmeyen state (runtime only):
 * - loading: İşlem devam ediyor mu?
 * - error: Son hata mesajı
 * - lastToggleAt: Son mode geçişi zamanı
 */
export const useShadowStore = create<ShadowState>()(
  persist(
    (set) => ({
  // Initial state
  enabled: false,
  pinSet: false,
  sessionId: null,
  lastToggleAt: null,
  loading: false,
  error: null,

  // Actions
  toggle: (next) =>
    set((state) => ({
      enabled: typeof next === "boolean" ? next : !state.enabled,
      lastToggleAt: new Date().toISOString(),
    })),

  setPinState: (pinEnabled) => set({ pinSet: pinEnabled }),

  setSessionId: (sessionId) => set({ sessionId }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      enabled: false,
      pinSet: false,
      sessionId: null,
      lastToggleAt: null,
      loading: false,
      error: null,
    }),
    }),
    {
      name: "shadow-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        pinSet: state.pinSet,
        sessionId: state.sessionId,
      }),
    }
  )
);
