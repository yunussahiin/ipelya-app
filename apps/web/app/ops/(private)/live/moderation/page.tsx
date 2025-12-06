"use client";

/**
 * Canlı Yayın Moderasyon Paneli
 * Şikayetler ve yasaklar yönetimi
 */

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertTriangle, Ban, CheckCircle, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ReportsQueue } from "@/components/ops/live/reports-queue";
import { BansTable } from "@/components/ops/live/bans-table";
import { AdminLogsDataTable, columns as adminLogsColumns, type AdminLog } from "./admin-logs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Session {
  id: string;
  title: string;
  type: string;
  status: string;
}

interface Report {
  id: string;
  session_id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  action_taken: string | null;
  created_at: string;
  reporter: Profile | null;
  reported_user: Profile | null;
  session: Session | null;
}

interface BanRecord {
  id: string;
  session_id: string | null;
  user_id: string;
  banned_by: string;
  reason: string;
  ban_type: string;
  is_permanent: boolean;
  expires_at: string | null;
  lifted_at: string | null;
  created_at: string;
  user: Profile | null;
  banned_by_user: Profile | null;
  session: Session | null;
}

interface StatusCounts {
  pending: number;
  resolved: number;
  dismissed: number;
}

interface BanTypeCounts {
  session: number;
  creator: number;
  global: number;
  total: number;
}

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    resolved: 0,
    dismissed: 0
  });
  const [banTypeCounts, setBanTypeCounts] = useState<BanTypeCounts>({
    session: 0,
    creator: 0,
    global: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportFilter, setReportFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [adminLogsLoading, setAdminLogsLoading] = useState(false);
  const [adminLogsTotalCount, setAdminLogsTotalCount] = useState(0);
  const [selectedAdminLog, setSelectedAdminLog] = useState<AdminLog | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(`/api/ops/live/reports?status=${reportFilter}`);
      if (!response.ok) throw new Error("Şikayetler alınamadı");
      const data = await response.json();
      setReports(data.reports || []);
      if (data.statusCounts) {
        setStatusCounts(data.statusCounts);
      }
    } catch (error) {
      console.error("Reports fetch error:", error);
    }
  }, [reportFilter]);

  const fetchBans = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live/bans?active=true");
      if (!response.ok) throw new Error("Banlar alınamadı");
      const data = await response.json();
      setBans(data.bans || []);
      if (data.typeCounts) {
        setBanTypeCounts(data.typeCounts);
      }
    } catch (error) {
      console.error("Bans fetch error:", error);
    }
  }, []);

  const fetchAdminLogs = useCallback(async () => {
    setAdminLogsLoading(true);
    try {
      const response = await fetch("/api/ops/live/admin-logs?limit=100");
      if (!response.ok) throw new Error("Admin logları alınamadı");
      const data = await response.json();
      setAdminLogs(data.logs || []);
      setAdminLogsTotalCount(data.total || 0);
    } catch (error) {
      console.error("Admin logs fetch error:", error);
    } finally {
      setAdminLogsLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchReports(), fetchBans(), fetchAdminLogs()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchReports, fetchBans, fetchAdminLogs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchReports();
  }, [reportFilter, fetchReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleReportAction = async (
    reportId: string,
    action: string,
    options?: Record<string, unknown>
  ) => {
    const response = await fetch(`/api/ops/live/reports/${reportId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...options })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "İşlem başarısız");
    }

    // Listeyi yenile
    await fetchReports();
  };

  const handleLiftBan = async (banId: string, reason: string) => {
    const response = await fetch(`/api/ops/live/bans/${banId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Ban kaldırılamadı");
    }

    // Listeyi yenile
    await fetchBans();
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
          <h1 className="text-2xl font-bold">Moderasyon Paneli</h1>
          <p className="text-muted-foreground">Şikayetler ve yasaklar yönetimi</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Şikayetler</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">İnceleme bekliyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Çözümlenen</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.resolved}</div>
            <p className="text-xs text-muted-foreground">Aksiyon alındı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reddedilen</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.dismissed}</div>
            <p className="text-xs text-muted-foreground">Geçersiz şikayetler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Yasaklar</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banTypeCounts.total}</div>
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-xs">
                S: {banTypeCounts.session}
              </Badge>
              <Badge variant="outline" className="text-xs">
                C: {banTypeCounts.creator}
              </Badge>
              <Badge variant="outline" className="text-xs">
                G: {banTypeCounts.global}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Şikayetler
            {statusCounts.pending > 0 && (
              <Badge variant="destructive" className="ml-1">
                {statusCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bans" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Yasaklar
            {banTypeCounts.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {banTypeCounts.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Admin Logları
            {adminLogsTotalCount > 0 && (
              <Badge variant="outline" className="ml-1">
                {adminLogsTotalCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Report Filter */}
          <div className="flex gap-2">
            <Button
              variant={reportFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setReportFilter("pending")}
            >
              Bekleyen ({statusCounts.pending})
            </Button>
            <Button
              variant={reportFilter === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setReportFilter("resolved")}
            >
              Çözümlenen ({statusCounts.resolved})
            </Button>
            <Button
              variant={reportFilter === "dismissed" ? "default" : "outline"}
              size="sm"
              onClick={() => setReportFilter("dismissed")}
            >
              Reddedilen ({statusCounts.dismissed})
            </Button>
            <Button
              variant={reportFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setReportFilter("all")}
            >
              Tümü
            </Button>
          </div>

          <ReportsQueue
            reports={reports}
            onAction={handleReportAction}
            onViewDetail={setSelectedReport}
          />
        </TabsContent>

        <TabsContent value="bans">
          <BansTable bans={bans} onLiftBan={handleLiftBan} />
        </TabsContent>

        <TabsContent value="logs">
          <AdminLogsDataTable
            columns={adminLogsColumns}
            data={adminLogs}
            isLoading={adminLogsLoading}
            onRefresh={fetchAdminLogs}
            onRowClick={setSelectedAdminLog}
            meta={{ onViewDetail: setSelectedAdminLog }}
          />
        </TabsContent>
      </Tabs>

      {/* Admin Log Detail Dialog */}
      <Dialog open={!!selectedAdminLog} onOpenChange={() => setSelectedAdminLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Detayı</DialogTitle>
            <DialogDescription>
              {selectedAdminLog &&
                format(new Date(selectedAdminLog.created_at), "d MMMM yyyy HH:mm:ss", {
                  locale: tr
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedAdminLog && (
            <div className="space-y-4">
              {/* Admin Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedAdminLog.admin?.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedAdminLog.admin?.full_name?.[0] || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedAdminLog.admin?.full_name || "Bilinmiyor"}</p>
                  <p className="text-sm text-muted-foreground">{selectedAdminLog.admin?.email}</p>
                </div>
              </div>

              {/* Metadata */}
              {selectedAdminLog.metadata && Object.keys(selectedAdminLog.metadata).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">İşlem Detayları</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedAdminLog.metadata).map(([key, value]) => (
                      <div key={key} className="p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">
                          {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p className="font-medium truncate">
                          {value === null ? "-" : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Info */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Teknik Bilgiler</p>
                <div className="text-xs space-y-1 p-3 bg-muted rounded-lg font-mono overflow-hidden">
                  <p>
                    <span className="text-muted-foreground">IP:</span>{" "}
                    {selectedAdminLog.ip_address || "-"}
                  </p>
                  <p className="break-all">
                    <span className="text-muted-foreground">User Agent:</span>{" "}
                    {selectedAdminLog.user_agent || "-"}
                  </p>
                  <p className="break-all">
                    <span className="text-muted-foreground">Target ID:</span>{" "}
                    {selectedAdminLog.target_id || "-"}
                  </p>
                </div>
              </div>

              {/* Raw Metadata */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Ham Veri</p>
                <ScrollArea className="h-[120px] rounded-lg border bg-muted">
                  <pre className="text-xs font-mono p-3">
                    {JSON.stringify(selectedAdminLog.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Şikayet Detayı</DialogTitle>
            <DialogDescription>#{selectedReport?.id?.slice(0, 8)}</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Şikayet Eden</p>
                  <p className="font-medium">@{selectedReport.reporter?.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Şikayet Edilen</p>
                  <p className="font-medium">@{selectedReport.reported_user?.username}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Oturum</p>
                <p>{selectedReport.session?.title || "Bilinmiyor"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Neden</p>
                <Badge>{selectedReport.reason}</Badge>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Açıklama</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedReport.description}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReportAction(selectedReport.id, "dismiss");
                    setSelectedReport(null);
                  }}
                >
                  Reddet
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReportAction(selectedReport.id, "ban_session");
                    setSelectedReport(null);
                  }}
                >
                  Yasakla
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
