"use client";

/**
 * TerminateDialog Component
 * Oturum sonlandırma onay dialogu
 * - Hazır nedenler (mock data)
 * - Yönetici notu (sadece ops'ta görünür)
 */

import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Hazır sonlandırma nedenleri
const TERMINATION_REASONS = [
  { id: "community_violation", label: "Topluluk kuralları ihlali" },
  { id: "inappropriate_content", label: "Uygunsuz içerik" },
  { id: "spam_scam", label: "Spam veya dolandırıcılık" },
  { id: "copyright", label: "Telif hakkı ihlali" },
  { id: "technical_issue", label: "Teknik sorun" },
  { id: "user_request", label: "Kullanıcı talebi" },
  { id: "other", label: "Diğer" }
];

interface TerminateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  onConfirm: (reason: string, adminNote?: string) => void;
}

export function TerminateDialog({
  open,
  onOpenChange,
  sessionTitle,
  onConfirm
}: TerminateDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const reason =
      selectedReason === "other"
        ? customReason || "Diğer"
        : TERMINATION_REASONS.find((r) => r.id === selectedReason)?.label ||
          "Admin tarafından sonlandırıldı";

    setLoading(true);
    await onConfirm(reason, adminNote || undefined);
    setLoading(false);
    setSelectedReason("");
    setCustomReason("");
    setAdminNote("");
  };

  const isValid = selectedReason && (selectedReason !== "other" || customReason.trim());

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Yayını Sonlandır</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p>
                <strong>&quot;{sessionTitle}&quot;</strong> yayınını zorla sonlandırmak istediğinize
                emin misiniz?
              </p>
              <p>
                Bu işlem geri alınamaz. Tüm izleyiciler yayından çıkarılacak ve yayıncıya bildirim
                gönderilecektir.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Sonlandırma Nedeni Seçimi */}
          <div className="space-y-3">
            <Label>Sonlandırma Nedeni *</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="gap-2">
              {TERMINATION_REASONS.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Diğer seçiliyse özel neden */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Neden Açıklaması *</Label>
              <Textarea
                id="customReason"
                placeholder="Sonlandırma nedenini açıklayın..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Yönetici Notu */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="adminNote">Yönetici Notu</Label>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Sadece ops panelinde görünür</span>
              </div>
            </div>
            <Textarea
              id="adminNote"
              placeholder="İç notlar, takip gerektiren durumlar vb..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || !isValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Sonlandırılıyor..." : "Yayını Sonlandır"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
