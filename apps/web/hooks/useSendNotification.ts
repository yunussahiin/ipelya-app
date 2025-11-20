import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export interface SendNotificationPayload {
  type: 'single' | 'bulk' | 'scheduled';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  recipient_id?: string; // For single notifications
  recipient_segment?: string; // For bulk (all, creators, premium, inactive)
  filter?: Record<string, unknown>; // Additional filters for bulk
  scheduled_at?: string; // ISO timestamp for scheduled
}

export interface NotificationCampaign {
  id: string;
  admin_id: string;
  type: 'single' | 'bulk' | 'scheduled';
  title: string;
  body: string;
  data: Record<string, unknown>;
  recipient_segment?: string;
  filter?: Record<string, unknown>;
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface UseSendNotificationReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  campaign: NotificationCampaign | null;
  sendNotification: (payload: SendNotificationPayload) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for sending notifications (Admin-only)
 * Supports single, bulk, and scheduled notifications
 */
export function useSendNotification(): UseSendNotificationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [campaign, setCampaign] = useState<NotificationCampaign | null>(null);

  const sendNotification = useCallback(async (payload: SendNotificationPayload) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const supabase = createBrowserSupabaseClient();

      // Get current user (admin)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      console.log('📤 Sending notification:', payload.type);

      // Validate payload
      if (!payload.title || !payload.body) {
        throw new Error('Title and body are required');
      }

      if (payload.type === 'single' && !payload.recipient_id) {
        throw new Error('recipient_id is required for single notifications');
      }

      if (payload.type === 'bulk' && !payload.recipient_segment) {
        throw new Error('recipient_segment is required for bulk notifications');
      }

      if (payload.type === 'scheduled' && !payload.scheduled_at) {
        throw new Error('scheduled_at is required for scheduled notifications');
      }

      // Create campaign record
      const { data: campaignData, error: campaignError } = await supabase
        .from('notification_campaigns')
        .insert({
          admin_id: user.id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          recipient_segment: payload.recipient_segment,
          filter: payload.filter,
          scheduled_at: payload.scheduled_at,
          status: payload.type === 'scheduled' ? 'scheduled' : 'draft',
          total_recipients: 0,
          sent_count: 0,
          failed_count: 0,
        })
        .select()
        .single();

      if (campaignError) {
        console.error('❌ Campaign creation error:', campaignError);
        throw campaignError;
      }

      console.log('✅ Campaign created:', campaignData.id);

      // For single notifications, insert directly to notifications table
      if (payload.type === 'single' && payload.recipient_id) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            recipient_id: payload.recipient_id,
            actor_id: user.id,
            type: 'admin_notification',
            title: payload.title,
            body: payload.body,
            data: {
              ...payload.data,
              campaign_id: campaignData.id,
            },
          });

        if (notifError) {
          console.error('❌ Notification insert error:', notifError);
          throw notifError;
        }

        // Update campaign status
        const { error: updateError } = await supabase
          .from('notification_campaigns')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            total_recipients: 1,
            sent_count: 1,
          })
          .eq('id', campaignData.id);

        if (updateError) {
          console.error('❌ Campaign update error:', updateError);
          throw updateError;
        }

        console.log('✅ Single notification sent');
      }

      // For bulk/scheduled, they'll be processed by edge functions
      if (payload.type === 'bulk' || payload.type === 'scheduled') {
        console.log(`✅ ${payload.type} notification campaign created (will be processed by edge function)`);
      }

      setCampaign(campaignData);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send notification';
      console.error('❌ Send notification error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setCampaign(null);
  }, []);

  return {
    loading,
    error,
    success,
    campaign,
    sendNotification,
    reset,
  };
}
