/**
 * Creator Earnings Screen
 * Gelir raporu ekranı
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { EarningsCard, EarningsGrid } from "@/components/creator";
import { useCreatorEarnings } from "@/hooks/useCreatorEarnings";

type Period = "week" | "month" | "year" | "all";

export default function EarningsScreen() {
  const { colors } = useTheme();
  const { earnings, isLoading, refresh } = useCreatorEarnings();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");

  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "Hafta" },
    { key: "month", label: "Ay" },
    { key: "year", label: "Yıl" },
    { key: "all", label: "Tümü" }
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Total Balance */}
        <View style={[styles.balanceCard, { backgroundColor: colors.accent }]}>
          <Text style={styles.balanceLabel}>Toplam Kazanç</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.balanceValue}>
              {isLoading ? "..." : earnings?.totalEarnings.toLocaleString() || "0"}
            </Text>
          </View>
          <Text style={styles.balanceSubtext}>
            ≈ ₺{isLoading ? "..." : ((earnings?.totalEarnings || 0) * 0.5).toLocaleString()}
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.key ? colors.accent : colors.surface,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: selectedPeriod === period.key ? "#fff" : colors.textPrimary }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Grid */}
        <View style={styles.gridSection}>
          <EarningsGrid
            subscriptionEarnings={earnings?.subscriptionEarnings || 0}
            giftEarnings={earnings?.giftEarnings || 0}
            subscriberCount={earnings?.subscriberCount || 0}
            isLoading={isLoading}
          />
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Gelir Dağılımı</Text>

          <View style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>
                  Abonelikler
                </Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                🪙 {earnings?.subscriptionEarnings.toLocaleString() || "0"}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownDot, { backgroundColor: "#FFD700" }]} />
                <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>
                  Hediyeler
                </Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                🪙 {earnings?.giftEarnings.toLocaleString() || "0"}
              </Text>
            </View>
          </View>
        </View>

        {/* Payout Info */}
        <View style={[styles.payoutInfo, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <View style={styles.payoutTextContainer}>
            <Text style={[styles.payoutTitle, { color: colors.textPrimary }]}>Ödeme Bilgisi</Text>
            <Text style={[styles.payoutText, { color: colors.textSecondary }]}>
              Kazançlarınız her ayın 1'inde banka hesabınıza aktarılır. Minimum ödeme tutarı 500
              coin'dir.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: "center"
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  coinIcon: {
    fontSize: 32
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#fff"
  },
  balanceSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600"
  },
  gridSection: {
    padding: 16
  },
  breakdownSection: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12
  },
  breakdownCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  breakdownLabel: {
    fontSize: 15
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: "600"
  },
  payoutInfo: {
    flexDirection: "row",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "flex-start"
  },
  payoutTextContainer: {
    flex: 1
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
  payoutText: {
    fontSize: 13,
    lineHeight: 18
  }
});
