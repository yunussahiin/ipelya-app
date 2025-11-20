"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduled_at: string;
  status: "scheduled" | "sent" | "failed";
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

interface NotificationDistributionChartProps {
  notifications: ScheduledNotification[];
}

const chartConfig = {
  views: {
    label: "Bildirimler"
  },
  user: {
    label: "Kullanıcı",
    color: "var(--chart-1)"
  },
  creator: {
    label: "Creator",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

export function NotificationDistributionChart({
  notifications
}: NotificationDistributionChartProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof Omit<typeof chartConfig, "views">>("user");

  // Mock data - gerçek uygulamada notifications'dan gelecek
  const chartData = [
    { date: "Pazartesi", user: 12, creator: 8 },
    { date: "Salı", user: 15, creator: 10 },
    { date: "Çarşamba", user: 18, creator: 12 },
    { date: "Perşembe", user: 14, creator: 9 },
    { date: "Cuma", user: 20, creator: 15 },
    { date: "Cumartesi", user: 10, creator: 6 },
    { date: "Pazar", user: 8, creator: 5 }
  ];

  const total = React.useMemo(
    () => ({
      user: chartData.reduce((acc, curr) => acc + curr.user, 0),
      creator: chartData.reduce((acc, curr) => acc + curr.creator, 0)
    }),
    []
  );

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Bildirim Dağılımı</CardTitle>
          <CardDescription>Kullanıcı ve Yaratıcı bazında bildirim dağılımı</CardDescription>
        </div>
        <div className="flex">
          {["user", "creator"].map((key) => {
            const chart = key as keyof Omit<typeof chartConfig, "views">;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[chart].toLocaleString("tr-TR")}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  formatter={(value) => `${value} Bildirim`}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
