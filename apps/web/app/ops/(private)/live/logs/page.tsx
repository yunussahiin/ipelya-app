"use client";

/**
 * LiveKit Webhook Logs Sayfası
 * Webhook event'lerini ve hataları gösterir
 */

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  RefreshCw,
  Webhook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Video,
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WebhookLog {
  id: string;
  event_type: string;
  room_name: string | null;
  room_sid: string | null;
  participant_identity: string | null;
  participant_sid: string | null;
  session_id: string | null;
  call_id: string | null;
  raw_payload: Record<string, unknown>;
  processing_status: string;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

interface Stats {
  eventCounts: Record<string, number>;
  statusCounts: { success: number; error: number; skipped: number };
  total: number;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  room_started: <Video className="h-4 w-4 text-green-500" />,
  room_finished: <Video className="h-4 w-4 text-red-500" />,
  participant_joined: <Users className="h-4 w-4 text-blue-500" />,
  participant_left: <Users className="h-4 w-4 text-orange-500" />,
  track_published: <Webhook className="h-4 w-4 text-purple-500" />,
  track_unpublished: <Webhook className="h-4 w-4 text-gray-500" />
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  success: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  skipped: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  }
};

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    eventCounts: {},
    statusCounts: { success: 0, error: 0, skipped: 0 },
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.set("event_type", eventFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("room_name", searchQuery);

      const response = await fetch(`/api/ops/live/webhook-logs?${params}`);
      if (!response.ok) throw new Error("Loglar alınamadı");

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(
        data.stats || {
          eventCounts: {},
          statusCounts: { success: 0, error: 0, skipped: 0 },
          total: 0
        }
      );
    } catch (error) {
      console.error("Logs fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh her 30 saniyede
  useEffect(() => {
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhook Logları
          </h1>
          <p className="text-muted-foreground">LiveKit webhook event&apos;leri ve durumları</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son 24 Saat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">webhook event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarılı</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.statusCounts.success}</div>
            <p className="text-xs text-muted-foreground">işlenen event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hatalı</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.statusCounts.error}</div>
            <p className="text-xs text-muted-foreground">başarısız event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atlanan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.statusCounts.skipped}</div>
            <p className="text-xs text-muted-foreground">skip edilen event</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Event Dağılımı (Son 24 Saat)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.eventCounts).map(([event, count]) => (
              <Badge key={event} variant="outline" className="flex items-center gap-1">
                {EVENT_ICONS[event] || <Webhook className="h-3 w-3" />}
                {event}: {count}
              </Badge>
            ))}
            {Object.keys(stats.eventCounts).length === 0 && (
              <span className="text-muted-foreground text-sm">Henüz event yok</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Room adı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={eventFilter || "all"}
              onValueChange={(v) => setEventFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="room_started">room_started</SelectItem>
                <SelectItem value="room_finished">room_finished</SelectItem>
                <SelectItem value="participant_joined">participant_joined</SelectItem>
                <SelectItem value="participant_left">participant_left</SelectItem>
                <SelectItem value="track_published">track_published</SelectItem>
                <SelectItem value="track_unpublished">track_unpublished</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="success">Başarılı</SelectItem>
                <SelectItem value="error">Hatalı</SelectItem>
                <SelectItem value="skipped">Atlanan</SelectItem>
              </SelectContent>
            </Select>

            {(eventFilter || statusFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEventFilter("");
                  setStatusFilter("");
                  setSearchQuery("");
                }}
              >
                Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Logları</CardTitle>
          <CardDescription>Son {logs.length} webhook event</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zaman</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Webhook logu bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const statusConfig =
                    STATUS_CONFIG[log.processing_status] || STATUS_CONFIG.success;

                  return (
                    <TableRow
                      key={log.id}
                      className={
                        log.processing_status === "error" ? "bg-red-50 dark:bg-red-950/20" : ""
                      }
                    >
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {EVENT_ICONS[log.event_type] || <Webhook className="h-4 w-4" />}
                          <span className="font-mono text-sm">{log.event_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{log.room_name || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.participant_identity || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          {statusConfig.icon}
                          <span className="ml-1">{log.processing_status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.processing_time_ms ? (
                          <span className="text-sm">{log.processing_time_ms}ms</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          Detay
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && EVENT_ICONS[selectedLog.event_type]}
              {selectedLog?.event_type}
            </DialogTitle>
            <DialogDescription>
              {selectedLog &&
                format(new Date(selectedLog.created_at), "d MMMM yyyy HH:mm:ss", { locale: tr })}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Room Name</p>
                  <p className="font-mono">{selectedLog.room_name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Room SID</p>
                  <p className="font-mono text-xs">{selectedLog.room_sid || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Participant</p>
                  <p className="font-mono">{selectedLog.participant_identity || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">İşlem Süresi</p>
                  <p>
                    {selectedLog.processing_time_ms ? `${selectedLog.processing_time_ms}ms` : "-"}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {selectedLog.error_message && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Hata Mesajı</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}

              {/* Raw Payload */}
              <div>
                <p className="text-sm font-medium mb-2">Raw Payload</p>
                <ScrollArea className="h-[200px] rounded-lg border bg-muted p-3">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(selectedLog.raw_payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
