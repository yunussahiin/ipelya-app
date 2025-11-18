"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

const chartData = [
  { date: "2025-01-01", gelir: 4200, gider: 1800 },
  { date: "2025-01-02", gelir: 3800, gider: 1600 },
  { date: "2025-01-03", gelir: 5100, gider: 2100 },
  { date: "2025-01-04", gelir: 4600, gider: 1900 },
  { date: "2025-01-05", gelir: 6200, gider: 2400 },
  { date: "2025-01-06", gelir: 5800, gider: 2200 },
  { date: "2025-01-07", gelir: 4900, gider: 2000 },
  { date: "2025-01-08", gelir: 7100, gider: 2800 },
  { date: "2025-01-09", gelir: 3200, gider: 1500 },
  { date: "2025-01-10", gelir: 5400, gider: 2100 },
  { date: "2025-01-11", gelir: 6800, gider: 2600 },
  { date: "2025-01-12", gelir: 5200, gider: 2000 },
  { date: "2025-01-13", gelir: 7400, gider: 2900 },
  { date: "2025-01-14", gelir: 4100, gider: 1700 },
  { date: "2025-01-15", gelir: 3900, gider: 1600 },
  { date: "2025-01-16", gelir: 4300, gider: 1800 },
  { date: "2025-01-17", gelir: 8200, gider: 3200 },
  { date: "2025-01-18", gelir: 7600, gider: 3000 },
  { date: "2025-01-19", gelir: 5100, gider: 2100 },
  { date: "2025-01-20", gelir: 3600, gider: 1500 },
  { date: "2025-01-21", gelir: 4500, gider: 1900 },
  { date: "2025-01-22", gelir: 5300, gider: 2100 },
  { date: "2025-01-23", gelir: 4700, gider: 1900 },
  { date: "2025-01-24", gelir: 7800, gider: 3000 },
  { date: "2025-01-25", gelir: 5900, gider: 2300 },
  { date: "2025-01-26", gelir: 3400, gider: 1400 },
  { date: "2025-01-27", gelir: 8400, gider: 3300 },
  { date: "2025-01-28", gelir: 4200, gider: 1700 },
  { date: "2025-01-29", gelir: 6600, gider: 2500 },
  { date: "2025-01-30", gelir: 9200, gider: 3600 }
];

const chartConfig = {
  gelir: {
    label: "Gelir",
    color: "hsl(var(--chart-1))"
  },
  gider: {
    label: "Gider",
    color: "hsl(var(--chart-2))"
  }
} satisfies ChartConfig;

export function RevenueChart() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("gelir");

  const total = React.useMemo(
    () => ({
      gelir: chartData.reduce((acc, curr) => acc + curr.gelir, 0),
      gider: chartData.reduce((acc, curr) => acc + curr.gider, 0)
    }),
    []
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Gelir Grafiği</CardTitle>
          <CardDescription>Son 30 günlük gelir ve gider trendi</CardDescription>
        </div>
        <div className="flex">
          {["gelir", "gider"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">{chartConfig[chart].label}</span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  ₺{total[key as keyof typeof total].toLocaleString("tr-TR")}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("tr-TR", {
                  month: "short",
                  day: "numeric"
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("tr-TR", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={activeChart}
              type="natural"
              fill={`var(--color-${activeChart})`}
              fillOpacity={0.4}
              stroke={`var(--color-${activeChart})`}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
