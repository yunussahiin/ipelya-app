/**
 * Moderation Queue Page
 *
 * AI flagged content queue for review
 * - Filter by content type, priority, reason
 * - AI scores display (toxicity, nsfw, spam)
 * - Quick actions: approve, reject, escalate
 * - Bulk actions support
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconFlag,
  IconRefresh,
  IconRobot,
  IconShieldCheck,
  IconX
} from "@tabler/icons-react";
import Image from "next/image";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";

interface QueueItem {
  id: string;
  content_type: string;
  content_id: string;
  user_id: string;
  priority: number;
  reason: string;
  toxicity_score: number | null;
  nsfw_score: number | null;
  spam_score: number | null;
  report_count: number;
  report_reasons: string[] | null;
  status: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
  content_preview?: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: "Post",
  mini_post: "Vibe",
  poll: "Anket",
  voice_moment: "Ses",
  comment: "Yorum"
};

const REASON_LABELS: Record<string, string> = {
  ai_flagged: "AI Tespit",
  user_reported: "Kullanıcı Şikayeti",
  manual_review: "Manuel İnceleme"
};

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Bekliyor", variant: "secondary" },
  reviewing: { label: "İnceleniyor", variant: "default" },
  approved: { label: "Onaylandı", variant: "outline" },
  rejected: { label: "Reddedildi", variant: "destructive" },
  escalated: { label: "Yükseltildi", variant: "default" }
};

// Score badge component
function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;

  const getColor = () => {
    if (score >= 0.8) return "bg-red-500 text-white";
    if (score >= 0.5) return "bg-orange-500 text-white";
    if (score >= 0.3) return "bg-yellow-500 text-black";
    return "bg-green-500 text-white";
  };

  return (
    <Badge className={`text-xs ${getColor()}`}>
      {label}: {Math.round(score * 100)}%
    </Badge>
  );
}

export default function ModerationQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [contentType, setContentType] = useState<string>("all");
  const [status, setStatus] = useState<string>("pending");
  const [reason, setReason] = useState<string>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "escalate";
    itemId?: string;
    isBulk?: boolean;
  }>({ open: false, action: "approve" });
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch queue items
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (contentType !== "all") params.set("content_type", contentType);
      if (status !== "all") params.set("status", status);
      if (reason !== "all") params.set("reason", reason);

      const response = await fetch(`/api/ops/moderation/queue?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data.items);
        setTotalPages(data.data.pagination.total_pages);
      }
    } catch (error) {
      console.error("Queue fetch error:", error);
      toast.error("Kuyruk yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [page, contentType, status, reason]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  // Handle action
  const handleAction = async () => {
    setActionLoading(true);
    try {
      const ids = actionDialog.isBulk ? Array.from(selectedIds) : [actionDialog.itemId!];

      const response = await fetch("/api/ops/moderation/queue/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids,
          action: actionDialog.action,
          note: actionNote
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `${ids.length} içerik ${
            actionDialog.action === "approve"
              ? "onaylandı"
              : actionDialog.action === "reject"
                ? "reddedildi"
                : "yükseltildi"
          }`
        );
        setSelectedIds(new Set());
        fetchQueue();
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error("İşlem hatası");
    } finally {
      setActionLoading(false);
      setActionDialog({ open: false, action: "approve" });
      setActionNote("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moderasyon Kuyruğu</h1>
          <p className="text-muted-foreground">
            AI tarafından işaretlenen ve kullanıcı şikayetleri
          </p>
        </div>
        <Button variant="outline" onClick={fetchQueue}>
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

          <Select value={contentType} onValueChange={setContentType}>
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

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="pending">Bekliyor</SelectItem>
              <SelectItem value="reviewing">İnceleniyor</SelectItem>
              <SelectItem value="approved">Onaylandı</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
              <SelectItem value="escalated">Yükseltildi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Neden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="ai_flagged">AI Tespit</SelectItem>
              <SelectItem value="user_reported">Kullanıcı Şikayeti</SelectItem>
              <SelectItem value="manual_review">Manuel İnceleme</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedIds.size} içerik seçildi
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => setActionDialog({ open: true, action: "approve", isBulk: true })}
              >
                <IconCheck className="mr-1 h-4 w-4" />
                Toplu Onayla
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => setActionDialog({ open: true, action: "reject", isBulk: true })}
              >
                <IconX className="mr-1 h-4 w-4" />
                Toplu Reddet
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                Seçimi Temizle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconRobot className="h-5 w-5" />
            İnceleme Kuyruğu
          </CardTitle>
          <CardDescription>{items.length} içerik inceleme bekliyor</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconShieldCheck className="mb-4 h-12 w-12 text-green-500" />
              <h3 className="text-lg font-medium">Kuyruk Boş</h3>
              <p className="text-sm text-muted-foreground">İnceleme bekleyen içerik yok</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === items.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>İçerik</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Neden</TableHead>
                    <TableHead>AI Skorları</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Aksiyonlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelection(item.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">
                            {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                          </Badge>
                          {item.content_preview && (
                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                              {item.content_preview}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.user?.avatar_url ? (
                            <Image
                              src={item.user.avatar_url}
                              alt={item.user.username}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                              <span className="text-xs">
                                {item.user?.username?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <span className="text-sm">@{item.user?.username || "unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary">
                            {REASON_LABELS[item.reason] || item.reason}
                          </Badge>
                          {item.report_count > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {item.report_count} şikayet
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <ScoreBadge label="Toxic" score={item.toxicity_score} />
                          <ScoreBadge label="NSFW" score={item.nsfw_score} />
                          <ScoreBadge label="Spam" score={item.spam_score} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.priority >= 8
                              ? "destructive"
                              : item.priority >= 5
                                ? "default"
                                : "secondary"
                          }
                        >
                          {item.priority}/10
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_LABELS[item.status]?.variant || "secondary"}>
                          {STATUS_LABELS[item.status]?.label || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                action: "approve",
                                itemId: item.id
                              })
                            }
                          >
                            <IconCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                action: "reject",
                                itemId: item.id
                              })
                            }
                          >
                            <IconX className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-orange-600"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                action: "escalate",
                                itemId: item.id
                              })
                            }
                          >
                            <IconFlag className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Sayfa {page} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve"
                ? "İçeriği Onayla"
                : actionDialog.action === "reject"
                  ? "İçeriği Reddet"
                  : "İçeriği Yükselt"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.isBulk
                ? `${selectedIds.size} içerik için işlem yapılacak`
                : "Bu içerik için işlem yapılacak"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Not (Opsiyonel)</label>
              <Textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="İşlem hakkında not ekleyin..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: "approve" })}
            >
              İptal
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              variant={actionDialog.action === "reject" ? "destructive" : "default"}
            >
              {actionLoading
                ? "İşleniyor..."
                : actionDialog.action === "approve"
                  ? "Onayla"
                  : actionDialog.action === "reject"
                    ? "Reddet"
                    : "Yükselt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
