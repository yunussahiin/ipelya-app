import { useEffect, useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  notification_types: Record<string, boolean>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  toggleNotificationType: (type: string, enabled: boolean) => Promise<void>;
  setPushEnabled: (enabled: boolean) => Promise<void>;
  setEmailEnabled: (enabled: boolean) => Promise<void>;
  setQuietHours: (start?: string, end?: string) => Promise<void>;
}

/**
 * Hook for managing user notification preferences
 * Allows users to customize notification settings
 * Copied from mobile with web-specific Supabase client
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from database
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createBrowserSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      console.log('📥 Loading notification preferences for user:', user.id);

      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If no preferences exist, create default ones
      if (!data) {
        console.log('📝 Creating default preferences');
        const defaultPrefs: NotificationPreferences = {
          user_id: user.id,
          push_enabled: true,
          email_enabled: false,
          notification_types: {
            new_follower: true,
            follow_back: true,
            profile_mention: true,
            user_blocked: false,
            new_message: true,
            message_like: false,
            message_reply: true,
            typing_indicator: false,
            content_like: false,
            content_comment: true,
            content_share: false,
            content_update: true,
            system_alert: true,
            maintenance: true,
            security_alert: true,
            account_activity: true,
          },
        };

        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs);

        if (insertError) throw insertError;

        setPreferences(defaultPrefs);
        console.log('✅ Default preferences created');
      } else {
        setPreferences(data);
        console.log('✅ Preferences loaded');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preferences';
      console.error('❌ Load preferences error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      try {
        const supabase = createBrowserSupabaseClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { error: updateError } = await supabase
          .from('notification_preferences')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        setPreferences((prev) =>
          prev ? { ...prev, ...updates } : null
        );

        console.log('✅ Preferences updated');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preferences';
        console.error('❌ Update preferences error:', message);
        setError(message);
      }
    },
    []
  );

  // Toggle specific notification type
  const toggleNotificationType = useCallback(
    async (type: string, enabled: boolean) => {
      try {
        if (!preferences) throw new Error('Preferences not loaded');

        const updatedTypes = {
          ...preferences.notification_types,
          [type]: enabled,
        };

        await updatePreferences({
          notification_types: updatedTypes,
        });

        console.log(`✅ Toggled ${type} to ${enabled}`);
      } catch (err) {
        console.error('❌ Toggle notification type error:', err);
      }
    },
    [preferences, updatePreferences]
  );

  // Set push notifications enabled/disabled
  const setPushEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await updatePreferences({ push_enabled: enabled });
        console.log(`✅ Push notifications ${enabled ? 'enabled' : 'disabled'}`);
      } catch (err) {
        console.error('❌ Set push enabled error:', err);
      }
    },
    [updatePreferences]
  );

  // Set email notifications enabled/disabled
  const setEmailEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await updatePreferences({ email_enabled: enabled });
        console.log(`✅ Email notifications ${enabled ? 'enabled' : 'disabled'}`);
      } catch (err) {
        console.error('❌ Set email enabled error:', err);
      }
    },
    [updatePreferences]
  );

  // Set quiet hours
  const setQuietHours = useCallback(
    async (start?: string, end?: string) => {
      try {
        await updatePreferences({
          quiet_hours_start: start,
          quiet_hours_end: end,
        });
        console.log(`✅ Quiet hours set to ${start} - ${end}`);
      } catch (err) {
        console.error('❌ Set quiet hours error:', err);
      }
    },
    [updatePreferences]
  );

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    toggleNotificationType,
    setPushEnabled,
    setEmailEnabled,
    setQuietHours,
  };
}
