"use client";

/**
 * useTerminateSession Hook
 * Oturum sonlandırma işlemi
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TerminateParams {
  sessionId: string;
  reason?: string;
  notifyParticipants?: boolean;
}

interface TerminateResponse {
  success: boolean;
  message: string;
}

async function terminateSession(params: TerminateParams): Promise<TerminateResponse> {
  const { sessionId, reason, notifyParticipants = true } = params;

  const response = await fetch(`/api/ops/live/sessions/${sessionId}/terminate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, notifyParticipants }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Oturum sonlandırılamadı");
  }

  return response.json();
}

export function useTerminateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: terminateSession,
    onSuccess: (_, variables) => {
      // Invalidate session detail
      queryClient.invalidateQueries({
        queryKey: ["live-session", variables.sessionId],
      });
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
      // Invalidate participants
      queryClient.invalidateQueries({
        queryKey: ["live-participants", variables.sessionId],
      });
    },
  });
}
