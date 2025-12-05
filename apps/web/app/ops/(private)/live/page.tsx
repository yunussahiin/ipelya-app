"use client";

/**
 * Live Overview Page
 * Aktif yayınları ve çağrıları gösteren ana sayfa
 * Referans: WEB_ADMIN_DASHBOARD.md → Live Overview
 */

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Video, Mic, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StatsCards } from "@/components/ops/live/stats-cards";
import { SessionsTable } from "@/components/ops/live/sessions-table";
import { CallsTable } from "@/components/ops/live/calls-table";

import type { LiveSession, Call, LiveAnalyticsOverview } from "@/lib/types/live";

export default function LiveOverviewPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [overview, setOverview] = useState<LiveAnalyticsOverview>({
    active_sessions: 0,
    active_video_sessions: 0,
    active_audio_rooms: 0,
    active_calls: 0,
    total_viewers: 0,
    pending_reports: 0,
    active_bans: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live/sessions");
      if (!response.ok) throw new Error("Veriler alınamadı");

      const data = await response.json();
      setSessions(data.sessions || []);
      setCalls(data.calls || []);
      if (data.overview) {
        setOverview(data.overview);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // 30 saniyede bir yenile
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const videoSessions = sessions.filter((s) => s.session_type === "video_live");
  const audioRooms = sessions.filter((s) => s.session_type === "audio_room");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canlı Yayın Yönetimi</h1>
          <p className="text-muted-foreground">Aktif yayınları izleyin ve yönetin</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards overview={overview} isLoading={loading} />

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            Tümü
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{sessions.length}</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {videoSessions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Sesli Oda
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{audioRooms.length}</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Çağrılar
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{calls.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {videoSessions.length > 0 && (
            <SessionsTable
              sessions={videoSessions}
              title="Aktif Video Yayınları"
              icon="video"
              onRefresh={handleRefresh}
            />
          )}
          {audioRooms.length > 0 && (
            <SessionsTable
              sessions={audioRooms}
              title="Aktif Sesli Odalar"
              icon="audio"
              onRefresh={handleRefresh}
            />
          )}
          {calls.length > 0 && <CallsTable calls={calls} />}
          {sessions.length === 0 && calls.length === 0 && !loading && (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">Şu anda aktif yayın veya çağrı bulunmuyor</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="video">
          <SessionsTable
            sessions={videoSessions}
            title="Aktif Video Yayınları"
            icon="video"
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="audio">
          <SessionsTable
            sessions={audioRooms}
            title="Aktif Sesli Odalar"
            icon="audio"
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="calls">
          <CallsTable calls={calls} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
