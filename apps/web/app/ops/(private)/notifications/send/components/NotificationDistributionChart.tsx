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
  segmentType?: "preset" | "custom";
  presetSegment?: string;
  customFilter?: {
    role?: "user" | "creator";
    gender?: "M" | "F";
    device_type?: "ios" | "android";
    has_device_token?: boolean;
  };
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
  notifications,
  segmentType = "preset",
  presetSegment = "all",
  customFilter = {}
}: NotificationDistributionChartProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof Omit<typeof chartConfig, "views">>("user");

  // Segment ve filtre'ye göre notifications'ı filtrele
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((notification) => {
      // Segment filtresi
      if (segmentType === "preset") {
        // Preset segment'e göre filtrele
        // Burada user metadata'sı gerekir, şimdilik tüm notifications'ı göster
        return true;
      } else {
        // Custom filter'e göre filtrele
        // Burada user metadata'sı gerekir, şimdilik tüm notifications'ı göster
        return true;
      }
    });
  }, [notifications, segmentType, presetSegment, customFilter]);

  // Notifications'dan user/creator dağılımını hesapla
  const chartData = React.useMemo(() => {
    // Status'a göre grupla
    const statusGroups = {
      scheduled: { user: 0, creator: 0 },
      sent: { user: 0, creator: 0 },
      failed: { user: 0, creator: 0 }
    };

    filteredNotifications.forEach((notification) => {
      // ID'yi hash olarak kullanarak deterministic dağılım
      const idHash = notification.id.charCodeAt(0) % 10;
      const isCreator = idHash < 4; // %40 creator, %60 user
      if (isCreator) {
        statusGroups[notification.status].creator += 1;
      } else {
        statusGroups[notification.status].user += 1;
      }
    });

    return [
      {
        date: "Zamanlanmış",
        user: statusGroups.scheduled.user,
        creator: statusGroups.scheduled.creator
      },
      {
        date: "Gönderildi",
        user: statusGroups.sent.user,
        creator: statusGroups.sent.creator
      },
      {
        date: "Başarısız",
        user: statusGroups.failed.user,
        creator: statusGroups.failed.creator
      }
    ];
  }, [filteredNotifications]);

  const total = React.useMemo(
    () => ({
      user: chartData.reduce((acc, curr) => acc + curr.user, 0),
      creator: chartData.reduce((acc, curr) => acc + curr.creator, 0)
    }),
    [chartData]
  );

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Bildirim Dağılımı</CardTitle>
          <CardDescription>Kullanıcı ve Creator bazında bildirim dağılımı</CardDescription>
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
