import { useEffect, useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id?: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

/**
 * Hook for managing notifications with real-time updates
 * Fetches notifications, listens for new ones, and provides actions
 * Copied from mobile with web-specific Supabase client
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createBrowserSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      console.log('📥 Loading notifications for user:', user.id);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);

      // Calculate unread count
      const unread = (data || []).filter((n) => !n.read).length;
      setUnreadCount(unread);

      console.log('✅ Loaded', data?.length || 0, 'notifications');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('❌ Load notifications error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time listener
  useEffect(() => {
    loadNotifications();

    let retryCount = 0;
    const maxRetries = 3;

    const setupSubscription = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('🔗 Setting up realtime subscription for user:', user.id);

        // Subscribe to new notifications
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
              console.log('📬 New notification received:', newNotification);

              // Add to beginning of list
              setNotifications((prev) => [newNotification, ...prev]);
              setUnreadCount((prev) => prev + 1);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime subscription active');
              retryCount = 0;
            } else if (status === 'CHANNEL_ERROR') {
              if (retryCount < maxRetries) {
                retryCount++;
                console.warn(`⚠️ Realtime subscription error (retry ${retryCount}/${maxRetries})`);
                setTimeout(setupSubscription, 1000 * retryCount);
              } else {
                console.warn('⚠️ Realtime subscription failed after retries');
              }
            }
          });

        return () => {
          channel.unsubscribe();
        };
      } catch (err) {
        console.error('❌ Subscription setup error:', err);
      }
    };

    setupSubscription();
  }, [loadNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const supabase = createBrowserSupabaseClient();

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
      console.log('✅ Marked notification as read:', notificationId);
    } catch (err) {
      console.error('❌ Mark as read error:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const supabase = createBrowserSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      console.log('✅ Marked all notifications as read');
    } catch (err) {
      console.error('❌ Mark all as read error:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const supabase = createBrowserSupabaseClient();

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) throw deleteError;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      console.log('✅ Deleted notification:', notificationId);
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
