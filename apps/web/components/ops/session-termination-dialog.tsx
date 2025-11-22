import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SessionTerminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  userId: string;
  onSuccess?: () => void;
}

export function SessionTerminationDialog({
  open,
  onOpenChange,
  sessionId,
  userId,
  onSuccess
}: SessionTerminationDialogProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTerminate = async () => {
    if (!reason.trim()) {
      toast.error("✕ Lütfen bir neden girin");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ops/shadow/sessions/${sessionId}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Oturum sonlandırılamadı");
      }

      toast.success("✓ Oturum başarıyla sonlandırıldı");
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Session termination error:", error);
      toast.error(`✕ Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oturumu Sonlandır</DialogTitle>
          <DialogDescription>Bu oturumu sonlandırmak için bir neden belirtin.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Neden</Label>
            <Input
              id="reason"
              placeholder="Örn: Şüpheli aktivite"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button variant="destructive" onClick={handleTerminate} disabled={isLoading}>
            {isLoading ? "Sonlandırılıyor..." : "Oturumu Sonlandır"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
