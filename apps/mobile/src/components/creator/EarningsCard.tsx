/**
 * EarningsCard Component
 * Creator gelir özet kartı
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface EarningsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isCoin?: boolean;
}

export function EarningsCard({
  title,
  value,
  subtitle,
  icon = "cash-outline",
  iconColor,
  trend,
  trendValue,
  isCoin = false
}: EarningsCardProps) {
  const { colors } = useTheme();

  const trendColors = {
    up: colors.success,
    down: colors.warning,
    neutral: colors.textMuted
  };

  const trendIcons = {
    up: "trending-up",
    down: "trending-down",
    neutral: "remove"
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name={icon} size={20} color={iconColor || colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      </View>

      <View style={styles.valueContainer}>
        {isCoin && <Text style={styles.coinIcon}>🪙</Text>}
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Text>
      </View>

      {(subtitle || trend) && (
        <View style={styles.footer}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={trendIcons[trend] as keyof typeof Ionicons.glyphMap}
                size={14}
                color={trendColors[trend]}
              />
              <Text style={[styles.trendValue, { color: trendColors[trend] }]}>{trendValue}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

interface EarningsGridProps {
  earnings: {
    total: number;
    subscriptions: number;
    gifts: number;
  };
  subscribers: {
    active: number;
    total: number;
  };
  balance: number;
}

export function EarningsGrid({ earnings, subscribers, balance }: EarningsGridProps) {
  const { colors } = useTheme();

  // Default values for safety
  const safeEarnings = earnings || { total: 0, subscriptions: 0, gifts: 0 };
  const safeSubscribers = subscribers || { active: 0, total: 0 };

  return (
    <View style={styles.grid}>
      <View style={styles.gridRow}>
        <EarningsCard
          title="Toplam Gelir"
          value={safeEarnings.total}
          icon="wallet-outline"
          isCoin
        />
        <EarningsCard title="Mevcut Bakiye" value={balance || 0} icon="cash-outline" isCoin />
      </View>
      <View style={styles.gridRow}>
        <EarningsCard
          title="Abonelik"
          value={safeEarnings.subscriptions}
          icon="repeat-outline"
          subtitle="Bu dönem"
          isCoin
        />
        <EarningsCard
          title="Hediyeler"
          value={safeEarnings.gifts}
          icon="gift-outline"
          subtitle="Bu dönem"
          isCoin
        />
      </View>
      <View style={styles.gridRow}>
        <EarningsCard title="Aktif Abone" value={safeSubscribers.active} icon="people-outline" />
        <EarningsCard
          title="Toplam Abone"
          value={safeSubscribers.total}
          icon="people-circle-outline"
          subtitle="Tüm zamanlar"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flex: 1,
    gap: 8
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  coinIcon: {
    fontSize: 20
  },
  value: {
    fontSize: 24,
    fontWeight: "700"
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  subtitle: {
    fontSize: 12
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  trendValue: {
    fontSize: 12,
    fontWeight: "500"
  },
  grid: {
    gap: 12
  },
  gridRow: {
    flexDirection: "row",
    gap: 12
  }
});
