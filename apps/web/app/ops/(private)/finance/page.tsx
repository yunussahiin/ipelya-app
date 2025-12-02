import { Suspense } from "react";
import Link from "next/link";
import {
  Coins,
  Users,
  CreditCard,
  FileText,
  Settings,
  TrendingUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatTL, formatCoin } from "@/components/ops/finance/utils";

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getFinanceStats() {
  const supabase = await createServerSupabaseClient();

  // Güncel kur
  const { data: currentRate } = await supabase
    .from("coin_rates")
    .select("rate, effective_from")
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  // Toplam bakiyeler
  const { data: balanceStats } = await supabase
    .from("creator_balances")
    .select("total_earned, total_withdrawn, pending_payout, available_balance");

  // Bekleyen ödeme yöntemi onayları
  const { count: pendingPaymentMethods } = await supabase
    .from("payment_methods")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Bekleyen ödeme talepleri
  const { count: pendingPayouts } = await supabase
    .from("payout_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // İncelenen ödeme talepleri
  const { count: inReviewPayouts } = await supabase
    .from("payout_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_review");

  // Bekleyen KYC başvuruları
  const { count: pendingKYC } = await supabase
    .from("kyc_applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Bugünkü onaylanan ödemeler
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayPayouts } = await supabase
    .from("payout_requests")
    .select("tl_amount")
    .eq("status", "paid")
    .gte("paid_at", today.toISOString());

  // Hesaplamalar
  const totalEarned = balanceStats?.reduce((sum, b) => sum + (b.total_earned || 0), 0) || 0;
  const totalWithdrawn = balanceStats?.reduce((sum, b) => sum + (b.total_withdrawn || 0), 0) || 0;
  const totalPending = balanceStats?.reduce((sum, b) => sum + (b.pending_payout || 0), 0) || 0;
  const totalAvailable = balanceStats?.reduce((sum, b) => sum + (b.available_balance || 0), 0) || 0;
  const todayPaidAmount = todayPayouts?.reduce((sum, p) => sum + Number(p.tl_amount || 0), 0) || 0;

  return {
    currentRate: currentRate?.rate || 0.5,
    rateUpdatedAt: currentRate?.effective_from,
    totalEarned,
    totalWithdrawn,
    totalPending,
    totalAvailable,
    pendingPaymentMethods: pendingPaymentMethods || 0,
    pendingPayouts: pendingPayouts || 0,
    inReviewPayouts: inReviewPayouts || 0,
    pendingKYC: pendingKYC || 0,
    todayPaidAmount
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  className
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  badgeVariant = "default"
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "secondary";
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          {badge !== undefined && badge > 0 && <Badge variant={badgeVariant}>{badge}</Badge>}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-sm text-primary">
            <span>Görüntüle</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AlertCard({
  title,
  description,
  type = "warning"
}: {
  title: string;
  description: string;
  type?: "warning" | "info";
}) {
  const styles = {
    warning: "border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950",
    info: "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950"
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[type]}`}>
      <AlertCircle
        className={`h-5 w-5 ${type === "warning" ? "text-orange-500" : "text-blue-500"}`}
      />
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

async function FinanceDashboardContent() {
  const stats = await getFinanceStats();

  const hasWarnings = stats.pendingPayouts > 5 || stats.pendingKYC > 3;

  return (
    <div className="space-y-6">
      {/* Uyarılar */}
      {hasWarnings && (
        <div className="space-y-2">
          {stats.pendingPayouts > 5 && (
            <AlertCard
              title="Bekleyen Ödeme Talepleri"
              description={`${stats.pendingPayouts} adet ödeme talebi bekliyor. Lütfen inceleyin.`}
              type="warning"
            />
          )}
          {stats.pendingKYC > 3 && (
            <AlertCard
              title="Bekleyen KYC Başvuruları"
              description={`${stats.pendingKYC} adet KYC başvurusu bekliyor.`}
              type="info"
            />
          )}
        </div>
      )}

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Güncel Kur"
          value={`1 🪙 = ${formatTL(stats.currentRate)}`}
          subValue={
            stats.rateUpdatedAt
              ? `Son güncelleme: ${new Date(stats.rateUpdatedAt).toLocaleDateString("tr-TR")}`
              : undefined
          }
          icon={Coins}
        />
        <StatCard
          title="Toplam Kazanılan"
          value={`🪙 ${formatCoin(stats.totalEarned)}`}
          subValue={`≈ ${formatTL(stats.totalEarned * stats.currentRate)}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Çekilebilir Bakiye"
          value={`🪙 ${formatCoin(stats.totalAvailable)}`}
          subValue={`≈ ${formatTL(stats.totalAvailable * stats.currentRate)}`}
          icon={CreditCard}
        />
        <StatCard title="Bugün Ödenen" value={formatTL(stats.todayPaidAmount)} icon={FileText} />
      </div>

      {/* Hızlı Erişim */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Hızlı Erişim</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Kur Yönetimi"
            description="Coin/TL kur oranını güncelle"
            href="/ops/finance/coin-rates"
            icon={Coins}
          />
          <QuickActionCard
            title="Creator Bakiyeleri"
            description="Tüm creator bakiyelerini görüntüle"
            href="/ops/finance/creator-balances"
            icon={Users}
          />
          <QuickActionCard
            title="Ödeme Yöntemleri"
            description="Banka/Kripto hesap onayları"
            href="/ops/finance/payment-methods"
            icon={CreditCard}
            badge={stats.pendingPaymentMethods}
            badgeVariant={stats.pendingPaymentMethods > 0 ? "destructive" : "secondary"}
          />
          <QuickActionCard
            title="Ödeme Talepleri"
            description="Payout request yönetimi"
            href="/ops/finance/payout-requests"
            icon={FileText}
            badge={stats.pendingPayouts + stats.inReviewPayouts}
            badgeVariant={stats.pendingPayouts > 0 ? "destructive" : "secondary"}
          />
          <QuickActionCard
            title="Otomatik Ödemeler"
            description="Auto-payout ayarları"
            href="/ops/finance/auto-payouts"
            icon={Settings}
          />
          <QuickActionCard
            title="KYC Başvuruları"
            description="Kimlik doğrulama onayları"
            href="/ops/kyc"
            icon={ShieldCheck}
            badge={stats.pendingKYC}
            badgeVariant={stats.pendingKYC > 0 ? "destructive" : "secondary"}
          />
        </div>
      </div>

      {/* Bekleyen İşlemler Özeti */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Bekleyen İşlemler</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPaymentMethods}</p>
                  <p className="text-sm text-muted-foreground">Ödeme Yöntemi Onayı</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPayouts}</p>
                  <p className="text-sm text-muted-foreground">Bekleyen Ödeme Talebi</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inReviewPayouts}</p>
                  <p className="text-sm text-muted-foreground">İncelenen Talep</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingKYC}</p>
                  <p className="text-sm text-muted-foreground">KYC Başvurusu</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
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
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finans Yönetimi</h1>
        <p className="text-muted-foreground">Creator gelirleri, ödemeler ve KYC yönetimi</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <FinanceDashboardContent />
      </Suspense>
    </div>
  );
}
