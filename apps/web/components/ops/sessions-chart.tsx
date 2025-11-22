"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

interface SessionsChartProps {
  period: "24h" | "7d" | "30d" | "90d";
}

const chartConfig = {
  count: {
    label: "Oturumlar",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

export function SessionsChart({ period }: SessionsChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions-chart", period],
    queryFn: async () => {
      const res = await fetch(`/api/ops/shadow/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch chart data");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessions Over Time</CardTitle>
          <CardDescription>Last {period}</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Use test data if no real data
  const defaultData = [
    { time: "00:00", count: 12 },
    { time: "01:00", count: 8 },
    { time: "02:00", count: 5 },
    { time: "03:00", count: 3 },
    { time: "04:00", count: 4 },
    { time: "05:00", count: 6 },
    { time: "06:00", count: 15 },
    { time: "07:00", count: 28 },
    { time: "08:00", count: 42 },
    { time: "09:00", count: 38 },
    { time: "10:00", count: 45 },
    { time: "11:00", count: 52 },
    { time: "12:00", count: 48 },
    { time: "13:00", count: 55 },
    { time: "14:00", count: 50 },
    { time: "15:00", count: 43 },
    { time: "16:00", count: 39 },
    { time: "17:00", count: 35 },
    { time: "18:00", count: 32 },
    { time: "19:00", count: 28 },
    { time: "20:00", count: 22 },
    { time: "21:00", count: 18 },
    { time: "22:00", count: 14 },
    { time: "23:00", count: 10 }
  ];

  const chartData = data?.sessions_over_time?.length ? data.sessions_over_time : defaultData;
  const periodLabel =
    period === "24h"
      ? "24 saat"
      : period === "7d"
        ? "7 gün"
        : period === "30d"
          ? "30 gün"
          : "90 gün";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Oturum Trendleri
          {!data?.sessions_over_time?.length && (
            <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-500">
              (Test Verisi)
            </span>
          )}
        </CardTitle>
        <CardDescription>Son {periodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <LineChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--color-sessions)"
              strokeWidth={2}
              dot={false}
              name="Oturumlar"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
