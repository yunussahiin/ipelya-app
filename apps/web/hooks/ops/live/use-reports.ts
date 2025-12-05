"use client";

/**
 * useReports Hook
 * Şikayetleri React Query ile yönetir
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Report {
  id: string;
  session_id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: "pending" | "resolved" | "dismissed";
  action_taken: string | null;
  action_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  reported_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  session?: {
    id: string;
    title: string;
    type: string;
    status: string;
  };
}

interface ReportsResponse {
  reports: Report[];
  total: number;
  statusCounts: {
    pending: number;
    resolved: number;
    dismissed: number;
  };
}

interface ReportActionParams {
  reportId: string;
  action: "dismiss" | "warn" | "kick" | "ban";
  banType?: "session" | "creator" | "global";
  banDuration?: number;
  notes?: string;
}

async function fetchReports(status: string): Promise<ReportsResponse> {
  const response = await fetch(`/api/ops/live/reports?status=${status}`);
  if (!response.ok) {
    throw new Error("Şikayetler alınamadı");
  }
  return response.json();
}

async function handleReportAction(params: ReportActionParams): Promise<void> {
  const { reportId, ...body } = params;
  const response = await fetch(`/api/ops/live/reports/${reportId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "İşlem başarısız");
  }
}

export function useReports(status: string = "pending") {
  return useQuery({
    queryKey: ["live-reports", status],
    queryFn: () => fetchReports(status),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useHandleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: handleReportAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-reports"] });
    },
  });
}

export function usePendingReportsCount() {
  const { data } = useReports("pending");
  return data?.statusCounts?.pending || 0;
}
