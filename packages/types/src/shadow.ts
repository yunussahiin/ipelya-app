/**
 * Shadow Profile - Shared Types
 * 
 * Types used for Web-Ops to Mobile communication via Supabase Broadcast
 */

/**
 * Event types sent from Web-Ops to Mobile
 */
export type OpsEventType =
  | 'session_terminated'
  | 'user_locked'
  | 'user_unlocked'
  | 'rate_limit_config_updated'
  | 'anomaly_detection_config_updated'
  | 'anomaly_alert';

/**
 * Generic ops event structure
 */
export interface OpsEvent {
  type: OpsEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutMinutes: number;
}

/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
  excessiveFailedAttempts: {
    threshold: number;
    windowMinutes: number;
  };
  multipleIps: {
    windowMinutes: number;
  };
  longSession: {
    maxSessionMinutes: number;
  };
  unusualTime: {
    normalHours: { start: number; end: number };
  };
}

/**
 * Session termination payload
 */
export interface SessionTerminatedPayload {
  sessionId: string;
  reason: string;
  timestamp: string;
}

/**
 * User locked payload
 */
export interface UserLockedPayload {
  reason: string;
  duration: number; // minutes
  locked_until: string; // ISO timestamp
  timestamp: string;
}

/**
 * User unlocked payload
 */
export interface UserUnlockedPayload {
  timestamp: string;
}

/**
 * Rate limit config updated payload
 */
export interface RateLimitConfigUpdatedPayload {
  type: 'pin' | 'biometric';
  config: RateLimitConfig;
  timestamp: string;
}

/**
 * Anomaly detection config updated payload
 */
export interface AnomalyDetectionConfigUpdatedPayload {
  config: Partial<AnomalyDetectionConfig>;
  timestamp: string;
}

/**
 * Anomaly alert payload
 */
export interface AnomalyAlertPayload {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
}
