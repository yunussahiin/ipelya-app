import { useOnboardingService } from "./useOnboardingService";
import { useAuth } from "./useAuth";
import { logger } from "@/utils/logger";

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
      return;
    }

    try {
      await syncOnboardingProgress(userId, step);
    } catch (error) {
      logger.error('Onboarding sync error', error, { tag: 'Onboarding' });
      throw error;
    }
  };

  return { userId, syncStep };
}
