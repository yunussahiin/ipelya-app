"use client";

/**
 * useAnalytics Hook
 * LiveKit analitik verilerini React Query ile yönetir
 */

import { useQuery } from "@tanstack/react-query";

export interface AnalyticsOverview {
  today: {
    sessions: number;
    viewers: number;
    duration: number;
    calls: number;
  };
  week: {
    sessions: number;
    viewers: number;
    duration: number;
    calls: number;
  };
  month: {
    sessions: number;
    viewers: number;
    duration: number;
    calls: number;
  };
  daily: Array<{
    date: string;
    video: number;
    audio: number;
    calls: number;
  }>;
  typeDistribution: {
    video: number;
    audio: number;
    screen: number;
  };
}

export interface CreatorStats {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_sessions: number;
  total_viewers: number;
  total_duration_seconds: number;
  avg_viewers: number;
}

interface CreatorsResponse {
  creators: CreatorStats[];
  total: number;
}

async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await fetch("/api/ops/live/analytics/overview");
  if (!response.ok) {
    throw new Error("Analitik veriler alınamadı");
  }
  return response.json();
}

async function fetchCreatorStats(period: string, limit: number): Promise<CreatorsResponse> {
  const response = await fetch(`/api/ops/live/analytics/creators?period=${period}&limit=${limit}`);
  if (!response.ok) {
    throw new Error("Creator istatistikleri alınamadı");
  }
  return response.json();
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["live-analytics-overview"],
    queryFn: fetchAnalyticsOverview,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useCreatorStats(period: string = "week", limit: number = 10) {
  return useQuery({
    queryKey: ["live-creator-stats", period, limit],
    queryFn: () => fetchCreatorStats(period, limit),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useTopCreators(limit: number = 5) {
  return useCreatorStats("week", limit);
}
