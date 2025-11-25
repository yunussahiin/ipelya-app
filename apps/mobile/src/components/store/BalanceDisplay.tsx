/**
 * BalanceDisplay Component
 * Coin bakiyesini gösteren kompakt bileşen
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Ionicons } from "@expo/vector-icons";

interface BalanceDisplayProps {
  onPress?: () => void;
  showAddButton?: boolean;
  size?: "small" | "medium" | "large";
}

export function BalanceDisplay({
  onPress,
  showAddButton = true,
  size = "medium"
}: BalanceDisplayProps) {
  const { colors } = useTheme();
  const { balance, formattedBalance, isLoading } = useTokenBalance();

  const sizeStyles = {
    small: { icon: 16, text: 14, padding: 6 },
    medium: { icon: 20, text: 16, padding: 10 },
    large: { icon: 24, text: 20, padding: 14 }
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingHorizontal: currentSize.padding,
          paddingVertical: currentSize.padding / 2
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.coinContainer}>
        <Text style={styles.coinIcon}>🪙</Text>
        <Text
          style={[styles.balanceText, { color: colors.textPrimary, fontSize: currentSize.text }]}
        >
          {isLoading ? "..." : formattedBalance()}
        </Text>
      </View>

      {showAddButton && (
        <View style={[styles.addButton, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={currentSize.icon - 4} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    gap: 8
  },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  coinIcon: {
    fontSize: 18
  },
  balanceText: {
    fontWeight: "600"
  },
  addButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  }
});
