"use client";

/**
 * useBans Hook
 * Ban kayıtlarını React Query ile yönetir
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BanRecord {
  id: string;
  session_id: string | null;
  banned_user_id: string;
  banned_by: string;
  reason: string;
  ban_type: "session" | "creator" | "global";
  is_active: boolean;
  expires_at: string | null;
  lifted_at: string | null;
  lifted_by: string | null;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  banned_by_user?: {
    id: string;
    username: string;
    display_name: string;
  };
  session?: {
    id: string;
    title: string;
    type: string;
  };
}

interface BansResponse {
  bans: BanRecord[];
  total: number;
  typeCounts: {
    session: number;
    creator: number;
    global: number;
    total: number;
  };
}

interface LiftBanParams {
  banId: string;
  reason: string;
}

async function fetchBans(active: boolean, type?: string): Promise<BansResponse> {
  const params = new URLSearchParams();
  params.set("active", String(active));
  if (type && type !== "all") params.set("type", type);

  const response = await fetch(`/api/ops/live/bans?${params}`);
  if (!response.ok) {
    throw new Error("Banlar alınamadı");
  }
  return response.json();
}

async function liftBan(params: LiftBanParams): Promise<void> {
  const { banId, reason } = params;
  const response = await fetch(`/api/ops/live/bans/${banId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Ban kaldırılamadı");
  }
}

export function useBans(active: boolean = true, type?: string) {
  return useQuery({
    queryKey: ["live-bans", active, type],
    queryFn: () => fetchBans(active, type),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useActiveBans() {
  return useBans(true);
}

export function useLiftBan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: liftBan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-bans"] });
    },
  });
}

export function useActiveBansCount() {
  const { data } = useActiveBans();
  return data?.typeCounts?.total || 0;
}
