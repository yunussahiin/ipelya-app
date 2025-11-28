"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, RefreshCw, Wallet } from "lucide-react";

interface CreditsData {
  total_credits: number;
  total_usage: number;
  remaining: number;
}

export function CreditsCard() {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/ai/credits");
      if (!response.ok) {
        throw new Error("Failed to fetch credits");
      }
      const data = await response.json();
      setCredits(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const usagePercentage = credits ? (credits.total_usage / credits.total_credits) * 100 : 0;

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Kredi Durumu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Wallet className="h-5 w-5" />
            Kredi Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchCredits}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Kredi Durumu
            </CardTitle>
            <CardDescription>OpenRouter hesap bakiyeniz</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchCredits}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Kalan Kredi */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Kalan Kredi</span>
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(credits?.remaining ?? 0)}
            </span>
          </div>
          <Progress value={100 - usagePercentage} className="h-2" />
        </div>

        {/* Detaylar */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Toplam Satın Alınan</span>
            <p className="font-medium">{formatCurrency(credits?.total_credits ?? 0)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Toplam Kullanılan</span>
            <p className="font-medium">{formatCurrency(credits?.total_usage ?? 0)}</p>
          </div>
        </div>

        {/* Kullanım Yüzdesi */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Kullanım Oranı</span>
          <span className={usagePercentage > 80 ? "text-destructive font-medium" : ""}>
            %{usagePercentage.toFixed(1)}
          </span>
        </div>

        {/* Kredi Ekle Butonu */}
        <Button className="w-full" asChild>
          <a href="https://openrouter.ai/credits" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Kredi Ekle
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
