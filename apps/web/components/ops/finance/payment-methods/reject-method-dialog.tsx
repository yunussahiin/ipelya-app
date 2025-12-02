"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RejectMethodDialogProps {
  methodId: string;
  creatorUsername: string;
  methodType: "bank" | "crypto";
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const REJECTION_REASONS = [
  { id: "invalid_iban", label: "IBAN numarası hatalı" },
  { id: "name_mismatch", label: "Hesap sahibi adı uyuşmuyor" },
  { id: "kyc_missing", label: "KYC doğrulaması eksik" },
  { id: "invalid_wallet", label: "Cüzdan adresi geçersiz" },
  { id: "other", label: "Diğer (açıklama zorunlu)" }
];

export function RejectMethodDialog({
  methodId,
  creatorUsername,
  methodType,
  trigger,
  onSuccess
}: RejectMethodDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    let reason = "";

    if (selectedReason === "other") {
      if (!customReason.trim()) {
        toast.error("Açıklama zorunludur");
        return;
      }
      reason = customReason.trim();
    } else {
      const selected = REJECTION_REASONS.find((r) => r.id === selectedReason);
      reason = selected?.label || "";
    }

    if (!reason) {
      toast.error("Reddetme sebebi seçiniz");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/ops/finance/payment-methods/${methodId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: reason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      toast.success("✓ Ödeme yöntemi reddedildi");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  // Crypto için farklı sebepler filtrele
  const filteredReasons = REJECTION_REASONS.filter((r) => {
    if (methodType === "crypto") {
      return !["invalid_iban", "name_mismatch"].includes(r.id);
    }
    if (methodType === "bank") {
      return r.id !== "invalid_wallet";
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive">
            <XCircle className="h-4 w-4 mr-2" />
            Reddet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Ödeme Yöntemini Reddet
          </DialogTitle>
          <DialogDescription>@{creatorUsername} için ödeme yöntemini reddedin</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sebep Seçimi */}
          <div className="space-y-2">
            <Label>Reddetme Sebebi (Zorunlu)</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {filteredReasons.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id} className="cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Özel Açıklama */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Açıklama</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Reddetme sebebini açıklayın..."
                rows={3}
              />
            </div>
          )}

          {/* Uyarı */}
          <Alert>
            <AlertDescription className="text-sm">
              Bu açıklama creator&apos;a gösterilecektir.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !selectedReason}
          >
            {isLoading ? "İşleniyor..." : "Reddet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
