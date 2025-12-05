"use client";

/**
 * useHandleReport Hook
 * Şikayet işleme (action) operasyonları
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

export type ReportAction = "dismiss" | "warn" | "kick" | "ban";
export type BanType = "session" | "creator" | "global";

interface HandleReportParams {
  reportId: string;
  action: ReportAction;
  banType?: BanType;
  banDuration?: number; // minutes
  notes?: string;
}

interface HandleReportResponse {
  success: boolean;
  message: string;
  action: ReportAction;
  banId?: string;
}

async function handleReport(params: HandleReportParams): Promise<HandleReportResponse> {
  const { reportId, ...body } = params;

  const response = await fetch(`/api/ops/live/reports/${reportId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Şikayet işlenemedi");
  }

  return response.json();
}

export function useHandleReportAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: handleReport,
    onSuccess: () => {
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: ["live-reports"] });
      // If ban was created, invalidate bans
      queryClient.invalidateQueries({ queryKey: ["live-bans"] });
      // Invalidate sessions (status might have changed)
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
    },
  });
}

// Helper hooks for specific actions
export function useDismissReport() {
  const mutation = useHandleReportAction();
  return {
    ...mutation,
    dismiss: (reportId: string, notes?: string) =>
      mutation.mutateAsync({ reportId, action: "dismiss", notes }),
  };
}

export function useWarnUser() {
  const mutation = useHandleReportAction();
  return {
    ...mutation,
    warn: (reportId: string, notes?: string) =>
      mutation.mutateAsync({ reportId, action: "warn", notes }),
  };
}

export function useKickFromReport() {
  const mutation = useHandleReportAction();
  return {
    ...mutation,
    kick: (reportId: string, notes?: string) =>
      mutation.mutateAsync({ reportId, action: "kick", notes }),
  };
}

export function useBanFromReport() {
  const mutation = useHandleReportAction();
  return {
    ...mutation,
    ban: (
      reportId: string,
      banType: BanType,
      banDuration?: number,
      notes?: string
    ) =>
      mutation.mutateAsync({
        reportId,
        action: "ban",
        banType,
        banDuration,
        notes,
      }),
  };
}
