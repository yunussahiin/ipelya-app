/**
 * Real-time Stats Dashboard
 *
 * Live feed activity monitoring
 * - Active users count
 * - Posts/likes/comments per minute
 * - Real-time engagement metrics
 * - Supabase Realtime subscription
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconActivity,
  IconHeart,
  IconMessage,
  IconPhoto,
  IconRefresh,
  IconTrendingUp,
  IconUsers
} from "@tabler/icons-react";
import Image from "next/image";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface LiveStats {
  active_users: number;
  posts_per_minute: number;
  likes_per_minute: number;
  comments_per_minute: number;
  active_sessions: number;
  peak_users_today: number;
  engagement_rate: number;
  trending_content_type: string;
}

interface RecentActivity {
  id: string;
  type: "post" | "like" | "comment" | "follow";
  user: string;
  avatar_url?: string;
  content?: string;
  timestamp: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: "Post",
  mini_post: "Vibe",
  poll: "Anket",
  voice_moment: "Ses"
};

export default function LiveStatsPage() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ops/feed/live");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setActivities(data.data.activities || []);
      } else {
        toast.error("İstatistikler yüklenemedi");
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      toast.error("İstatistikler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Live updates - fetch from API every 5 seconds
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/ops/feed/live");
        const data = await response.json();

        if (data.success) {
          setStats(data.data.stats);
          if (data.data.activities?.length > 0) {
            setActivities(data.data.activities);
          }
        }
      } catch (error) {
        console.error("Live update error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const toggleLive = () => {
    setIsLive((prev) => !prev);
    toast.info(isLive ? "Canlı güncelleme durduruldu" : "Canlı güncelleme başlatıldı");
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "post":
        return <IconPhoto className="h-4 w-4 text-blue-500" />;
      case "like":
        return <IconHeart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <IconMessage className="h-4 w-4 text-green-500" />;
      case "follow":
        return <IconUsers className="h-4 w-4 text-purple-500" />;
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case "post":
        return "yeni bir paylaşım yaptı";
      case "like":
        return "bir içeriği beğendi";
      case "comment":
        return "yorum yaptı";
      case "follow":
        return "birini takip etti";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canlı İstatistikler</h1>
          <p className="text-muted-foreground">Feed aktivitesini gerçek zamanlı izleyin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchStats}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button variant={isLive ? "destructive" : "default"} onClick={toggleLive}>
            <IconActivity className="mr-2 h-4 w-4" />
            {isLive ? "Durdur" : "Canlı Başlat"}
          </Button>
        </div>
      </div>

      {/* Live Status */}
      {isLive && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Canlı güncelleme aktif - Her 3 saniyede bir güncelleniyor
            </span>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Active Users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconUsers className="h-4 w-4" />
                  Aktif Kullanıcılar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.active_users}</div>
                <p className="text-xs text-muted-foreground">
                  Bugünkü zirve: {stats.peak_users_today}
                </p>
                <Progress
                  value={(stats.active_users / stats.peak_users_today) * 100}
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>

            {/* Posts per Minute */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconPhoto className="h-4 w-4" />
                  Post/Dakika
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.posts_per_minute}</div>
                <p className="text-xs text-muted-foreground">Son 1 dakikada paylaşılan</p>
              </CardContent>
            </Card>

            {/* Likes per Minute */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconHeart className="h-4 w-4" />
                  Beğeni/Dakika
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.likes_per_minute}</div>
                <p className="text-xs text-muted-foreground">Son 1 dakikada beğenilen</p>
              </CardContent>
            </Card>

            {/* Comments per Minute */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconMessage className="h-4 w-4" />
                  Yorum/Dakika
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.comments_per_minute}</div>
                <p className="text-xs text-muted-foreground">Son 1 dakikada yapılan</p>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconActivity className="h-4 w-4" />
                  Aktif Oturumlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.active_sessions}</div>
                <p className="text-xs text-muted-foreground">Şu an açık olan oturumlar</p>
              </CardContent>
            </Card>

            {/* Engagement Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconTrendingUp className="h-4 w-4" />
                  Etkileşim Oranı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.engagement_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Ortalama etkileşim</p>
              </CardContent>
            </Card>

            {/* Trending Content Type */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconTrendingUp className="h-4 w-4" />
                  Trend İçerik Türü
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="text-lg">
                    {CONTENT_TYPE_LABELS[stats.trending_content_type] ||
                      stats.trending_content_type}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Şu an en çok etkileşim alan içerik türü
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="h-5 w-5" />
                Son Aktiviteler
              </CardTitle>
              <CardDescription>Gerçek zamanlı kullanıcı aktiviteleri</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Henüz aktivite yok. Yenile butonuna tıklayın veya canlı güncellemeyi başlatın.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-lg bg-muted p-3"
                    >
                      {activity.avatar_url ? (
                        <Image
                          src={activity.avatar_url}
                          alt={activity.user}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          {getActivityIcon(activity.type)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">@{activity.user}</span>{" "}
                          {getActivityText(activity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString("tr-TR")}
                        </p>
                      </div>
                      {getActivityIcon(activity.type)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">İstatistikler yüklenemedi</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
