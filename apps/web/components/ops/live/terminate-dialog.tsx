"use client";

/**
 * TerminateDialog Component
 * Oturum sonlandırma onay dialogu
 */

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TerminateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  onConfirm: (reason: string) => void;
}

export function TerminateDialog({
  open,
  onOpenChange,
  sessionTitle,
  onConfirm
}: TerminateDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(reason || "Admin tarafından sonlandırıldı");
    setLoading(false);
    setReason("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Yayını Sonlandır</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>&quot;{sessionTitle}&quot;</strong> yayınını zorla sonlandırmak istediğinize
              emin misiniz?
            </p>
            <p className="text-sm">
              Bu işlem geri alınamaz. Tüm izleyiciler yayından çıkarılacak ve yayıncıya bildirim
              gönderilecektir.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="reason">Sonlandırma Nedeni (Opsiyonel)</Label>
          <Textarea
            id="reason"
            placeholder="Örn: Topluluk kurallarının ihlali..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Sonlandırılıyor..." : "Yayını Sonlandır"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
