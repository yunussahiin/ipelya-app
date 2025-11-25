/**
 * CoinPackageCard Component
 * Coin paketi satın alma kartı
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";

interface CoinPackageCardProps {
  id: string;
  coins: number;
  bonus: number;
  price: string;
  popular?: boolean;
  onPurchase: (productId: string) => void;
  isProcessing?: boolean;
}

export function CoinPackageCard({
  id,
  coins,
  bonus,
  price,
  popular = false,
  onPurchase,
  isProcessing = false
}: CoinPackageCardProps) {
  const { colors } = useTheme();
  const totalCoins = coins + bonus;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: popular ? colors.accent : colors.border,
          borderWidth: popular ? 2 : 1
        }
      ]}
      onPress={() => onPurchase(id)}
      disabled={isProcessing}
      activeOpacity={0.8}
    >
      {popular && (
        <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.popularText}>En Popüler</Text>
        </View>
      )}

      <View style={styles.coinSection}>
        <Text style={styles.coinEmoji}>🪙</Text>
        <Text style={[styles.coinAmount, { color: colors.textPrimary }]}>
          {coins.toLocaleString()}
        </Text>
        {bonus > 0 && (
          <View style={[styles.bonusBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.bonusText}>+{bonus}</Text>
          </View>
        )}
      </View>

      {bonus > 0 && (
        <Text style={[styles.totalText, { color: colors.textSecondary }]}>
          Toplam: {totalCoins.toLocaleString()} coin
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          { backgroundColor: popular ? colors.accent : colors.backgroundRaised }
        ]}
        onPress={() => onPurchase(id)}
        disabled={isProcessing}
      >
        <Text style={[styles.priceText, { color: popular ? "#fff" : colors.textPrimary }]}>
          {isProcessing ? "İşleniyor..." : price}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    position: "relative",
    overflow: "hidden"
  },
  popularBadge: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    paddingVertical: 4,
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  popularText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  coinSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16
  },
  coinEmoji: {
    fontSize: 32
  },
  coinAmount: {
    fontSize: 28,
    fontWeight: "700"
  },
  bonusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  bonusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  totalText: {
    fontSize: 14
  },
  purchaseButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600"
  }
});
