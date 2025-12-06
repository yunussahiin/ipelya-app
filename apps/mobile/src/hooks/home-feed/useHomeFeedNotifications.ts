/**
 * useHomeFeedNotifications Hook
 * 
 * Amaç: Home Feed notification'larını dinler (mention, like, comment)
 * 
 * Özellikler:
 * - Mevcut notification system ile entegrasyon
 * - Mention notifications
 * - Like notifications
 * - Comment notifications
 * - Crystal gift notifications
 * 
 * Kullanım:
 * useHomeFeedNotifications(userId);
 * 
 * Not: Mevcut notification system'i kullanır (notifications table)
 * Sadece home feed'e özel notification type'ları filtreler
 */

import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

/**
 * Home Feed Notification Types
 * Mevcut notification system'deki type'lar
 */
const HOME_FEED_NOTIFICATION_TYPES = [
  'mention',           // @username mention
  'content_like',      // Post beğeni
  'content_comment',   // Post yorum
  'content_share',     // Post paylaşım
  'crystal_gift',      // Dijital hediye
];

export function useHomeFeedNotifications(
  userId: string,
  onNotification?: (notification: any) => void
) {
  useEffect(() => {
    if (!userId) return;
    
    // Mevcut notification channel'ı kullan
    // (notifications table'a INSERT event'i dinle)
    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new;
          
          // Sadece home feed notification'larını işle
          if (HOME_FEED_NOTIFICATION_TYPES.includes(notification.type)) {
            if (onNotification) {
              onNotification(notification);
            }
          }
        }
      )
      .subscribe();
    
    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [userId, onNotification]);
}
