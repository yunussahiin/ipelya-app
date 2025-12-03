"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  CreatorProfileCard,
  CreatorProfileSkeleton,
  SubscriptionTiersCard,
  SubscriptionTiersSkeleton,
  SubscribersListCard,
  SubscribersListSkeleton,
  EarningsSummaryCard,
  EarningsSummarySkeleton,
  TransactionHistoryCard,
  TransactionHistorySkeleton,
  BroadcastChannelsCard,
  BroadcastChannelsSkeleton
} from "@/components/ops/finance/kyc/creator-details";
import type { CreatorProfile } from "@/components/ops/finance/kyc/creator-details/creator-profile-card";
import type { SubscriptionTier } from "@/components/ops/finance/kyc/creator-details/subscription-tiers-card";
import type { Subscriber } from "@/components/ops/finance/kyc/creator-details/subscribers-list-card";
import type { EarningsSummary } from "@/components/ops/finance/kyc/creator-details/earnings-summary-card";
import type { Transaction } from "@/components/ops/finance/kyc/creator-details/transaction-history-card";
import type { BroadcastChannel } from "@/components/ops/finance/kyc/creator-details/broadcast-channels-card";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface CreatorDetailsData {
  profile: CreatorProfile;
  tiers: SubscriptionTier[];
  subscribers: {
    list: Subscriber[];
    totalCount: number;
    newThisMonth: number;
    churnedThisMonth: number;
  };
  earnings: EarningsSummary;
  transactions: {
    list: Transaction[];
    hasMore: boolean;
  };
  broadcastChannels: BroadcastChannel[];
}

interface CreatorDetailsTabProps {
  creatorId: string;
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function CreatorDetailsTab({ creatorId }: CreatorDetailsTabProps) {
  const [data, setData] = useState<CreatorDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createBrowserSupabaseClient();
        const { data: result, error: fnError } = await supabase.functions.invoke(
          "get-creator-details",
          {
            body: { creatorId, period: "30d" }
          }
        );

        if (fnError) throw fnError;
        if (!result.success) throw new Error(result.error || "Veri alınamadı");

        setData(result.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Veri yüklenirken hata oluştu";
        console.error("[CreatorDetailsTab] Error:", err);
        setError(message);
        toast.error("Hata", {
          description: message
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (creatorId) {
      fetchData();
    }
  }, [creatorId]);

  if (isLoading) {
    return <CreatorDetailsSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || "Veri bulunamadı"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Profile + Tiers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CreatorProfileCard profile={data.profile} />
        <SubscriptionTiersCard tiers={data.tiers} totalSubscribers={data.subscribers.totalCount} />
      </div>

      {/* Row 2: Subscribers + Earnings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SubscribersListCard
          subscribers={data.subscribers.list}
          totalCount={data.subscribers.totalCount}
          newThisMonth={data.subscribers.newThisMonth}
          churnedThisMonth={data.subscribers.churnedThisMonth}
        />
        <EarningsSummaryCard earnings={data.earnings} period="Son 30 Gün" />
      </div>

      {/* Row 3: Transactions + Broadcast */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionHistoryCard
          transactions={data.transactions.list}
          hasMore={data.transactions.hasMore}
        />
        <BroadcastChannelsCard
          channels={data.broadcastChannels}
          creatorAvatarUrl={data.profile.avatarUrl}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

function CreatorDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <CreatorProfileSkeleton />
        <SubscriptionTiersSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SubscribersListSkeleton />
        <EarningsSummarySkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionHistorySkeleton />
        <BroadcastChannelsSkeleton />
      </div>
    </div>
  );
}
