"use client";

import { Database, Activity, Zap, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DatabaseStats, ConnectionStats } from "../types";

interface StatsCardsProps {
  dbStats: DatabaseStats | null;
  connectionStats: ConnectionStats | null;
}

export function StatsCards({ dbStats, connectionStats }: StatsCardsProps) {
  // Format uptime
  const formatUptime = (uptime: string) => {
    if (!uptime) return "-";
    const match = uptime.match(/(\d+) days? (\d+):(\d+):(\d+)/);
    if (match) {
      const [, days, hours, minutes] = match;
      return `${days}g ${hours}s ${minutes}d`;
    }
    return uptime;
  };

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Database Size */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Veritabanı Boyutu
            </CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Database className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>PostgreSQL veritabanının toplam disk kullanımı</p>
                <p className="text-xs text-muted-foreground">
                  {dbStats?.database_size_bytes?.toLocaleString("tr-TR")} bytes
                </p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats?.database_size || "-"}</div>
            <p className="text-xs text-muted-foreground">PostgreSQL</p>
          </CardContent>
        </Card>

        {/* Active Connections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktif Bağlantı
            </CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Veritabanı bağlantı durumu</p>
                <div className="text-xs space-y-1 mt-1">
                  <p>Aktif: {connectionStats?.active || 0}</p>
                  <p>Idle: {connectionStats?.idle || 0}</p>
                  <p>Bekleyen: {connectionStats?.waiting || 0}</p>
                  <p>Idle in TX: {connectionStats?.idle_in_transaction || 0}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectionStats?.active || 0} / {connectionStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {connectionStats?.idle || 0} idle, {connectionStats?.waiting || 0} bekliyor
            </p>
          </CardContent>
        </Card>

        {/* Cache Hit Ratio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cache Hit Ratio
            </CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Veritabanı cache performansı</p>
                <p className="text-xs text-muted-foreground mt-1">
                  %99+ ideal performans göstergesidir
                </p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (dbStats?.cache_hit_ratio || 0) >= 99
                  ? "text-green-600"
                  : (dbStats?.cache_hit_ratio || 0) >= 95
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {dbStats?.cache_hit_ratio || 0}%
            </div>
            <Progress value={dbStats?.cache_hit_ratio || 0} className="mt-2" />
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Veritabanı çalışma süresi</p>
                <p className="text-xs text-muted-foreground mt-1">{dbStats?.uptime || "-"}</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(dbStats?.uptime || "")}</div>
            <p className="text-xs text-muted-foreground">Son yeniden başlatma</p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
