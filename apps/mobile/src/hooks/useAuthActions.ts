import { useState } from "react";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabaseClient";
import { saveSession, clearSession } from "@/services/secure-store.service";
import { useAuthStore } from "@/store/auth.store";
import { signInWithGoogle, signInWithMagicLink, signInWithApple } from "@/services/oauth.service";
import { logger } from "@/utils/logger";

export function useAuthActions() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSessionStore = useAuthStore((s) => s.clearSession);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.session?.access_token && data.user) {
        await saveSession(data.session.access_token);
        setSession(data.session.access_token);
        
        // Device info güncelle
        const deviceInfo = {
          platform: Device.osName?.toLowerCase() || "unknown",
          model: Device.modelName || "unknown",
          os_version: Device.osVersion || "unknown",
          app_version: Constants.expoConfig?.version || "1.0.0",
          device_id: Constants.deviceId || "unknown"
        };
        
        await supabase
          .from("profiles")
          .update({
            last_device_info: deviceInfo,
            last_login_at: new Date().toISOString()
          })
          .eq("user_id", data.user.id)
          .eq("type", "real");
        
        // Onboarding durumunu kontrol et
        const { data: profileData } = await supabase
          .from("profiles")
          .select("onboarding_step")
          .eq("user_id", data.user.id)
          .eq("type", "real")
          .single();

        const onboardingStep = profileData?.onboarding_step || 0;

        if (onboardingStep < 5) {
          logger.debug(`Onboarding resume: Step ${onboardingStep}`, { tag: "Auth" });
          router.replace(`/(auth)/onboarding?step=${onboardingStep}`);
        } else {
          logger.debug("Onboarding complete", { tag: "Auth" });
          router.replace("/(feed)");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      logger.debug(`Starting signup for: ${email}`, { tag: "Auth" });
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      
      if (authError) {
        logger.error("Auth signup error", authError, { tag: "Auth" });
        throw authError;
      }
      
      logger.debug(`Auth signup successful, user ID: ${data.user?.id}`, { tag: "Auth" });
      
      // Session token'ı kaydet
      if (data.session?.access_token) {
        await saveSession(data.session.access_token);
        setSession(data.session.access_token);
        logger.debug("Session token saved", { tag: "Auth" });
      }
      
      // Kayıt sonrası device info kaydet (trigger otomatik profile oluşturur)
      if (data.user) {
        const deviceInfo = {
          platform: Device.osName?.toLowerCase() || "unknown",
          model: Device.modelName || "unknown",
          os_version: Device.osVersion || "unknown",
          app_version: Constants.expoConfig?.version || "1.0.0",
          device_id: Constants.deviceId || "unknown"
        };
        
        logger.debug("Updating profile with device info", { tag: "Auth" });
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            last_device_info: deviceInfo,
            last_login_at: new Date().toISOString()
          })
          .eq("user_id", data.user.id)
          .eq("type", "real");
        
        if (profileError) {
          logger.warn("Profile update error", { tag: "Auth", data: { error: profileError.message } });
        } else {
          logger.debug("Profile updated successfully", { tag: "Auth" });
        }
      }
      
      logger.debug("Signup complete, redirecting to onboarding", { tag: "Auth" });
      router.replace("/(auth)/onboarding");
    } catch (err) {
      logger.error("Signup error", err, { tag: "Auth" });
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearSession();
    clearSessionStore();
    router.replace("/(auth)/login");
  };

  const signInWithGoogleOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      logger.debug("Google OAuth starting", { tag: "Auth" });
      const session = await signInWithGoogle();
      
      if (session?.access_token && session.user) {
        await saveSession(session.access_token);
        setSession(session.access_token);
        
        // Device info güncelle
        const deviceInfo = {
          platform: Device.osName?.toLowerCase() || "unknown",
          model: Device.modelName || "unknown",
          os_version: Device.osVersion || "unknown",
          app_version: Constants.expoConfig?.version || "1.0.0",
          device_id: Constants.deviceId || "unknown"
        };
        
        await supabase
          .from("profiles")
          .update({
            last_device_info: deviceInfo,
            last_login_at: new Date().toISOString()
          })
          .eq("user_id", session.user.id)
          .eq("type", "real");
        
        logger.debug("Google OAuth successful", { tag: "Auth" });
        router.replace("/home");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Google OAuth hatası";
      logger.error("Google OAuth error", err, { tag: "Auth" });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLinkEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      logger.debug(`Magic link sending to: ${email}`, { tag: "Auth" });
      await signInWithMagicLink(email);
      logger.debug("Magic link sent", { tag: "Auth" });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Magic link hatası";
      logger.error("Magic link error", err, { tag: "Auth" });
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithAppleOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      logger.debug("Apple Sign-In starting", { tag: "Auth" });
      const session = await signInWithApple();
      
      if (session?.access_token && session.user) {
        await saveSession(session.access_token);
        setSession(session.access_token);
        
        // Device info güncelle
        const deviceInfo = {
          platform: Device.osName?.toLowerCase() || "unknown",
          model: Device.modelName || "unknown",
          os_version: Device.osVersion || "unknown",
          app_version: Constants.expoConfig?.version || "1.0.0",
          device_id: Constants.deviceId || "unknown"
        };
        
        await supabase
          .from("profiles")
          .update({
            last_device_info: deviceInfo,
            last_login_at: new Date().toISOString()
          })
          .eq("user_id", session.user.id)
          .eq("type", "real");
        
        logger.debug("Apple Sign-In successful", { tag: "Auth" });
        router.replace("/home");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Apple Sign-In hatası";
      logger.error("Apple Sign-In error", err, { tag: "Auth" });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { 
    signIn, 
    signUp, 
    signOut, 
    signInWithGoogleOAuth,
    signInWithMagicLinkEmail,
    signInWithAppleOAuth,
    isLoading, 
    error, 
    setError 
  };
}
