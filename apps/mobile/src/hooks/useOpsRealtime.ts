/**
 * useOpsRealtime Hook
 * 
 * Listens for Web-Ops to Mobile communication via Supabase Broadcast
 * Handles session termination, user lockout, config updates, and anomaly alerts
 */

import { useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { useShadowStore } from '@/store/shadow.store';
import { endSession } from '@/services/session.service';
import { logAudit } from '@/services/audit.service';
import {
  updateRateLimitConfigDynamic,
  RateLimitConfig,
} from '@/services/rate-limit.service';
import {
  updateAnomalyConfig,
  AnomalyDetectionConfig,
} from '@/services/anomaly-detection.service';

/**
 * Setup realtime listener for ops commands from web-ops
 * 
 * @param userId - Current user ID
 */
export function useOpsRealtime(userId: string | undefined) {
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ useOpsRealtime: userId not available');
      return;
    }

    console.log('🔗 Setting up realtime listener for ops commands...');

    // Subscribe to ops broadcast channel
    const channel = supabase.channel(`ops:user:${userId}`);

    channel
      .on(
        'broadcast',
        { event: 'session_terminated' },
        async (payload) => {
          console.log('📡 Received: session_terminated', JSON.stringify(payload, null, 2));
          console.log('📡 Payload structure:', { 
            hasPayload: !!payload.payload, 
            keys: Object.keys(payload) 
          });
          await handleSessionTerminated(payload.payload as Record<string, unknown>, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'user_locked' },
        (payload) => {
          console.log('📡 Received: user_locked', payload);
          handleUserLocked(payload.payload as Record<string, unknown>, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'user_unlocked' },
        (payload) => {
          console.log('📡 Received: user_unlocked', payload);
          handleUserUnlocked(payload.payload as Record<string, unknown>, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'rate_limit_config_updated' },
        (payload) => {
          console.log('📡 Received: rate_limit_config_updated', payload);
          handleRateLimitConfigUpdated(payload.payload as Record<string, unknown>);
        }
      )
      .on(
        'broadcast',
        { event: 'anomaly_detection_config_updated' },
        (payload) => {
          console.log('📡 Received: anomaly_detection_config_updated', payload);
          handleAnomalyConfigUpdated(payload.payload as Record<string, unknown>);
        }
      )
      .on(
        'broadcast',
        { event: 'anomaly_alert' },
        (payload) => {
          console.log('📡 Received: anomaly_alert', payload);
          handleAnomalyAlert(payload.payload as Record<string, unknown>);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime listener connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime listener error');
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime listener disconnected');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from realtime listener...');
      channel.unsubscribe();
    };
  }, [userId]);
}

/**
 * Handle session termination by ops
 */
async function handleSessionTerminated(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    const sessionId = (payload.sessionId || payload.session_id) as string;
    const reason = (payload.reason || 'Unknown') as string;

    console.log(
      `⚠️ Session terminated by ops: ${sessionId} (reason: ${reason})`
    );

    // 1. End session locally
    console.log(`🔴 Ending session: ${sessionId}`);
    await endSession(sessionId, 'invalidated');

    // 2. Disable shadow mode
    console.log('🔴 Disabling shadow mode');
    useShadowStore.setState({ enabled: false, sessionId: null });

    // 3. Log audit event
    console.log('🔴 Logging audit event');
    await logAudit(userId, 'session_terminated_by_ops', 'real', {
      sessionId,
      reason,
    });

    // 4. Show alert to user
    console.log('🔴 Showing alert');
    Alert.alert(
      'Oturum Sonlandırıldı',
      `Ops tarafından oturumunuz sonlandırıldı.\n\nNeden: ${reason}`,
      [
        {
          text: 'Tamam',
          onPress: () => {
            // Optional: Navigate to home screen
          },
        },
      ]
    );

    console.log('✅ Session terminated successfully');
  } catch (error) {
    console.error('❌ Error handling session termination:', error);
  }
}

/**
 * Handle user lockout by ops
 */
function handleUserLocked(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    const reason = payload.reason as string;
    const duration = payload.duration as number; // minutes
    const lockedUntil = payload.locked_until as string; // ISO timestamp

    console.log(`🔒 User locked by ops: ${reason} (${duration} min)`);

    // 1. Disable shadow mode
    useShadowStore.setState({ enabled: false });

    // 2. Log audit event
    logAudit(userId, 'user_locked_by_ops', 'real', {
      reason,
      duration,
      lockedUntil,
    });

    // 3. Show alert to user
    Alert.alert(
      '🔒 Hesap Kilitlendi',
      `Hesabınız ${duration} dakika boyunca kilitlenmiştir.\n\nNeden: ${reason}\n\nKilit saat: ${new Date(lockedUntil).toLocaleTimeString('tr-TR')}`,
      [
        {
          text: 'Tamam',
          onPress: () => {
            // Optional: Navigate to home
          },
        },
      ]
    );

    console.log('✅ User lockout handled');
  } catch (error) {
    console.error('❌ Error handling user lockout:', error);
  }
}

/**
 * Handle user unlock by ops
 */
function handleUserUnlocked(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    console.log('🔓 User unlocked by ops');

    // Log audit event
    logAudit(userId, 'user_unlocked_by_ops', 'real', {});

    // Show notification
    Alert.alert(
      '🔓 Hesap Açıldı',
      'Hesabınızın kilidi açılmıştır. Şimdi shadow profili kullanabilirsiniz.',
      [
        {
          text: 'Tamam',
          onPress: () => {},
        },
      ]
    );

    console.log('✅ User unlock handled');
  } catch (error) {
    console.error('❌ Error handling user unlock:', error);
  }
}

/**
 * Handle rate limit config update
 */
function handleRateLimitConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Partial<RateLimitConfig>;
    const type = payload.type as 'pin' | 'biometric';

    console.log(`⚙️ Rate limit config updated for ${type}:`, config);

    // Apply config update
    updateRateLimitConfigDynamic(type, config);

    console.log('✅ Rate limit config updated successfully');
  } catch (error) {
    console.error('❌ Error handling rate limit config update:', error);
  }
}

/**
 * Handle anomaly detection config update
 */
function handleAnomalyConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Partial<AnomalyDetectionConfig>;

    console.log('⚙️ Anomaly detection config updated:', config);

    // Apply config update
    updateAnomalyConfig(config);

    console.log('✅ Anomaly detection config updated successfully');
  } catch (error) {
    console.error('❌ Error handling anomaly config update:', error);
  }
}

/**
 * Handle anomaly alert from ops
 */
function handleAnomalyAlert(payload: Record<string, unknown>) {
  try {
    const alertType = payload.type as string;
    const severity = payload.severity as string;
    const message = payload.message as string;

    console.log(
      `🚨 Anomaly alert received: ${alertType} (${severity})`
    );

    // Show notification to user
    Alert.alert(
      '🚨 Şüpheli Aktivite Algılandı',
      message,
      [
        {
          text: 'Tamam',
          onPress: () => {},
        },
      ]
    );

    console.log('✅ Anomaly alert handled');
  } catch (error) {
    console.error('❌ Error handling anomaly alert:', error);
  }
}
