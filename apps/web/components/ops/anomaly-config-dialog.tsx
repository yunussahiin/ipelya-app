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

interface AnomalyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function AnomalyConfigDialog({
  open,
  onOpenChange,
  userId,
  onSuccess
}: AnomalyConfigDialogProps) {
  const [excessiveThreshold, setExcessiveThreshold] = useState("10");
  const [excessiveWindow, setExcessiveWindow] = useState("60");
  const [multipleIpsWindow, setMultipleIpsWindow] = useState("60");
  const [longSessionMinutes, setLongSessionMinutes] = useState("120");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (!excessiveThreshold || !excessiveWindow || !multipleIpsWindow || !longSessionMinutes) {
      toast.error("✕ Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ops/shadow/config/anomaly-detection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          config: {
            excessiveFailedAttempts: {
              threshold: parseInt(excessiveThreshold),
              windowMinutes: parseInt(excessiveWindow)
            },
            multipleIps: {
              windowMinutes: parseInt(multipleIpsWindow)
            },
            longSession: {
              maxSessionMinutes: parseInt(longSessionMinutes)
            },
            unusualTime: {
              normalHours: { start: 8, end: 23 }
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Konfigürasyon güncellenemedi");
      }

      toast.success("✓ Anomali algılama konfigürasyonu başarıyla güncellendi");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Anomaly config update error:", error);
      toast.error(`✕ Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Anomali Algılama Konfigürasyonunu Güncelle</DialogTitle>
          <DialogDescription>Anomali algılama eşiklerini ayarlayın.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="excessiveThreshold">Aşırı Başarısız Denemeler Eşiği</Label>
            <Input
              id="excessiveThreshold"
              type="number"
              min="1"
              value={excessiveThreshold}
              onChange={(e) => setExcessiveThreshold(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="excessiveWindow">Aşırı Denemeler Penceresi (dakika)</Label>
            <Input
              id="excessiveWindow"
              type="number"
              min="1"
              value={excessiveWindow}
              onChange={(e) => setExcessiveWindow(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="multipleIpsWindow">Çoklu IP Penceresi (dakika)</Label>
            <Input
              id="multipleIpsWindow"
              type="number"
              min="1"
              value={multipleIpsWindow}
              onChange={(e) => setMultipleIpsWindow(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="longSessionMinutes">Uzun Oturum Süresi (dakika)</Label>
            <Input
              id="longSessionMinutes"
              type="number"
              min="1"
              value={longSessionMinutes}
              onChange={(e) => setLongSessionMinutes(e.target.value)}
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
