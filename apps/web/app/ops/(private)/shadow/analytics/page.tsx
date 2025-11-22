"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SessionsChart } from "@/components/ops/sessions-chart";
import { AuthSuccessChart } from "@/components/ops/auth-success-chart";
import { FailedAttemptsChart } from "@/components/ops/failed-attempts-chart";
import { AnomalySeverityChart } from "@/components/ops/anomaly-severity-chart";
import { DeviceTypeChart } from "@/components/ops/device-type-chart";
import { HelpCircle } from "lucide-react";

type Period = "24h" | "7d" | "30d" | "90d";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");

  const { data: analytics } = useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/ops/shadow/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    }
  });

  const metrics = analytics?.metrics || {};

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analitikler</h1>
            <p className="text-muted-foreground mt-2">
              Shadow profil aktivite analitikleri ve trendleri
            </p>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Son 24 Saat</SelectItem>
              <SelectItem value="7d">Son 7 Gün</SelectItem>
              <SelectItem value="30d">Son 30 Gün</SelectItem>
              <SelectItem value="90d">Son 90 Gün</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Oturumlar
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Seçilen dönem içinde oluşturulan tüm shadow mod oturumları</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_sessions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.unique_users || 0} benzersiz kullanıcı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aktif Oturumlar
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Şu anda devam eden shadow mod oturumları</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_sessions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tepe: {metrics.peak_concurrent_users || 0} eş zamanlı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kimlik Doğrulama Başarısı
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Başarılı kimlik doğrulama denemelerinin yüzdesi</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(100 - (metrics.failure_rate || 0)).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.failed_authentications || 0} başarısız
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ort. Oturum Süresi
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shadow mod oturumlarının ortalama süresi (dakika cinsinden)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.average_session_duration_minutes || 0}d
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.successful_authentications || 0} başarılı doğrulama
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SessionsChart period={period} />
          <AuthSuccessChart period={period} />
        </div>

        {/* Detailed Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Ayrıntılı Bilgiler</CardTitle>
            <CardDescription>Dönem: {period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Toplam Oturumlar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Seçilen dönem içinde oluşturulan tüm oturumlar</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.total_sessions || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Aktif Oturumlar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Şu anda devam eden oturumlar</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.active_sessions || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Başarılı Doğrulamalar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Başarıyla tamamlanan kimlik doğrulama denemeleri</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.successful_authentications || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Başarısız Doğrulamalar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Başarısız kimlik doğrulama denemeleri</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.failed_authentications || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Başarısızlık Oranı</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Başarısız doğrulama denemelerinin yüzdesi</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">{(metrics.failure_rate || 0).toFixed(2)}%</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Benzersiz Kullanıcılar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shadow mod kullanan farklı kullanıcı sayısı</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.unique_users || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Ort. Oturum Süresi</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Oturumların ortalama süresi (dakika cinsinden)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">
                  {metrics.average_session_duration_minutes || 0}d
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Tepe Eş Zamanlı Kullanıcılar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Aynı anda en fazla aktif olan kullanıcı sayısı</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.peak_concurrent_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grafikler */}
        <div className="grid gap-6 md:grid-cols-2">
          <SessionsChart period={period} />
          <AuthSuccessChart period={period} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FailedAttemptsChart period={period} />
          <DeviceTypeChart />
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <AnomalySeverityChart />
        </div>
      </div>
    </TooltipProvider>
  );
}
