import { useState } from "react";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabaseClient";
import { saveSession, clearSession } from "@/services/secure-store.service";
import { useAuthStore } from "@/store/auth.store";

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
        
        router.replace("/home");
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
      console.log("🔵 Starting signup for:", email);
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      
      if (authError) {
        console.error("❌ Auth signup error:", authError);
        throw authError;
      }
      
      console.log("✅ Auth signup successful, user ID:", data.user?.id);
      
      // Kayıt sonrası device info kaydet (trigger otomatik profile oluşturur)
      if (data.user) {
        const deviceInfo = {
          platform: Device.osName?.toLowerCase() || "unknown",
          model: Device.modelName || "unknown",
          os_version: Device.osVersion || "unknown",
          app_version: Constants.expoConfig?.version || "1.0.0",
          device_id: Constants.deviceId || "unknown"
        };
        
        console.log("⏳ Waiting for trigger to create profile...");
        // Trigger'ın profile oluşturmasını bekle (2 saniye)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("🔄 Updating profile with device info...");
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            last_device_info: deviceInfo,
            last_login_at: new Date().toISOString()
          })
          .eq("user_id", data.user.id)
          .eq("type", "real");
        
        if (profileError) {
          console.error("⚠️ Profile update error:", profileError);
          // Profile update hatası kritik değil, devam et
        } else {
          console.log("✅ Profile updated successfully");
        }
      }
      
      console.log("🎉 Signup complete, redirecting to login");
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("💥 Signup error:", err);
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

  return { signIn, signUp, signOut, isLoading, error, setError };
}
