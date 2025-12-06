/**
 * useShadowMode Hook
 * 
 * Shadow mode sisteminin temel hook'u. Mode geçişi, PIN doğrulama,
 * biometric authentication ve session yönetimi için kullanılır.
 * 
 * Kullanım:
 * ```tsx
 * const { enabled, toggleShadowMode, verifyShadowPin } = useShadowMode();
 * ```
 */

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useShadowStore } from "@/store/shadow.store";
import { verifyPin } from "@/utils/crypto";
import { logAudit } from "@/services/audit.service";
import { checkPinRateLimit, checkBiometricRateLimit } from "@/services/rate-limit.service";
import { isUserLocked, getLockInfo, formatLockDuration } from "@/services/user-lock.service";
import { logger } from "@/utils/logger";
import * as LocalAuthentication from "expo-local-authentication";

/**
 * useShadowMode Hook
 * 
 * @returns {Object} Shadow mode operations
 * @returns {boolean} enabled - Shadow mode aktif mi?
 * @returns {boolean} loading - İşlem devam ediyor mu?
 * @returns {string|null} error - Son hata mesajı
 * @returns {Function} getCurrentProfile - Aktif profili al
 * @returns {Function} verifyShadowPin - PIN doğrula
 * @returns {Function} toggleShadowMode - Mode aç/kapat
 * @returns {Function} verifyBiometric - Biometric doğrula
 */
export function useShadowMode() {
  const { enabled, loading, error, setLoading, setError } = useShadowStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  /**
   * Biometric donanımının kullanılabilir olup olmadığını kontrol et
   */
  const checkBiometricAvailability = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const available = hasHardware && isEnrolled;
      setBiometricAvailable(available);
      logger.debug(`Biometric available: ${available}`, { tag: "Shadow" });
      return available;
    } catch (error) {
      logger.error("Biometric availability check error", error, { tag: "Shadow" });
      setBiometricAvailable(false);
      return false;
    }
  }, []);

  /**
   * Aktif profil bilgisini al (real veya shadow)
   */
  const getCurrentProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const profileType = enabled ? "shadow" : "real";
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", profileType)
        .single();

      if (fetchError) throw fetchError;

      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch profile";
      setError(message);
      logger.error("Get profile error", error, { tag: "Shadow" });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enabled, setLoading, setError]);

  /**
   * Shadow PIN'i doğrula
   * 
   * @param {string} pin - Kullanıcı tarafından girilen PIN
   * @returns {Promise<boolean>} PIN doğru mu?
   */
  const verifyShadowPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Check rate limit
        const rateLimitStatus = await checkPinRateLimit(user.id);
        if (rateLimitStatus.isLocked) {
          setError(rateLimitStatus.message);
          logger.warn("PIN rate limit exceeded", { tag: "Shadow" });
          return false;
        }

        // Get shadow PIN hash from real profile
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("shadow_pin_hash")
          .eq("user_id", user.id)
          .eq("type", "real")
          .single();

        if (fetchError) throw fetchError;
        if (!profile?.shadow_pin_hash) {
          throw new Error("Shadow PIN not set");
        }

        // Verify PIN
        const isValid = await verifyPin(pin, profile.shadow_pin_hash);
        
        if (!isValid) {
          // Log failed attempt
          await logAudit(user.id, "pin_failed", "real");
          
          // Show warning if attempts remaining is low
          if (rateLimitStatus.attemptsRemaining <= 2) {
            setError(rateLimitStatus.message);
          }
        } else {
          // Log successful verification
          await logAudit(user.id, "pin_verified", "real");
        }

        return isValid;
      } catch (error) {
        const message = error instanceof Error ? error.message : "PIN verification failed";
        setError(message);
        logger.error("PIN verification error", error, { tag: "Shadow" });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Shadow mode'u aç/kapat
   * 
   * @param {string} pin - Shadow PIN (boş string ise biometric doğrulanmış demek)
   * @param {boolean} biometricVerified - Biometric ile doğrulandı mı?
   * @returns {Promise<boolean>} Başarılı mı?
   */
  const toggleShadowMode = useCallback(
    async (pin: string, biometricVerified: boolean = false): Promise<boolean> => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Check if user is locked (only when enabling shadow mode)
        if (!enabled) {
          const locked = await isUserLocked();
          if (locked) {
            const lockInfo = await getLockInfo();
            const durationText = lockInfo?.duration 
              ? formatLockDuration(lockInfo.duration)
              : 'kalıcı olarak';
            
            setError(`Hesabınız ${durationText} kilitlenmiştir. Neden: ${lockInfo?.reason}`);
            logger.warn("User is locked, cannot enable shadow mode", { tag: "Shadow" });
            return false;
          }
        }

        // PIN doğrulama (biometric bypass)
        if (!biometricVerified && pin) {
          const isValid = await verifyShadowPin(pin);
          if (!isValid) {
            throw new Error("Invalid PIN");
          }
        }

        const { data, error } = await supabase.rpc("toggle_shadow_mode", {
          p_user_id: user.id,
        });

        if (error) throw error;

        // Update local store
        const newState = !enabled;
        useShadowStore.setState(() => ({
          enabled: newState,
          sessionId: data?.session_id || null,
        }));

        // Session management is handled by toggle_shadow_mode RPC
        // RPC creates session when entering shadow mode
        // RPC ends session when exiting shadow mode
        if (newState && data?.session_id) {
          useShadowStore.setState({ sessionId: data.session_id });
        } else if (!newState) {
          useShadowStore.setState({ sessionId: null });
        }

        // Log audit event
        const action = newState ? "shadow_mode_enabled" : "shadow_mode_disabled";
        await logAudit(user.id, action, "real", {
          biometricVerified,
          sessionId: data?.session_id
        });

        logger.debug(`Shadow mode toggled: ${newState}`, { tag: "Shadow" });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to toggle shadow mode";
        setError(message);
        logger.error("Toggle shadow mode error", error, { tag: "Shadow" });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [enabled, verifyShadowPin, setLoading, setError]
  );

  /**
   * Biometric ile doğrula (simulator'da fallback PIN'e)
   * 
   * @returns {Promise<boolean>} Doğrulama başarılı mı?
   */
  const verifyBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // Check rate limit
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const rateLimitStatus = await checkBiometricRateLimit(user.id);
        if (rateLimitStatus.isLocked) {
          setError(rateLimitStatus.message);
          logger.warn("Biometric rate limit exceeded", { tag: "Shadow" });
          return false;
        }
      }

      const available = await checkBiometricAvailability();
      
      if (!available) return false;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Shadow profiline geçiş yap",
        fallbackLabel: "PIN kullan",
        disableDeviceFallback: false,
      });

      if (result.success) {
        if (user) await logAudit(user.id, "biometric_verified", "real");
        return true;
      } else {
        if (user) await logAudit(user.id, "biometric_failed", "real");
        return false;
      }
    } catch (error) {
      logger.error("Biometric verification error", error, { tag: "Shadow" });
      return false;
    }
  }, [checkBiometricAvailability, setError]);

  return {
    enabled,
    loading,
    error,
    biometricAvailable,
    checkBiometricAvailability,
    getCurrentProfile,
    verifyShadowPin,
    toggleShadowMode,
    verifyBiometric,
  };
}
