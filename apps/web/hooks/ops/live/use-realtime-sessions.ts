"use client";

/**
 * useRealtimeSessions Hook
 * Supabase Realtime ile oturum değişikliklerini dinler
 */

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SessionChangeHandler = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

export function useRealtimeSessions(onSessionChange?: SessionChangeHandler) {
  const queryClient = useQueryClient();

  const invalidateSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
  }, [queryClient]);

  useEffect(() => {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel("live-sessions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_sessions",
        },
        (payload) => {
          // Invalidate React Query cache
          invalidateSessions();

          // Call custom handler if provided
          if (onSessionChange) {
            onSessionChange({
              eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateSessions, onSessionChange]);
}

export function useRealtimeSessionStatus(sessionId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-session", sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);
}
