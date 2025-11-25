/**
 * SubscriptionCard Component
 * Platform abonelik kartı
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface SubscriptionCardProps {
  id: string;
  title: string;
  period: "monthly" | "yearly";
  price: string;
  features: string[];
  isActive?: boolean;
  isBestValue?: boolean;
  onSubscribe: (productId: string) => void;
  isProcessing?: boolean;
}

export function SubscriptionCard({
  id,
  title,
  period,
  price,
  features,
  isActive = false,
  isBestValue = false,
  onSubscribe,
  isProcessing = false
}: SubscriptionCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isActive ? colors.success : isBestValue ? colors.accent : colors.border,
          borderWidth: isActive || isBestValue ? 2 : 1
        }
      ]}
    >
      {/* Badge */}
      {(isBestValue || isActive) && (
        <View
          style={[styles.badge, { backgroundColor: isActive ? colors.success : colors.accent }]}
        >
          <Text style={styles.badgeText}>{isActive ? "Aktif" : "En İyi Değer"}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>{price}</Text>
          <Text style={[styles.period, { color: colors.textSecondary }]}>
            /{period === "yearly" ? "yıl" : "ay"}
          </Text>
        </View>
        {period === "yearly" && (
          <Text style={[styles.savings, { color: colors.success }]}>2 ay ücretsiz!</Text>
        )}
      </View>

      {/* Features */}
      <View style={styles.features}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      {!isActive && (
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { backgroundColor: isBestValue ? colors.accent : colors.backgroundRaised }
          ]}
          onPress={() => onSubscribe(id)}
          disabled={isProcessing}
        >
          <Text
            style={[styles.subscribeText, { color: isBestValue ? "#fff" : colors.textPrimary }]}
          >
            {isProcessing ? "İşleniyor..." : "Abone Ol"}
          </Text>
        </TouchableOpacity>
      )}

      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: colors.success + "20" }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.activeText, { color: colors.success }]}>Aktif Abonelik</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    position: "relative",
    overflow: "hidden"
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline"
  },
  price: {
    fontSize: 32,
    fontWeight: "700"
  },
  period: {
    fontSize: 16,
    marginLeft: 4
  },
  savings: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4
  },
  features: {
    gap: 12,
    marginBottom: 20
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  featureText: {
    fontSize: 15,
    flex: 1
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: "600"
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12
  },
  activeText: {
    fontSize: 16,
    fontWeight: "600"
  }
});
