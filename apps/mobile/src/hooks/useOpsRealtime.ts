/**
 * useOpsRealtime Hook
 * 
 * Listens for Web-Ops to Mobile communication via Supabase Broadcast
 * Handles session termination, user lockout, config updates, and anomaly alerts
 */

import { useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { endSession } from '@/services/session.service';
import { logAudit } from '@/services/audit.service';
import { useShadowStore } from '@/store/shadow.store';
import { saveLockInfo, clearLockInfo, formatLockDuration } from '@/services/user-lock.service';
import { updateRateLimitConfigDynamic, RateLimitConfig } from '@/services/rate-limit.service';
import { updateAnomalyConfig, AnomalyDetectionConfig } from '@/services/anomaly-detection.service';
import { logger } from '@/utils/logger';

/**
 * Setup realtime listener for ops commands from web-ops
 * 
 * @param userId - Current user ID
 */
export function useOpsRealtime(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    logger.debug('Setting up ops realtime listener', { tag: 'OpsRealtime' });

    // Subscribe to ops broadcast channel
    const channel = supabase.channel(`ops:user:${userId}`);

    channel
      .on(
        'broadcast',
        { event: 'session_terminated' },
        async (payload) => {
          logger.debug('Received: session_terminated', { tag: 'OpsRealtime' });
          await handleSessionTerminated(payload.payload as Record<string, unknown>, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'user_locked' },
        (payload) => {
          logger.debug('Received: user_locked', { tag: 'OpsRealtime' });
          handleUserLocked(payload.payload as Record<string, unknown>, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'user_unlocked' },
        (payload) => {
          logger.debug('Received: user_unlocked', { tag: 'OpsRealtime' });
          handleUserUnlocked(payload.payload as Record<string, unknown>, userId);
        }
      )
      .on(
        'broadcast',
        { event: 'rate_limit_config_updated' },
        (payload) => {
          logger.debug('Received: rate_limit_config_updated', { tag: 'OpsRealtime' });
          handleRateLimitConfigUpdated(payload.payload as Record<string, unknown>);
        }
      )
      .on(
        'broadcast',
        { event: 'anomaly_detection_config_updated' },
        (payload) => {
          logger.debug('Received: anomaly_detection_config_updated', { tag: 'OpsRealtime' });
          handleAnomalyConfigUpdated(payload.payload as Record<string, unknown>);
        }
      )
      .on(
        'broadcast',
        { event: 'anomaly_alert' },
        (payload) => {
          logger.debug('Received: anomaly_alert', { tag: 'OpsRealtime' });
          handleAnomalyAlert(payload.payload as Record<string, unknown>);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('Ops realtime connected', { tag: 'OpsRealtime' });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Ops realtime error', undefined, { tag: 'OpsRealtime' });
        }
      });

    return () => {
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

    await endSession(sessionId, 'invalidated');
    useShadowStore.setState({ enabled: false, sessionId: null });
    await logAudit(userId, 'session_terminated_by_ops', 'real', { sessionId, reason });
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

  } catch (error) {
    logger.error('Error handling session termination', error, { tag: 'OpsRealtime' });
  }
}

/**
 * Handle user lockout by ops
 */
async function handleUserLocked(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    const reason = payload.reason as string;
    const duration = payload.duration as number | null;
    const lockedUntil = payload.locked_until as string | null;

    await saveLockInfo({
      reason,
      lockedAt: new Date().toISOString(),
      lockedUntil,
      duration,
    });

    // 2. Disable shadow mode
    useShadowStore.setState({ enabled: false, sessionId: null });

    // 3. Log audit event
    await logAudit(userId, 'user_locked_by_ops', 'real', {
      reason,
      duration,
      lockedUntil,
    });

    // 4. Show alert to user
    const durationText = duration 
      ? formatLockDuration(duration)
      : 'kalıcı olarak';
    
    const untilText = lockedUntil
      ? `\n\nKilit bitiş: ${new Date(lockedUntil).toLocaleString('tr-TR')}`
      : '';

    Alert.alert(
      '🔒 Hesap Kilitlendi',
      `Hesabınız ${durationText} kilitlenmiştir.\n\nNeden: ${reason}${untilText}`,
      [
        {
          text: 'Tamam',
          onPress: () => {},
        },
      ]
    );

  } catch (error) {
    logger.error('Error handling user lockout', error, { tag: 'OpsRealtime' });
  }
}

/**
 * Handle user unlock by ops
 */
async function handleUserUnlocked(
  payload: Record<string, unknown>,
  userId: string
) {
  try {
    await clearLockInfo();

    // 2. Log audit event
    await logAudit(userId, 'user_unlocked_by_ops', 'real', {});

    // 3. Show notification
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

  } catch (error) {
    logger.error('Error handling user unlock', error, { tag: 'OpsRealtime' });
  }
}

/**
 * Handle rate limit config update
 */
function handleRateLimitConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Partial<RateLimitConfig>;
    const type = payload.type as 'pin' | 'biometric';

    updateRateLimitConfigDynamic(type, config);
  } catch (error) {
    logger.error('Error handling rate limit config update', error, { tag: 'OpsRealtime' });
  }
}

/**
 * Handle anomaly detection config update
 */
function handleAnomalyConfigUpdated(payload: Record<string, unknown>) {
  try {
    const config = payload.config as Partial<AnomalyDetectionConfig>;

    updateAnomalyConfig(config);
  } catch (error) {
    logger.error('Error handling anomaly config update', error, { tag: 'OpsRealtime' });
  }
}

/**
 * Handle anomaly alert from ops
 */
function handleAnomalyAlert(payload: Record<string, unknown>) {
  try {
    const message = payload.message as string;

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

  } catch (error) {
    logger.error('Error handling anomaly alert', error, { tag: 'OpsRealtime' });
  }
}
