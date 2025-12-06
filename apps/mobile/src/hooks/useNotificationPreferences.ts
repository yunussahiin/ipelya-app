import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

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
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Load preferences from database
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

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
      } else {
        setPreferences(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preferences';
      logger.error('Load preferences error', err, { tag: 'NotificationPrefs' });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      try {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preferences';
        logger.error('Update preferences error', err, { tag: 'NotificationPrefs' });
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
      } catch (err) {
        logger.error('Toggle notification type error', err, { tag: 'NotificationPrefs' });
      }
    },
    [preferences, updatePreferences]
  );

  // Set push notifications enabled/disabled
  const setPushEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await updatePreferences({ push_enabled: enabled });
      } catch (err) {
        logger.error('Set push enabled error', err, { tag: 'NotificationPrefs' });
      }
    },
    [updatePreferences]
  );

  // Set email notifications enabled/disabled
  const setEmailEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await updatePreferences({ email_enabled: enabled });
      } catch (err) {
        logger.error('Set email enabled error', err, { tag: 'NotificationPrefs' });
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
      } catch (err) {
        logger.error('Set quiet hours error', err, { tag: 'NotificationPrefs' });
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
