"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { BarChart3, Coins, Hash, RefreshCw, TrendingUp } from "lucide-react";

interface ActivityData {
  byModel: Array<{
    model: string;
    requests: number;
    tokens: number;
    cost?: number;
    avgDuration?: number;
  }>;
  byDate: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost?: number;
  }>;
  totals: {
    requests: number;
    tokens: number;
    cost?: number;
  };
}

export function AnalyticsSection() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/ai/activity");
      if (!response.ok) {
        throw new Error("Failed to fetch activity");
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;
  const formatNumber = (num: number) => num.toLocaleString("tr-TR");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchActivity}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam İstek
            </CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data?.totals.requests || 0)}</div>
            <p className="text-xs text-muted-foreground">son 30 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Token
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data?.totals.tokens || 0)}</div>
            <p className="text-xs text-muted-foreground">son 30 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Maliyet
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data?.totals.cost !== undefined ? formatCurrency(data.totals.cost) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">son 30 gün</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Model Bazlı Kullanım
              </CardTitle>
              <CardDescription>Son 30 günde model bazlı kullanım istatistikleri</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchActivity}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.byModel && data.byModel.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">İstek</TableHead>
                    <TableHead className="text-right">Token</TableHead>
                    <TableHead className="text-right">Maliyet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byModel.map((item) => (
                    <TableRow key={item.model}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{item.model}</span>
                          {item.cost === 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            >
                              Free
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.requests)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.tokens)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.cost !== undefined ? formatCurrency(item.cost) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Henüz Veri Yok</h3>
              <p className="text-sm text-muted-foreground">
                Son 30 günde OpenRouter kullanımı bulunmuyor.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Usage */}
      {data?.byDate && data.byDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Günlük Kullanım</CardTitle>
            <CardDescription>Son 30 günün günlük kullanım özeti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[300px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">İstek</TableHead>
                    <TableHead className="text-right">Token</TableHead>
                    <TableHead className="text-right">Maliyet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byDate
                    .slice()
                    .reverse()
                    .map((item) => (
                      <TableRow key={item.date}>
                        <TableCell className="font-mono">{item.date}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(item.requests)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(item.tokens)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.cost !== undefined ? formatCurrency(item.cost) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
