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

interface UserLockoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

const DURATION_OPTIONS = [
  { label: "15 dakika", value: "15" },
  { label: "30 dakika", value: "30" },
  { label: "1 saat", value: "60" },
  { label: "4 saat", value: "240" },
  { label: "1 gün", value: "1440" }
];

export function UserLockoutDialog({
  open,
  onOpenChange,
  userId,
  onSuccess
}: UserLockoutDialogProps) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("30");
  const [isLoading, setIsLoading] = useState(false);

  const handleLockout = async () => {
    if (!reason.trim()) {
      toast.error("✕ Lütfen bir neden girin");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ops/shadow/users/${userId}/lockout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          durationMinutes: parseInt(duration)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kullanıcı kilitlenemedi");
      }

      toast.success("✓ Kullanıcı başarıyla kilitlendi");
      setReason("");
      setDuration("30");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("User lockout error:", error);
      toast.error(`✕ Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Kilitle</DialogTitle>
          <DialogDescription>Kullanıcıyı belirtilen süre için kilitleyeceksiniz.</DialogDescription>
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

          <div>
            <Label htmlFor="duration">Süre</Label>
            <Select value={duration} onValueChange={setDuration} disabled={isLoading}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button variant="destructive" onClick={handleLockout} disabled={isLoading}>
            {isLoading ? "Kilitleniyor..." : "Kullanıcıyı Kilitle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
