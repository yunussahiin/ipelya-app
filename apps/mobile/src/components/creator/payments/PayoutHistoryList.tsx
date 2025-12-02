/**
 * PayoutHistoryList Component
 * Ödeme talebi geçmişi listesi
 */

import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

export type PayoutStatus = "pending" | "in_review" | "approved" | "paid" | "rejected" | "cancelled";

interface PayoutRequest {
  id: string;
  coin_amount: number;
  tl_amount: number;
  locked_rate: number;
  status: PayoutStatus;
  rejection_reason?: string;
  paid_at?: string;
  payment_reference?: string;
  is_auto_created: boolean;
  created_at: string;
  paymentMethodType: "bank" | "crypto";
  paymentMethodDisplayName: string;
}

interface PayoutHistoryListProps {
  requests: PayoutRequest[];
  onItemPress?: (request: PayoutRequest) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<PayoutStatus, { icon: string; color: string; label: string }> = {
  pending: { icon: "time", color: "#F59E0B", label: "Bekliyor" },
  in_review: { icon: "eye", color: "#3B82F6", label: "İnceleniyor" },
  approved: { icon: "checkmark-circle", color: "#10B981", label: "Onaylandı" },
  paid: { icon: "checkmark-done", color: "#10B981", label: "Ödendi" },
  rejected: { icon: "close-circle", color: "#EF4444", label: "Reddedildi" },
  cancelled: { icon: "ban", color: "#6B7280", label: "İptal Edildi" }
};

export function PayoutHistoryList({ requests, onItemPress, isLoading }: PayoutHistoryListProps) {
  const { colors } = useTheme();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const renderItem = ({ item }: { item: PayoutRequest }) => {
    const status = STATUS_CONFIG[item.status];

    return (
      <Pressable
        style={[styles.item, { backgroundColor: colors.surface }]}
        onPress={() => onItemPress?.(item)}
      >
        <View style={[styles.statusIcon, { backgroundColor: `${status.color}20` }]}>
          <Ionicons name={status.icon as any} size={20} color={status.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.amount, { color: colors.textPrimary }]}>
              🪙 {item.coin_amount.toLocaleString("tr-TR")}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <Text style={[styles.tlAmount, { color: colors.textSecondary }]}>
            ₺{item.tl_amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </Text>

          <View style={styles.bottomRow}>
            <View style={styles.methodRow}>
              <Ionicons
                name={item.paymentMethodType === "bank" ? "card-outline" : "wallet-outline"}
                size={14}
                color={colors.textMuted}
              />
              <Text style={[styles.methodText, { color: colors.textMuted }]}>
                {item.paymentMethodDisplayName}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          {item.status === "rejected" && item.rejection_reason && (
            <View style={[styles.rejectionBox, { backgroundColor: "#EF444410" }]}>
              <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
            </View>
          )}

          {item.status === "paid" && item.payment_reference && (
            <Text style={[styles.refText, { color: colors.textMuted }]}>
              Ref: {item.payment_reference}
            </Text>
          )}

          {item.is_auto_created && (
            <View style={[styles.autoBadge, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="repeat" size={12} color={colors.accent} />
              <Text style={[styles.autoText, { color: colors.accent }]}>Otomatik</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  };

  if (requests.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz ödeme talebi yok</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  content: {
    flex: 1
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2
  },
  amount: {
    fontSize: 16,
    fontWeight: "600"
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500"
  },
  tlAmount: {
    fontSize: 13,
    marginBottom: 6
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  methodText: {
    fontSize: 12
  },
  dateText: {
    fontSize: 12
  },
  rejectionBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6
  },
  rejectionText: {
    color: "#EF4444",
    fontSize: 12
  },
  refText: {
    fontSize: 11,
    marginTop: 4
  },
  autoBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    gap: 4
  },
  autoText: {
    fontSize: 10,
    fontWeight: "500"
  },
  emptyContainer: {
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    gap: 12
  },
  emptyText: {
    fontSize: 14
  }
});
