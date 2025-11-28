"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Search,
  FileText,
  Eye,
  Send,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

interface ImpersonationLog {
  id: string;
  admin_id: string;
  target_user_id: string;
  conversation_id: string;
  message_id: string | null;
  action: "view" | "send_message" | "edit_message" | "delete_message";
  metadata: {
    content_preview?: string;
    admin_name?: string;
    target_user_name?: string;
    action_type?: string;
  };
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_profile: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  target_user_profile: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface Stats {
  total_logs: number;
  unique_admins: number;
  unique_targets: number;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  view: {
    label: "Görüntüleme",
    icon: <Eye className="h-4 w-4" />,
    color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
  },
  send_message: {
    label: "Mesaj Gönderme",
    icon: <Send className="h-4 w-4" />,
    color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
  },
  edit_message: {
    label: "Mesaj Düzenleme",
    icon: <Edit className="h-4 w-4" />,
    color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
  },
  delete_message: {
    label: "Mesaj Silme",
    icon: <Trash2 className="h-4 w-4" />,
    color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
  }
};

export default function ImpersonationLogsPage() {
  const [logs, setLogs] = useState<ImpersonationLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Logları yükle
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.set("action", actionFilter);
      params.set("limit", "100");

      const response = await fetch(`/api/ops/messaging/impersonation-logs?${params}`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setLogs(result.data || []);
      setStats(result.stats || null);
    } catch (error) {
      console.error("Load logs error:", error);
      toast.error("Loglar yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Filtrelenmiş loglar
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.admin_profile?.display_name?.toLowerCase().includes(query) ||
      log.admin_profile?.username?.toLowerCase().includes(query) ||
      log.target_user_profile?.display_name?.toLowerCase().includes(query) ||
      log.target_user_profile?.username?.toLowerCase().includes(query) ||
      log.metadata?.content_preview?.toLowerCase().includes(query)
    );
  });

  // CSV Export
  const exportCSV = () => {
    const headers = ["Tarih", "Admin", "Hedef Kullanıcı", "İşlem", "İçerik", "IP Adresi"];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.admin_profile?.display_name || log.admin_profile?.username || log.admin_id,
      log.target_user_profile?.display_name ||
        log.target_user_profile?.username ||
        log.target_user_id,
      ACTION_LABELS[log.action]?.label || log.action,
      log.metadata?.content_preview || "-",
      log.ip_address || "-"
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `impersonation-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV dosyası indirildi");
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/messaging/impersonate">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Impersonation Logları
            </h1>
            <p className="text-muted-foreground">Kullanıcı adına yapılan tüm işlemlerin kaydı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            CSV İndir
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam İşlem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_logs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktif Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_admins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Etkilenen Kullanıcı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_targets}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Admin, kullanıcı veya içerik ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="İşlem türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="view">Görüntüleme</SelectItem>
                <SelectItem value="send_message">Mesaj Gönderme</SelectItem>
                <SelectItem value="edit_message">Mesaj Düzenleme</SelectItem>
                <SelectItem value="delete_message">Mesaj Silme</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">İşlem Geçmişi</CardTitle>
          <CardDescription>{filteredLogs.length} kayıt gösteriliyor</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p>Yükleniyor...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Kayıt bulunamadı</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Hedef Kullanıcı</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Detay</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || {
                      label: log.action,
                      icon: <FileText className="h-4 w-4" />,
                      color: "bg-muted"
                    };

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(log.created_at), "dd MMM yyyy", { locale: tr })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={log.admin_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(log.admin_profile?.display_name || "A")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {log.admin_profile?.display_name || log.admin_profile?.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={log.target_user_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(log.target_user_profile?.display_name || "U")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {log.target_user_profile?.display_name ||
                                  log.target_user_profile?.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${actionInfo.color} gap-1`}>
                            {actionInfo.icon}
                            {actionInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {log.metadata?.content_preview ? (
                            <p className="text-sm text-muted-foreground truncate">
                              {log.metadata.content_preview}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.ip_address || "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
