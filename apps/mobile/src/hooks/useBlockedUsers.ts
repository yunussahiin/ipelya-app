/**
 * useBlockedUsers Hook
 * Fetch and manage blocked users list
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export interface BlockedUser {
  id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  blocked_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export interface UseBlockedUsersReturn {
  blockedUsers: BlockedUser[];
  loading: boolean;
  error: string | null;
  isUserBlocked: (userId: string) => boolean;
  loadBlockedUsers: () => Promise<void>;
  clearError: () => void;
}

export function useBlockedUsers(): UseBlockedUsersReturn {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error(`Auth error: ${authError?.message || "No user found"}`);
      }
      const user = authData.user;

      const { data, error: fetchError } = await supabase
        .from("blocked_users")
        .select(
          `
          id,
          blocked_id,
          reason,
          created_at
        `
        )
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });

      // Engellenen kullanıcıların profil bilgilerini ayrı sorguyla çek
      if (data && data.length > 0) {
        const blockedIds = data.map((item) => item.blocked_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, username")
          .in("user_id", blockedIds);

        if (profilesError) {
          throw profilesError;
        }

        // Profil verilerini engellenenler listesiyle birleştir
        const enrichedData = data.map((blocked) => ({
          ...blocked,
          blocked_profile: profilesData?.find((p) => p.user_id === blocked.blocked_id)
        }));

        setBlockedUsers((enrichedData as unknown as BlockedUser[]) || []);
        return;
      }

      if (fetchError) throw fetchError;

      setBlockedUsers([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load blocked users";
      logger.error('Load blocked users error', err, { tag: 'BlockedUsers' });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const isUserBlocked = useCallback(
    (userId: string): boolean => {
      return blockedUsers.some((block) => block.blocked_id === userId);
    },
    [blockedUsers]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load blocked users on mount
  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  return {
    blockedUsers,
    loading,
    error,
    isUserBlocked,
    loadBlockedUsers,
    clearError
  };
}
