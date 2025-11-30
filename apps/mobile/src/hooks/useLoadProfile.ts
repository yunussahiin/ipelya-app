/**
 * useLoadProfile Hook
 *
 * Kullanıcının profile bilgisini Supabase'den yükleyip store'a kaydeder
 * - App başlangıcında çalıştırılmalı
 * - Real profili yükler (shadow mode'u useShadowMode hook'u yönetir)
 * - Avatar URL'i dahil tüm profil bilgisini yükler
 */

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfileStore } from "@/store/profile.store";

export function useLoadProfile() {
  const setProfile = useProfileStore((s) => s.setProfile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log("ℹ️ No user authenticated");
          return;
        }

        console.log("📥 Loading real profile for user:", user.id);

        // Fetch REAL profile from database
        // Shadow profil useShadowMode hook'u tarafından yönetilir
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .eq("user_id", user.id)
          .eq("type", "real")
          .single();

        if (profileError) {
          console.error("❌ Profile load error:", profileError);
          return;
        }

        if (!profile) {
          console.warn("⚠️ Profile not found");
          return;
        }

        // Log loaded profile
        console.log("✅ Real profile loaded:", {
          id: profile.user_id,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url
        });

        // Set profile in store
        setProfile({
          id: profile.user_id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url
        });

      } catch (error) {
        console.error("❌ useLoadProfile error:", error);
      }
    };

    loadProfile();
  }, [setProfile]);
}
