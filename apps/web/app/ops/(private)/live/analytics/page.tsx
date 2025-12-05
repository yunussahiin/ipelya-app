"use client";

/**
 * LiveKit Analytics Dashboard
 * Canlı yayın analitik ve istatistiklerini gösterir
 */

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Calendar, TrendingUp, Clock, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DailySessionsChart } from "@/components/ops/live/daily-sessions-chart";
import { SessionTypesPie } from "@/components/ops/live/session-types-pie";
import { TopCreatorsTable } from "@/components/ops/live/top-creators-table";

interface OverviewStats {
  totalSessions: number;
  videoSessions: number;
  audioSessions: number;
  totalViewers: number;
  totalDuration: number;
  avgDuration: number;
  calls?: number;
}

interface DailyData {
  date: string;
  dayName: string;
  videoSessions: number;
  audioSessions: number;
  calls: number;
  totalViewers: number;
  totalDuration: number;
}

interface TypeDistribution {
  video: number;
  audio_room: number;
  calls: number;
}

interface CreatorStats {
  creator_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  totalSessions: number;
  videoSessions: number;
  audioSessions: number;
  totalViewers: number;
  maxViewers: number;
  totalDuration: number;
  avgDuration: number;
  lastSession: string;
}

interface AnalyticsData {
  today: OverviewStats;
  week: OverviewStats;
  month: OverviewStats;
  dailyBreakdown: DailyData[];
  typeDistribution: TypeDistribution;
}

// Süreyi formatla
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}s ${remainingMinutes}dk`;
}

export default function LiveAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [creators, setCreators] = useState<CreatorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<string>("week");

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live/analytics/overview");
      if (!response.ok) throw new Error("Veriler alınamadı");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Analytics fetch error:", error);
    }
  }, []);

  const fetchCreators = useCallback(async () => {
    try {
      const response = await fetch(`/api/ops/live/analytics/creators?period=${period}&limit=10`);
      if (!response.ok) throw new Error("Creator verileri alınamadı");
      const data = await response.json();
      setCreators(data.creators || []);
    } catch (error) {
      console.error("Creators fetch error:", error);
    }
  }, [period]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchAnalytics(), fetchCreators()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchAnalytics, fetchCreators]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchCreators();
  }, [period, fetchCreators]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = analytics?.week || {
    totalSessions: 0,
    videoSessions: 0,
    audioSessions: 0,
    totalViewers: 0,
    totalDuration: 0,
    avgDuration: 0,
    calls: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Canlı Yayın Analitikleri</h1>
          <p className="text-muted-foreground">Performans metrikleri ve trendler</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Oturum</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Bu hafta ({stats.videoSessions} video, {stats.audioSessions} sesli)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İzleyici</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViewers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Bu hafta benzersiz izleyici</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Süre</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Ortalama: {formatDuration(stats.avgDuration)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1-1 Çağrılar</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.calls || 0}</div>
            <p className="text-xs text-muted-foreground">Bu hafta tamamlanan</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Sessions Chart */}
        {analytics?.dailyBreakdown && <DailySessionsChart data={analytics.dailyBreakdown} />}

        {/* Session Types Pie */}
        {analytics?.typeDistribution && <SessionTypesPie data={analytics.typeDistribution} />}
      </div>

      {/* Top Creators */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            En Aktif Creator&apos;lar
          </h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Dönem seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Bugün</SelectItem>
              <SelectItem value="week">Bu Hafta</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TopCreatorsTable creators={creators} period={period} />
      </div>

      {/* Comparison Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bugün</CardTitle>
              <CardDescription>Günlük özet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oturumlar</span>
                <span className="font-medium">{analytics.today.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">İzleyiciler</span>
                <span className="font-medium">{analytics.today.totalViewers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Süre</span>
                <span className="font-medium">{formatDuration(analytics.today.totalDuration)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bu Hafta</CardTitle>
              <CardDescription>Haftalık özet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oturumlar</span>
                <span className="font-medium">{analytics.week.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">İzleyiciler</span>
                <span className="font-medium">{analytics.week.totalViewers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Süre</span>
                <span className="font-medium">{formatDuration(analytics.week.totalDuration)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bu Ay</CardTitle>
              <CardDescription>Aylık özet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oturumlar</span>
                <span className="font-medium">{analytics.month.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">İzleyiciler</span>
                <span className="font-medium">{analytics.month.totalViewers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Süre</span>
                <span className="font-medium">{formatDuration(analytics.month.totalDuration)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
