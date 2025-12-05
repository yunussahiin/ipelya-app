"use client";

/**
 * LiveKit Quota & Alerts Sayfası
 * Kota kullanımı ve sistem uyarıları
 */

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface QuotaUsage {
  name: string;
  used: number;
  limit: number;
  unit: string;
  percentage: number;
  status: "normal" | "warning" | "critical";
}

interface Alert {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  source: string;
  created_at: string;
  resolved_at: string | null;
  is_resolved: boolean;
}

interface SystemHealth {
  livekit: "healthy" | "degraded" | "down";
  supabase: "healthy" | "degraded" | "down";
  realtime: "healthy" | "degraded" | "down";
  lastCheck: string;
}

export default function AlertsPage() {
  const [quotas, setQuotas] = useState<QuotaUsage[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live/system-status");
      if (!response.ok) {
        throw new Error("API error");
      }

      const data = await response.json();

      // API'den gelen verileri state'e aktar
      setQuotas(data.quotas || []);
      setAlerts(data.alerts || []);
      setSystemHealth(data.health || null);
    } catch (error) {
      console.error("Data fetch error:", error);
      // Hata durumunda sistem durumunu down olarak işaretle
      setSystemHealth({
        livekit: "down",
        supabase: "down",
        realtime: "down",
        lastCheck: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (status: "normal" | "warning" | "critical") => {
    switch (status) {
      case "normal":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
    }
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "info":
        return <Bell className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getHealthIcon = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kota & Uyarılar</h1>
          <p className="text-muted-foreground">LiveKit kota kullanımı ve sistem uyarıları</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* System Health */}
      {systemHealth && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Sistem Durumu
            </CardTitle>
            <CardDescription>
              Son kontrol:{" "}
              {formatDistanceToNow(new Date(systemHealth.lastCheck), {
                addSuffix: true,
                locale: tr
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {getHealthIcon(systemHealth.livekit)}
                <div>
                  <p className="font-medium">LiveKit Cloud</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {systemHealth.livekit === "healthy" ? "Çalışıyor" : systemHealth.livekit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {getHealthIcon(systemHealth.supabase)}
                <div>
                  <p className="font-medium">Supabase</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {systemHealth.supabase === "healthy" ? "Çalışıyor" : systemHealth.supabase}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {getHealthIcon(systemHealth.realtime)}
                <div>
                  <p className="font-medium">Realtime</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {systemHealth.realtime === "healthy" ? "Çalışıyor" : systemHealth.realtime}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="quotas">
        <TabsList>
          <TabsTrigger value="quotas" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Kota Kullanımı
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Uyarılar
            {alerts.filter((a) => !a.is_resolved).length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {alerts.filter((a) => !a.is_resolved).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quotas.map((quota) => (
              <Card key={quota.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{quota.name}</CardTitle>
                    <Badge
                      variant={
                        quota.status === "normal"
                          ? "outline"
                          : quota.status === "warning"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {quota.status === "normal"
                        ? "Normal"
                        : quota.status === "warning"
                          ? "Uyarı"
                          : "Kritik"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {quota.used.toLocaleString()} / {quota.limit.toLocaleString()} {quota.unit}
                      </span>
                      <span className="font-medium">{quota.percentage}%</span>
                    </div>
                    <Progress
                      value={quota.percentage}
                      className={`h-2 ${
                        quota.status === "critical"
                          ? "[&>div]:bg-red-500"
                          : quota.status === "warning"
                            ? "[&>div]:bg-yellow-500"
                            : ""
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kota Özeti */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kota Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kota</TableHead>
                    <TableHead>Kullanım</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => (
                    <TableRow key={quota.name}>
                      <TableCell className="font-medium">{quota.name}</TableCell>
                      <TableCell>
                        {quota.used.toLocaleString()} {quota.unit}
                      </TableCell>
                      <TableCell>
                        {quota.limit.toLocaleString()} {quota.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(quota.status)}`} />
                          <span>{quota.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Aktif Uyarılar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Aktif Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.filter((a) => !a.is_resolved).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Aktif uyarı yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts
                    .filter((a) => !a.is_resolved)
                    .map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{alert.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(alert.created_at), {
                                addSuffix: true,
                                locale: tr
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {alert.source}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Geçmiş Uyarılar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Geçmiş Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip</TableHead>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Kaynak</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Çözüm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts
                    .filter((a) => a.is_resolved)
                    .map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{getAlertIcon(alert.type)}</TableCell>
                        <TableCell className="font-medium">{alert.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.source}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.created_at), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </TableCell>
                        <TableCell>
                          {alert.resolved_at && (
                            <span className="text-green-600 text-sm">
                              {formatDistanceToNow(new Date(alert.resolved_at), {
                                addSuffix: true,
                                locale: tr
                              })}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
