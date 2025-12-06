"use client";

/**
 * Günlük Oturum Grafiği
 * Son 7 günün video, audio ve çağrı istatistiklerini gösterir
 */

import { useTheme } from "next-themes";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyData {
  date: string;
  dayName: string;
  videoSessions: number;
  audioSessions: number;
  calls: number;
  totalViewers: number;
  totalDuration: number;
}

interface DailySessionsChartProps {
  data: DailyData[];
}

// Light ve Dark mode için ayrı renkler
const CHART_COLORS = {
  light: {
    video: "#3b82f6", // blue-500
    audio: "#22c55e", // green-500
    calls: "#f97316" // orange-500
  },
  dark: {
    video: "#60a5fa", // blue-400
    audio: "#4ade80", // green-400
    calls: "#fb923c" // orange-400
  }
};

export function DailySessionsChart({ data }: DailySessionsChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const chartConfig: ChartConfig = {
    videoSessions: {
      label: "Video Yayınları",
      color: colors.video
    },
    audioSessions: {
      label: "Sesli Odalar",
      color: colors.audio
    },
    calls: {
      label: "1-1 Çağrılar",
      color: colors.calls
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Haftalık Oturum Trendi</CardTitle>
        <CardDescription>Son 7 günün canlı yayın istatistikleri</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="dayName" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload;
                if (!data) return null;

                const dateStr = new Date(data.date).toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                });

                return (
                  <div className="rounded-lg border bg-card p-3 shadow-lg">
                    <p className="font-semibold text-card-foreground mb-2">{dateStr}</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: colors.video }}
                          />
                          <span className="text-muted-foreground">Video Yayınları</span>
                        </div>
                        <span className="font-medium text-card-foreground">
                          {data.videoSessions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: colors.audio }}
                          />
                          <span className="text-muted-foreground">Sesli Odalar</span>
                        </div>
                        <span className="font-medium text-card-foreground">
                          {data.audioSessions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: colors.calls }}
                          />
                          <span className="text-muted-foreground">1-1 Çağrılar</span>
                        </div>
                        <span className="font-medium text-card-foreground">{data.calls}</span>
                      </div>
                      <div className="border-t pt-1.5 mt-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Toplam</span>
                          <span className="font-semibold text-card-foreground">
                            {data.videoSessions + data.audioSessions + data.calls}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="videoSessions"
              type="monotone"
              fill="var(--color-videoSessions)"
              fillOpacity={0.4}
              stroke="var(--color-videoSessions)"
              stackId="a"
            />
            <Area
              dataKey="audioSessions"
              type="monotone"
              fill="var(--color-audioSessions)"
              fillOpacity={0.4}
              stroke="var(--color-audioSessions)"
              stackId="a"
            />
            <Area
              dataKey="calls"
              type="monotone"
              fill="var(--color-calls)"
              fillOpacity={0.4}
              stroke="var(--color-calls)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
