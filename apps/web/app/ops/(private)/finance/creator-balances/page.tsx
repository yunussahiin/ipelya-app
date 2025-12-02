import { Suspense } from "react";
import Link from "next/link";
import { Users, Search, Download, AlertCircle, Check, Clock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CoinDisplay, formatCoin, formatTL } from "@/components/ops/finance";

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getCreatorBalances() {
  const supabase = await createServerSupabaseClient();

  // Bakiyeler
  const { data: balances, error } = await supabase
    .from("creator_balances")
    .select("*")
    .order("total_earned", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Creator Balances] Error:", error);
    return { balances: [], stats: null, currentRate: 0.5 };
  }

  // Creator profilleri
  const creatorIds = balances?.map((b) => b.creator_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", creatorIds)
    .eq("type", "real");

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  // Ödeme yöntemleri durumu
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("creator_id, status")
    .in("creator_id", creatorIds)
    .eq("status", "approved");

  const hasApprovedMethod = new Set(paymentMethods?.map((p) => p.creator_id));

  // Bekleyen talepler
  const { data: pendingRequests } = await supabase
    .from("payout_requests")
    .select("creator_id")
    .in("creator_id", creatorIds)
    .in("status", ["pending", "in_review"]);

  const hasPendingRequest = new Set(pendingRequests?.map((p) => p.creator_id));

  // Güncel kur
  const { data: currentRate } = await supabase
    .from("coin_rates")
    .select("rate")
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  const rate = currentRate?.rate || 0.5;

  // Enriched balances
  const enrichedBalances = balances?.map((balance) => {
    const profile = profileMap.get(balance.creator_id);
    const hasMethod = hasApprovedMethod.has(balance.creator_id);
    const hasPending = hasPendingRequest.has(balance.creator_id);

    let status: "ok" | "warning" | "error" = "ok";
    if (!hasMethod) status = "error";
    else if (hasPending) status = "warning";

    return {
      ...balance,
      profile,
      status,
      hasApprovedPaymentMethod: hasMethod,
      hasPendingRequest: hasPending
    };
  });

  // İstatistikler
  const stats = {
    totalEarned: balances?.reduce((sum, b) => sum + (b.total_earned || 0), 0) || 0,
    totalWithdrawn: balances?.reduce((sum, b) => sum + (b.total_withdrawn || 0), 0) || 0,
    totalPending: balances?.reduce((sum, b) => sum + (b.pending_payout || 0), 0) || 0,
    totalAvailable: balances?.reduce((sum, b) => sum + (b.available_balance || 0), 0) || 0,
    creatorCount: balances?.length || 0
  };

  return { balances: enrichedBalances || [], stats, currentRate: rate };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") {
    return <Check className="h-4 w-4 text-green-500" />;
  }
  if (status === "warning") {
    return <Clock className="h-4 w-4 text-yellow-500" />;
  }
  return <AlertCircle className="h-4 w-4 text-red-500" />;
}

async function CreatorBalancesContent() {
  const { balances, stats, currentRate } = await getCreatorBalances();

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🪙 Toplam Kazanılan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoin(stats?.totalEarned || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatTL((stats?.totalEarned || 0) * currentRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              💰 Çekilebilir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoin(stats?.totalAvailable || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatTL((stats?.totalAvailable || 0) * currentRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🔒 Kilitli (Bekleyen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoin(stats?.totalPending || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatTL((stats?.totalPending || 0) * currentRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📤 Toplam Ödenen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoin(stats?.totalWithdrawn || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatTL((stats?.totalWithdrawn || 0) * currentRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bakiye Tablosu */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Creator Bakiyeleri</CardTitle>
              <CardDescription>{stats?.creatorCount} creator</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {balances.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Çekilebilir</TableHead>
                    <TableHead className="text-right">Kilitli</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow key={balance.creator_id}>
                      <TableCell>
                        <Link
                          href={`/ops/finance/creator-balances/${balance.creator_id}`}
                          className="flex items-center gap-3 hover:opacity-80"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={balance.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {balance.profile?.username?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            @{balance.profile?.username || "unknown"}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <CoinDisplay amount={balance.total_earned} rate={currentRate} size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <CoinDisplay
                          amount={balance.available_balance}
                          rate={currentRate}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {balance.pending_payout > 0 ? (
                          <CoinDisplay
                            amount={balance.pending_payout}
                            rate={currentRate}
                            size="sm"
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusIcon status={balance.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" /> Ödeme yöntemi onaylı
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-yellow-500" /> Bekleyen talep var
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500" /> Ödeme yöntemi yok
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Henüz bakiye kaydı yok</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreatorBalancesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function CreatorBalancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creator Bakiyeleri</h1>
        <p className="text-muted-foreground">Tüm creator bakiyelerini görüntüleyin</p>
      </div>

      <Suspense fallback={<CreatorBalancesSkeleton />}>
        <CreatorBalancesContent />
      </Suspense>
    </div>
  );
}
