"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface UserLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function UserLockDialog({ open, onOpenChange, userId, onSuccess }: UserLockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<string>("30");

  const handleLock = async () => {
    if (!reason.trim()) {
      alert("Lütfen bir sebep girin");
      return;
    }

    setLoading(true);
    try {
      const durationMinutes = duration === "permanent" ? null : parseInt(duration);

      const res = await fetch(`/api/ops/users/${userId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          durationMinutes
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to lock user");
      }

      onSuccess?.();
      onOpenChange(false);
      setReason("");
      setDuration("30");
    } catch (error) {
      console.error("Lock user error:", error);
      alert(error instanceof Error ? error.message : "Failed to lock user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔒 Kullanıcıyı Kilitle</DialogTitle>
          <DialogDescription>Kullanıcının shadow profile erişimini engelleyin</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Kilit Süresi</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 dakika</SelectItem>
                <SelectItem value="30">30 dakika</SelectItem>
                <SelectItem value="60">1 saat</SelectItem>
                <SelectItem value="180">3 saat</SelectItem>
                <SelectItem value="360">6 saat</SelectItem>
                <SelectItem value="720">12 saat</SelectItem>
                <SelectItem value="1440">24 saat</SelectItem>
                <SelectItem value="permanent">Kalıcı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Sebep</Label>
            <Textarea
              id="reason"
              placeholder="Kilitleme sebebini girin..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleLock} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kilitle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
