// Türkçe başlık ve açıklamalar için metadata kullanılabilir
"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, AlertTriangle, AlertCircle, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { MetricCard } from "@/components/ops/metric-card";
import { SessionsChart } from "@/components/ops/sessions-chart";
import { AuthSuccessChart } from "@/components/ops/auth-success-chart";
import { AnomaliesAlert } from "@/components/ops/anomalies-alert";
import { SessionsTable } from "@/components/ops/sessions-table";

export default function ShadowDashboard() {
  const { data: analytics } = useQuery({
    queryKey: ["analytics", "7d"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/analytics?period=7d");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    }
  });

  const { data: rateLimits } = useQuery({
    queryKey: ["rate-limits"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/rate-limits");
      if (!res.ok) throw new Error("Failed to fetch rate limits");
      return res.json();
    }
  });

  const { data: anomalies } = useQuery({
    queryKey: ["anomalies"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/anomalies?limit=10");
      if (!res.ok) throw new Error("Failed to fetch anomalies");
      return res.json();
    }
  });

  const metrics = analytics?.metrics || {};
  const activeSessions = metrics.active_sessions || 0;
  const failedAuths = metrics.failed_authentications || 0;
  const activeAnomalies = anomalies?.active || 0;
  const lockedUsers =
    (rateLimits?.pin_attempts?.locked_users || 0) +
    (rateLimits?.biometric_attempts?.locked_users || 0);

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Başlık */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shadow Profil Kontrol Paneli</h1>
          <p className="text-muted-foreground mt-2">
            Gerçek zamanlı shadow profil aktivitesi ve güvenlik metrikleri
          </p>
        </div>

        {/* Metrik Kartları */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <div className="absolute top-0 right-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Şu anda devam eden shadow mod oturumlarının sayısı</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <MetricCard
              title="Aktif Oturumlar"
              value={activeSessions}
              trend="+12%"
              icon={<Users className="h-4 w-4" />}
            />
          </div>
          <div className="relative">
            <div className="absolute top-0 right-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Başarısız kimlik doğrulama denemelerinin sayısı</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <MetricCard
              title="Başarısız Kimlik Doğrulama"
              value={failedAuths}
              trend="-5%"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>
          <div className="relative">
            <div className="absolute top-0 right-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Şu anda aktif olan güvenlik anomalilerinin sayısı</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <MetricCard
              title="Aktif Anomaliler"
              value={activeAnomalies}
              trend="+2"
              icon={<AlertCircle className="h-4 w-4" />}
            />
          </div>
          <div className="relative">
            <div className="absolute top-0 right-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hız sınırlaması nedeniyle kilitli olan kullanıcıların sayısı</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <MetricCard
              title="Kilitli Kullanıcılar"
              value={lockedUsers}
              trend="0"
              icon={<Lock className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid gap-6 md:grid-cols-2">
          <SessionsChart period="7d" />
          <AuthSuccessChart period="7d" />
        </div>

        {/* Son Aktiviteler */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnomaliesAlert />
          <SessionsTable />
        </div>
      </div>
    </TooltipProvider>
  );
}
