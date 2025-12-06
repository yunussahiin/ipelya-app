/**
 * Session Management Service
 * Handles shadow profile session tracking, timeout, and invalidation
 */

import { supabase } from "@/lib/supabaseClient";
import { logAudit } from "./audit.service";
import { logger } from "@/utils/logger";

export interface SessionData {
  id: string;
  user_id: string;
  profile_type: "real" | "shadow";
  started_at: string;
  last_activity: string;
  status: "active" | "expired" | "invalidated";
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  profileType: "real" | "shadow" = "shadow"
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const now = new Date();

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        profile_type: profileType,
        started_at: now.toISOString(),
        last_activity: now.toISOString(),
        status: "active"
      })
      .select()
      .single();

    if (error) {
      logger.error("Session creation error", error, { tag: "Session" });
      return { success: false, error: error.message };
    }
    
    // Log session start
    await logAudit(userId, "session_started", profileType, {
      sessionId: data.id,
      startedAt: now.toISOString()
    });

    return { success: true, sessionId: data.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Session creation failed", error, { tag: "Session" });
    return { success: false, error: errorMessage };
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  try {
    const now = new Date();

    const { error } = await supabase
      .from("sessions")
      .update({
        last_activity: now.toISOString()
      })
      .eq("id", sessionId);

    if (error) {
      logger.error("Session activity update error", error, { tag: "Session" });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Session activity update failed", error, { tag: "Session" });
    return false;
  }
}

/**
 * Check if session is expired (based on last_activity timeout)
 */
export async function checkSessionTimeout(sessionId: string, timeoutMinutes: number = 30): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("last_activity, status")
      .eq("id", sessionId)
      .single();

    if (error) {
      logger.error("Session check error", error, { tag: "Session" });
      return true; // Assume expired if error
    }

    if (data.status !== "active") {
      return true; // Session already ended or invalidated
    }

    const lastActivity = new Date(data.last_activity);
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    if (now.getTime() - lastActivity.getTime() > timeoutMs) {
      // Session expired, mark as expired
      await endSession(sessionId, "expired");
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Session timeout check failed", error, { tag: "Session" });
    return true; // Assume expired if error
  }
}

/**
 * End a session
 */
export async function endSession(
  sessionId: string,
  reason: "user_logout" | "expired" | "invalidated" = "user_logout"
): Promise<boolean> {
  try {
    const { data: sessionData, error: fetchError } = await supabase
      .from("sessions")
      .select("user_id, profile_type")
      .eq("id", sessionId)
      .single();

    if (fetchError) {
      logger.error("Session fetch error", fetchError, { tag: "Session" });
      return false;
    }

    const { error } = await supabase
      .from("sessions")
      .update({
        status: reason === "expired" ? "expired" : "invalidated"
      })
      .eq("id", sessionId);

    if (error) {
      logger.error("Session end error", error, { tag: "Session" });
      return false;
    }

    // Log session end
    const action = reason === "expired" ? "session_timeout" : "session_ended";
    await logAudit(sessionData.user_id, action as "session_timeout" | "session_ended", sessionData.profile_type, {
      sessionId,
      reason
    });

    return true;
  } catch (error) {
    logger.error("Session end failed", error, { tag: "Session" });
    return false;
  }
}

/**
 * Get active sessions for user
 */
export async function getActiveSessions(userId: string): Promise<SessionData[]> {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("started_at", { ascending: false });

    if (error) {
      logger.error("Get active sessions error", error, { tag: "Session" });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("Get active sessions failed", error, { tag: "Session" });
    return [];
  }
}

/**
 * Invalidate all sessions for user
 */
export async function invalidateAllSessions(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("sessions")
      .update({ status: "invalidated" })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      logger.error("Invalidate all sessions error", error, { tag: "Session" });
      return false;
    }
    
    // Log session invalidation
    const sessionEndedAction = "session_ended" as const;
    await logAudit(userId, sessionEndedAction, "real", {
      reason: "all_sessions_invalidated"
    });

    return true;
  } catch (error) {
    logger.error("Invalidate all sessions failed", error, { tag: "Session" });
    return false;
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("sessions")
      .update({ status: "expired" })
      .lt("expires_at", now)
      .eq("status", "active")
      .select();

    if (error) {
      logger.error("Cleanup expired sessions error", error, { tag: "Session" });
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    logger.error("Cleanup expired sessions failed", error, { tag: "Session" });
    return 0;
  }
}
