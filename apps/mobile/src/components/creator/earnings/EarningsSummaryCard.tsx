/**
 * EarningsSummaryCard Component
 * Toplam kazanç özet kartı - coin + TL gösterimi
 */

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { CoinRateSheet } from "./CoinRateSheet";

interface EarningsSummaryCardProps {
  totalCoins: number;
  totalTL: number;
  coinRate: {
    rate: number;
    updatedAt: string;
  };
  isLoading?: boolean;
}

export function EarningsSummaryCard({
  totalCoins,
  totalTL,
  coinRate,
  isLoading
}: EarningsSummaryCardProps) {
  const { colors } = useTheme();
  const [showRateSheet, setShowRateSheet] = useState(false);

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.accent }]}>
        <Text style={styles.label}>Toplam Kazanç</Text>

        <View style={styles.coinRow}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinValue}>
            {isLoading ? "..." : totalCoins.toLocaleString("tr-TR")}
          </Text>
        </View>

        <Pressable style={styles.tlRow} onPress={() => setShowRateSheet(true)}>
          <Text style={styles.tlValue}>
            ≈ ₺{isLoading ? "..." : totalTL.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </Text>
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <CoinRateSheet
        visible={showRateSheet}
        onClose={() => setShowRateSheet(false)}
        rate={coinRate.rate}
        updatedAt={coinRate.updatedAt}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: "center"
  },
  label: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  coinIcon: {
    fontSize: 32
  },
  coinValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#fff"
  },
  tlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  tlValue: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)"
  }
});
