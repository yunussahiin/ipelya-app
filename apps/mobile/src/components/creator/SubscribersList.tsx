/**
 * SubscribersList Component
 * Creator'ın abone listesi
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient";

interface Subscriber {
  id: string;
  subscriberId: string;
  status: string;
  coinPrice: number;
  startedAt: string;
  currentPeriodEnd: string;
  billingPeriod: string;
  tierName: string;
  profile?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface SubscribersListProps {
  tierId?: string;
  onSubscriberPress?: (subscriber: Subscriber) => void;
}

export function SubscribersList({ tierId, onSubscriberPress }: SubscribersListProps) {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const fetchSubscribers = useCallback(async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from("creator_subscriptions")
        .select(
          `
          *,
          tier:creator_subscription_tiers!left(name)
        `
        )
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });

      if (tierId) {
        query = query.eq("tier_id", tierId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubscribers(
        data?.map((sub) => ({
          id: sub.id,
          subscriberId: sub.subscriber_id,
          status: sub.status,
          coinPrice: sub.coin_price,
          startedAt: sub.started_at,
          currentPeriodEnd: sub.current_period_end,
          billingPeriod: sub.billing_period,
          tierName: (sub.tier as { name?: string })?.name || "Unknown",
          profile: undefined
        })) || []
      );
    } catch (error) {
      console.error("Fetch subscribers error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, tierId]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubscribers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success;
      case "paused":
        return colors.warning;
      case "cancelled":
      case "expired":
        return colors.textMuted;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "paused":
        return "Askıda";
      case "cancelled":
        return "İptal";
      case "expired":
        return "Süresi Dolmuş";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const renderSubscriber = ({ item }: { item: Subscriber }) => (
    <TouchableOpacity
      style={[
        styles.subscriberCard,
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}
      onPress={() => onSubscriberPress?.(item)}
      activeOpacity={onSubscriberPress ? 0.7 : 1}
    >
      <View style={styles.subscriberHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
          <Text style={styles.avatarText}>
            {(item.profile?.displayName || item.profile?.username || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.subscriberInfo}>
          <Text style={[styles.subscriberName, { color: colors.textPrimary }]}>
            {item.profile?.displayName || item.profile?.username || "Kullanıcı"}
          </Text>
          <Text style={[styles.subscriberTier, { color: colors.textSecondary }]}>
            {item.tierName} • {item.billingPeriod === "yearly" ? "Yıllık" : "Aylık"}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.subscriberDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.detailText, { color: colors.textMuted }]}>
            {formatDate(item.startedAt)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={[styles.detailText, { color: colors.textMuted }]}>
            {item.coinPrice}/{item.billingPeriod === "yearly" ? "yıl" : "ay"}
          </Text>
        </View>
        {item.status === "active" && (
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textMuted }]}>
              {formatDate(item.currentPeriodEnd)}'e kadar
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color={colors.textMuted} />
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz abone yok</Text>
      <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
        Tier'larınızı paylaşarak abone kazanın
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={subscribers}
      keyExtractor={(item) => item.id}
      renderItem={renderSubscriber}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 12
  },
  subscriberCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1
  },
  subscriberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600"
  },
  subscriberInfo: {
    flex: 1
  },
  subscriberName: {
    fontSize: 16,
    fontWeight: "600"
  },
  subscriberTier: {
    fontSize: 13,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600"
  },
  subscriberDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)"
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  coinIcon: {
    fontSize: 12
  },
  detailText: {
    fontSize: 12
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40
  },
  loadingText: {
    fontSize: 14
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center"
  }
});
