import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export interface NotificationData {
  type: string;
  actor_id?: string;
  actor_name?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Hook for listening to incoming notifications and handling user interactions
 * Sets up notification handler, foreground listener, and response listener
 * Handles deep linking based on notification data
 */
export function useNotificationListener(): void {
  useEffect(() => {
    // 1. Configure notification handler (how to display notifications in foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    console.log('✅ Notification handler configured');

    // 2. Listen for notifications received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received (foreground):', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
      }
    );

    // 3. Listen for user interactions with notifications (tap)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as NotificationData;
        console.log('👆 Notification tapped:', data);

        // Handle deep linking based on notification type
        handleNotificationDeepLink(data);
      });

    // 4. Check for last notification (app opened from notification)
    const checkLastNotification = async () => {
      const lastNotification = Notifications.getLastNotificationResponse();
      if (lastNotification) {
        console.log('📬 App opened from notification:', lastNotification);
        const data = lastNotification.notification.request.content
          .data as NotificationData;
        handleNotificationDeepLink(data);
      }
    };

    checkLastNotification();

    // Cleanup
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
}

/**
 * Handle deep linking based on notification type and data
 */
function handleNotificationDeepLink(data: NotificationData): void {
  try {
    // Priority 1: Use custom URL if provided
    if (data.url) {
      console.log('🔗 Deep linking to:', data.url);
      router.push(data.url);
      return;
    }

    // Priority 2: Handle based on notification type
    switch (data.type) {
      case 'new_follower':
      case 'follow_back':
        if (data.actor_id) {
          console.log('🔗 Opening profile:', data.actor_id);
          router.push(`/(profile)/${data.actor_id}`);
        }
        break;

      case 'new_message':
      case 'message_like':
      case 'message_reply':
        if (data.actor_id) {
          console.log('🔗 Opening messages:', data.actor_id);
          router.push(`/messages/${data.actor_id}`);
        }
        break;

      case 'content_like':
      case 'content_comment':
      case 'content_share':
        if (data.content_id) {
          console.log('🔗 Opening content:', data.content_id);
          router.push(`/content/${data.content_id}`);
        }
        break;

      case 'security_alert':
        console.log('🔗 Opening security settings');
        router.push('/(settings)/security');
        break;

      case 'system_alert':
        if (data.action_url && typeof data.action_url === 'string') {
          console.log('🔗 Opening system alert:', data.action_url);
          router.push(data.action_url);
        }
        break;

      default:
        console.log('ℹ️ No deep link handler for notification type:', data.type);
    }
  } catch (err) {
    console.error('❌ Error handling notification deep link:', err);
  }
}
