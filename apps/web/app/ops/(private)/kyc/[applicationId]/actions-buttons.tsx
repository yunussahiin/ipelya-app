"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface KYCActionsButtonsProps {
  applicationId: string;
}

const REJECTION_REASONS = [
  { id: "blurry_id", label: "Kimlik fotoğrafı net değil" },
  { id: "blurry_selfie", label: "Selfie fotoğrafı net değil" },
  { id: "face_mismatch", label: "Yüz eşleşmedi" },
  { id: "id_expired", label: "Kimlik süresi dolmuş" },
  { id: "info_mismatch", label: "Bilgiler uyuşmuyor" },
  { id: "other", label: "Diğer" }
];

export function KYCActionsButtons({ applicationId }: KYCActionsButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ops/kyc/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      toast.success("✓ KYC başvurusu onaylandı");
      router.push("/ops/kyc");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
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
      toast.error("Red sebebi seçiniz");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ops/kyc/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      toast.success("KYC başvurusu reddedildi");
      setRejectDialogOpen(false);
      router.push("/ops/kyc");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          onClick={() => setRejectDialogOpen(true)}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Reddet
        </Button>
        <Button onClick={handleApprove} disabled={isLoading}>
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? "İşleniyor..." : "Onayla"}
        </Button>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">KYC Başvurusunu Reddet</DialogTitle>
            <DialogDescription>Bu işlem geri alınamaz.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reddetme Sebebi</Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {REJECTION_REASONS.map((reason) => (
                  <div key={reason.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.id} id={reason.id} />
                    <Label htmlFor={reason.id} className="cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {selectedReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Açıklama</Label>
                <Textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Red sebebini açıklayın..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || !selectedReason}
            >
              {isLoading ? "İşleniyor..." : "Reddet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
