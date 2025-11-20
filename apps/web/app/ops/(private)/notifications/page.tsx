"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Send, History, FileText } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, LineChart, Line } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

// Sample data for charts
const campaignData = [
  { date: "Pazartesi", sent: 45, scheduled: 12, failed: 2 },
  { date: "Salı", sent: 52, scheduled: 15, failed: 1 },
  { date: "Çarşamba", sent: 38, scheduled: 10, failed: 3 },
  { date: "Perşembe", sent: 61, scheduled: 18, failed: 0 },
  { date: "Cuma", sent: 55, scheduled: 20, failed: 2 },
  { date: "Cumartesi", sent: 48, scheduled: 8, failed: 1 },
  { date: "Pazar", sent: 42, scheduled: 5, failed: 0 }
];

const engagementData = [
  { date: "1 Hf", rate: 65 },
  { date: "2 Hf", rate: 72 },
  { date: "3 Hf", rate: 68 },
  { date: "4 Hf", rate: 78 },
  { date: "5 Hf", rate: 82 },
  { date: "6 Hf", rate: 75 },
  { date: "7 Hf", rate: 88 }
];

const chartConfig = {
  sent: {
    label: "Gönderilen",
    color: "#10b981"
  },
  scheduled: {
    label: "Zamanlanmış",
    color: "#3b82f6"
  },
  failed: {
    label: "Başarısız",
    color: "#ef4444"
  }
} satisfies ChartConfig;

const engagementConfig = {
  rate: {
    label: "Katılım Oranı (%)",
    color: "#8b5cf6"
  }
} satisfies ChartConfig;

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bildirim Yönetimi</h1>
        <p className="text-muted-foreground mt-2">
          Kullanıcılara bildirim gönderin, geçmişi görüntüleyin ve şablonları yönetin
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Send Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              <CardTitle>Bildirim Gönder</CardTitle>
            </div>
            <CardDescription>Tekil, toplu veya zamanlanmış bildirimler gönderin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Kullanıcılara hemen veya belirli bir zamanda bildirim gönderin. Tekil kullanıcılar
              veya segmentler için desteklenir.
            </p>
            <Link href="/ops/notifications/send">
              <Button className="w-full">
                Gönder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-green-600" />
              <CardTitle>Geçmiş</CardTitle>
            </div>
            <CardDescription>Gönderilen bildirimleri görüntüleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Tüm bildirim kampanyalarının geçmişini, durumunu ve istatistiklerini görüntüleyin.
            </p>
            <Link href="/ops/notifications/history">
              <Button className="w-full" variant="outline">
                Geçmişi Görüntüle
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Templates Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <CardTitle>Şablonlar</CardTitle>
            </div>
            <CardDescription>Bildirim şablonlarını yönetin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Sık kullanılan bildirim şablonlarını oluşturun, düzenleyin ve silin.
            </p>
            <Link href="/ops/notifications/templates">
              <Button className="w-full" variant="outline">
                Şablonları Yönet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kampanya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-gray-500 mt-1">+12 bu ay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gönderilen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-gray-500 mt-1">+180 bu hafta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Zamanlanmış</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-gray-500 mt-1">Sonraki 7 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Şablonlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-gray-500 mt-1">Aktif şablonlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Kampanya Durumu (7 Gün)</CardTitle>
            <CardDescription>Gönderilen, zamanlanmış ve başarısız bildirimler</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={campaignData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sent" fill="var(--color-sent)" radius={4} />
                <Bar dataKey="scheduled" fill="var(--color-scheduled)" radius={4} />
                <Bar dataKey="failed" fill="var(--color-failed)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Engagement Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Katılım Oranı Trendi</CardTitle>
            <CardDescription>Haftalık ortalama katılım oranı</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={engagementConfig} className="h-[300px] w-full">
              <LineChart data={engagementData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--color-rate)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-rate)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
