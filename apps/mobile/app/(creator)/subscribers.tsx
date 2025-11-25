/**
 * Creator Subscribers Screen
 * Abone listesi ekranı
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { SubscribersList } from "@/components/creator";
import { useCreatorTiers } from "@/hooks/useCreatorTiers";

export default function SubscribersScreen() {
  const { colors } = useTheme();
  const { tiers } = useCreatorTiers();
  const [selectedTierId, setSelectedTierId] = useState<string | undefined>();

  const totalSubscribers = tiers.reduce((sum, t) => sum + (t.subscriberCount || 0), 0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Header Stats */}
      <View
        style={[
          styles.statsHeader,
          { backgroundColor: colors.surface, borderBottomColor: colors.border }
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalSubscribers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Abone</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {tiers.reduce(
              (sum, t) => sum + (t.subscriberCount || 0) * (t.coinPriceMonthly || 0),
              0
            )}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Aylık Gelir (Coin)
          </Text>
        </View>
      </View>

      {/* Tier Filter */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: !selectedTierId ? colors.accent : colors.surface,
              borderColor: colors.border
            }
          ]}
          onPress={() => setSelectedTierId(undefined)}
        >
          <Text
            style={[styles.filterText, { color: !selectedTierId ? "#fff" : colors.textPrimary }]}
          >
            Tümü
          </Text>
        </TouchableOpacity>
        {tiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedTierId === tier.id ? colors.accent : colors.surface,
                borderColor: colors.border
              }
            ]}
            onPress={() => setSelectedTierId(tier.id)}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedTierId === tier.id ? "#fff" : colors.textPrimary }
              ]}
            >
              {tier.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Subscribers List */}
      <SubscribersList tierId={selectedTierId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  statsHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1
  },
  statItem: {
    flex: 1,
    alignItems: "center"
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700"
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4
  },
  filterSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500"
  }
});
