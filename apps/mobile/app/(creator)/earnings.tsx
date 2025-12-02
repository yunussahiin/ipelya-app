/**
 * Creator Earnings Screen
 * Gelir raporu ekranı - Dashboard'dan erişilen iç sayfa
 * Yeni componentler entegre edildi
 */

import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Info, Wallet } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useCreatorEarnings, type EarningsPeriod } from "@/hooks/useCreatorEarnings";
import {
  EarningsSummaryCard,
  EarningsBreakdown,
  EarningsTrendChart,
  TransactionList
} from "@/components/creator/earnings";

type TransactionFilterType = "all" | "subscription" | "gift" | "payout";

const PERIODS: { key: EarningsPeriod; label: string }[] = [
  { key: "7d", label: "7G" },
  { key: "30d", label: "30G" },
  { key: "90d", label: "90G" },
  { key: "all", label: "Tümü" }
];

export default function EarningsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const {
    data: earningsData,
    isLoading,
    period,
    changePeriod,
    refreshEarnings
  } = useCreatorEarnings();
  const [refreshing, setRefreshing] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilterType>("all");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(creator)/dashboard");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshEarnings();
    setRefreshing(false);
  }, [refreshEarnings]);

  // Edge function'dan gelen yeni format verileri
  const coinRate = earningsData?.coinRate?.rate || 0.5;
  const totalCoins = earningsData?.earnings?.total || earningsData?.totalCoins || 0;
  const subscriptionCoins =
    earningsData?.earnings?.subscriptions || earningsData?.subscriptionCoins || 0;
  const giftCoins = earningsData?.earnings?.gifts || earningsData?.giftCoins || 0;
  const transactions = earningsData?.transactions || [];
  const dailyTrend = earningsData?.dailyTrend || earningsData?.dailyEarnings || [];
  const tierBreakdown =
    earningsData?.tierBreakdown ||
    earningsData?.tiers?.map((t: any) => ({
      tier_id: t.id,
      tier_name: t.name,
      subscriber_count: t.subscriptions?.[0]?.count || t.subscriberCount || 0,
      total_coins:
        (t.subscriptions?.[0]?.count || t.subscriberCount || 0) *
        (t.coin_price_monthly || t.coinPriceMonthly || 0)
    })) ||
    [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Gelir Raporu</Text>
        <Pressable style={styles.walletButton} onPress={() => router.push("/(creator)/revenue")}>
          <Wallet size={22} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Total Balance Card - Yeni Component */}
        <EarningsSummaryCard
          totalCoins={totalCoins}
          totalTL={totalCoins * coinRate}
          coinRate={{
            rate: coinRate,
            updatedAt: earningsData?.coinRate?.updatedAt || new Date().toISOString()
          }}
          isLoading={isLoading}
        />

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.key}
              style={[styles.periodButton, period === p.key && styles.periodButtonActive]}
              onPress={() => changePeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Earnings Breakdown - Yeni Component */}
        <EarningsBreakdown
          subscriptionCoins={subscriptionCoins}
          giftCoins={giftCoins}
          tierBreakdown={tierBreakdown}
          coinRate={coinRate}
          isLoading={isLoading}
        />

        {/* Trend Chart - Yeni Component */}
        <EarningsTrendChart
          data={dailyTrend.map((d: any) => ({
            day: d.date || d.day,
            total_coins: d.total || d.total_coins || 0,
            subscription_coins: d.subscriptions || d.subscription_coins || 0,
            gift_coins: d.gifts || d.gift_coins || 0
          }))}
          isLoading={isLoading}
        />

        {/* Transaction List - Yeni Component */}
        <TransactionList
          transactions={transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            metadata: t.metadata,
            created_at: t.created_at
          }))}
          filter={transactionFilter}
          onFilterChange={setTransactionFilter}
          onLoadMore={() => {}}
          hasMore={earningsData?.hasMoreTransactions || false}
          isLoadingMore={false}
          coinRate={coinRate}
        />

        {/* Payout Info */}
        <View style={styles.payoutInfo}>
          <Info size={20} color={colors.textMuted} />
          <View style={styles.payoutTextContainer}>
            <Text style={styles.payoutTitle}>Para Çekme</Text>
            <Text style={styles.payoutText}>
              Kazançlarınızı çekmek için Ödeme Yönetimi sayfasına gidin. Minimum çekim tutarı 500
              coin'dir.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center"
    },
    walletButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center"
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary
    },
    scrollContent: {
      paddingBottom: insets.bottom
    },
    balanceCard: {
      margin: 20,
      padding: 24,
      borderRadius: 20,
      alignItems: "center",
      backgroundColor: colors.accent
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
      paddingHorizontal: 20,
      gap: 8
    },
    periodButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface
    },
    periodButtonActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    periodText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    },
    periodTextActive: {
      color: "#FFFFFF"
    },
    breakdownSection: {
      padding: 20
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 12,
      color: colors.textPrimary
    },
    breakdownCard: {
      padding: 16,
      borderRadius: 12,
      gap: 16,
      backgroundColor: colors.surface
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
      fontSize: 15,
      color: colors.textPrimary
    },
    breakdownValue: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary
    },
    payoutInfo: {
      flexDirection: "row",
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      gap: 12,
      alignItems: "flex-start",
      backgroundColor: colors.surface
    },
    payoutTextContainer: {
      flex: 1
    },
    payoutTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
      color: colors.textPrimary
    },
    payoutText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary
    }
  });
