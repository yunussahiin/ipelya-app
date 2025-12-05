"use client";

/**
 * Günlük Oturum Grafiği
 * Son 7 günün video, audio ve çağrı istatistiklerini gösterir
 */

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
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

const chartConfig = {
  videoSessions: {
    label: "Video Yayınları",
    color: "hsl(var(--chart-1))"
  },
  audioSessions: {
    label: "Sesli Odalar",
    color: "hsl(var(--chart-2))"
  },
  calls: {
    label: "1-1 Çağrılar",
    color: "hsl(var(--chart-3))"
  }
} satisfies ChartConfig;

export function DailySessionsChart({ data }: DailySessionsChartProps) {
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
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    if (payload?.[0]?.payload?.date) {
                      return new Date(payload[0].payload.date).toLocaleDateString("tr-TR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long"
                      });
                    }
                    return value;
                  }}
                />
              }
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
