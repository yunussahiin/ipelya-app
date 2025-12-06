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
import { logger } from "@/utils/logger";

export function useLoadProfile() {
  const setProfile = useProfileStore((s) => s.setProfile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          return;
        }

        // Fetch REAL profile from database
        // Shadow profil useShadowMode hook'u tarafından yönetilir
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .eq("user_id", user.id)
          .eq("type", "real")
          .single();

        if (profileError) {
          logger.error('Profile load error', profileError, { tag: 'Profile' });
          return;
        }

        if (!profile) return;
        setProfile({
          id: profile.user_id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url
        });

      } catch (error) {
        logger.error('useLoadProfile error', error, { tag: 'Profile' });
      }
    };

    loadProfile();
  }, [setProfile]);
}
