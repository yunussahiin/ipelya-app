"use client";

/**
 * useBanParticipant Hook
 * Katılımcı banlama işlemi
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BanParams {
  participantId: string;
  sessionId: string;
  reason: string;
  banType: "session" | "creator" | "global";
  duration?: number; // minutes, null = permanent
}

interface BanResponse {
  success: boolean;
  message: string;
  banId: string;
}

async function banParticipant(params: BanParams): Promise<BanResponse> {
  const { participantId, reason, banType, duration } = params;

  const response = await fetch(`/api/ops/live/participants/${participantId}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, banType, duration }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Katılımcı banlanamadı");
  }

  return response.json();
}

export function useBanParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: banParticipant,
    onSuccess: (_, variables) => {
      // Invalidate participants list
      queryClient.invalidateQueries({
        queryKey: ["live-participants", variables.sessionId],
      });
      // Invalidate session detail
      queryClient.invalidateQueries({
        queryKey: ["live-session", variables.sessionId],
      });
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
      // Invalidate bans list
      queryClient.invalidateQueries({ queryKey: ["live-bans"] });
    },
  });
}
