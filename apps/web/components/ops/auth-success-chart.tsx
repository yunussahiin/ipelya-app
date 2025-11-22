"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";

interface AuthSuccessChartProps {
  period: "24h" | "7d" | "30d" | "90d";
}

const chartConfig = {
  successful: {
    label: "Başarılı",
    color: "var(--chart-1)"
  },
  failed: {
    label: "Başarısız",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

export function AuthSuccessChart({ period }: AuthSuccessChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-success-chart", period],
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
          <CardTitle>Authentication Success Rate</CardTitle>
          <CardDescription>Last {period}</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const successful = data?.metrics?.successful_authentications || 0;
  const failed = data?.metrics?.failed_authentications || 0;

  const chartData = [
    {
      name: "Başarılı",
      value: successful || 45,
      fill: "var(--chart-1)"
    },
    {
      name: "Başarısız",
      value: failed || 15,
      fill: "var(--chart-2)"
    }
  ];

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
          Kimlik Doğrulama Başarısı
          {successful === 0 && failed === 0 && (
            <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-500">
              (Test Verisi)
            </span>
          )}
        </CardTitle>
        <CardDescription>Son {periodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
