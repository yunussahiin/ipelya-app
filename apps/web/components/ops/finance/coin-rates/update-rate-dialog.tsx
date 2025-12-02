"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatTL } from "@/components/ops/finance";

interface UpdateRateDialogProps {
  currentRate: number;
  trigger?: React.ReactNode;
}

export function UpdateRateDialog({ currentRate, trigger }: UpdateRateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(currentRate.toString());
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const numRate = parseFloat(rate);

    if (isNaN(numRate) || numRate <= 0) {
      toast.error("Geçerli bir kur değeri giriniz");
      return;
    }

    if (numRate > 100) {
      toast.error("Kur değeri 100 TL'den büyük olamaz");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ops/finance/coin-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: numRate, note: note || undefined })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      toast.success("✓ Kur başarıyla güncellendi");
      setOpen(false);
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const numRate = parseFloat(rate) || 0;
  const rateChange = numRate - currentRate;
  const rateChangePercent = currentRate > 0 ? ((rateChange / currentRate) * 100).toFixed(1) : "0";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Kuru Güncelle</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Kuru Güncelle
          </DialogTitle>
          <DialogDescription>Coin/TL dönüşüm kurunu güncelleyin</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mevcut Kur */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Mevcut Kur</p>
            <p className="text-lg font-semibold">1 🪙 = {formatTL(currentRate)}</p>
          </div>

          {/* Yeni Kur */}
          <div className="space-y-2">
            <Label htmlFor="rate">Yeni Kur (TL)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₺
              </span>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="pl-8"
                placeholder="0.50"
              />
            </div>
            {numRate > 0 && numRate !== currentRate && (
              <p className="text-sm text-muted-foreground">
                Değişim:{" "}
                <span className={rateChange > 0 ? "text-green-500" : "text-red-500"}>
                  {rateChange > 0 ? "+" : ""}
                  {formatTL(rateChange)} ({rateChange > 0 ? "+" : ""}
                  {rateChangePercent}%)
                </span>
              </p>
            )}
          </div>

          {/* Not */}
          <div className="space-y-2">
            <Label htmlFor="note">Not (Opsiyonel)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kur değişikliği sebebi..."
              rows={2}
            />
          </div>

          {/* Uyarı */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <ul className="list-disc pl-4 space-y-1">
                <li>Bu değişiklik mevcut talepleri etkilemez</li>
                <li>Mobil uygulamada anında görünür</li>
                <li>Yeni talepler bu kurla oluşturulur</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || numRate <= 0}>
            {isLoading ? "Güncelleniyor..." : "Kuru Güncelle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
