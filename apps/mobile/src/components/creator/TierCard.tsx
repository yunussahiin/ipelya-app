/**
 * TierCard Component
 * Creator abonelik tier kartı
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface TierCardProps {
  id: string;
  name: string;
  description?: string;
  coinPriceMonthly: number;
  coinPriceYearly?: number;
  benefits: string[];
  subscriberCount?: number;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onEdit?: () => void;
  isCreatorView?: boolean;
  isLoading?: boolean;
}

export function TierCard({
  id,
  name,
  description,
  coinPriceMonthly,
  coinPriceYearly,
  benefits,
  subscriberCount = 0,
  isSubscribed = false,
  onSubscribe,
  onEdit,
  isCreatorView = false,
  isLoading = false
}: TierCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isSubscribed ? colors.accent : colors.border,
          borderWidth: isSubscribed ? 2 : 1
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
          {isCreatorView && (
            <TouchableOpacity onPress={onEdit} style={styles.editButton}>
              <Ionicons name="pencil" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        )}
      </View>

      {/* Price */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={[styles.price, { color: colors.textPrimary }]}>{coinPriceMonthly}</Text>
          <Text style={[styles.period, { color: colors.textSecondary }]}>/ay</Text>
        </View>
        {coinPriceYearly && (
          <Text style={[styles.yearlyPrice, { color: colors.textMuted }]}>
            veya 🪙 {coinPriceYearly}/yıl
          </Text>
        )}
      </View>

      {/* Benefits */}
      {benefits.length > 0 && (
        <View style={styles.benefitsSection}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.benefitText, { color: colors.textPrimary }]}>{benefit}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      {isCreatorView ? (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.subscriberInfo}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.subscriberCount, { color: colors.textSecondary }]}>
              {subscriberCount} abone
            </Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            {
              backgroundColor: isSubscribed ? colors.backgroundRaised : colors.accent
            }
          ]}
          onPress={onSubscribe}
          disabled={isSubscribed || isLoading}
        >
          <Text
            style={[styles.subscribeText, { color: isSubscribed ? colors.textSecondary : "#fff" }]}
          >
            {isLoading ? "İşleniyor..." : isSubscribed ? "Abone" : "Abone Ol"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 16
  },
  header: {
    gap: 4
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  name: {
    fontSize: 20,
    fontWeight: "700"
  },
  editButton: {
    padding: 4
  },
  description: {
    fontSize: 14
  },
  priceSection: {
    gap: 4
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4
  },
  coinIcon: {
    fontSize: 24
  },
  price: {
    fontSize: 32,
    fontWeight: "700"
  },
  period: {
    fontSize: 16
  },
  yearlyPrice: {
    fontSize: 13
  },
  benefitsSection: {
    gap: 8
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  benefitText: {
    fontSize: 14,
    flex: 1
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12
  },
  subscriberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  subscriberCount: {
    fontSize: 14
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: "600"
  }
});
