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
      console.log("🔍 Biometric availability kontrol ediliyor...");
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log(`📱 Biometric hardware var mı? ${hasHardware}`);
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log(`✅ Biometric kaydedilmiş mi? ${isEnrolled}`);
      
      const available = hasHardware && isEnrolled;
      setBiometricAvailable(available);
      console.log(`✨ Biometric kullanılabilir: ${available}`);
      
      return available;
    } catch (error) {
      console.error("❌ Biometric availability check error:", error);
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

      console.log(`✅ ${profileType} profile fetched`);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch profile";
      setError(message);
      console.error("❌ Get profile error:", error);
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
          console.warn("⚠️ PIN rate limit exceeded:", rateLimitStatus.message);
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
        console.error("❌ PIN verification error:", error);
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
            console.warn('⚠️ User is locked, cannot enable shadow mode');
            return false;
          }
        }

        // PIN doğrulama (biometric bypass)
        if (!biometricVerified && pin) {
          console.log("🔑 PIN doğrulanıyor...");
          const isValid = await verifyShadowPin(pin);
          if (!isValid) {
            throw new Error("Invalid PIN");
          }
        } else if (biometricVerified) {
          console.log("✅ Biometric doğrulama bypass'ı kullanılıyor");
        }

        // Call toggle_shadow_mode function
        console.log("🔄 Shadow mode toggle RPC çağrılıyor...");
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
          // Update local store with session ID from RPC
          useShadowStore.setState({ sessionId: data.session_id });
          console.log(`✅ Session oluşturuldu: ${data.session_id}`);
        } else if (!newState) {
          // Clear local session ID when exiting shadow mode
          useShadowStore.setState({ sessionId: null });
          console.log("📝 Session kapatıldı");
        }

        // Log audit event
        const action = newState ? "shadow_mode_enabled" : "shadow_mode_disabled";
        await logAudit(user.id, action, "real", {
          biometricVerified,
          sessionId: data?.session_id
        });

        console.log(`✅ Shadow mode toggled: ${newState}`);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to toggle shadow mode";
        setError(message);
        console.error("❌ Toggle shadow mode error:", error);
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
      console.log("🔐 Biometric doğrulama başlatılıyor...");
      
      // Check rate limit
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const rateLimitStatus = await checkBiometricRateLimit(user.id);
        if (rateLimitStatus.isLocked) {
          setError(rateLimitStatus.message);
          console.warn("⚠️ Biometric rate limit exceeded:", rateLimitStatus.message);
          return false;
        }
      }

      const available = await checkBiometricAvailability();
      
      if (!available) {
        console.log("ℹ️ Biometric kullanılamıyor → PIN fallback'e geçiliyor");
        return false;
      }

      console.log("👆 Biometric prompt gösteriliyor (Face ID/Touch ID/Fingerprint)");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Shadow profiline geçiş yap",
        fallbackLabel: "PIN kullan",
        disableDeviceFallback: false,
      });

      if (result.success) {
        console.log("✅ Biometric doğrulama başarılı!");
        // Log successful biometric verification
        if (user) {
          await logAudit(user.id, "biometric_verified", "real");
        }
        return true;
      } else {
        console.log(`⚠️ Biometric doğrulama başarısız (reason: ${result.error})`);
        console.log("ℹ️ PIN fallback'e geçiliyor");
        // Log failed biometric attempt
        if (user) {
          await logAudit(user.id, "biometric_failed", "real");
        }
        return false;
      }
    } catch (error) {
      console.error("❌ Biometric doğrulama hatası:", error);
      console.log("ℹ️ PIN fallback'e geçiliyor");
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
