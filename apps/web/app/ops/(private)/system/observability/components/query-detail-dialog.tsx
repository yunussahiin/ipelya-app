"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SlowQuery } from "../types";

interface QueryDetailDialogProps {
  query: SlowQuery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueryDetailDialog({ query, open, onOpenChange }: QueryDetailDialogProps) {
  if (!query) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sorgu Detayı</DialogTitle>
          <DialogDescription>Sorgu performans metrikleri ve tam sorgu metni</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Çağrı Sayısı</p>
              <p className="text-lg font-bold">{query.calls?.toLocaleString("tr-TR")}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Toplam Süre</p>
              <p className="text-lg font-bold">{query.total_time?.toLocaleString("tr-TR")} ms</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Ortalama Süre</p>
              <p className="text-lg font-bold text-primary">
                {query.mean_time?.toLocaleString("tr-TR")} ms
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Dönen Satır</p>
              <p className="text-lg font-bold">{query.rows?.toLocaleString("tr-TR")}</p>
            </div>
          </div>

          {/* Performance Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Performans:</span>
            {query.mean_time < 10 ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Hızlı (&lt;10ms)
              </Badge>
            ) : query.mean_time < 100 ? (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Normal (10-100ms)
              </Badge>
            ) : query.mean_time < 1000 ? (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Yavaş (100ms-1s)
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Çok Yavaş (&gt;1s)
              </Badge>
            )}
          </div>

          {/* Query Text */}
          <div>
            <p className="text-sm font-medium mb-2">Sorgu Metni</p>
            <ScrollArea className="h-[200px] rounded-lg border bg-muted/50 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">{query.query}</pre>
            </ScrollArea>
          </div>

          {/* Tips */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-sm font-medium mb-2">Optimizasyon İpuçları</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Sık çağrılan sorgular için indeks eklemeyi düşünün</li>
              <li>• EXPLAIN ANALYZE ile sorgu planını inceleyin</li>
              <li>• Gereksiz SELECT * kullanımından kaçının</li>
              <li>• WHERE koşullarında indeksli kolonları kullanın</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
