/**
 * TransactionList Component
 * İşlem geçmişi listesi - filtreleme + pagination
 */

import React from "react";
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

type TransactionType = "subscription" | "gift" | "payout" | "adjustment" | "ppv" | "refund";
type FilterType = "all" | "subscription" | "gift" | "payout";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  metadata?: any;
  created_at: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  coinRate: number;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "subscription", label: "Abonelik" },
  { key: "gift", label: "Hediye" },
  { key: "payout", label: "Ödeme" }
];

const TYPE_CONFIG: Record<TransactionType, { icon: string; color: string; label: string }> = {
  subscription: { icon: "star", color: "#F59E0B", label: "Abonelik" },
  gift: { icon: "gift", color: "#EC4899", label: "Hediye" },
  payout: { icon: "arrow-down-circle", color: "#EF4444", label: "Ödeme Çıkışı" },
  adjustment: { icon: "swap-horizontal", color: "#6B7280", label: "Düzeltme" },
  ppv: { icon: "lock-open", color: "#8B5CF6", label: "PPV" },
  refund: { icon: "refresh", color: "#6B7280", label: "İade" }
};

export function TransactionList({
  transactions,
  filter,
  onFilterChange,
  onLoadMore,
  hasMore,
  isLoadingMore,
  coinRate
}: TransactionListProps) {
  const { colors } = useTheme();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    const days = hours / 24;

    if (hours < 1) return "Az önce";
    if (hours < 24) return `${Math.floor(hours)} saat önce`;
    if (days < 2) return "Dün";
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.adjustment;
    const isPositive = item.amount > 0;

    return (
      <View style={[styles.item, { backgroundColor: colors.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.typeLabel, { color: colors.textPrimary }]}>
              {config.label}
              {item.metadata?.tier_name && ` – ${item.metadata.tier_name}`}
              {item.metadata?.gift_name && ` – ${item.metadata.gift_name}`}
            </Text>
            <Text style={[styles.amount, { color: isPositive ? "#10B981" : "#EF4444" }]}>
              {isPositive ? "+" : ""}
              {item.amount.toLocaleString("tr-TR")} coin
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.subtext, { color: colors.textMuted }]}>
              {item.metadata?.from_user?.username && `@${item.metadata.from_user.username} • `}
              {formatDate(item.created_at)}
            </Text>
            <Text style={[styles.tlAmount, { color: colors.textMuted }]}>
              ≈ ₺
              {Math.abs(item.amount * coinRate).toLocaleString("tr-TR", {
                minimumFractionDigits: 0
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>İşlem Geçmişi</Text>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === f.key ? colors.accent : colors.surface,
                borderColor: colors.border
              }
            ]}
            onPress={() => onFilterChange(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? "#fff" : colors.textSecondary }
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz işlem yok</Text>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              style={[styles.loadMoreButton, { borderColor: colors.border }]}
              onPress={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.loadMoreText, { color: colors.accent }]}>
                  Daha Fazla Yükle
                </Text>
              )}
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500"
  },
  list: {
    gap: 8
  },
  item: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    gap: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  content: {
    flex: 1
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1
  },
  amount: {
    fontSize: 14,
    fontWeight: "600"
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  subtext: {
    fontSize: 12
  },
  tlAmount: {
    fontSize: 12
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14
  },
  loadMoreButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 8
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "500"
  }
});
