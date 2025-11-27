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
  IconEyeOff,
  IconLoader2,
  IconTrash
} from "@tabler/icons-react";
import { toast } from "sonner";

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
  const [sendNotification, setSendNotification] = useState(true);

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

  useEffect(() => {
    if (open) {
      fetchReasons();
      // Reset form
      setActionType(currentStatus === "hidden" ? "unhide" : "hide");
      setReasonCode("");
      setReasonCustom("");
      setSendNotification(true);
    }
  }, [open, currentStatus, fetchReasons]);

  // Filtrelenmiş nedenler
  const filteredReasons = reasons.filter(
    (r) => r.target_types.includes(targetType) && r.action_types.includes(actionType)
  );

  const handleSubmit = async () => {
    if (!reasonCode && !reasonCustom) {
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
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
          {/* İşlem Türü */}
          <div className="space-y-3">
            <Label>İşlem Türü</Label>
            <RadioGroup value={actionType} onValueChange={setActionType} className="space-y-2">
              {currentStatus !== "hidden" && (
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
              {currentStatus === "hidden" && (
                <label
                  htmlFor="unhide"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-green-500/50 p-3 hover:bg-green-500/5 [&:has([data-state=checked])]:border-green-500 [&:has([data-state=checked])]:bg-green-500/10"
                >
                  <RadioGroupItem value="unhide" id="unhide" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-green-600">
                      <IconEyeOff className="h-4 w-4" /> Göster
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gizlenen içerik tekrar görünür hale gelir
                    </p>
                  </div>
                </label>
              )}
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

          {/* Neden Seçimi */}
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

          {/* Özel Neden */}
          <div className="space-y-2">
            <Label>Özel Neden / Ek Açıklama</Label>
            <Textarea
              placeholder="İsteğe bağlı ek açıklama yazın..."
              value={reasonCustom}
              onChange={(e) => setReasonCustom(e.target.value)}
              rows={3}
            />
          </div>

          {/* Bildirim Gönder */}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!reasonCode && !reasonCustom)}
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
