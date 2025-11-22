/**
 * Shadow Profile - Broadcast Service
 * 
 * Handles Web-Ops to Mobile communication via Supabase Broadcast
 * Used by web-ops API endpoints to send commands to mobile app
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  OpsEventType,
  RateLimitConfig,
  AnomalyDetectionConfig,
} from '@ipelya/types';

/**
 * Send a generic broadcast message to a user's ops channel
 * 
 * @param supabase - Supabase client instance
 * @param userId - Target user ID
 * @param type - Event type
 * @param payload - Event payload
 */
export async function sendBroadcast(
  supabase: SupabaseClient,
  userId: string,
  type: OpsEventType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    // Use Edge Function to send broadcast
    // Edge Function handles Supabase Realtime channel subscription and broadcast
    const projectUrl = supabase.supabaseUrl;
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!projectUrl || !apiKey) {
      throw new Error(`Missing Supabase URL or API key. URL: ${projectUrl}, Key: ${apiKey ? 'present' : 'missing'}`);
    }

    // Create a simple JWT token for Edge Function verification
    // Edge Function expects Authorization header with Bearer token
    const response = await fetch(`${projectUrl}/functions/v1/broadcast-ops-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Service role key as Bearer token for Edge Function JWT verification
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        userId,
        type,
        payload,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Broadcast Edge Function error: ${response.status} - ${error}`);
    }

    console.log(`✅ Broadcast sent: ${type} to user ${userId}`);
  } catch (error) {
    console.error(`❌ Error sending broadcast: ${type}`, error);
    throw error;
  }
}

/**
 * Terminate a session by ops
 * 
 * @param supabase - Supabase client instance
 * @param userId - Target user ID
 * @param sessionId - Session ID to terminate
 * @param reason - Termination reason
 */
export async function terminateSessionByOps(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  reason: string
): Promise<void> {
  await sendBroadcast(supabase, userId, 'session_terminated', {
    sessionId,
    reason,
  });
}

/**
 * Lock a user account by ops
 * 
 * @param supabase - Supabase client instance
 * @param userId - Target user ID
 * @param reason - Lockout reason
 * @param durationMinutes - Lockout duration in minutes
 */
export async function lockUserByOps(
  supabase: SupabaseClient,
  userId: string,
  reason: string,
  durationMinutes: number
): Promise<void> {
  const lockedUntil = new Date(Date.now() + durationMinutes * 60000);

  await sendBroadcast(supabase, userId, 'user_locked', {
    reason,
    duration: durationMinutes,
    locked_until: lockedUntil.toISOString(),
  });
}

/**
 * Unlock a user account by ops
 * 
 * @param supabase - Supabase client instance
 * @param userId - Target user ID
 */
export async function unlockUserByOps(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await sendBroadcast(supabase, userId, 'user_unlocked', {});
}

/**
 * Update rate limit configuration for a user
 * 
 * @param supabase - Supabase client instance
 * @param userId - Target user ID
 * @param type - Config type (pin or biometric)
 * @param config - New rate limit configuration
 */
export async function updateRateLimitConfig(
  supabase: SupabaseClient,
  userId: string,
  type: 'pin' | 'biometric',
  config: Partial<RateLimitConfig>
): Promise<void> {
  await sendBroadcast(supabase, userId, 'rate_limit_config_updated', {
    type,
    config,
  });
}

/**
 * Update anomaly detection configuration for a user
 * 
 * @param supabase - Supabase client instance
 * @param userId - Target user ID
 * @param config - New anomaly detection configuration
 */
export async function updateAnomalyDetectionConfig(
  supabase: SupabaseClient,
  userId: string,
  config: Partial<AnomalyDetectionConfig>
): Promise<void> {
  await sendBroadcast(supabase, userId, 'anomaly_detection_config_updated', {
    config,
  });
}

/**
 * Send an anomaly alert to a user
 * 
 * @param supabase - Supabase client instance
 * @param userId - Target user ID
 * @param alertType - Type of anomaly (excessive_failed_attempts, multiple_ips, etc.)
 * @param severity - Alert severity (low, medium, high)
 * @param message - Alert message
 */
export async function sendAnomalyAlert(
  supabase: SupabaseClient,
  userId: string,
  alertType: string,
  severity: 'low' | 'medium' | 'high',
  message: string
): Promise<void> {
  await sendBroadcast(supabase, userId, 'anomaly_alert', {
    type: alertType,
    severity,
    message,
  });
}
