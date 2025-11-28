/**
 * ModerationDialog Component
 * İçerik moderasyonu için dialog
 * - Neden seçimi (taslak + özel)
 * - İşlem türü seçimi
 * - Bildirim gönderme seçeneği
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconBell,
  IconClock,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconRefresh,
  IconTrash,
  IconUser
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ReasonTemplate {
  id: string;
  code: string;
  title: string;
  description: string;
  target_types: string[];
  action_types: string[];
}

interface ModerationHistory {
  id: string;
  action_type: string;
  reason_code: string | null;
  reason_title: string | null;
  reason_custom: string | null;
  admin_note: string | null;
  created_at: string;
  admin: {
    display_name: string;
    email?: string;
  };
}

interface ModerationDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: "post" | "mini_post" | "poll" | "voice_moment" | "comment";
  targetId: string;
  currentStatus?: "visible" | "hidden" | "deleted";
  onSuccess?: () => void;
}

export function ModerationDialog({
  open,
  onClose,
  targetType,
  targetId,
  currentStatus = "visible",
  onSuccess
}: ModerationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState<ReasonTemplate[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);

  // Form state
  const [actionType, setActionType] = useState<string>("hide");
  const [reasonCode, setReasonCode] = useState<string>("");
  const [reasonCustom, setReasonCustom] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [sendNotification, setSendNotification] = useState(true);

  // Moderation history
  const [history, setHistory] = useState<ModerationHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Neden şablonlarını yükle
  const fetchReasons = useCallback(async () => {
    setLoadingReasons(true);
    try {
      const response = await fetch("/api/ops/moderation/reasons");
      const data = await response.json();
      if (data.success) {
        setReasons(data.data);
      }
    } catch (error) {
      console.error("Reasons fetch error:", error);
    } finally {
      setLoadingReasons(false);
    }
  }, []);

  // Moderasyon geçmişini yükle
  const fetchHistory = useCallback(async () => {
    if (!targetId) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/ops/moderation/history?target_type=${targetType}&target_id=${targetId}`
      );
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error("History fetch error:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    if (open) {
      fetchReasons();
      fetchHistory();
      // Reset form
      setActionType(
        currentStatus === "hidden" ? "unhide" : currentStatus === "deleted" ? "restore" : "hide"
      );
      setReasonCode("");
      setReasonCustom("");
      setAdminNote("");
      setSendNotification(true);
    }
  }, [open, currentStatus, fetchReasons, fetchHistory]);

  // Filtrelenmiş nedenler
  const filteredReasons = reasons.filter(
    (r) => r.target_types.includes(targetType) && r.action_types.includes(actionType)
  );

  const handleSubmit = async () => {
    // unhide/restore için neden zorunlu değil
    const needsReason = !["unhide", "restore"].includes(actionType);
    if (needsReason && !reasonCode && !reasonCustom) {
      toast.error("Lütfen bir neden seçin veya özel neden yazın");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ops/moderation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          action_type: actionType,
          reason_code: reasonCode || undefined,
          reason_custom: reasonCustom || undefined,
          admin_note: adminNote || undefined,
          send_notification: sendNotification
        })
      });

      const data = await response.json();

      if (data.success) {
        const actionLabels: Record<string, string> = {
          hide: "gizlendi",
          unhide: "gösterildi",
          delete: "silindi",
          restore: "geri yüklendi",
          warn: "uyarıldı"
        };
        toast.success(`İçerik başarıyla ${actionLabels[actionType]}!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (error) {
      console.error("Moderation error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeName = () => {
    const names: Record<string, string> = {
      post: "Gönderi",
      mini_post: "Vibe",
      poll: "Anket",
      voice_moment: "Ses Kaydı",
      comment: "Yorum"
    };
    return names[targetType] || "İçerik";
  };

  // Son moderasyon işlemini al
  const lastModeration = history.length > 0 ? history[0] : null;

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      hide: "Gizlendi",
      unhide: "Gösterildi",
      delete: "Silindi",
      restore: "Geri Yüklendi",
      warn: "Uyarıldı"
    };
    return labels[action] || action;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5 text-orange-500" />
            {getContentTypeName()} Moderasyonu
          </DialogTitle>
          <DialogDescription>
            Bu içerik için moderasyon işlemi yapın. Kullanıcıya bildirim gönderilebilir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mevcut Moderasyon Durumu */}
          {lastModeration && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
              <div className="flex items-center gap-2 text-sm font-medium text-orange-800 dark:text-orange-200">
                <IconAlertTriangle className="h-4 w-4" />
                Aktif Moderasyon
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">İşlem:</span>
                  <Badge variant="secondary">{getActionLabel(lastModeration.action_type)}</Badge>
                </div>
                {lastModeration.reason_title && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Neden:</span>
                    <span className="font-medium">{lastModeration.reason_title}</span>
                  </div>
                )}
                {lastModeration.reason_custom && (
                  <div>
                    <span className="text-muted-foreground">Açıklama:</span>
                    <p className="mt-1 rounded bg-muted p-2 text-xs">
                      {lastModeration.reason_custom}
                    </p>
                  </div>
                )}
                {lastModeration.admin_note && (
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <IconUser className="h-3 w-3" /> Yönetim Notu:
                    </span>
                    <p className="mt-1 rounded bg-yellow-100 p-2 text-xs dark:bg-yellow-900/30">
                      {lastModeration.admin_note}
                    </p>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IconUser className="h-3 w-3" />
                  <span>{lastModeration.admin.display_name || "Admin"}</span>
                  <span>•</span>
                  <IconClock className="h-3 w-3" />
                  <span>
                    {new Date(lastModeration.created_at).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* İşlem Türü */}
          <div className="space-y-3">
            <Label>İşlem Türü</Label>
            <RadioGroup value={actionType} onValueChange={setActionType} className="space-y-2">
              {/* Moderasyonu Kaldır - sadece aktif moderasyon varsa */}
              {(currentStatus === "hidden" || lastModeration?.action_type === "hide") && (
                <label
                  htmlFor="unhide"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-green-500/50 p-3 hover:bg-green-500/5 [&:has([data-state=checked])]:border-green-500 [&:has([data-state=checked])]:bg-green-500/10"
                >
                  <RadioGroupItem value="unhide" id="unhide" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-green-600">
                      <IconEye className="h-4 w-4" /> Moderasyonu Kaldır
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gizlenen içerik tekrar görünür hale gelir
                    </p>
                  </div>
                </label>
              )}
              {currentStatus === "deleted" && (
                <label
                  htmlFor="restore"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-blue-500/50 p-3 hover:bg-blue-500/5 [&:has([data-state=checked])]:border-blue-500 [&:has([data-state=checked])]:bg-blue-500/10"
                >
                  <RadioGroupItem value="restore" id="restore" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-blue-600">
                      <IconRefresh className="h-4 w-4" /> Geri Yükle
                    </div>
                    <p className="text-xs text-muted-foreground">Silinen içerik geri yüklenir</p>
                  </div>
                </label>
              )}
              {currentStatus !== "hidden" && currentStatus !== "deleted" && (
                <label
                  htmlFor="hide"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                >
                  <RadioGroupItem value="hide" id="hide" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <IconEyeOff className="h-4 w-4" /> Gizle
                    </div>
                    <p className="text-xs text-muted-foreground">
                      İçerik feedden gizlenir, kullanıcı profilinde görünmez
                    </p>
                  </div>
                </label>
              )}
              {currentStatus !== "deleted" && (
                <label
                  htmlFor="delete"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-destructive/50 p-3 hover:bg-destructive/5 [&:has([data-state=checked])]:border-destructive [&:has([data-state=checked])]:bg-destructive/10"
                >
                  <RadioGroupItem value="delete" id="delete" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-destructive">
                      <IconTrash className="h-4 w-4" /> Kalıcı Sil
                    </div>
                    <p className="text-xs text-muted-foreground">
                      İçerik tamamen silinir, geri alınamaz
                    </p>
                  </div>
                </label>
              )}
              <label
                htmlFor="warn"
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-500/50 p-3 hover:bg-orange-500/5 [&:has([data-state=checked])]:border-orange-500 [&:has([data-state=checked])]:bg-orange-500/10"
              >
                <RadioGroupItem value="warn" id="warn" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-orange-600">
                    <IconAlertTriangle className="h-4 w-4" /> Uyar
                  </div>
                  <p className="text-xs text-muted-foreground">
                    İçerik kalır, kullanıcıya uyarı bildirimi gönderilir
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Neden Seçimi - unhide/restore için gösterme */}
          {!["unhide", "restore"].includes(actionType) && (
            <div className="space-y-2">
              <Label>Neden</Label>
              {loadingReasons ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Yükleniyor...
                </div>
              ) : (
                <Select value={reasonCode} onValueChange={setReasonCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir neden seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredReasons.map((reason) => (
                      <SelectItem key={reason.code} value={reason.code}>
                        <div className="flex flex-col">
                          <span>{reason.title}</span>
                          {reason.description && (
                            <span className="text-xs text-muted-foreground">
                              {reason.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Özel Neden / Ek Açıklama - User görür */}
          {!["unhide", "restore"].includes(actionType) && (
            <div className="space-y-2">
              <Label>Ek Açıklama (Kullanıcı Görür)</Label>
              <Textarea
                placeholder="Kullanıcıya gösterilecek ek açıklama..."
                value={reasonCustom}
                onChange={(e) => setReasonCustom(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Bu açıklama kullanıcıya bildirimde gösterilir.
              </p>
            </div>
          )}

          {/* Yönetim Notu - User görmez */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconUser className="h-4 w-4" />
              Yönetim Notu (Sadece Adminler Görür)
            </Label>
            <Textarea
              placeholder="Bu işlemi neden yaptığınızı yazın (iç kullanım)..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/30"
            />
            <p className="text-xs text-muted-foreground">
              Bu not sadece admin panelinde görünür, kullanıcıya gösterilmez ve bildirime dahil
              edilmez.
            </p>
          </div>

          {/* Bildirim Gönder - unhide/restore için gösterme */}
          {!["unhide", "restore"].includes(actionType) && (
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <Checkbox
                id="notification"
                checked={sendNotification}
                onCheckedChange={(checked) => setSendNotification(checked as boolean)}
              />
              <Label htmlFor="notification" className="flex cursor-pointer items-center gap-2">
                <IconBell className="h-4 w-4" />
                Kullanıcıya bildirim gönder
              </Label>
            </div>
          )}

          {/* Moderasyon Geçmişi */}
          {history.length > 1 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                Önceki İşlemler ({history.length - 1})
              </Label>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border p-2">
                {history.slice(1).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded bg-muted p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getActionLabel(h.action_type)}
                      </Badge>
                      <span className="text-muted-foreground">{h.admin.display_name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingHistory && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="h-4 w-4 animate-spin" />
              Geçmiş yükleniyor...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              (!["unhide", "restore"].includes(actionType) && !reasonCode && !reasonCustom)
            }
            variant={actionType === "delete" ? "destructive" : "default"}
          >
            {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionType === "hide" && "Gizle"}
            {actionType === "unhide" && "Göster"}
            {actionType === "delete" && "Sil"}
            {actionType === "warn" && "Uyar"}
            {actionType === "restore" && "Geri Yükle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
