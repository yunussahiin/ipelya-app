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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface RateLimitConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function RateLimitConfigDialog({
  open,
  onOpenChange,
  userId,
  onSuccess
}: RateLimitConfigDialogProps) {
  const [type, setType] = useState<"pin" | "biometric">("pin");
  const [maxAttempts, setMaxAttempts] = useState("5");
  const [windowMinutes, setWindowMinutes] = useState("15");
  const [lockoutMinutes, setLockoutMinutes] = useState("30");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (!maxAttempts || !windowMinutes || !lockoutMinutes) {
      toast.error("✕ Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ops/shadow/config/rate-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type,
          config: {
            maxAttempts: parseInt(maxAttempts),
            windowMinutes: parseInt(windowMinutes),
            lockoutMinutes: parseInt(lockoutMinutes)
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Konfigürasyon güncellenemedi");
      }

      toast.success("✓ Oran limiti konfigürasyonu başarıyla güncellendi");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Rate limit config update error:", error);
      toast.error(`✕ Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oran Limiti Konfigürasyonunu Güncelle</DialogTitle>
          <DialogDescription>Kullanıcı için oran limiti ayarlarını güncelleyin.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Tip</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as "pin" | "biometric")}
              disabled={isLoading}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pin">PIN</SelectItem>
                <SelectItem value="biometric">Biyometrik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maxAttempts">Maksimum Denemeler</Label>
            <Input
              id="maxAttempts"
              type="number"
              min="1"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="windowMinutes">Pencere (dakika)</Label>
            <Input
              id="windowMinutes"
              type="number"
              min="1"
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="lockoutMinutes">Kilitleme Süresi (dakika)</Label>
            <Input
              id="lockoutMinutes"
              type="number"
              min="1"
              value={lockoutMinutes}
              onChange={(e) => setLockoutMinutes(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Güncelleniyor..." : "Konfigürasyonu Güncelle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
