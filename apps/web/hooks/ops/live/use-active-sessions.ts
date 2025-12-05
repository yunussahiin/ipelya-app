"use client";

/**
 * useActiveSessions Hook
 * Aktif oturumları React Query ile yönetir
 */

import { useQuery } from "@tanstack/react-query";

export interface LiveSession {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  type: "video" | "audio" | "screen";
  status: "scheduled" | "live" | "ended" | "host_disconnected";
  is_private: boolean;
  max_participants: number;
  livekit_room_name: string;
  livekit_room_sid: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  end_reason: string | null;
  total_duration_seconds: number | null;
  peak_viewers: number;
  created_at: string;
  creator?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  _count?: {
    active_participants: number;
  };
}

interface SessionsResponse {
  sessions: LiveSession[];
  calls: unknown[];
  stats: {
    activeSessions: number;
    totalViewers: number;
    activeCalls: number;
    sessionsLast24h: number;
  };
}

interface UseActiveSessionsOptions {
  type?: "all" | "video" | "audio" | "screen";
  status?: "all" | "live" | "scheduled" | "ended";
  refetchInterval?: number;
}

async function fetchActiveSessions(options: UseActiveSessionsOptions): Promise<SessionsResponse> {
  const params = new URLSearchParams();
  if (options.type && options.type !== "all") params.set("type", options.type);
  if (options.status && options.status !== "all") params.set("status", options.status);

  const response = await fetch(`/api/ops/live/sessions?${params}`);
  if (!response.ok) {
    throw new Error("Oturumlar alınamadı");
  }
  return response.json();
}

export function useActiveSessions(options: UseActiveSessionsOptions = {}) {
  const { type = "all", status = "all", refetchInterval = 10000 } = options;

  return useQuery({
    queryKey: ["live-sessions", type, status],
    queryFn: () => fetchActiveSessions({ type, status }),
    refetchInterval,
    staleTime: 5000,
  });
}

export function useSessionStats() {
  const { data, ...rest } = useActiveSessions({ refetchInterval: 30000 });
  return {
    stats: data?.stats,
    ...rest,
  };
}
