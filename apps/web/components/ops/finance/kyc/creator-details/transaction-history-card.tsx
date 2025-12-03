"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Crown,
  Coins,
  RefreshCw,
  Video,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: "subscription" | "gift" | "payout" | "adjustment" | "ppv" | "refund";
  amount: number;
  description?: string;
  metadata?: {
    fromUser?: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
    tierName?: string;
    giftName?: string;
  };
  createdAt: string;
}

interface TransactionHistoryCardProps {
  transactions: Transaction[];
  hasMore: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function formatCoin(amount: number): string {
  const absAmount = Math.abs(amount);
  return absAmount.toLocaleString("tr-TR");
}

function getTransactionConfig(type: Transaction["type"]) {
  const config = {
    subscription: {
      icon: Crown,
      label: "Abonelik",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    gift: {
      icon: Gift,
      label: "Hediye",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    payout: {
      icon: ArrowUpRight,
      label: "Ödeme",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10"
    },
    adjustment: {
      icon: RefreshCw,
      label: "Düzeltme",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10"
    },
    ppv: {
      icon: Video,
      label: "PPV",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10"
    },
    refund: {
      icon: ArrowDownRight,
      label: "İade",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10"
    }
  };

  return config[type] || config.adjustment;
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function TransactionHistoryCard({
  transactions,
  hasMore,
  onLoadMore,
  isLoadingMore
}: TransactionHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            İşlem Geçmişi
          </CardTitle>
          <Badge variant="secondary">{transactions.length} işlem</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz işlem yok</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            </ScrollArea>

            {hasMore && onLoadMore && (
              <div className="pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      Daha Fazla Göster
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
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

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const config = getTransactionConfig(transaction.type);
  const Icon = config.icon;
  const isPositive = transaction.amount > 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div className={cn("p-2 rounded-lg", config.bgColor)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{config.label}</span>
          {transaction.metadata?.tierName && (
            <Badge variant="outline" className="text-xs">
              {transaction.metadata.tierName}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {transaction.description ||
            (transaction.metadata?.fromUser ? `@${transaction.metadata.fromUser.username}` : "-")}
        </p>
      </div>

      {/* Amount & Date */}
      <div className="text-right">
        <div
          className={cn(
            "flex items-center gap-1 font-semibold",
            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}
        >
          <Coins className="h-3.5 w-3.5" />
          {isPositive ? "+" : "-"}
          {formatCoin(transaction.amount)}
        </div>
        <p className="text-xs text-muted-foreground">
          {format(new Date(transaction.createdAt), "d MMM HH:mm", { locale: tr })}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

export function TransactionHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            İşlem Geçmişi
          </CardTitle>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-5 w-16 ml-auto" />
                <Skeleton className="h-3 w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
