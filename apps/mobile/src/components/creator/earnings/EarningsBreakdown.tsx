/**
 * EarningsBreakdown Component
 * Gelir dağılımı kartı - Abonelik vs Hediye
 */

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { TierBreakdownSheet } from "./TierBreakdownSheet";

interface TierEarning {
  tier_id: string;
  tier_name: string;
  subscriber_count: number;
  total_coins: number;
}

interface EarningsBreakdownProps {
  subscriptionCoins: number;
  giftCoins: number;
  tierBreakdown: TierEarning[];
  coinRate: number;
  isLoading?: boolean;
}

export function EarningsBreakdown({
  subscriptionCoins,
  giftCoins,
  tierBreakdown,
  coinRate,
  isLoading
}: EarningsBreakdownProps) {
  const { colors } = useTheme();
  const [showTierSheet, setShowTierSheet] = useState(false);

  const totalCoins = subscriptionCoins + giftCoins;
  const subscriptionPercentage = totalCoins > 0 ? (subscriptionCoins / totalCoins) * 100 : 50;

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Gelir Dağılımı</Text>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.backgroundRaised }]}>
          <View
            style={[
              styles.progressSubscription,
              { width: `${subscriptionPercentage}%`, backgroundColor: colors.accent }
            ]}
          />
        </View>

        {/* Subscription Row */}
        <Pressable style={styles.row} onPress={() => setShowTierSheet(true)}>
          <View style={styles.rowLeft}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Abonelikler</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.coinValue, { color: colors.textPrimary }]}>
              🪙 {isLoading ? "..." : subscriptionCoins.toLocaleString("tr-TR")}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Pressable>
        <Text style={[styles.tlSubtext, { color: colors.textMuted }]}>
          ≈ ₺{(subscriptionCoins * coinRate).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </Text>

        {/* Gift Row */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.dot, { backgroundColor: "#F59E0B" }]} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Hediyeler</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.coinValue, { color: colors.textPrimary }]}>
              🪙 {isLoading ? "..." : giftCoins.toLocaleString("tr-TR")}
            </Text>
          </View>
        </View>
        <Text style={[styles.tlSubtext, { color: colors.textMuted }]}>
          ≈ ₺{(giftCoins * coinRate).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Total */}
        <View style={styles.row}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Toplam</Text>
          <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
            🪙 {isLoading ? "..." : totalCoins.toLocaleString("tr-TR")}
          </Text>
        </View>
      </View>

      <TierBreakdownSheet
        visible={showTierSheet}
        onClose={() => setShowTierSheet(false)}
        tierBreakdown={tierBreakdown}
        coinRate={coinRate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden"
  },
  progressSubscription: {
    height: "100%",
    borderRadius: 4
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  rowLabel: {
    fontSize: 15
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  coinValue: {
    fontSize: 15,
    fontWeight: "600"
  },
  tlSubtext: {
    fontSize: 12,
    marginLeft: 18,
    marginBottom: 12
  },
  divider: {
    height: 1,
    marginVertical: 12
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500"
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700"
  }
});
