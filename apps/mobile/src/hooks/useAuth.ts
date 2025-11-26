/**
 * useAuth Hook
 *
 * Amaç: Kullanıcı authentication durumunu yönetmek
 * Tarih: 2025-11-26
 *
 * Supabase auth state'ini dinler ve user bilgisini sağlar.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Kullanıcı authentication durumunu yönetir
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mevcut session'ı al
    const getInitialSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("[useAuth] Session alınamadı:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

/**
 * Sadece user ID'yi döndürür (performans için)
 */
export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}
