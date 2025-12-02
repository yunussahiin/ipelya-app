import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  Clock,
  FileText,
  User,
  Building2,
  Wallet,
  History
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  PayoutStatusBadge,
  CoinDisplay,
  RateDisplay,
  formatTL,
  formatCoin
} from "@/components/ops/finance";
import { PayoutActionsDropdown } from "./actions-dropdown";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ requestId: string }>;
}

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getPayoutRequestDetail(requestId: string) {
  const supabase = await createServerSupabaseClient();

  // Ödeme talebi
  const { data: request, error } = await supabase
    .from("payout_requests")
    .select(
      `
      *,
      payment_methods (*)
    `
    )
    .eq("id", requestId)
    .single();

  if (error || !request) {
    return null;
  }

  // Creator profili
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", request.creator_id)
    .eq("type", "real")
    .single();

  // Auth user (email için)
  const { data: authData } = await supabase.auth.admin.getUserById(request.creator_id);

  // Creator bakiyesi
  const { data: balance } = await supabase
    .from("creator_balances")
    .select("*")
    .eq("creator_id", request.creator_id)
    .single();

  // Durum geçmişi
  const { data: statusHistory } = await supabase
    .from("payout_status_history")
    .select("*")
    .eq("payout_request_id", requestId)
    .order("created_at", { ascending: false });

  // Admin bilgileri
  const adminIds = [
    ...(statusHistory?.map((h) => h.changed_by).filter(Boolean) || []),
    request.reviewed_by
  ].filter(Boolean);

  const { data: admins } = await supabase
    .from("admin_profiles")
    .select("id, full_name, email")
    .in("id", adminIds);

  const adminMap = new Map(admins?.map((a) => [a.id, a]));

  const enrichedHistory = statusHistory?.map((h) => ({
    ...h,
    admin: h.changed_by ? adminMap.get(h.changed_by) : null
  }));

  // Diğer bekleyen talepler
  const { data: otherPending } = await supabase
    .from("payout_requests")
    .select("id, coin_amount, tl_amount")
    .eq("creator_id", request.creator_id)
    .neq("id", requestId)
    .in("status", ["pending", "in_review", "approved"]);

  return {
    request: {
      ...request,
      reviewer: request.reviewed_by ? adminMap.get(request.reviewed_by) : null
    },
    creator: profile ? { ...profile, email: authData?.user?.email } : null,
    balance,
    statusHistory: enrichedHistory || [],
    otherPendingRequests: otherPending || []
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function StatusHistoryItem({
  status,
  createdAt,
  admin,
  note
}: {
  status: string;
  createdAt: string;
  admin?: { full_name?: string; email?: string } | null;
  note?: string;
}) {
  return (
    <div className="flex gap-3 pb-4 last:pb-0">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary" />
        <div className="w-0.5 flex-1 bg-border" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <PayoutStatusBadge status={status as any} showIcon={false} />
          <span className="text-sm text-muted-foreground">
            {new Date(createdAt).toLocaleString("tr-TR")}
          </span>
        </div>
        {admin && (
          <p className="text-sm text-muted-foreground mt-1">{admin.full_name || admin.email}</p>
        )}
        {note && <p className="text-sm mt-1 italic">{note}</p>}
      </div>
    </div>
  );
}

async function PayoutRequestDetailContent({ requestId }: { requestId: string }) {
  const data = await getPayoutRequestDetail(requestId);

  if (!data) {
    notFound();
  }

  const { request, creator, balance, statusHistory, otherPendingRequests } = data;
  const paymentMethod = request.payment_methods;
  const canTakeAction = ["pending", "in_review", "approved"].includes(request.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/finance/payout-requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator?.avatar_url || undefined} />
              <AvatarFallback>{creator?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">@{creator?.username}</h1>
              <p className="text-sm text-muted-foreground">{creator?.email}</p>
            </div>
          </div>
        </div>

        {canTakeAction && (
          <PayoutActionsDropdown requestId={request.id} currentStatus={request.status} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sol Kolon */}
        <div className="space-y-6">
          {/* Talep Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                Talep Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Coin Miktarı</span>
                <CoinDisplay amount={request.coin_amount} showTL={false} size="lg" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">TL Tutarı</span>
                <span className="text-2xl font-bold">{formatTL(Number(request.tl_amount))}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Uygulanan Kur</span>
                <RateDisplay rate={Number(request.locked_rate)} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kur Kilitleme</span>
                <span className="text-sm">
                  {new Date(request.rate_locked_at).toLocaleString("tr-TR")}
                </span>
              </div>
              {request.is_auto_created && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Oluşturma</span>
                  <span className="text-sm text-blue-500">Otomatik Ödeme</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ödeme Yöntemi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {paymentMethod?.type === "bank" ? (
                  <Building2 className="h-5 w-5 text-blue-500" />
                ) : (
                  <Wallet className="h-5 w-5 text-purple-500" />
                )}
                Ödeme Yöntemi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethod?.type === "bank" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banka</span>
                    <span className="font-medium">{paymentMethod.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-mono text-sm">{paymentMethod.iban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hesap Sahibi</span>
                    <span className="font-medium">{paymentMethod.account_holder}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ağ</span>
                    <span className="font-medium">{paymentMethod?.crypto_network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cüzdan</span>
                    <span className="font-mono text-sm break-all">
                      {paymentMethod?.wallet_address}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Creator Bakiye */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Creator Bakiye Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam Bakiye</span>
                <span>🪙 {formatCoin(balance?.total_earned || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bu Talep</span>
                <span className="text-red-500">🪙 -{formatCoin(request.coin_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kalan</span>
                <span className="font-medium">
                  🪙 {formatCoin((balance?.available_balance || 0) + request.coin_amount)}
                </span>
              </div>
              {otherPendingRequests.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diğer Bekleyen</span>
                  <span className="text-yellow-500">
                    {otherPendingRequests.length} talep (
                    {formatTL(
                      otherPendingRequests.reduce((sum, r) => sum + Number(r.tl_amount || 0), 0)
                    )}
                    )
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon */}
        <div className="space-y-6">
          {/* Durum */}
          <Card>
            <CardHeader>
              <CardTitle>Durum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <PayoutStatusBadge status={request.status} />
              </div>
              {request.rejection_reason && (
                <p className="mt-3 text-sm text-destructive">
                  <strong>Red Sebebi:</strong> {request.rejection_reason}
                </p>
              )}
              {request.payment_reference && (
                <p className="mt-3 text-sm">
                  <strong>Ödeme Referansı:</strong> {request.payment_reference}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Durum Geçmişi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Durum Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length > 0 ? (
                <div>
                  {statusHistory.map((h, i) => (
                    <StatusHistoryItem
                      key={h.id || i}
                      status={h.status}
                      createdAt={h.created_at}
                      admin={h.admin}
                      note={h.note}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz durum değişikliği yok</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {request.internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Internal Notes
                </CardTitle>
                <CardDescription>Creator görmez</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{request.internal_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function PayoutRequestDetailPage({ params }: PageProps) {
  const { requestId } = await params;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PayoutRequestDetailContent requestId={requestId} />
    </Suspense>
  );
}
