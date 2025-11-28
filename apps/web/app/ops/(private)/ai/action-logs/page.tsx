"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  RefreshCw,
  Undo2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Coins,
  Bell,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ActionLog {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown> | null;
  admin_id: string;
  admin_username: string | null;
  target_type: string | null;
  target_id: string | null;
  target_username: string | null;
  status: "completed" | "failed" | "reverted";
  error_message: string | null;
  is_reversible: boolean;
  revert_data: Record<string, unknown> | null;
  reverted_at: string | null;
  reverted_by: string | null;
  revert_reason: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  completed: number;
  failed: number;
  reverted: number;
  reversible: number;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  user: <User className="size-4" />,
  post: <FileText className="size-4" />,
  coin: <Coins className="size-4" />,
  notification: <Bell className="size-4" />,
  report: <Shield className="size-4" />,
  other: <Activity className="size-4" />
};

const STATUS_BADGES: Record<
  string,
  { variant: "default" | "destructive" | "secondary" | "outline"; label: string }
> = {
  completed: { variant: "default", label: "Tamamlandı" },
  failed: { variant: "destructive", label: "Başarısız" },
  reverted: { variant: "secondary", label: "Geri Alındı" }
};

export default function AIActionLogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [toolCounts, setToolCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  // Filters
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<string>("all");

  // Revert dialog
  const [revertDialog, setRevertDialog] = useState<{ open: boolean; log: ActionLog | null }>({
    open: false,
    log: null
  });
  const [revertReason, setRevertReason] = useState("");
  const [reverting, setReverting] = useState(false);

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; log: ActionLog | null }>({
    open: false,
    log: null
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit)
      });

      if (toolFilter !== "all") params.append("toolName", toolFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (targetFilter !== "all") params.append("targetType", targetFilter);

      const res = await fetch(`/api/ops/ai/action-logs?${params}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
        setHasMore(data.pagination.hasMore);
        setStats(data.stats);
        setToolCounts(data.toolCounts);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, toolFilter, statusFilter, targetFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRevert = async () => {
    if (!revertDialog.log || !revertReason.trim()) return;

    setReverting(true);
    try {
      const res = await fetch("/api/ops/ai/action-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: revertDialog.log.id,
          reason: revertReason
        })
      });

      const data = await res.json();
      if (data.success) {
        setRevertDialog({ open: false, log: null });
        setRevertReason("");
        fetchLogs();
      } else {
        alert(data.message || "Geri alma başarısız");
      }
    } catch (error) {
      console.error("Revert error:", error);
      alert("Geri alma sırasında hata oluştu");
    } finally {
      setReverting(false);
    }
  };

  const formatToolName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const uniqueTools = Object.keys(toolCounts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI İşlem Logları</h1>
          <p className="text-muted-foreground">
            AI asistanın yaptığı tüm işlemleri görüntüle ve geri al
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" disabled={loading}>
          <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Toplam İşlem</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Tamamlanan</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Başarısız</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.reverted}</div>
              <div className="text-xs text-muted-foreground">Geri Alınan</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.reversible}</div>
              <div className="text-xs text-muted-foreground">Geri Alınabilir</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={toolFilter} onValueChange={setToolFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tool Seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tool&apos;lar</SelectItem>
                {uniqueTools.map((tool) => (
                  <SelectItem key={tool} value={tool}>
                    {formatToolName(tool)} ({toolCounts[tool]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum Seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="completed">Tamamlanan</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
                <SelectItem value="reverted">Geri Alınan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={targetFilter} onValueChange={setTargetFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Hedef Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Hedefler</SelectItem>
                <SelectItem value="user">Kullanıcı</SelectItem>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="coin">Coin</SelectItem>
                <SelectItem value="report">Rapor</SelectItem>
                <SelectItem value="notification">Bildirim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="size-5" />
            İşlem Geçmişi
          </CardTitle>
          <CardDescription>{total} işlem bulundu</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Henüz işlem kaydı yok</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zaman</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Hedef</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-accent/50">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="size-3" />
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {TOOL_ICONS[log.target_type || "other"]}
                          <span className="font-medium">{formatToolName(log.tool_name)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.target_username ? (
                          <span className="text-sm">@{log.target_username}</span>
                        ) : log.target_id ? (
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.target_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGES[log.status]?.variant || "outline"}>
                          {log.status === "completed" && <CheckCircle className="size-3 mr-1" />}
                          {log.status === "failed" && <XCircle className="size-3 mr-1" />}
                          {log.status === "reverted" && <Undo2 className="size-3 mr-1" />}
                          {STATUS_BADGES[log.status]?.label || log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.admin_username || "Bilinmiyor"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailDialog({ open: true, log })}
                          >
                            Detay
                          </Button>
                          {log.is_reversible && log.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRevertDialog({ open: true, log })}
                            >
                              <Undo2 className="size-3 mr-1" />
                              Geri Al
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Sayfa {page + 1} / {Math.ceil(total / limit)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="size-4" />
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                  >
                    Sonraki
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Revert Dialog */}
      <Dialog
        open={revertDialog.open}
        onOpenChange={(open) => setRevertDialog({ open, log: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-500" />
              İşlemi Geri Al
            </DialogTitle>
            <DialogDescription>Bu işlemi geri almak istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>

          {revertDialog.log && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-sm font-medium">
                  {formatToolName(revertDialog.log.tool_name)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {revertDialog.log.target_username
                    ? `Hedef: @${revertDialog.log.target_username}`
                    : revertDialog.log.target_id
                      ? `Hedef ID: ${revertDialog.log.target_id}`
                      : ""}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Geri Alma Sebebi</label>
                <Textarea
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  placeholder="Neden geri alıyorsunuz?"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertDialog({ open: false, log: null })}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevert}
              disabled={reverting || !revertReason.trim()}
            >
              {reverting ? "Geri Alınıyor..." : "Geri Al"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog({ open, log: null })}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>İşlem Detayı</DialogTitle>
          </DialogHeader>

          {detailDialog.log && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Tool</label>
                  <div className="font-medium">{formatToolName(detailDialog.log.tool_name)}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Durum</label>
                  <div>
                    <Badge variant={STATUS_BADGES[detailDialog.log.status]?.variant}>
                      {STATUS_BADGES[detailDialog.log.status]?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tarih</label>
                  <div className="text-sm">
                    {new Date(detailDialog.log.created_at).toLocaleString("tr-TR")}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Admin</label>
                  <div className="text-sm">{detailDialog.log.admin_username || "Bilinmiyor"}</div>
                </div>
              </div>

              {/* Target */}
              {(detailDialog.log.target_type || detailDialog.log.target_id) && (
                <div>
                  <label className="text-xs text-muted-foreground">Hedef</label>
                  <div className="p-2 rounded bg-muted text-sm">
                    <span className="font-medium">{detailDialog.log.target_type}: </span>
                    {detailDialog.log.target_username || detailDialog.log.target_id}
                  </div>
                </div>
              )}

              {/* Input */}
              <div>
                <label className="text-xs text-muted-foreground">Giriş Parametreleri</label>
                <pre className="p-2 rounded bg-muted text-xs overflow-x-auto">
                  {JSON.stringify(detailDialog.log.tool_input, null, 2)}
                </pre>
              </div>

              {/* Output */}
              {detailDialog.log.tool_output && (
                <div>
                  <label className="text-xs text-muted-foreground">Çıktı</label>
                  <pre className="p-2 rounded bg-muted text-xs overflow-x-auto max-h-40">
                    {JSON.stringify(detailDialog.log.tool_output, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error */}
              {detailDialog.log.error_message && (
                <div>
                  <label className="text-xs text-red-500">Hata</label>
                  <div className="p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
                    {detailDialog.log.error_message}
                  </div>
                </div>
              )}

              {/* Revert Info */}
              {detailDialog.log.status === "reverted" && (
                <div className="p-3 rounded border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Geri Alındı
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Sebep: {detailDialog.log.revert_reason}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {detailDialog.log.reverted_at &&
                      new Date(detailDialog.log.reverted_at).toLocaleString("tr-TR")}
                  </div>
                </div>
              )}

              {/* Log ID */}
              <div className="text-xs text-muted-foreground font-mono">
                ID: {detailDialog.log.id}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
