"use client";

/**
 * StatsCards Component
 * Canlı yayın özet istatistikleri kartları
 * Aktif oturum, izleyici sayısı vb.
 */

import { Video, Mic, Phone, Users, AlertTriangle, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveAnalyticsOverview } from "@/lib/types/live";

interface StatsCardsProps {
  overview: LiveAnalyticsOverview;
  isLoading?: boolean;
}

export function StatsCards({ overview, isLoading }: StatsCardsProps) {
  const stats = [
    {
      title: "Aktif Video Yayınları",
      value: overview.active_video_sessions,
      icon: Video,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Aktif Sesli Odalar",
      value: overview.active_audio_rooms,
      icon: Mic,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Aktif Çağrılar",
      value: overview.active_calls,
      icon: Phone,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Toplam İzleyici",
      value: overview.total_viewers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Bekleyen Şikayetler",
      value: overview.pending_reports,
      icon: AlertTriangle,
      color: overview.pending_reports > 0 ? "text-orange-500" : "text-muted-foreground",
      bgColor: overview.pending_reports > 0 ? "bg-orange-500/10" : "bg-muted"
    },
    {
      title: "Aktif Yasaklar",
      value: overview.active_bans,
      icon: Ban,
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
