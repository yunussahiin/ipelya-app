import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

export interface UseDeviceTokenReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDeviceToken(): UseDeviceTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const registerDeviceToken = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!Device.isDevice) {
        setLoading(false);
        return;
      }

      // 2. Permission iste
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission denied for push notifications');
      }

      if (Device.osName === 'Android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        });
      }

      // 4. Expo Push Token al
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found in app config');
      }

      const expoPushToken = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;

      setToken(expoPushToken);

      // 5. Token'ı Supabase'e kaydet
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: dbError } = await supabase
        .from('device_tokens')
        .upsert(
          {
            user_id: user.id,
            token: expoPushToken,
            device_type: Device.osName === 'iOS' ? 'ios' : 'android',
            device_name: Device.modelName,
            device_model: Device.modelId,
            os_version: Device.osVersion,
            is_active: true,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (dbError) throw dbError;

      const { error: prefError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_enabled: true,
        });

      if (prefError) throw prefError;

      logger.debug('Device token registered', { tag: 'DeviceToken' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register device token';
      logger.error('Device token error', err, { tag: 'DeviceToken' });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    registerDeviceToken();
  }, []);

  return { token, loading, error, refetch: registerDeviceToken };
}
