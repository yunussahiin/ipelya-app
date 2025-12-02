"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, AlertTriangle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCoin } from "@/components/ops/finance";

interface BalanceAdjustmentDialogProps {
  creatorId: string;
  creatorUsername: string;
  currentBalance: number;
  trigger?: React.ReactNode;
}

export function BalanceAdjustmentDialog({
  creatorId,
  creatorUsername,
  currentBalance,
  trigger
}: BalanceAdjustmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseInt(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Geçerli bir miktar giriniz");
      return;
    }

    if (!reason || reason.trim().length < 5) {
      toast.error("Düzeltme sebebi zorunludur (min 5 karakter)");
      return;
    }

    if (type === "subtract" && numAmount > currentBalance) {
      toast.error(`Yetersiz bakiye. Mevcut: ${formatCoin(currentBalance)} coin`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/ops/finance/creator-balances/${creatorId}/adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: numAmount,
          reason: reason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      toast.success(`✓ ${data.message}`);
      setOpen(false);
      setAmount("");
      setReason("");
      setType("add");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const numAmount = parseInt(amount) || 0;
  const newBalance = type === "add" ? currentBalance + numAmount : currentBalance - numAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Manuel Düzeltme</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manuel Bakiye Düzeltmesi</DialogTitle>
          <DialogDescription>@{creatorUsername} için bakiye düzeltmesi</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mevcut Bakiye */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Mevcut Bakiye</p>
            <p className="text-lg font-semibold">🪙 {formatCoin(currentBalance)}</p>
          </div>

          {/* İşlem Tipi */}
          <div className="space-y-2">
            <Label>İşlem Tipi</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as "add" | "subtract")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="flex items-center gap-1 cursor-pointer">
                  <Plus className="h-4 w-4 text-green-500" />
                  Ekleme (+)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subtract" id="subtract" />
                <Label htmlFor="subtract" className="flex items-center gap-1 cursor-pointer">
                  <Minus className="h-4 w-4 text-red-500" />
                  Çıkarma (-)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Miktar */}
          <div className="space-y-2">
            <Label htmlFor="amount">Miktar (Coin)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                🪙
              </span>
              <Input
                id="amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder="500"
              />
            </div>
            {numAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                Yeni Bakiye:{" "}
                <span className={newBalance < 0 ? "text-red-500" : ""}>
                  🪙 {formatCoin(newBalance)}
                </span>
              </p>
            )}
          </div>

          {/* Sebep */}
          <div className="space-y-2">
            <Label htmlFor="reason">Sebep (Zorunlu)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Düzeltme sebebini açıklayın..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Min 5 karakter. Bu bilgi işlem geçmişinde görünecek.
            </p>
          </div>

          {/* Uyarı */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Bu işlem geri alınamaz!</AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || numAmount <= 0 || reason.trim().length < 5}
            variant={type === "subtract" ? "destructive" : "default"}
          >
            {isLoading ? "İşleniyor..." : "Düzeltmeyi Uygula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
