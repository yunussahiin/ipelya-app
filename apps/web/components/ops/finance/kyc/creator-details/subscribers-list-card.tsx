"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Crown, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface Subscriber {
  id: string;
  oderId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  tierName: string;
  tierId: string;
  billingPeriod: "monthly" | "yearly";
  coinPrice: number;
  status: "active" | "paused" | "cancelled" | "expired";
  startedAt: string;
  currentPeriodEnd: string;
}

interface SubscribersListCardProps {
  subscribers: Subscriber[];
  totalCount: number;
  newThisMonth: number;
  churnedThisMonth: number;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function getStatusBadge(status: Subscriber["status"]) {
  const config = {
    active: { label: "Aktif", variant: "default" as const },
    paused: { label: "Duraklatılmış", variant: "secondary" as const },
    cancelled: { label: "İptal", variant: "destructive" as const },
    expired: { label: "Süresi Dolmuş", variant: "outline" as const }
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatCoin(amount: number): string {
  return amount.toLocaleString("tr-TR");
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function SubscribersListCard({
  subscribers,
  totalCount,
  newThisMonth,
  churnedThisMonth
}: SubscribersListCardProps) {
  const activeSubscribers = subscribers.filter((s) => s.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aboneler
          </CardTitle>
          <Badge variant="secondary">{totalCount} Toplam</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <StatBox
            label="Aktif"
            value={activeSubscribers.length}
            icon={Users}
            color="text-green-600 dark:text-green-400"
          />
          <StatBox
            label="Bu Ay Yeni"
            value={newThisMonth}
            icon={TrendingUp}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatBox
            label="Bu Ay Ayrılan"
            value={churnedThisMonth}
            icon={TrendingDown}
            color="text-red-600 dark:text-red-400"
          />
        </div>

        {/* Subscribers List */}
        {subscribers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz abone yok</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {subscribers.map((subscriber) => (
                <SubscriberItem key={subscriber.id} subscriber={subscriber} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SubscriberItem({ subscriber }: { subscriber: Subscriber }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={subscriber.avatarUrl} alt={subscriber.username} />
        <AvatarFallback>{subscriber.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {subscriber.displayName || subscriber.username}
          </span>
          {getStatusBadge(subscriber.status)}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            {subscriber.tierName}
          </span>
          <span>•</span>
          <span>
            {formatCoin(subscriber.coinPrice)} coin/
            {subscriber.billingPeriod === "monthly" ? "ay" : "yıl"}
          </span>
        </div>
      </div>

      <div className="text-right text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDistanceToNow(new Date(subscriber.startedAt), {
            addSuffix: true,
            locale: tr
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

export function SubscribersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aboneler
          </CardTitle>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
              <Skeleton className="h-4 w-4 mx-auto mb-1" />
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
