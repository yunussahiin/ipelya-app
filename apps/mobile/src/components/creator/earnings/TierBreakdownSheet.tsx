/**
 * TierBreakdownSheet Component
 * Tier bazlı abonelik geliri detayları
 */

import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TierEarning {
  tier_id: string;
  tier_name: string;
  subscriber_count: number;
  total_coins: number;
}

interface TierBreakdownSheetProps {
  visible: boolean;
  onClose: () => void;
  tierBreakdown: TierEarning[];
  coinRate: number;
}

const TIER_EMOJIS: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  diamond: "💎",
  vip: "👑"
};

export function TierBreakdownSheet({
  visible,
  onClose,
  tierBreakdown,
  coinRate
}: TierBreakdownSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const totalCoins = tierBreakdown.reduce((sum, t) => sum + t.total_coins, 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Abonelik Gelirleri (Tier Bazlı)
          </Text>

          <ScrollView style={styles.list}>
            {tierBreakdown.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Henüz abonelik geliri yok
              </Text>
            ) : (
              tierBreakdown.map((tier) => (
                <View
                  key={tier.tier_id}
                  style={[styles.tierRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierEmoji}>
                      {TIER_EMOJIS[tier.tier_id.toLowerCase()] || "⭐"}
                    </Text>
                    <Text style={[styles.tierName, { color: colors.textPrimary }]}>
                      {tier.tier_name}
                    </Text>
                  </View>
                  <Text style={[styles.tierDetail, { color: colors.textSecondary }]}>
                    {tier.subscriber_count} abone ×{" "}
                    {Math.round(tier.total_coins / tier.subscriber_count)} coin
                  </Text>
                  <Text style={[styles.tierTotal, { color: colors.accent }]}>
                    🪙 {tier.total_coins.toLocaleString("tr-TR")}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {tierBreakdown.length > 0 && (
            <View style={[styles.totalRow, { backgroundColor: colors.backgroundRaised }]}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Toplam</Text>
              <View>
                <Text style={[styles.totalCoins, { color: colors.textPrimary }]}>
                  🪙 {totalCoins.toLocaleString("tr-TR")}
                </Text>
                <Text style={[styles.totalTL, { color: colors.textMuted }]}>
                  ≈ ₺{(totalCoins * coinRate).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.accent }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Kapat</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%"
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(128,128,128,0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16
  },
  list: {
    maxHeight: 300
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20
  },
  tierRow: {
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  tierEmoji: {
    fontSize: 20
  },
  tierName: {
    fontSize: 16,
    fontWeight: "600"
  },
  tierDetail: {
    fontSize: 13,
    marginLeft: 28,
    marginBottom: 4
  },
  tierTotal: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 28
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600"
  },
  totalCoins: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "right"
  },
  totalTL: {
    fontSize: 13,
    textAlign: "right"
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});
