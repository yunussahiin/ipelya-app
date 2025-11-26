/**
 * Creator Earnings Screen
 * Gelir raporu ekranı - Dashboard'dan erişilen iç sayfa
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Info } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useCreatorEarnings, type EarningsPeriod } from "@/hooks/useCreatorEarnings";

const PERIODS: { key: EarningsPeriod; label: string }[] = [
  { key: "7d", label: "Hafta" },
  { key: "30d", label: "Ay" },
  { key: "90d", label: "3 Ay" },
  { key: "all", label: "Tümü" }
];

export default function EarningsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { data: earningsData, isLoading, period, changePeriod } = useCreatorEarnings();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(creator)/dashboard");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Gelir Raporu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Toplam Kazanç</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.balanceValue}>
              {isLoading ? "..." : (earningsData?.earnings?.total || 0).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.balanceSubtext}>
            ≈ ₺{((earningsData?.earnings?.total || 0) * 0.5).toLocaleString()}
          </Text>
        </View>

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

        {/* Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Gelir Dağılımı</Text>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.breakdownLabel}>Abonelikler</Text>
              </View>
              <Text style={styles.breakdownValue}>
                🪙 {(earningsData?.earnings?.subscriptions || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownDot, { backgroundColor: "#FFD700" }]} />
                <Text style={styles.breakdownLabel}>Hediyeler</Text>
              </View>
              <Text style={styles.breakdownValue}>
                🪙 {(earningsData?.earnings?.gifts || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Payout Info */}
        <View style={styles.payoutInfo}>
          <Info size={20} color={colors.textMuted} />
          <View style={styles.payoutTextContainer}>
            <Text style={styles.payoutTitle}>Ödeme Bilgisi</Text>
            <Text style={styles.payoutText}>
              Kazançlarınız her ayın 1'inde banka hesabınıza aktarılır. Minimum ödeme tutarı 500
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
