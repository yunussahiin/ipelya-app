import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  Clock,
  FileText,
  TrendingUp,
  ShieldCheck
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CoinDisplay,
  KYCStatusBadge,
  PayoutStatusBadge,
  formatCoin,
  formatTL
} from "@/components/ops/finance";
import { BalanceAdjustmentDialog } from "@/components/ops/finance/creator-balances/balance-adjustment-dialog";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ creatorId: string }>;
}

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getCreatorBalanceDetail(creatorId: string) {
  const supabase = await createServerSupabaseClient();

  // Bakiye
  const { data: balance } = await supabase
    .from("creator_balances")
    .select("*")
    .eq("creator_id", creatorId)
    .single();

  // Profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", creatorId)
    .eq("type", "real")
    .single();

  if (!profile) {
    return null;
  }

  // Auth user (email için)
  const { data: authData } = await supabase.auth.admin.getUserById(creatorId);

  // KYC
  const { data: kyc } = await supabase
    .from("creator_kyc_profiles")
    .select("*")
    .eq("creator_id", creatorId)
    .single();

  // Son işlemler
  const { data: transactions } = await supabase
    .from("creator_transactions")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Bekleyen talepler
  const { data: pendingRequests } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("creator_id", creatorId)
    .in("status", ["pending", "in_review", "approved"]);

  // Güncel kur
  const { data: currentRate } = await supabase
    .from("coin_rates")
    .select("rate")
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  return {
    balance: balance || {
      creator_id: creatorId,
      total_earned: 0,
      total_withdrawn: 0,
      pending_payout: 0,
      available_balance: 0
    },
    profile: {
      ...profile,
      email: authData?.user?.email
    },
    kyc,
    transactions: transactions || [],
    pendingRequests: pendingRequests || [],
    currentRate: currentRate?.rate || 0.5
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function TransactionTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    subscription: {
      label: "Abonelik",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    },
    gift: {
      label: "Hediye",
      className: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
    },
    ppv: {
      label: "PPV",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    },
    payout: {
      label: "Ödeme",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    },
    adjustment: {
      label: "Düzeltme",
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    },
    refund: {
      label: "İade",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  };

  const c = config[type] || { label: type, className: "bg-gray-100 text-gray-800" };

  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

async function CreatorBalanceDetailContent({ creatorId }: { creatorId: string }) {
  const data = await getCreatorBalanceDetail(creatorId);

  if (!data) {
    notFound();
  }

  const { balance, profile, kyc, transactions, pendingRequests, currentRate } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/finance/creator-balances">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">@{profile.username}</h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          {kyc && <KYCStatusBadge status={kyc.status} level={kyc.level} />}
        </div>
        <Link href="/ops/kyc">
          <Button variant="outline" size="sm">
            <ShieldCheck className="h-4 w-4 mr-2" />
            KYC Yönetimi
          </Button>
        </Link>
      </div>

      {/* Bakiye Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" /> Toplam Kazanılan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CoinDisplay amount={balance.total_earned} rate={currentRate} size="lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Çekilebilir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CoinDisplay amount={balance.available_balance} rate={currentRate} size="lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Kilitli (Bekleyen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CoinDisplay amount={balance.pending_payout} rate={currentRate} size="lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Toplam Ödenen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CoinDisplay amount={balance.total_withdrawn} rate={currentRate} size="lg" />
          </CardContent>
        </Card>
      </div>

      {/* Bekleyen Talepler */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bekleyen Talepler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>TL</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>🪙 {formatCoin(request.coin_amount)}</TableCell>
                    <TableCell>{formatTL(Number(request.tl_amount))}</TableCell>
                    <TableCell>
                      <PayoutStatusBadge status={request.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Admin İşlemleri */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Admin İşlemleri</CardTitle>
            <BalanceAdjustmentDialog
              creatorId={creatorId}
              creatorUsername={profile.username}
              currentBalance={balance.available_balance}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Son İşlemler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Son İşlemler
          </CardTitle>
          <CardDescription>Son 20 işlem</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead>Açıklama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {new Date(tx.created_at).toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      <TransactionTypeBadge type={tx.type} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={tx.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {tx.amount > 0 ? "+" : ""}
                        {formatCoin(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.description || tx.adjustment_reason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Henüz işlem yok</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
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
          <Skeleton className="h-6 w-32" />
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

export default async function CreatorBalanceDetailPage({ params }: PageProps) {
  const { creatorId } = await params;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <CreatorBalanceDetailContent creatorId={creatorId} />
    </Suspense>
  );
}
