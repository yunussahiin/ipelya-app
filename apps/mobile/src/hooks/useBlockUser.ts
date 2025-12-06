/**
 * useBlockUser Hook
 * Block and unblock users
 */

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export interface UseBlockUserReturn {
  blocking: boolean;
  error: string | null;
  blockUser: (userId: string, reason?: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useBlockUser(): UseBlockUserReturn {
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockUser = useCallback(
    async (userId: string, reason?: string): Promise<boolean> => {
      setBlocking(true);
      setError(null);
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          throw new Error("Authenticated user not found");
        }
        const user = data.user;

        // 1. Engelleme kaydını ekle
        const { error: blockError } = await supabase.from("blocked_users").insert({
          blocker_id: user.id,
          blocked_id: userId,
          reason: reason || null
        });

        if (blockError) {
          throw blockError;
        }

        // 2. Engellenen kullanıcıyı takipten çıkar (varsa)
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);

        // 3. Engellenen kullanıcının takipçisini sil (varsa)
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", userId)
          .eq("following_id", user.id);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to block user";
        logger.error('Block error', err, { tag: 'BlockUser' });
        setError(message);
        return false;
      } finally {
        setBlocking(false);
      }
    },
    []
  );

  const unblockUser = useCallback(
    async (userId: string): Promise<boolean> => {
      setBlocking(true);
      setError(null);
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          throw new Error("Authenticated user not found");
        }
        const user = data.user;

        const { error: unblockError } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", userId);

        if (unblockError) {
          throw unblockError;
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to unblock user";
        logger.error('Unblock error', err, { tag: 'BlockUser' });
        setError(message);
        return false;
      } finally {
        setBlocking(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    blocking,
    error,
    blockUser,
    unblockUser,
    clearError
  };
}
