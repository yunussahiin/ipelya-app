"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Info } from "lucide-react";
import type { ConnectionStats, TableSize, IndexUsage } from "../types";

// Chart colors
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)"
];

interface OverviewTabProps {
  connectionStats: ConnectionStats | null;
  tableSizes: TableSize[];
  indexUsage?: IndexUsage[];
}

export function OverviewTab({ connectionStats, tableSizes, indexUsage = [] }: OverviewTabProps) {
  // Prepare connection chart data
  const connectionChartData = useMemo(() => {
    if (!connectionStats?.by_application) return [];
    return Object.entries(connectionStats.by_application)
      .map(([name, value], index) => ({
        name: name.length > 15 ? name.slice(0, 15) + "..." : name,
        fullName: name,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [connectionStats]);

  // Prepare table size chart data
  const tableSizeChartData = useMemo(() => {
    return tableSizes.slice(0, 6).map((table, index) => ({
      name: table.table_name,
      size: Math.round(table.total_size_bytes / 1024), // KB
      rows: table.row_count,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [tableSizes]);

  // Prepare index usage chart data
  const indexChartData = useMemo(() => {
    return indexUsage.slice(0, 6).map((idx, index) => ({
      name: idx.index_name.length > 20 ? idx.index_name.slice(0, 20) + "..." : idx.index_name,
      fullName: idx.index_name,
      scans: idx.index_scans,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [indexUsage]);

  // Chart configs
  const connectionChartConfig: ChartConfig = {
    value: {
      label: "Bağlantı"
    }
  };

  const tableSizeChartConfig: ChartConfig = {
    size: {
      label: "Boyut (KB)"
    }
  };

  const indexChartConfig: ChartConfig = {
    scans: {
      label: "Tarama"
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Top Row - Connection Stats & Table Sizes */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Connection by Application - Pie Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Uygulama Bağlantıları</CardTitle>
                <CardDescription>Veritabanı bağlantı dağılımı</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Veritabanına bağlı uygulamalar</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    postgrest: API, realtime: WebSocket
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              {connectionChartData.length > 0 ? (
                <ChartContainer config={connectionChartConfig} className="mx-auto h-[200px]">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const data = payload?.[0]?.payload;
                            return data?.fullName || data?.name || "";
                          }}
                        />
                      }
                    />
                    <Pie
                      data={connectionChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {connectionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Bağlantı verisi yok
                </p>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {connectionChartData.map((item, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className="text-xs cursor-help"
                        style={{ borderColor: item.fill }}
                      >
                        <span
                          className="w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: item.fill }}
                        />
                        {item.name}: {item.value}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">{item.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {getAppDescription(item.fullName)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table Sizes - Bar Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Tablo Boyutları</CardTitle>
                <CardDescription>En büyük tablolar (KB)</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Disk kullanımına göre tablolar</p>
                  <p className="text-xs text-muted-foreground mt-1">Tablo + İndeks boyutu</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              {tableSizeChartData.length > 0 ? (
                <ChartContainer config={tableSizeChartConfig} className="h-[200px]">
                  <BarChart
                    data={tableSizeChartData}
                    layout="vertical"
                    margin={{ left: 0, right: 10 }}
                  >
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, props) => {
                            const data = props?.payload;
                            return (
                              <div className="space-y-1">
                                <p>
                                  <strong>Boyut:</strong> {value} KB
                                </p>
                                <p>
                                  <strong>Satır:</strong>{" "}
                                  {data?.rows >= 0 ? data.rows.toLocaleString("tr-TR") : "~"}
                                </p>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Bar dataKey="size" radius={4}>
                      {tableSizeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Tablo verisi yok</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Index Usage */}
        {indexChartData.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">En Çok Kullanılan İndeksler</CardTitle>
                <CardDescription>Tarama sayısına göre</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>İndeks tarama istatistikleri</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yüksek tarama = sık kullanılan indeks
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <ChartContainer config={indexChartConfig} className="h-[200px]">
                <BarChart data={indexChartData} margin={{ left: 0, right: 10 }}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          const data = payload?.[0]?.payload;
                          return data?.fullName || data?.name || "";
                        }}
                      />
                    }
                  />
                  <Bar dataKey="scans" radius={[4, 4, 0, 0]}>
                    {indexChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

function getAppDescription(app: string): string {
  const descriptions: Record<string, string> = {
    postgrest: "PostgREST API sunucusu",
    realtime_connect: "Realtime WebSocket bağlantısı",
    realtime_subscription_checker: "Realtime abonelik kontrolü",
    realtime_subscription_manager: "Realtime abonelik yönetimi",
    realtime_subscription_manager_pub: "Realtime yayın yönetimi",
    realtime_replication_connection: "Realtime replikasyon",
    pg_cron_scheduler: "Zamanlanmış görev yöneticisi",
    "pg_cron scheduler": "Zamanlanmış görev yöneticisi",
    postgres_exporter: "Prometheus metrikleri",
    "pg_net 0.19.5": "HTTP istekleri için pg_net extension",
    undefined: "Tanımsız bağlantı"
  };
  return descriptions[app] || "Bilinmeyen uygulama";
}
