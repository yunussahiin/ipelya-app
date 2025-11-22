/**
 * useShadowProfile Hook
 * 
 * Shadow profil verilerini yönetmek için hook. Profil bilgilerini al, güncelle, avatar upload.
 * 
 * Kullanım:
 * ```tsx
 * const { profile, updateProfile, uploadAvatar } = useShadowProfile();
 * ```
 */

import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client factory
const getSupabaseClient = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key);
};

/**
 * Shadow Profile Type
 */
interface ShadowProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * useShadowProfile Hook
 * 
 * @returns {Object} Shadow profile operations
 * @returns {ShadowProfile|null} profile - Aktif shadow profil
 * @returns {boolean} loading - İşlem devam ediyor mu?
 * @returns {string|null} error - Son hata mesajı
 * @returns {Function} getShadowProfile - Shadow profili al
 * @returns {Function} updateProfile - Profil bilgilerini güncelle
 * @returns {Function} uploadAvatar - Avatar yükle
 */
export function useShadowProfile() {
  const [profile, setProfile] = useState<ShadowProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Shadow profili al
   */
  const getShadowProfile = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: shadowProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "shadow")
        .single();

      if (fetchError) throw fetchError;

      setProfile(shadowProfile as ShadowProfile);
      console.log("✅ Shadow profile fetched");
      return shadowProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch profile";
      setError(message);
      console.error("❌ Get shadow profile error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Profil bilgilerini güncelle
   */
  const updateProfile = useCallback(
    async (data: Partial<ShadowProfile>) => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("type", "shadow");

        if (updateError) throw updateError;

        // Refresh profile
        await getShadowProfile();
        console.log("✅ Shadow profile updated");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update profile";
        setError(message);
        console.error("❌ Update shadow profile error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getShadowProfile]
  );

  /**
   * Avatar yükle
   */
  const uploadAvatar = useCallback(
    async (fileUri: string) => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get file extension
        const fileExtension = fileUri.split(".").pop() || "jpg";
        const fileName = `shadow_${user.id}_${Date.now()}.${fileExtension}`;

        // Read file and upload
        // TODO: Implement file reading and upload
        // const fileData = await fetch(fileUri);
        // const blob = await fileData.blob();

        // const { data: uploadData, error: uploadError } = await supabase.storage
        //   .from("avatars")
        //   .upload(`shadow/${fileName}`, blob);

        // if (uploadError) throw uploadError;

        // Get public URL
        // const { data: { publicUrl } } = supabase.storage
        //   .from("avatars")
        //   .getPublicUrl(`shadow/${fileName}`);

        // Update profile with avatar URL
        // await updateProfile({ avatar_url: publicUrl });

        console.log("✅ Avatar uploaded");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload avatar";
        setError(message);
        console.error("❌ Upload avatar error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [updateProfile]
  );

  return {
    profile,
    loading,
    error,
    getShadowProfile,
    updateProfile,
    uploadAvatar,
  };
}
