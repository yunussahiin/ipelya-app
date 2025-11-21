"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "An interactive area chart";

function generateChartData() {
  const data = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Rastgele veriler
    const ios = Math.floor(Math.random() * 200) + 50;
    const android = Math.floor(Math.random() * 300) + 80;
    const desktop = Math.floor(Math.random() * 400) + 100;

    data.push({ date: dateStr, ios, android, desktop });
  }

  return data;
}

const chartData = generateChartData();

const chartConfig = {
  visitors: {
    label: "Ziyaretçiler"
  },
  ios: {
    label: "iOS",
    color: "hsl(259, 80%, 60%)"
  },
  android: {
    label: "Android",
    color: "hsl(142, 76%, 36%)"
  },
  desktop: {
    label: "Masaüstü",
    color: "hsl(217, 91%, 60%)"
  }
} satisfies ChartConfig;

interface ChartDataPoint {
  date: string;
  ios: number;
  android: number;
  desktop: number;
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Toplam Ziyaretçiler</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Son 3 ayın toplamı</span>
          <span className="@[540px]/card:hidden">Son 3 ay</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Son 3 ay</ToggleGroupItem>
            <ToggleGroupItem value="30d">Son 30 gün</ToggleGroupItem>
            <ToggleGroupItem value="7d">Son 7 gün</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Zaman aralığı seç"
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
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
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
                      month: "short",
                      day: "numeric"
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="android"
              type="natural"
              fill="var(--color-android)"
              fillOpacity={0.4}
              stroke="var(--color-android)"
              stackId="a"
            />
            <Area
              dataKey="ios"
              type="natural"
              fill="var(--color-ios)"
              fillOpacity={0.6}
              stroke="var(--color-ios)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.2}
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
