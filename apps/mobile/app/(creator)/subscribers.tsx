/**
 * Creator Subscribers Screen
 * Abone listesi ekranı - Dashboard'dan erişilen iç sayfa
 */

import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { SubscribersList } from "@/components/creator";
import { useCreatorTiers } from "@/hooks/useCreatorTiers";

export default function SubscribersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { tiers } = useCreatorTiers();
  const [selectedTierId, setSelectedTierId] = useState<string | undefined>();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(creator)/dashboard");
    }
  };

  const totalSubscribers = tiers.reduce((sum, t) => sum + (t.subscriberCount || 0), 0);
  const monthlyRevenue = tiers.reduce(
    (sum, t) => sum + (t.subscriberCount || 0) * (t.coinPriceMonthly || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Abonelerim</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalSubscribers}</Text>
          <Text style={styles.statLabel}>Toplam Abone</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{monthlyRevenue}</Text>
          <Text style={styles.statLabel}>Aylık Gelir (Coin)</Text>
        </View>
      </View>

      {/* Tier Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterSection}
      >
        <Pressable
          style={[styles.filterChip, !selectedTierId && styles.filterChipActive]}
          onPress={() => setSelectedTierId(undefined)}
        >
          <Text style={[styles.filterText, !selectedTierId && styles.filterTextActive]}>Tümü</Text>
        </Pressable>
        {tiers.map((tier) => (
          <Pressable
            key={tier.id}
            style={[styles.filterChip, selectedTierId === tier.id && styles.filterChipActive]}
            onPress={() => setSelectedTierId(tier.id)}
          >
            <Text
              style={[styles.filterText, selectedTierId === tier.id && styles.filterTextActive]}
            >
              {tier.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Subscribers List */}
      <SubscribersList tierId={selectedTierId} />
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
    statsHeader: {
      flexDirection: "row",
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    statItem: {
      flex: 1,
      alignItems: "center"
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary
    },
    statLabel: {
      fontSize: 12,
      marginTop: 4,
      color: colors.textSecondary
    },
    filterSection: {
      flexDirection: "row",
      padding: 12,
      gap: 8
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface
    },
    filterChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    filterText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textPrimary
    },
    filterTextActive: {
      color: "#FFFFFF"
    }
  });
