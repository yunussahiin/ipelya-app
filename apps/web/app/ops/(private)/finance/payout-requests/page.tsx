import { Suspense } from "react";
import Link from "next/link";
import { FileText, Clock, Search, Check, X, Banknote, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { PayoutStatusBadge, CoinDisplay, formatTL } from "@/components/ops/finance";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PayoutCounts {
  all: number;
  pending: number;
  in_review: number;
  approved: number;
  paid: number;
  rejected: number;
}

interface TodaySummary {
  pending: { count: number; amount: number };
  approved: { count: number; amount: number };
  paid: { count: number; amount: number };
}

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getPayoutRequests(): Promise<{
  requests: any[];
  counts: PayoutCounts;
  warnings: string[];
  todaySummary: TodaySummary;
  currentRate: number;
}> {
  const supabase = await createServerSupabaseClient();

  const { data: requests, error } = await supabase
    .from("payout_requests")
    .select(
      `
      *,
      payment_methods (
        id,
        type,
        bank_name,
        iban,
        crypto_network,
        wallet_address
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Payout Requests] Error:", error);
    return {
      requests: [],
      counts: { all: 0, pending: 0, in_review: 0, approved: 0, paid: 0, rejected: 0 },
      warnings: [],
      todaySummary: {
        pending: { count: 0, amount: 0 },
        approved: { count: 0, amount: 0 },
        paid: { count: 0, amount: 0 }
      },
      currentRate: 0.5
    };
  }

  // Creator profilleri
  const creatorIds = [...new Set(requests?.map((r) => r.creator_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", creatorIds)
    .eq("type", "real");

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  // Güncel kur
  const { data: currentRate } = await supabase
    .from("coin_rates")
    .select("rate")
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  const rate = currentRate?.rate || 0.5;

  const enrichedRequests = requests?.map((req) => ({
    ...req,
    creator: profileMap.get(req.creator_id) || null
  }));

  const counts = {
    all: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    in_review: requests?.filter((r) => r.status === "in_review").length || 0,
    approved: requests?.filter((r) => r.status === "approved").length || 0,
    paid: requests?.filter((r) => r.status === "paid").length || 0,
    rejected: requests?.filter((r) => r.status === "rejected").length || 0
  };

  // Uyarılar
  const warnings: string[] = [];
  const now = new Date();
  const pendingOld = requests?.filter((r) => {
    if (r.status !== "pending") return false;
    const created = new Date(r.created_at);
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 48;
  });

  if (pendingOld && pendingOld.length > 0) {
    warnings.push(`${pendingOld.length} talep 48 saatten fazla bekliyor`);
  }

  const highAmount = requests?.filter((r) => r.status === "pending" && Number(r.tl_amount) > 10000);
  if (highAmount && highAmount.length > 0) {
    warnings.push(`${highAmount.length} talep anormal yüksek tutar (>₺10,000)`);
  }

  // Bugünkü özet
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPending = requests?.filter(
    (r) => r.status === "pending" && new Date(r.created_at) >= today
  );
  const todayApproved = requests?.filter(
    (r) => r.status === "approved" && new Date(r.reviewed_at) >= today
  );
  const todayPaid = requests?.filter((r) => r.status === "paid" && new Date(r.paid_at) >= today);

  const todaySummary = {
    pending: {
      count: todayPending?.length || 0,
      amount: todayPending?.reduce((sum, r) => sum + Number(r.tl_amount || 0), 0) || 0
    },
    approved: {
      count: todayApproved?.length || 0,
      amount: todayApproved?.reduce((sum, r) => sum + Number(r.tl_amount || 0), 0) || 0
    },
    paid: {
      count: todayPaid?.length || 0,
      amount: todayPaid?.reduce((sum, r) => sum + Number(r.tl_amount || 0), 0) || 0
    }
  };

  return {
    requests: enrichedRequests || [],
    counts,
    warnings,
    todaySummary,
    currentRate: rate
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function PayoutRequestsTable({ requests, currentRate }: { requests: any[]; currentRate: number }) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">Bu kategoride ödeme talebi yok</div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Creator</TableHead>
          <TableHead className="text-right">Tutar</TableHead>
          <TableHead className="text-right">TL</TableHead>
          <TableHead>Yöntem</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Durum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell>
              <Link
                href={`/ops/finance/payout-requests/${req.id}`}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={req.creator?.avatar_url || undefined} />
                  <AvatarFallback>
                    {req.creator?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">@{req.creator?.username || "unknown"}</span>
              </Link>
            </TableCell>
            <TableCell className="text-right">
              <CoinDisplay amount={req.coin_amount} showTL={false} size="sm" />
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatTL(Number(req.tl_amount))}
            </TableCell>
            <TableCell>
              {req.payment_methods?.type === "bank" ? (
                <span className="text-sm">🏦 {req.payment_methods.bank_name}</span>
              ) : (
                <span className="text-sm">💎 {req.payment_methods?.crypto_network}</span>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(req.created_at).toLocaleDateString("tr-TR")}
            </TableCell>
            <TableCell>
              <PayoutStatusBadge status={req.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function PayoutRequestsContent() {
  const { requests, counts, warnings, todaySummary, currentRate } = await getPayoutRequests();

  const pending = requests.filter((r) => r.status === "pending");
  const inReview = requests.filter((r) => r.status === "in_review");
  const approved = requests.filter((r) => r.status === "approved");
  const paid = requests.filter((r) => r.status === "paid");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Uyarılar */}
      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Bugünkü Özet */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Bekleyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTL(todaySummary.pending.amount)}</div>
            <p className="text-xs text-muted-foreground">{todaySummary.pending.count} talep</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Check className="h-4 w-4" />
              Onaylanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTL(todaySummary.approved.amount)}</div>
            <p className="text-xs text-muted-foreground">{todaySummary.approved.count} talep</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Ödenen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTL(todaySummary.paid.amount)}</div>
            <p className="text-xs text-muted-foreground">{todaySummary.paid.count} talep</p>
          </CardContent>
        </Card>
      </div>

      {/* Talepler Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Talepleri</CardTitle>
          <CardDescription>Tüm ödeme talepleri</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="flex-wrap">
              <TabsTrigger value="all" className="gap-2">
                Tümü
                <Badge variant="secondary">{counts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                ⏳ Bekleyen
                {counts.pending > 0 && <Badge variant="destructive">{counts.pending}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="in_review" className="gap-2">
                🔍 İnceleniyor
                {counts.in_review > 0 && <Badge variant="secondary">{counts.in_review}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                ✅ Onaylı
                <Badge variant="secondary">{counts.approved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="paid" className="gap-2">
                💸 Ödendi
                <Badge variant="secondary">{counts.paid}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                ❌ Red
                <Badge variant="secondary">{counts.rejected}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <PayoutRequestsTable requests={requests} currentRate={currentRate} />
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              <PayoutRequestsTable requests={pending} currentRate={currentRate} />
            </TabsContent>
            <TabsContent value="in_review" className="mt-4">
              <PayoutRequestsTable requests={inReview} currentRate={currentRate} />
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              <PayoutRequestsTable requests={approved} currentRate={currentRate} />
            </TabsContent>
            <TabsContent value="paid" className="mt-4">
              <PayoutRequestsTable requests={paid} currentRate={currentRate} />
            </TabsContent>
            <TabsContent value="rejected" className="mt-4">
              <PayoutRequestsTable requests={rejected} currentRate={currentRate} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutRequestsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
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
          <Skeleton className="h-10 w-full mb-4" />
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

export default function PayoutRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ödeme Talepleri</h1>
        <p className="text-muted-foreground">Payout request yönetimi</p>
      </div>

      <Suspense fallback={<PayoutRequestsSkeleton />}>
        <PayoutRequestsContent />
      </Suspense>
    </div>
  );
}
