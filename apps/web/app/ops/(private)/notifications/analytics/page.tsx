"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { LineChart, Line, PieChart, Pie, Label, Sector, XAxis, CartesianGrid } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
// ChartLegend ve ChartLegendContent line chart'ta kullanılıyor
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Loader2, TrendingUp, Send, CheckCircle, AlertCircle } from "lucide-react";

interface Campaign {
  id: string;
  type: "single" | "bulk" | "scheduled";
  title: string;
  status: "draft" | "scheduled" | "sent" | "failed" | "archived";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at?: string;
}

interface Stats {
  totalCampaigns: number;
  sentCampaigns: number;
  failedCampaigns: number;
  totalNotifications: number;
  deliveredNotifications: number;
  failedNotifications: number;
  averageDeliveryRate: number;
}

const chartConfig = {
  campaigns: {
    label: "Kampanya",
    color: "#3b82f6"
  },
  delivered: {
    label: "İletilen",
    color: "#10b981"
  }
} satisfies ChartConfig;

export default function NotificationAnalytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<
    Array<{ date: string; campaigns: number; notifications: number; delivered: number }>
  >([]);
  const [typeData, setTypeData] = useState<Array<{ name: string; value: number; fill: string }>>(
    []
  );
  const [activeType, setActiveType] = useState<string>("");

  const chartId = "campaign-type-chart";

  const pieChartConfig = {
    value: {
      label: "Kampanya Sayısı"
    },
    single: {
      label: "Tekil",
      color: "var(--chart-1)"
    },
    bulk: {
      label: "Toplu",
      color: "var(--chart-2)"
    },
    scheduled: {
      label: "Zamanlanmış",
      color: "var(--chart-3)"
    }
  } satisfies ChartConfig;

  const types = useMemo(() => typeData.map((item) => item.name), [typeData]);
  const activeIndex = useMemo(
    () => typeData.findIndex((item) => item.name === activeType),
    [activeType, typeData]
  );

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();

      // Load campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("notification_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (campaignsError) throw campaignsError;

      setCampaigns(campaignsData || []);

      // Calculate stats
      const totalCampaigns = campaignsData?.length || 0;
      const sentCampaigns = campaignsData?.filter((c) => c.status === "sent").length || 0;
      const failedCampaigns = campaignsData?.filter((c) => c.status === "failed").length || 0;

      const totalNotifications =
        campaignsData?.reduce((sum, c) => sum + c.total_recipients, 0) || 0;
      const deliveredNotifications = campaignsData?.reduce((sum, c) => sum + c.sent_count, 0) || 0;
      const failedNotifications = campaignsData?.reduce((sum, c) => sum + c.failed_count, 0) || 0;

      const averageDeliveryRate =
        totalNotifications > 0 ? (deliveredNotifications / totalNotifications) * 100 : 0;

      setStats({
        totalCampaigns,
        sentCampaigns,
        failedCampaigns,
        totalNotifications,
        deliveredNotifications,
        failedNotifications,
        averageDeliveryRate
      });

      // Prepare chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      const chartDataByDay = last7Days.map((date) => {
        const dayCampaigns =
          campaignsData?.filter((c) => c.created_at.split("T")[0] === date) || [];
        return {
          date: new Date(date).toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
          campaigns: dayCampaigns.length,
          notifications: dayCampaigns.reduce((sum, c) => sum + c.total_recipients, 0),
          delivered: dayCampaigns.reduce((sum, c) => sum + c.sent_count, 0)
        };
      });

      setChartData(chartDataByDay);

      // Prepare type data
      const typeStats = {
        single: campaignsData?.filter((c) => c.type === "single").length || 0,
        bulk: campaignsData?.filter((c) => c.type === "bulk").length || 0,
        scheduled: campaignsData?.filter((c) => c.type === "scheduled").length || 0
      };

      const newTypeData = [
        { name: "single", value: typeStats.single, fill: "var(--chart-1)" },
        { name: "bulk", value: typeStats.bulk, fill: "var(--chart-2)" },
        { name: "scheduled", value: typeStats.scheduled, fill: "var(--chart-3)" }
      ];

      setTypeData(newTypeData);
      setActiveType(newTypeData[0]?.name || "");
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bildirim Analytics</h1>
          <p className="text-gray-500 mt-1">Kampanya istatistikleri ve performans metrikleri</p>
        </div>
        <Button onClick={loadAnalytics}>Yenile</Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Kampanya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalCampaigns}</div>
                <Send className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.sentCampaigns} gönderildi, {stats.failedCampaigns} başarısız
              </p>
            </CardContent>
          </Card>

          {/* Total Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Bildirim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {stats.totalNotifications.toLocaleString()}
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.deliveredNotifications.toLocaleString()} iletildi
              </p>
            </CardContent>
          </Card>

          {/* Delivery Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                İletim Oranı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.averageDeliveryRate.toFixed(1)}%</div>
                <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.failedNotifications.toLocaleString()} başarısız
              </p>
            </CardContent>
          </Card>

          {/* Sent Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gönderilen Kampanya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.sentCampaigns}</div>
                <AlertCircle className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {((stats.sentCampaigns / stats.totalCampaigns) * 100).toFixed(1)}% başarı oranı
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7 Günlük Trend</CardTitle>
            <CardDescription>Kampanya ve bildirim aktivitesi</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="campaigns"
                  stroke="var(--color-campaigns)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-campaigns)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="var(--color-delivered)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-delivered)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Campaign Type Distribution */}
        <Card data-chart={chartId} className="flex flex-col">
          <ChartStyle id={chartId} config={pieChartConfig} />
          <CardHeader className="flex-row items-start space-y-0 pb-0">
            <div className="grid gap-1">
              <CardTitle>Kampanya Türleri</CardTitle>
              <CardDescription>Dağılım</CardDescription>
            </div>
            <Select value={activeType} onValueChange={setActiveType}>
              <SelectTrigger
                className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                aria-label="Kampanya türü seç"
              >
                <SelectValue placeholder="Tür seç" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl">
                {types.map((key) => {
                  const config = pieChartConfig[key as keyof typeof pieChartConfig];

                  if (!config) {
                    return null;
                  }

                  return (
                    <SelectItem key={key} value={key} className="rounded-lg [&_span]:flex">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="flex h-3 w-3 shrink-0 rounded-xs"
                          style={{
                            backgroundColor: `var(--color-${key})`
                          }}
                        />
                        {config?.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex flex-1 justify-center pb-0">
            <ChartContainer
              id={chartId}
              config={pieChartConfig}
              className="mx-auto aspect-square w-full max-w-[300px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                  activeIndex={activeIndex}
                  activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                    <g>
                      <Sector {...props} outerRadius={outerRadius + 10} />
                      <Sector
                        {...props}
                        outerRadius={outerRadius + 25}
                        innerRadius={outerRadius + 12}
                      />
                    </g>
                  )}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const activeData = typeData[activeIndex];
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {activeData?.value.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              {
                                pieChartConfig[activeData?.name as keyof typeof pieChartConfig]
                                  ?.label
                              }
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Son Kampanyalar</CardTitle>
          <CardDescription>En son 10 kampanya</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Başlık</TableHead>
                  <TableHead className="text-left">Tür</TableHead>
                  <TableHead className="text-left">Durum</TableHead>
                  <TableHead className="text-right">Alıcı</TableHead>
                  <TableHead className="text-right">İletilen</TableHead>
                  <TableHead className="text-right">Başarısız</TableHead>
                  <TableHead className="text-right">Oran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 10).map((campaign) => {
                  const deliveryRate =
                    campaign.total_recipients > 0
                      ? ((campaign.sent_count / campaign.total_recipients) * 100).toFixed(1)
                      : "0";

                  const statusBadgeClass = {
                    sent: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                    scheduled: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
                    failed: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
                    draft: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    archived:
                      "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                  };

                  const typeBadgeClass =
                    "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";

                  return (
                    <TableRow key={campaign.id} className="hover:bg-accent">
                      <TableCell className="font-medium truncate max-w-xs">
                        {campaign.title}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${typeBadgeClass}`}>
                          {campaign.type === "single"
                            ? "Tekil"
                            : campaign.type === "bulk"
                              ? "Toplu"
                              : "Zamanlanmış"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            statusBadgeClass[campaign.status as keyof typeof statusBadgeClass] ||
                            statusBadgeClass.draft
                          }`}
                        >
                          {campaign.status === "sent"
                            ? "Gönderildi"
                            : campaign.status === "scheduled"
                              ? "Zamanlanmış"
                              : campaign.status === "failed"
                                ? "Başarısız"
                                : campaign.status === "archived"
                                  ? "Arşivlendi"
                                  : "Taslak"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.total_recipients.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                        {campaign.sent_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                        {campaign.failed_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">{deliveryRate}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
