"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Crown, Users, Coins, CheckCircle2, XCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface SubscriptionTier {
  id: string;
  name: string;
  description?: string;
  coinPriceMonthly: number;
  coinPriceYearly?: number;
  benefits: string[];
  maxSubscribers?: number;
  isActive: boolean;
  sortOrder: number;
  subscriberCount: number;
}

interface SubscriptionTiersCardProps {
  tiers: SubscriptionTier[];
  totalSubscribers: number;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function formatCoin(amount: number): string {
  return amount.toLocaleString("tr-TR");
}

function getTierColor(index: number): string {
  const colors = [
    "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
    "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
    "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
  ];
  return colors[index % colors.length];
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function SubscriptionTiersCard({ tiers, totalSubscribers }: SubscriptionTiersCardProps) {
  const activeTiers = tiers.filter((t) => t.isActive);
  const inactiveTiers = tiers.filter((t) => !t.isActive);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Abonelik Tierları
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {totalSubscribers} Toplam Abone
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tiers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz tier oluşturulmamış</p>
          </div>
        ) : (
          <>
            {/* Active Tiers */}
            {activeTiers.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Aktif Tierlar ({activeTiers.length})
                </p>
                {activeTiers.map((tier, index) => (
                  <TierItem key={tier.id} tier={tier} colorClass={getTierColor(index)} />
                ))}
              </div>
            )}

            {/* Inactive Tiers */}
            {inactiveTiers.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Pasif Tierlar ({inactiveTiers.length})
                </p>
                {inactiveTiers.map((tier) => (
                  <TierItem
                    key={tier.id}
                    tier={tier}
                    colorClass="bg-muted/50 border-muted text-muted-foreground"
                    inactive
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────

function TierItem({
  tier,
  colorClass,
  inactive = false
}: {
  tier: SubscriptionTier;
  colorClass: string;
  inactive?: boolean;
}) {
  const fillPercentage = tier.maxSubscribers
    ? Math.min((tier.subscriberCount / tier.maxSubscribers) * 100, 100)
    : 0;

  return (
    <div className={cn("rounded-lg border p-4 space-y-3", colorClass, inactive && "opacity-60")}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          <span className="font-semibold">{tier.name}</span>
          {!tier.isActive && (
            <Badge variant="outline" className="text-xs">
              Pasif
            </Badge>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 font-semibold">
            <Coins className="h-4 w-4" />
            {formatCoin(tier.coinPriceMonthly)}
            <span className="text-xs font-normal text-muted-foreground">/ay</span>
          </div>
          {tier.coinPriceYearly && (
            <div className="text-xs text-muted-foreground">
              {formatCoin(tier.coinPriceYearly)}/yıl
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {tier.description && <p className="text-sm opacity-80">{tier.description}</p>}

      {/* Subscriber Count */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {tier.subscriberCount} abone
          </span>
          {tier.maxSubscribers && (
            <span className="text-muted-foreground">/ {tier.maxSubscribers} max</span>
          )}
        </div>
        {tier.maxSubscribers && <Progress value={fillPercentage} className="h-1.5" />}
      </div>

      {/* Benefits */}
      {tier.benefits.length > 0 && (
        <div className="pt-2 border-t border-current/10">
          <p className="text-xs font-medium mb-1.5 opacity-70">Avantajlar:</p>
          <div className="flex flex-wrap gap-1">
            {tier.benefits.slice(0, 3).map((benefit, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-background/50">
                {benefit}
              </Badge>
            ))}
            {tier.benefits.length > 3 && (
              <Badge variant="outline" className="text-xs bg-background/50">
                +{tier.benefits.length - 3} daha
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

export function SubscriptionTiersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Abonelik Tierları
          </CardTitle>
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
