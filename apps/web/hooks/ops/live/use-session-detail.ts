"use client";

/**
 * useSessionDetail Hook
 * Tek bir oturum detayını React Query ile yönetir
 */

import { useQuery } from "@tanstack/react-query";
import type { LiveSession } from "./use-active-sessions";

interface SessionDetailResponse {
  session: LiveSession & {
    participants: Array<{
      id: string;
      user_id: string;
      role: string;
      is_active: boolean;
      joined_at: string;
      left_at: string | null;
      user?: {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
      };
    }>;
    messages_count: number;
  };
}

async function fetchSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
  const response = await fetch(`/api/ops/live/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error("Oturum detayı alınamadı");
  }
  return response.json();
}

export function useSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ["live-session", sessionId],
    queryFn: () => fetchSessionDetail(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
