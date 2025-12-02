/**
 * PayoutSummaryCard Component
 * Çekilebilir bakiye ve bekleyen talep özeti
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface PayoutSummaryCardProps {
  withdrawableBalance: number;
  pendingRequest?: {
    coin_amount: number;
    tl_amount: number;
    status: string;
  } | null;
  coinRate: number;
  onWithdraw: () => void;
  isLoading?: boolean;
}

export function PayoutSummaryCard({
  withdrawableBalance,
  pendingRequest,
  coinRate,
  onWithdraw,
  isLoading
}: PayoutSummaryCardProps) {
  const { colors } = useTheme();

  const STATUS_LABELS: Record<string, string> = {
    pending: "Bekliyor",
    in_review: "İnceleniyor",
    approved: "Onaylandı"
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.balanceSection}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Çekilebilir Bakiye</Text>
        <Text style={[styles.coinValue, { color: colors.textPrimary }]}>
          🪙 {isLoading ? "..." : withdrawableBalance.toLocaleString("tr-TR")}
        </Text>
        <Text style={[styles.tlValue, { color: colors.textMuted }]}>
          ≈ ₺
          {(withdrawableBalance * coinRate).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {pendingRequest ? (
        <View style={[styles.pendingBox, { backgroundColor: `${colors.accent}15` }]}>
          <View style={styles.pendingRow}>
            <Ionicons name="time" size={18} color={colors.accent} />
            <Text style={[styles.pendingLabel, { color: colors.accent }]}>
              {STATUS_LABELS[pendingRequest.status] || "Bekliyor"}
            </Text>
          </View>
          <Text style={[styles.pendingAmount, { color: colors.textPrimary }]}>
            🪙 {pendingRequest.coin_amount.toLocaleString("tr-TR")} (₺
            {pendingRequest.tl_amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })})
          </Text>
        </View>
      ) : (
        <Pressable
          style={[
            styles.withdrawButton,
            { backgroundColor: withdrawableBalance < 500 ? colors.textMuted : colors.accent }
          ]}
          onPress={onWithdraw}
          disabled={withdrawableBalance < 500}
        >
          <Ionicons name="arrow-down-circle" size={20} color="#fff" />
          <Text style={styles.withdrawButtonText}>Para Çek</Text>
        </Pressable>
      )}

      {withdrawableBalance < 500 && !pendingRequest && (
        <Text style={[styles.minText, { color: colors.textMuted }]}>Minimum çekim: 500 coin</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 16
  },
  balanceSection: {
    alignItems: "center",
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    marginBottom: 4
  },
  coinValue: {
    fontSize: 32,
    fontWeight: "700"
  },
  tlValue: {
    fontSize: 14,
    marginTop: 4
  },
  pendingBox: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4
  },
  pendingLabel: {
    fontSize: 13,
    fontWeight: "500"
  },
  pendingAmount: {
    fontSize: 15,
    fontWeight: "600"
  },
  withdrawButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8
  },
  withdrawButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  minText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8
  }
});
