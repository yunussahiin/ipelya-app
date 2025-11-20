"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { TrendingUp as TrendingUpIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface HistoryChartProps {
  campaigns?: any[];
}

const chartConfig = {
  notifications: {
    label: "Bildirimler"
  },
  sent: {
    label: "Gönderildi",
    color: "var(--chart-1)"
  },
  failed: {
    label: "Başarısız",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

export function HistoryChart({ campaigns = [] }: HistoryChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d");
  const [chartData, setChartData] = useState<any[]>([]);

  // Kampanyalardan chart data'sını hesapla
  useEffect(() => {
    if (!campaigns || campaigns.length === 0) {
      setChartData([]);
      return;
    }

    // Tarihe göre grupla
    const groupedByDate: Record<string, { sent: number; failed: number }> = {};

    campaigns.forEach((campaign) => {
      const dateStr = format(new Date(campaign.created_at), "yyyy-MM-dd", { locale: tr });
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { sent: 0, failed: 0 };
      }
      groupedByDate[dateStr].sent += campaign.sent_count || 0;
      groupedByDate[dateStr].failed += campaign.failed_count || 0;
    });

    // Array'e çevir ve sırala
    const data = Object.entries(groupedByDate)
      .map(([date, values]) => ({
        date,
        sent: values.sent,
        failed: values.failed
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setChartData(data);
  }, [campaigns]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>📊 Bildirim Analizi</CardTitle>
          <CardDescription>
            Gönderilen ve başarısız bildirimlerin zaman içindeki dağılımı
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Zaman aralığı seçin"
          >
            <SelectValue placeholder="Son 3 ay" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Son 3 ay
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Son 30 gün
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Son 7 gün
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart accessibilityLayer data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return format(date, "dd MMM", { locale: tr });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return format(new Date(value), "dd MMMM yyyy", { locale: tr });
                  }}
                />
              }
            />
            <Bar dataKey="sent" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="failed" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Bildirim analizi <TrendingUpIcon className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Son {timeRange === "90d" ? "3 ay" : timeRange === "30d" ? "30 gün" : "7 gün"} içindeki
          gönderilen ve başarısız bildirimler
        </div>
      </CardFooter>
    </Card>
  );
}
