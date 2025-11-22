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

interface UserUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function UserUnlockDialog({ open, onOpenChange, userId, onSuccess }: UserUnlockDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ops/shadow/users/${userId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kullanıcı açılamadı");
      }

      toast.success("✓ Kullanıcı başarıyla açıldı");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("User unlock error:", error);
      toast.error(`✕ Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Aç</DialogTitle>
          <DialogDescription>
            Bu kullanıcının kilidini açmak istediğinizden emin misiniz?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button onClick={handleUnlock} disabled={isLoading}>
            {isLoading ? "Açılıyor..." : "Kullanıcıyı Aç"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
