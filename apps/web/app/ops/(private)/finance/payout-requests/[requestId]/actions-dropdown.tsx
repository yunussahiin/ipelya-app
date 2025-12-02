"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search, Check, Banknote, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PayoutActionsDropdownProps {
  requestId: string;
  currentStatus: string;
}

const REJECTION_REASONS = [
  { id: "insufficient_balance", label: "Yetersiz bakiye" },
  { id: "invalid_payment_method", label: "Geçersiz ödeme yöntemi" },
  { id: "kyc_issue", label: "KYC problemi" },
  { id: "suspicious_activity", label: "Şüpheli aktivite" },
  { id: "other", label: "Diğer" }
];

export function PayoutActionsDropdown({ requestId, currentStatus }: PayoutActionsDropdownProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [paidDialogOpen, setPaidDialogOpen] = useState(false);

  // Form states
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const handleAction = async (action: string, extraData?: Record<string, any>) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/ops/finance/payout-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      toast.success(`✓ ${data.message}`);
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

    await handleAction("reject", { rejectionReason: reason });
    setRejectDialogOpen(false);
    setSelectedReason("");
    setCustomReason("");
  };

  const handlePaid = async () => {
    await handleAction("paid", {
      paymentReference: paymentReference || undefined
    });
    setPaidDialogOpen(false);
    setPaymentReference("");
  };

  // Hangi aksiyonlar gösterilecek?
  const showInReview = currentStatus === "pending";
  const showApprove = currentStatus === "in_review";
  const showPaid = currentStatus === "approved";
  const showReject = ["pending", "in_review", "approved"].includes(currentStatus);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4 mr-2" />
            İşlemler
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showInReview && (
            <DropdownMenuItem onClick={() => handleAction("in_review")}>
              <Search className="h-4 w-4 mr-2" />
              İncelemeye Al
            </DropdownMenuItem>
          )}

          {showApprove && (
            <DropdownMenuItem onClick={() => handleAction("approve")}>
              <Check className="h-4 w-4 mr-2" />
              Onayla
            </DropdownMenuItem>
          )}

          {showPaid && (
            <DropdownMenuItem onClick={() => setPaidDialogOpen(true)}>
              <Banknote className="h-4 w-4 mr-2" />
              Ödendi İşaretle
            </DropdownMenuItem>
          )}

          {showReject && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setRejectDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Reddet
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Talebi Reddet</DialogTitle>
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

      {/* Paid Dialog */}
      <Dialog open={paidDialogOpen} onOpenChange={setPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödendi Olarak İşaretle</DialogTitle>
            <DialogDescription>
              Ödeme yapıldıysa referans numarasını ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Ödeme Referansı (Opsiyonel)</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Dekont no, TX hash vb."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaidDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handlePaid} disabled={isLoading}>
              {isLoading ? "İşleniyor..." : "Ödendi İşaretle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
