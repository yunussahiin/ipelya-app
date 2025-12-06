/**
 * useCreatorNotifications Hook
 * Creator için push notification yönetimi
 * 
 * Bu hook realtime events'leri dinler ve kullanıcıya
 * bildirim gösterir (in-app toast veya push notification)
 * 
 * Bildirim Türleri:
 * - new_earning: Yeni kazanç bildirimi
 * - payout_approved: Ödeme onaylandı
 * - payout_paid: Ödeme yapıldı
 * - payout_rejected: Ödeme reddedildi
 * - payment_method_approved: Ödeme yöntemi onaylandı
 * - kyc_approved: KYC onaylandı
 * - kyc_rejected: KYC reddedildi
 */

import { useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui';
import { useCreatorRealtime, type CreatorRealtimeEvent } from './useCreatorRealtime';
import * as Notifications from 'expo-notifications';
import { logger } from '@/utils/logger';

// Notification config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationConfig {
  title: string;
  body: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

function getNotificationConfig(event: CreatorRealtimeEvent): NotificationConfig | null {
  const { type, data } = event;

  switch (type) {
    case 'new_earning':
      if (data.type === 'subscription') {
        return {
          title: '🎉 Yeni Abone!',
          body: `Yeni bir abone kazandın! +${data.amount} coin`,
          type: 'success'
        };
      } else if (data.type === 'gift') {
        return {
          title: '🎁 Hediye Aldın!',
          body: `Bir hayran sana hediye gönderdi! +${data.amount} coin`,
          type: 'success'
        };
      }
      return null;

    case 'payout_status_changed':
      switch (data.status) {
        case 'approved':
          return {
            title: '✓ Ödeme Onaylandı',
            body: `${data.coin_amount} coin çekim talebiniz onaylandı.`,
            type: 'success'
          };
        case 'paid':
          return {
            title: '💰 Ödeme Yapıldı!',
            body: `₺${data.tl_amount?.toLocaleString('tr-TR')} hesabınıza aktarıldı.`,
            type: 'success'
          };
        case 'rejected':
          return {
            title: '❌ Ödeme Reddedildi',
            body: data.rejection_reason || 'Ödeme talebiniz reddedildi.',
            type: 'error'
          };
        default:
          return null;
      }

    case 'payment_method_verified':
      if (data.status === 'approved') {
        return {
          title: '✓ Ödeme Yöntemi Onaylandı',
          body: 'Ödeme yönteminiz başarıyla doğrulandı.',
          type: 'success'
        };
      } else if (data.status === 'rejected') {
        return {
          title: '❌ Ödeme Yöntemi Reddedildi',
          body: 'Ödeme yönteminiz doğrulanamadı.',
          type: 'error'
        };
      }
      return null;

    case 'kyc_status_changed':
      if (data.status === 'approved') {
        return {
          title: '🎉 KYC Onaylandı!',
          body: 'Kimlik doğrulamanız başarıyla tamamlandı. Artık para çekebilirsiniz.',
          type: 'success'
        };
      } else if (data.status === 'rejected') {
        return {
          title: '❌ KYC Reddedildi',
          body: data.rejection_reason || 'Kimlik doğrulamanız reddedildi. Tekrar başvurabilirsiniz.',
          type: 'error'
        };
      }
      return null;

    default:
      return null;
  }
}

interface UseCreatorNotificationsOptions {
  showToasts?: boolean;
  sendPushNotifications?: boolean;
  enabled?: boolean;
}

export function useCreatorNotifications(options: UseCreatorNotificationsOptions = {}) {
  const {
    showToasts = true,
    sendPushNotifications = true,
    enabled = true
  } = options;
  
  const { showToast } = useToast();

  const handleEvent = useCallback(async (event: CreatorRealtimeEvent) => {
    const config = getNotificationConfig(event);
    if (!config) return;

    // Show in-app toast
    if (showToasts) {
      showToast({
        type: config.type,
        message: config.title,
        description: config.body
      });
    }

    // Send push notification (for when app is in background)
    if (sendPushNotifications) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: config.title,
            body: config.body,
            sound: 'default',
            data: { event }
          },
          trigger: null // Immediate notification
        });
      } catch (error) {
        logger.error('Push notification failed', error, { tag: 'Notifications' });
      }
    }
  }, [showToasts, sendPushNotifications, showToast]);

  // Subscribe to realtime events
  const { unsubscribe, isSubscribed } = useCreatorRealtime({
    onAnyEvent: handleEvent,
    enabled
  });

  // Request notification permissions on mount
  useEffect(() => {
    if (!enabled) return;

    async function requestPermissions() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // Permission not granted - silent
      }
    }

    requestPermissions();
  }, [enabled]);

  return {
    unsubscribe,
    isSubscribed
  };
}
