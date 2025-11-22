import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient";

/**
 * Guard hook - /home'a erişmeden önce onboarding kontrol et
 * Eğer onboarding tamamlanmamışsa onboarding screen'ine yönlendir
 */
export function useOnboardingGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) {
          // User logged out
          router.replace("/(auth)/login");
          return;
        }

        // Check onboarding status
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_step")
          .eq("user_id", user.user.id)
          .eq("type", "real")
          .single();

        if (error) {
          console.error("❌ Onboarding guard hatası:", error);
          return;
        }

        const onboardingStep = profile?.onboarding_step || 0;

        // If onboarding not complete, redirect
        if (onboardingStep < 5) {
          console.log(
            `🔄 Onboarding incomplete (step ${onboardingStep}), redirecting...`
          );
          router.replace(`/(auth)/onboarding?step=${onboardingStep}`);
        }
      } catch (error) {
        console.error("❌ Onboarding guard error:", error);
      }
    };

    checkOnboardingStatus();
  }, [router]);
}
