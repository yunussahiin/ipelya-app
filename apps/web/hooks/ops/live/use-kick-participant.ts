"use client";

/**
 * useKickParticipant Hook
 * Katılımcı çıkarma (kick) işlemi
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface KickParams {
  participantId: string;
  sessionId: string;
  reason?: string;
}

interface KickResponse {
  success: boolean;
  message: string;
}

async function kickParticipant(params: KickParams): Promise<KickResponse> {
  const { participantId, reason } = params;

  const response = await fetch(`/api/ops/live/participants/${participantId}/kick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Katılımcı çıkarılamadı");
  }

  return response.json();
}

export function useKickParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kickParticipant,
    onSuccess: (_, variables) => {
      // Invalidate participants list
      queryClient.invalidateQueries({
        queryKey: ["live-participants", variables.sessionId],
      });
      // Invalidate session detail
      queryClient.invalidateQueries({
        queryKey: ["live-session", variables.sessionId],
      });
      // Invalidate sessions list (participant count changed)
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
    },
  });
}
