/**
 * Credits Badge Component
 * Header'da kredi durumunu gösteren badge
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CreditsData {
  total_credits: number;
  total_usage: number;
  remaining: number;
}

export function CreditsBadge() {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch("/api/ops/ai/credits");
        if (!response.ok) {
          throw new Error("Failed to fetch credits");
        }
        const result = await response.json();
        // API { success: true, data: { ... } } döndürüyor
        setCredits(result.data || result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchCredits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Skeleton className="h-6 w-16" />;
  }

  if (error || !credits || typeof credits.remaining !== "number") {
    return null;
  }

  const remaining = credits.remaining ?? 0;
  const totalCredits = credits.total_credits ?? 0;
  const totalUsage = credits.total_usage ?? 0;
  const isLow = remaining < 1;
  const isCritical = remaining < 0.5;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/ops/ai/settings">
            <Badge
              variant={isCritical ? "destructive" : isLow ? "secondary" : "outline"}
              className={cn(
                "cursor-pointer gap-1 transition-colors",
                isLow &&
                  !isCritical &&
                  "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700"
              )}
            >
              {isLow ? <AlertTriangle className="h-3 w-3" /> : <Coins className="h-3 w-3" />}$
              {remaining.toFixed(2)}
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p>Toplam: ${totalCredits.toFixed(2)}</p>
            <p>Kullanılan: ${totalUsage.toFixed(2)}</p>
            <p className="font-medium">Kalan: ${remaining.toFixed(2)}</p>
            {isLow && (
              <p className="text-orange-500 dark:text-orange-400">
                Kredi düşük! Tıklayarak ekleyin.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
