/**
 * Moderation Logs Sayfası
 *
 * Tüm moderasyon işlemlerinin kayıtlarını gösterir
 * - Hangi admin hangi işlemi yaptı
 * - Neden ve açıklama
 * - Tarih ve saat
 * - Filtreleme ve arama
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconFilter,
  IconRefresh,
  IconTrash,
  IconUser
} from "@tabler/icons-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ModerationLog {
  id: string;
  admin_id: string;
  target_type: string;
  target_id: string;
  target_user_id: string;
  action_type: string;
  reason_code: string | null;
  reason_custom: string | null;
  reason_title: string | null;
  notification_sent: boolean;
  created_at: string;
  admin: {
    display_name: string;
    email?: string;
  };
  target_user: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function ModerationLogsPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });

  // Filters
  const [targetType, setTargetType] = useState<string>("all");
  const [actionType, setActionType] = useState<string>("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      if (targetType !== "all") {
        params.set("target_type", targetType);
      }
      if (actionType !== "all") {
        params.set("action_type", actionType);
      }

      const response = await fetch(`/api/ops/moderation/logs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Logs fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, targetType, actionType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "hide":
        return (
          <Badge variant="secondary" className="gap-1">
            <IconEyeOff className="h-3 w-3" /> Gizlendi
          </Badge>
        );
      case "unhide":
        return (
          <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
            <IconEye className="h-3 w-3" /> Gösterildi
          </Badge>
        );
      case "delete":
        return (
          <Badge variant="destructive" className="gap-1">
            <IconTrash className="h-3 w-3" /> Silindi
          </Badge>
        );
      case "restore":
        return (
          <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600">
            <IconRefresh className="h-3 w-3" /> Geri Yüklendi
          </Badge>
        );
      case "warn":
        return (
          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
            <IconAlertTriangle className="h-3 w-3" /> Uyarıldı
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTargetTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      post: "Post",
      mini_post: "Vibe",
      poll: "Anket",
      voice_moment: "Ses",
      comment: "Yorum"
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moderasyon Logları</h1>
          <p className="text-muted-foreground">Tüm moderasyon işlemlerinin kayıtları</p>
        </div>
        <Button variant="outline" onClick={fetchLogs}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <IconFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtreler:</span>
          </div>

          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="İçerik Türü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="mini_post">Vibe</SelectItem>
              <SelectItem value="poll">Anket</SelectItem>
              <SelectItem value="voice_moment">Ses</SelectItem>
              <SelectItem value="comment">Yorum</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="İşlem Türü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="hide">Gizle</SelectItem>
              <SelectItem value="unhide">Göster</SelectItem>
              <SelectItem value="delete">Sil</SelectItem>
              <SelectItem value="restore">Geri Yükle</SelectItem>
              <SelectItem value="warn">Uyar</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="ml-auto">
            {pagination.total} kayıt
          </Badge>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
          <CardDescription>Tüm moderasyon işlemleri burada listelenir</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconCalendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Kayıt bulunamadı</h3>
              <p className="text-sm text-muted-foreground">Henüz moderasyon işlemi yapılmamış</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>İçerik Türü</TableHead>
                    <TableHead>Hedef Kullanıcı</TableHead>
                    <TableHead>Neden</TableHead>
                    <TableHead>Bildirim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <IconUser className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">
                            {log.admin.display_name || "Admin"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell>{getTargetTypeBadge(log.target_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.target_user.avatar_url ? (
                            <Image
                              src={log.target_user.avatar_url}
                              alt={log.target_user.username}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                              <span className="text-xs">
                                {log.target_user.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-sm">@{log.target_user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {log.reason_title && (
                            <Badge variant="outline" className="mb-1">
                              {log.reason_title}
                            </Badge>
                          )}
                          {log.reason_custom && (
                            <p className="truncate text-xs text-muted-foreground">
                              {log.reason_custom}
                            </p>
                          )}
                          {!log.reason_title && !log.reason_custom && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.notification_sent ? (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Gönderildi
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Gönderilmedi</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Sayfa {pagination.page} / {pagination.total_pages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
