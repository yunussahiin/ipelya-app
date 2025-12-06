/**
 * Anomaly Detection Service
 * Detects suspicious activities and potential security threats
 */

import { supabase } from "@/lib/supabaseClient";
import { getAuditLogs } from "./audit.service";
import { logger } from "@/utils/logger";

export interface AnomalyAlert {
  type: "excessive_failed_attempts" | "multiple_ips" | "long_session" | "unusual_time";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

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

// Mutable configuration for dynamic updates from web-ops
let ANOMALY_CONFIG: AnomalyDetectionConfig = {
  excessiveFailedAttempts: {
    threshold: 10,
    windowMinutes: 60
  },
  multipleIps: {
    windowMinutes: 60
  },
  longSession: {
    maxSessionMinutes: 120
  },
  unusualTime: {
    normalHours: { start: 8, end: 23 }
  }
};

/**
 * Update anomaly detection configuration dynamically (from web-ops)
 */
export function updateAnomalyConfig(
  newConfig: Partial<AnomalyDetectionConfig>
): void {
  ANOMALY_CONFIG = { ...ANOMALY_CONFIG, ...newConfig };
}

/**
 * Get current anomaly detection configuration
 */
export function getAnomalyConfig(): AnomalyDetectionConfig {
  return ANOMALY_CONFIG;
}

/**
 * Detect excessive failed PIN attempts
 */
export async function detectExcessiveFailedAttempts(
  userId: string,
  threshold: number = 10,
  windowMinutes: number = 60
): Promise<AnomalyAlert | null> {
  try {
    const result = await getAuditLogs(userId, 100);
    if (!result.success || !result.data) return null;

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    const failedAttempts = result.data.filter(
      (log) =>
        (log.action === "pin_failed" || log.action === "biometric_failed") &&
        log.created_at &&
        new Date(log.created_at) > windowStart
    );

    if (failedAttempts.length >= threshold) {
      return {
        type: "excessive_failed_attempts",
        severity: "high",
        message: `${failedAttempts.length} başarısız giriş denemesi algılandı (${windowMinutes} dakika içinde)`,
        timestamp: now,
        metadata: {
          attemptCount: failedAttempts.length,
          threshold,
          windowMinutes
        }
      };
    }

    return null;
  } catch (error) {
    logger.error('Excessive failed attempts detection error', error, { tag: 'Anomaly' });
    return null;
  }
}

/**
 * Detect multiple IPs accessing the same account
 */
export async function detectMultipleIps(
  userId: string,
  windowMinutes: number = 60
): Promise<AnomalyAlert | null> {
  try {
    const result = await getAuditLogs(userId, 100);
    if (!result.success || !result.data) return null;

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    const recentLogs = result.data.filter(
      (log) => log.created_at && new Date(log.created_at) > windowStart
    );

    // Get unique IPs
    const ips = new Set(
      recentLogs
        .filter((log) => log.ip_address)
        .map((log) => log.ip_address)
    );

    if (ips.size > 1) {
      return {
        type: "multiple_ips",
        severity: "medium",
        message: `${ips.size} farklı IP adresinden erişim algılandı`,
        timestamp: now,
        metadata: {
          ipCount: ips.size,
          windowMinutes,
          ips: Array.from(ips)
        }
      };
    }

    return null;
  } catch (error) {
    logger.error('Multiple IPs detection error', error, { tag: 'Anomaly' });
    return null;
  }
}

/**
 * Detect long sessions
 */
export async function detectLongSession(
  userId: string,
  maxSessionMinutes: number = 120
): Promise<AnomalyAlert | null> {
  try {
    const result = await getAuditLogs(userId, 100);
    if (!result.success || !result.data) return null;

    // Find session start and end
    const sessionStart = result.data.find((log) => log.action === "session_started");
    const sessionEnd = result.data.find((log) => log.action === "session_ended");

    if (!sessionStart || !sessionStart.created_at) return null;

    const startTime = new Date(sessionStart.created_at);
    const endTime = sessionEnd && sessionEnd.created_at ? new Date(sessionEnd.created_at) : new Date();

    const sessionDurationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    if (sessionDurationMinutes > maxSessionMinutes) {
      return {
        type: "long_session",
        severity: "low",
        message: `Uzun oturum algılandı: ${Math.round(sessionDurationMinutes)} dakika`,
        timestamp: new Date(),
        metadata: {
          durationMinutes: sessionDurationMinutes,
          maxSessionMinutes,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        }
      };
    }

    return null;
  } catch (error) {
    logger.error('Long session detection error', error, { tag: 'Anomaly' });
    return null;
  }
}

/**
 * Detect unusual access time
 */
export async function detectUnusualAccessTime(
  userId: string,
  normalHours: { start: number; end: number } = { start: 8, end: 23 }
): Promise<AnomalyAlert | null> {
  try {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < normalHours.start || currentHour > normalHours.end) {
      return {
        type: "unusual_time",
        severity: "low",
        message: `Saat ${currentHour}:00'de erişim algılandı (normal saatler: ${normalHours.start}:00-${normalHours.end}:00)`,
        timestamp: now,
        metadata: {
          currentHour,
          normalHours
        }
      };
    }

    return null;
  } catch (error) {
    logger.error('Unusual access time detection error', error, { tag: 'Anomaly' });
    return null;
  }
}

/**
 * Run all anomaly detections
 */
export async function runAnomalyDetections(userId: string): Promise<AnomalyAlert[]> {
  try {
    const alerts: AnomalyAlert[] = [];

    // Run all detections in parallel
    const [
      excessiveFailedAttempts,
      multipleIps,
      longSession,
      unusualTime
    ] = await Promise.all([
      detectExcessiveFailedAttempts(userId),
      detectMultipleIps(userId),
      detectLongSession(userId),
      detectUnusualAccessTime(userId)
    ]);

    if (excessiveFailedAttempts) alerts.push(excessiveFailedAttempts);
    if (multipleIps) alerts.push(multipleIps);
    if (longSession) alerts.push(longSession);
    if (unusualTime) alerts.push(unusualTime);

    return alerts;
  } catch (error) {
    logger.error('Anomaly detection error', error, { tag: 'Anomaly' });
    return [];
  }
}

/**
 * Log anomaly alert
 */
export async function logAnomalyAlert(userId: string, alert: AnomalyAlert): Promise<void> {
  try {
    const { error } = await supabase
      .from("anomaly_alerts")
      .insert({
        user_id: userId,
        alert_type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata || {}
      });

    if (error) {
      logger.error('Anomaly alert log error', error, { tag: 'Anomaly' });
    }
  } catch (error) {
    logger.error('Anomaly alert log failed', error, { tag: 'Anomaly' });
  }
}
