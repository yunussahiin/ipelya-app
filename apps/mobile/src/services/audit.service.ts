/**
 * Audit Logging Service
 * Handles logging of shadow profile activities for security monitoring
 */

import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export type AuditAction =
  | "shadow_mode_enabled"
  | "shadow_mode_disabled"
  | "pin_created"
  | "pin_changed"
  | "pin_verified"
  | "pin_failed"
  | "biometric_enabled"
  | "biometric_disabled"
  | "biometric_verified"
  | "biometric_failed"
  | "profile_updated"
  | "avatar_uploaded"
  | "session_started"
  | "session_ended"
  | "session_timeout"
  | "session_terminated_by_ops"
  | "user_locked_by_ops"
  | "user_unlocked_by_ops";

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: AuditAction;
  profile_type: "real" | "shadow";
  ip_address?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface AuditLogResponse {
  success: boolean;
  error?: string;
  data?: AuditLogEntry;
}

/**
 * Log an audit event to the database
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  profileType: "real" | "shadow" = "shadow",
  metadata?: Record<string, unknown>
): Promise<AuditLogResponse> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: userId,
        action,
        profile_type: profileType,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      logger.error('Audit log error', error, { tag: 'Audit' });
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error('Audit log failed', err, { tag: 'Audit' });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get audit logs for a user
 */
export async function getAuditLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(
  userId: string,
  action: AuditAction,
  limit: number = 50
): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get failed PIN attempts in the last N minutes
 */
export async function getFailedPinAttempts(
  userId: string,
  minutesBack: number = 15
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const timeThreshold = new Date(Date.now() - minutesBack * 60 * 1000).toISOString();

    const { error, count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("action", "pin_failed")
      .gte("created_at", timeThreshold);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get failed biometric attempts in the last N minutes
 */
export async function getFailedBiometricAttempts(
  userId: string,
  minutesBack: number = 15
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const timeThreshold = new Date(Date.now() - minutesBack * 60 * 1000).toISOString();

    const { error, count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("action", "biometric_failed")
      .gte("created_at", timeThreshold);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Clear old audit logs (older than N days)
 */
export async function clearOldAuditLogs(
  daysOld: number = 90
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const timeThreshold = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error, count } = await supabase
      .from("audit_logs")
      .delete()
      .lt("created_at", timeThreshold);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, deletedCount: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
