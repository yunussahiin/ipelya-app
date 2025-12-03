"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Coins, Wallet, TrendingUp, ArrowUpRight, Clock, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface EarningsSummary {
  // Bakiye
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingPayout: number;

  // Dönemsel
  periodEarnings: {
    subscriptions: number;
    gifts: number;
    ppv: number;
    total: number;
  };

  // Kur
  coinRate: number;
  rateUpdatedAt: string;

  // KYC Limitleri
  kycLevel: "none" | "basic" | "full";
  monthlyPayoutLimit: number;
  usedPayoutLimit: number;
}

interface EarningsSummaryCardProps {
  earnings: EarningsSummary;
  period: string;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function formatCoin(amount: number): string {
  return amount.toLocaleString("tr-TR");
}

function formatTL(amount: number): string {
  return `₺${amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function coinsToTL(coins: number, rate: number): number {
  return coins * rate;
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function EarningsSummaryCard({ earnings, period }: EarningsSummaryCardProps) {
  const payoutLimitPercentage =
    earnings.monthlyPayoutLimit > 0
      ? (earnings.usedPayoutLimit / earnings.monthlyPayoutLimit) * 100
      : 0;

  const kycLevelLabels = {
    none: "KYC Yok",
    basic: "Temel KYC",
    full: "Tam KYC"
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Gelir Raporu
          </CardTitle>
          <Badge variant="outline">{period}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Balance */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Kullanılabilir Bakiye</span>
            <Badge variant="secondary" className="gap-1">
              <Wallet className="h-3 w-3" />1 Coin = {formatTL(earnings.coinRate)}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCoin(earnings.availableBalance)}</span>
            <span className="text-lg text-muted-foreground">coin</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ≈ {formatTL(coinsToTL(earnings.availableBalance, earnings.coinRate))}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Toplam Kazanç"
            value={formatCoin(earnings.totalEarned)}
            subValue={formatTL(coinsToTL(earnings.totalEarned, earnings.coinRate))}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            label="Toplam Çekim"
            value={formatCoin(earnings.totalWithdrawn)}
            subValue={formatTL(coinsToTL(earnings.totalWithdrawn, earnings.coinRate))}
            icon={ArrowUpRight}
            trend="neutral"
          />
          <StatCard
            label="Bekleyen Ödeme"
            value={formatCoin(earnings.pendingPayout)}
            subValue={formatTL(coinsToTL(earnings.pendingPayout, earnings.coinRate))}
            icon={Clock}
            trend={earnings.pendingPayout > 0 ? "pending" : "neutral"}
          />
          <StatCard
            label="Dönem Kazancı"
            value={formatCoin(earnings.periodEarnings.total)}
            subValue={formatTL(coinsToTL(earnings.periodEarnings.total, earnings.coinRate))}
            icon={Banknote}
            trend="up"
          />
        </div>

        {/* Period Breakdown */}
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-medium">Dönem Dağılımı</p>
          <div className="space-y-2">
            <BreakdownRow
              label="Abonelikler"
              value={earnings.periodEarnings.subscriptions}
              total={earnings.periodEarnings.total}
              color="bg-blue-500"
            />
            <BreakdownRow
              label="Hediyeler"
              value={earnings.periodEarnings.gifts}
              total={earnings.periodEarnings.total}
              color="bg-purple-500"
            />
            <BreakdownRow
              label="PPV"
              value={earnings.periodEarnings.ppv}
              total={earnings.periodEarnings.total}
              color="bg-amber-500"
            />
          </div>
        </div>

        {/* Payout Limit */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Aylık Ödeme Limiti</span>
            <Badge variant={earnings.kycLevel === "full" ? "default" : "secondary"}>
              {kycLevelLabels[earnings.kycLevel]}
            </Badge>
          </div>
          <Progress value={payoutLimitPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTL(earnings.usedPayoutLimit)} kullanıldı</span>
            <span>{formatTL(earnings.monthlyPayoutLimit)} limit</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend
}: {
  label: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral" | "pending";
}) {
  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
    pending: "text-amber-600 dark:text-amber-400"
  };

  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", trendColors[trend])} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold">
        {value} <span className="text-xs font-normal text-muted-foreground">coin</span>
      </p>
      <p className="text-xs text-muted-foreground">{subValue}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  total,
  color
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {formatCoin(value)} coin ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

export function EarningsSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Gelir Raporu
          </CardTitle>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Balance Skeleton */}
        <div className="p-4 rounded-lg bg-muted/50">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-48 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Breakdown Skeleton */}
        <div className="space-y-3 pt-4 border-t">
          <Skeleton className="h-4 w-28" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
