import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabaseClient';

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

      // 1. Fiziksel cihaz kontrolü
      if (!Device.isDevice) {
        console.warn('⚠️ Simulator detected - push notifications disabled (requires physical device)');
        setLoading(false);
        return;
      }

      console.log('✅ Physical device detected');

      // 2. Permission iste
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('📱 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission denied for push notifications');
      }

      console.log('✅ Permissions granted');

      // 3. Android notification channel oluştur
      if (Device.osName === 'Android') {
        console.log('🤖 Setting up Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        });
        console.log('✅ Android notification channel created');
      }

      // 4. Expo Push Token al
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found in app config');
      }

      console.log('🔑 Getting Expo Push Token...');
      const expoPushToken = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;

      console.log('✅ Expo Push Token:', expoPushToken);
      setToken(expoPushToken);

      // 5. Token'ı Supabase'e kaydet
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('💾 Saving token to database...');
      const { error: dbError } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: user.id,
          token: expoPushToken,
          device_type: Device.osName === 'iOS' ? 'ios' : 'android',
          device_name: Device.modelName,
        });

      if (dbError) throw dbError;

      console.log('✅ Token saved to database');

      // 6. Permission status'unu notification_preferences'a kaydet
      console.log('💾 Saving permission status...');
      const { error: prefError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_enabled: true,
        });

      if (prefError) throw prefError;

      console.log('✅ Permission status saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register device token';
      console.error('❌ Device token error:', message);
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
