/**
 * Moderation Logs Sayfası
 *
 * TanStack Table ile gelişmiş data table
 * - Sıralama, filtreleme, sayfalama
 * - Kolon görünürlüğü
 * - Satır seçimi
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconClock,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconRefresh,
  IconTrash,
  IconUser,
  IconX
} from "@tabler/icons-react";
import Image from "next/image";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { ModerationDialog } from "../../viewer/components/moderation-dialog";
import { columns, DataTable, type ModerationLog } from "./components";

export default function ModerationLogsPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Moderation dialog for changing action
  const [moderationTarget, setModerationTarget] = useState<{
    type: "post" | "mini_post" | "poll" | "voice_moment" | "comment";
    id: string;
    currentStatus?: "visible" | "hidden" | "deleted";
  } | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Tüm logları çek, filtreleme client-side yapılacak
      const response = await fetch("/api/ops/moderation/logs?limit=500");
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error("Logs fetch error:", error);
      toast.error("Loglar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleRowClick = (log: ModerationLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moderasyon Logları</h1>
          <p className="text-muted-foreground">
            Tüm moderasyon işlemlerinin kayıtları • {logs.length} kayıt
          </p>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
          <CardDescription>
            Tüm moderasyon işlemleri burada listelenir. Sıralama, filtreleme ve arama yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            isLoading={loading}
            onRefresh={fetchLogs}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconInfoCircle className="h-5 w-5" />
              Moderasyon Detayı
            </DialogTitle>
            <DialogDescription>İşlem hakkında detaylı bilgi</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Tarih/Saat */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconClock className="h-4 w-4" />
                  <span>İşlem Zamanı</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {new Date(selectedLog.created_at).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </p>
              </div>

              <Separator />

              {/* Admin Bilgisi */}
              <div className="flex items-center gap-3">
                {selectedLog.admin.avatar_url ? (
                  <Image
                    src={selectedLog.admin.avatar_url}
                    alt={selectedLog.admin.display_name || "Admin"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-medium">
                      {(selectedLog.admin.display_name || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">İşlemi Yapan Admin</p>
                  <p className="font-medium">
                    {selectedLog.admin.display_name || "Bilinmeyen Admin"}
                  </p>
                  {selectedLog.admin.email && (
                    <p className="text-xs text-muted-foreground">{selectedLog.admin.email}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* İşlem Detayları */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">İşlem Türü</p>
                  <div className="mt-1">{getActionBadge(selectedLog.action_type)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">İçerik Türü</p>
                  <div className="mt-1">{getTargetTypeBadge(selectedLog.target_type)}</div>
                </div>
              </div>

              {/* Hedef Kullanıcı */}
              <div className="flex items-center gap-3">
                {selectedLog.target_user.avatar_url ? (
                  <Image
                    src={selectedLog.target_user.avatar_url}
                    alt={selectedLog.target_user.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <span className="text-sm font-medium">
                      {selectedLog.target_user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Hedef Kullanıcı</p>
                  <p className="font-medium">@{selectedLog.target_user.username}</p>
                </div>
              </div>

              <Separator />

              {/* Neden */}
              <div>
                <p className="text-sm text-muted-foreground">Moderasyon Nedeni</p>
                {selectedLog.reason_title ? (
                  <Badge variant="outline" className="mt-1">
                    {selectedLog.reason_title}
                  </Badge>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Belirtilmemiş</p>
                )}
              </div>

              {selectedLog.reason_custom && (
                <div>
                  <p className="text-sm text-muted-foreground">Ek Açıklama (Kullanıcı Görür)</p>
                  <p className="mt-1 rounded-lg bg-muted p-3 text-sm">
                    {selectedLog.reason_custom}
                  </p>
                </div>
              )}

              {/* Yönetim Notu - Sadece adminler görür */}
              {selectedLog.admin_note && (
                <div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconUser className="h-3 w-3" />
                    Yönetim Notu (Sadece Adminler Görür)
                  </p>
                  <p className="mt-1 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-950/50">
                    {selectedLog.admin_note}
                  </p>
                </div>
              )}

              {/* Bildirim Durumu */}
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm">Kullanıcıya Bildirim</span>
                {selectedLog.notification_sent ? (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    Gönderildi
                  </Badge>
                ) : (
                  <Badge variant="secondary">Gönderilmedi</Badge>
                )}
              </div>

              <Separator />

              {/* Aksiyonlar */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setDetailOpen(false);
                    setModerationTarget({
                      type: selectedLog.target_type as
                        | "post"
                        | "mini_post"
                        | "poll"
                        | "voice_moment"
                        | "comment",
                      id: selectedLog.target_id,
                      currentStatus:
                        selectedLog.action_type === "delete"
                          ? "deleted"
                          : selectedLog.action_type === "hide"
                            ? "hidden"
                            : "visible"
                    });
                  }}
                >
                  <IconEdit className="h-4 w-4" />
                  İşlemi Değiştir
                </Button>
                <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation Dialog for changing action */}
      {moderationTarget && (
        <ModerationDialog
          open={!!moderationTarget}
          onClose={() => setModerationTarget(null)}
          targetType={moderationTarget.type}
          targetId={moderationTarget.id}
          currentStatus={moderationTarget.currentStatus}
          onSuccess={() => {
            setModerationTarget(null);
            fetchLogs();
            toast.success("Moderasyon işlemi güncellendi");
          }}
        />
      )}
    </div>
  );
}
