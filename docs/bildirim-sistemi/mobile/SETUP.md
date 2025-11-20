# Mobile - Push Notifications Setup 📱

## 1. Paket Kurulumu

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Paketlerin Görevleri

| Paket                | Görev                             |
| -------------------- | --------------------------------- |
| `expo-notifications` | Token alma, notification handling |
| `expo-device`        | Fiziksel cihaz kontrolü           |
| `expo-constants`     | projectId alma                    |

## 2. app.json Konfigürasyonu

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "defaultChannel": "default",
          "sounds": [
            "./assets/notification-sound.wav"
          ],
          "enableBackgroundRemoteNotifications": true
        }
      ]
    ]
  }
}
```

## 3. EAS Credentials Setup

```bash
# Credentials'ı setup et
eas credentials

# Development build oluştur
eas build:dev --platform ios
eas build:dev --platform android
```

### Android (FCM) Setup

1. Firebase Console'a git
2. Project oluştur
3. Android app ekle
4. `google-services.json` indir
5. EAS'e upload et

### iOS (APNs) Setup

1. Apple Developer Account
2. Push Notifications capability ekle
3. Certificate oluştur
4. EAS'e upload et

## 4. Hooks Implementasyonu

### useDeviceToken Hook

```typescript
// apps/mobile/src/hooks/useDeviceToken.ts

import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabaseClient';

export function useDeviceToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerDeviceToken();
  }, []);

  async function registerDeviceToken() {
    try {
      setLoading(true);
      setError(null);

      // 1. Fiziksel cihaz kontrolü
      if (!Device.isDevice) {
        throw new Error('Push notifications require a physical device');
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

      // 3. Android notification channel oluştur
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
        throw new Error('Project ID not found');
      }

      const expoPushToken = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;

      console.log('✅ Expo Push Token:', expoPushToken);
      setToken(expoPushToken);

      // 5. Token'ı Supabase'e kaydet
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('device_tokens').upsert({
          user_id: user.id,
          token: expoPushToken,
          device_type: Device.osName === 'iOS' ? 'ios' : 'android',
          device_name: Device.modelName,
        });

        console.log('✅ Token saved to database');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register device token';
      console.error('❌ Device token error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return { token, loading, error, refetch: registerDeviceToken };
}
```

### useNotificationListener Hook

```typescript
// apps/mobile/src/hooks/useNotificationListener.ts

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export interface NotificationData {
  type: string;
  actor_id?: string;
  actor_name?: string;
  url?: string;
  [key: string]: any;
}

export function useNotificationListener() {
  useEffect(() => {
    // 1. Notification handler setup
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // 2. Foreground notification listener
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
        // UI update, badge update vb.
      }
    );

    // 3. Notification response listener (tıklandığında)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as NotificationData;
        console.log('👆 Notification tapped:', data);

        // Deep link handle
        if (data.url) {
          router.push(data.url);
        }

        // Notification type'a göre action
        switch (data.type) {
          case 'new_follower':
            router.push(`/(profile)/${data.actor_id}`);
            break;
          case 'new_message':
            router.push(`/messages/${data.actor_id}`);
            break;
          default:
            break;
        }
      });

    // 4. Last notification check (app açılırken)
    const lastNotification = Notifications.getLastNotificationResponse();
    if (lastNotification) {
      const data = lastNotification.notification.request.content.data as NotificationData;
      if (data.url) {
        router.push(data.url);
      }
    }

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
}
```

### useNotifications Hook

```typescript
// apps/mobile/src/hooks/useNotifications.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id?: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bildirimleri yükle
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);

      // Okunmamış sayısını hesapla
      const unread = (data || []).filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('❌ Load notifications error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime listener setup
  useEffect(() => {
    loadNotifications();

    const {
      data: { user },
    } = supabase.auth.getUser();

    if (!user) return;

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          console.log('📬 New notification:', newNotification);

          // Başa ekle
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [loadNotifications]);

  // Bildirim okundu olarak işaretle
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Local state update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('❌ Mark as read error:', err);
    }
  }, []);

  // Tümünü okundu olarak işaretle
  const markAllAsRead = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Local state update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('❌ Mark all as read error:', err);
    }
  }, []);

  // Bildirim sil
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('❌ Delete notification error:', err);
    }
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
```

## 5. App Root Layout'a Entegre Etme

```typescript
// apps/mobile/app/_layout.tsx

import { useDeviceToken } from '@/hooks/useDeviceToken';
import { useNotificationListener } from '@/hooks/useNotificationListener';

export default function RootLayout() {
  // Device token setup
  useDeviceToken();

  // Notification listener setup
  useNotificationListener();

  return (
    // ... layout content
  );
}
```

## 6. Notification Preferences

```typescript
// apps/mobile/src/hooks/useNotificationPreferences.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  notification_types: Record<string, boolean>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setPreferences(
        data || {
          push_enabled: true,
          email_enabled: false,
          notification_types: {},
        }
      );
    } catch (err) {
      console.error('❌ Load preferences error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updatePreferences(updates: Partial<NotificationPreferences>) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          ...updates,
        });

      if (error) throw error;

      setPreferences((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error('❌ Update preferences error:', err);
    }
  }

  return { preferences, loading, updatePreferences };
}
```

## Sonraki Adımlar

1. ✅ Database schema oluştur
2. ✅ RLS policies ekle
3. ✅ Components oluştur
4. ✅ Edge Functions oluştur
5. ✅ Messaging system entegre et
