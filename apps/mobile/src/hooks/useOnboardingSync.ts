import { useOnboardingService } from "./useOnboardingService";
import { useAuth } from "./useAuth";

/**
 * Custom hook for syncing onboarding progress to database
 * Uses global auth store for user ID
 */
export function useOnboardingSync() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const { syncOnboardingProgress } = useOnboardingService();

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
