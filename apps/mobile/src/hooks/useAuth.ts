/**
 * useAuth Hook
 *
 * Amaç: Kullanıcı authentication durumunu yönetmek
 * Tarih: 2025-11-26
 *
 * Zustand store ile global auth state - tüm component'lerde aynı user
 */

import { useEffect } from "react";
import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// Global auth store - tüm component'lerde aynı state
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Auth listener'ı bir kez başlat
let authListenerInitialized = false;

function initAuthListener() {
  if (authListenerInitialized) return;
  authListenerInitialized = true;

  // Mevcut session'ı al
  supabase.auth.getUser().then(({ data: { user } }) => {
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setLoading(false);
  }).catch((error) => {
    console.error("[useAuth] Session alınamadı:", error);
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setLoading(false);
  });

  // Auth state değişikliklerini dinle
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(session?.user ?? null);
    useAuthStore.getState().setLoading(false);
  });
}

/**
 * Kullanıcı authentication durumunu yönetir
 * Zustand store kullanır - tüm component'lerde aynı user
 */
export function useAuth() {
  const { user, isLoading, isAuthenticated } = useAuthStore();

  // İlk kullanımda listener'ı başlat
  useEffect(() => {
    initAuthListener();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Sadece user ID'yi döndürür (performans için)
 */
export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}
