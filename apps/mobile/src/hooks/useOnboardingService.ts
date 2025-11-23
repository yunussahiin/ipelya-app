import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useOnboardingStore } from "@/store/onboarding.store";

interface OnboardingData {
  step1?: {
    displayName: string;
    bio: string;
    gender: string;
  };
  step2?: {
    mood: string;
    personality: string;
    energy: string;
  };
  step3?: {
    shadowPin: string;
    biometricEnabled: boolean;
    biometricType?: string;
  };
  step4?: {
    tosAccepted: boolean;
    privacyAccepted: boolean;
    antiScreenshotAccepted: boolean;
    firewallAccepted: boolean;
  };
}

export function useOnboardingService() {
  const { step1, step2, step3, step4 } = useOnboardingStore();

  /**
   * Onboarding progress'i Supabase'e kaydet
   */
  const syncOnboardingProgress = useCallback(
    async (userId: string, step: number) => {
      try {
        const onboardingData: OnboardingData = {};

        if (step >= 1) {
          onboardingData.step1 = {
            displayName: step1.displayName,
            bio: step1.bio,
            gender: step1.gender || "belirtmek-istemiyorum",
          };
        }

        if (step >= 2) {
          onboardingData.step2 = {
            mood: step2.mood || "",
            personality: step2.personality || "",
            energy: step2.energy || "",
          };
        }

        if (step >= 3) {
          onboardingData.step3 = {
            shadowPin: step3.shadowPin ? "***" : "", // PIN'i kaydetme, sadece flag
            biometricEnabled: step3.biometricEnabled,
            biometricType: step3.biometricType || undefined,
          };
        }

        if (step >= 4) {
          onboardingData.step4 = {
            tosAccepted: step4.tosAccepted,
            privacyAccepted: step4.privacyAccepted,
            antiScreenshotAccepted: step4.antiScreenshotAccepted,
            firewallAccepted: step4.firewallAccepted,
          };
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            onboarding_step: step,
            onboarding_data: onboardingData,
          })
          .eq("user_id", userId)
          .eq("type", "real");

        if (error) {
          console.error("❌ Onboarding sync hatası:", error);
          throw error;
        }

        console.log(`✅ Onboarding Step ${step} kaydedildi`);
      } catch (error) {
        console.error("❌ Onboarding sync başarısız:", error);
        throw error;
      }
    },
    [step1, step2, step3, step4]
  );

  /**
   * Supabase'den onboarding progress'i yükle
   */
  const loadOnboardingProgress = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_step, onboarding_data")
          .eq("user_id", userId)
          .eq("type", "real")
          .single();

        if (error) {
          console.error("❌ Onboarding yükleme hatası:", error);
          return null;
        }

        console.log(`✅ Onboarding Step ${data?.onboarding_step} yüklendi`);
        return {
          step: data?.onboarding_step || 0,
          data: data?.onboarding_data || {},
        };
      } catch (error) {
        console.error("❌ Onboarding yükleme başarısız:", error);
        return null;
      }
    },
    []
  );

  /**
   * Onboarding'i tamamla ve shadow profile'ı activate et
   */
  const completeOnboarding = useCallback(
    async (userId: string) => {
      try {
        // Get current profile to extract onboarding_data
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("onboarding_data")
          .eq("user_id", userId)
          .eq("type", "real")
          .single();

        if (fetchError) throw fetchError;

        // Extract data from onboarding_data
        const displayName = profile?.onboarding_data?.step1?.displayName || null;
        const bio = profile?.onboarding_data?.step1?.bio || null;
        
        // Map Turkish gender to database values
        const genderMap: Record<string, string | null> = {
          "erkek": "male",
          "kadın": "female",
          "non-binary": "lgbt",
          "genderqueer": "lgbt",
          "agender": null,
          "belirtmek-istemiyorum": null
        };
        const rawGender = profile?.onboarding_data?.step1?.gender || null;
        const gender = rawGender ? genderMap[rawGender] : null;

        // Extract biometric data from Step 3
        const biometricEnabled = profile?.onboarding_data?.step3?.biometricEnabled || false;
        const biometricType = profile?.onboarding_data?.step3?.biometricType || null;

        // Extract policy acceptance data from Step 4
        const now = new Date().toISOString();
        const tosAccepted = profile?.onboarding_data?.step4?.tosAccepted;
        const privacyAccepted = profile?.onboarding_data?.step4?.privacyAccepted;
        const antiScreenshotAccepted = profile?.onboarding_data?.step4?.antiScreenshotAccepted;
        const firewallAccepted = profile?.onboarding_data?.step4?.firewallAccepted;

        // Step 1: Onboarding'i tamamla ve profile data'sını güncelle
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            onboarding_step: 5,
            shadow_profile_active: true,
            is_active: true,
            display_name: displayName,
            bio: bio,
            gender: gender,
            biometric_enabled: biometricEnabled,
            biometric_type: biometricType,
            tos_accepted_at: tosAccepted ? now : null,
            privacy_accepted_at: privacyAccepted ? now : null,
            anti_screenshot_accepted_at: antiScreenshotAccepted ? now : null,
            firewall_accepted_at: firewallAccepted ? now : null,
            onboarding_completed_at: now,
            updated_at: now,
          })
          .eq("user_id", userId)
          .eq("type", "real");

        if (updateError) throw updateError;

        // Step 2: Shadow profile'ı oluştur veya activate et
        // Shadow profile trigger tarafından otomatik oluşturulmuş
        // Trigger'ın oluşturduğu shadow profile'ı doğrula
        const { data: shadowProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "shadow")
          .maybeSingle();

        if (!shadowProfile) {
          console.warn("⚠️ Shadow profile trigger tarafından oluşturulmadı, manuel oluştur");
          // Fallback: Shadow profile yok ise manuel oluştur
          const { error: shadowCreateError } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              type: "shadow",
              username: `shadow_${userId.substring(0, 8)}`,
              is_active: true,
              role: "user",
            });

          if (shadowCreateError) {
            console.warn("⚠️ Shadow profile oluşturma hatası:", shadowCreateError);
          } else {
            console.log("✅ Shadow profile manuel olarak oluşturuldu");
          }
        } else {
          console.log("✅ Shadow profile trigger tarafından oluşturulmuş");
        }

        console.log("✅ Onboarding tamamlandı, shadow profile hazır");
      } catch (error) {
        console.error("❌ Onboarding tamamlama hatası:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Shadow PIN'i hash'le ve kaydet (real profile'a kaydet)
   */
  const saveShadowPin = useCallback(
    async (userId: string, hashedPin: string) => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            shadow_pin_hash: hashedPin,
            shadow_pin_created_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("type", "real");

        if (error) throw error;

        console.log("✅ Shadow PIN kaydedildi");
      } catch (error) {
        console.error("❌ Shadow PIN kaydetme hatası:", error);
        throw error;
      }
    },
    []
  );

  return {
    syncOnboardingProgress,
    loadOnboardingProgress,
    completeOnboarding,
    saveShadowPin,
  };
}
