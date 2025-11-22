import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useOnboardingService } from "./useOnboardingService";

/**
 * Custom hook for syncing onboarding progress to database
 * Handles user ID retrieval and sync logic
 */
export function useOnboardingSync() {
  const [userId, setUserId] = useState<string | null>(null);
  const { syncOnboardingProgress } = useOnboardingService();

  // Get current user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  /**
   * Sync current step to database
   */
  const syncStep = async (step: number) => {
    if (!userId) {
      console.warn("⚠️ User ID not available for sync");
      return;
    }

    try {
      await syncOnboardingProgress(userId, step);
    } catch (error) {
      console.error(`❌ Step ${step} sync hatası:`, error);
      throw error;
    }
  };

  return { userId, syncStep };
}
