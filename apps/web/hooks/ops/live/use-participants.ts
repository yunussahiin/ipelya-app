"use client";

/**
 * useParticipants Hook
 * Oturum katılımcılarını React Query ile yönetir
 */

import { useQuery } from "@tanstack/react-query";

export interface Participant {
  id: string;
  session_id: string;
  user_id: string;
  role: "host" | "co_host" | "speaker" | "viewer";
  is_active: boolean;
  is_muted: boolean;
  is_hand_raised: boolean;
  joined_at: string;
  left_at: string | null;
  livekit_participant_sid: string | null;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface ParticipantsResponse {
  participants: Participant[];
  total: number;
  activeCount: number;
}

async function fetchParticipants(sessionId: string): Promise<ParticipantsResponse> {
  const response = await fetch(`/api/ops/live/sessions/${sessionId}/participants`);
  if (!response.ok) {
    throw new Error("Katılımcılar alınamadı");
  }
  return response.json();
}

export function useParticipants(sessionId: string | null) {
  return useQuery({
    queryKey: ["live-participants", sessionId],
    queryFn: () => fetchParticipants(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useActiveParticipants(sessionId: string | null) {
  const { data, ...rest } = useParticipants(sessionId);
  return {
    participants: data?.participants.filter((p) => p.is_active) || [],
    total: data?.activeCount || 0,
    ...rest,
  };
}
