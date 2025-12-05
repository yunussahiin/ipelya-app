"use client";

/**
 * useRealtimeParticipants Hook
 * Supabase Realtime ile katılımcı değişikliklerini dinler
 */

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ParticipantChangeHandler = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

export function useRealtimeParticipants(
  sessionId: string | null,
  onParticipantChange?: ParticipantChangeHandler
) {
  const queryClient = useQueryClient();

  const invalidateParticipants = useCallback(() => {
    if (sessionId) {
      queryClient.invalidateQueries({ queryKey: ["live-participants", sessionId] });
    }
  }, [queryClient, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          // Invalidate React Query cache
          invalidateParticipants();

          // Also invalidate session detail (participant count changed)
          queryClient.invalidateQueries({ queryKey: ["live-session", sessionId] });
          queryClient.invalidateQueries({ queryKey: ["live-sessions"] });

          // Call custom handler if provided
          if (onParticipantChange) {
            onParticipantChange({
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
  }, [sessionId, invalidateParticipants, onParticipantChange, queryClient]);
}

export function useRealtimeAllParticipants(onParticipantChange?: ParticipantChangeHandler) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel("all-participants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_participants",
        },
        (payload) => {
          // Invalidate all participant queries
          queryClient.invalidateQueries({ queryKey: ["live-participants"] });
          queryClient.invalidateQueries({ queryKey: ["live-sessions"] });

          if (onParticipantChange) {
            onParticipantChange({
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
  }, [queryClient, onParticipantChange]);
}
