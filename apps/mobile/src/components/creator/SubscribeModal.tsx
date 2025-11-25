/**
 * SubscribeModal Component
 * Creator'a abone olma modal'ı
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { TierCard } from "./TierCard";
import { useCreatorSubscription, CreatorTier } from "@/hooks/useCreatorSubscription";
import { useTokenBalance } from "@/hooks/useTokenBalance";

interface SubscribeModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  tiers: CreatorTier[];
}

export function SubscribeModal({
  visible,
  onClose,
  creatorId,
  creatorName,
  tiers
}: SubscribeModalProps) {
  const { colors } = useTheme();
  const { subscribe, isLoading, isSubscribedTo } = useCreatorSubscription();
  const { balance, hasEnoughBalance } = useTokenBalance();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const isAlreadySubscribed = isSubscribedTo(creatorId);

  const handleSubscribe = async () => {
    if (!selectedTier) return;

    try {
      await subscribe(creatorId, selectedTier, billingPeriod);
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  const selectedTierData = tiers.find((t) => t.id === selectedTier);
  const price =
    billingPeriod === "yearly"
      ? selectedTierData?.coinPriceYearly || (selectedTierData?.coinPriceMonthly || 0) * 10
      : selectedTierData?.coinPriceMonthly || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {creatorName}'a Abone Ol
          </Text>
          <View style={styles.placeholder} />
        </View>

        {isAlreadySubscribed ? (
          <View style={styles.alreadySubscribed}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={[styles.alreadyText, { color: colors.textPrimary }]}>
              Bu creator'a zaten abonesiniz!
            </Text>
          </View>
        ) : (
          <>
            {/* Balance */}
            <View style={[styles.balanceSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Mevcut Bakiye
              </Text>
              <View style={styles.balanceRow}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>
                  {balance.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Billing Period Toggle */}
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: billingPeriod === "monthly" ? colors.accent : colors.surface,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setBillingPeriod("monthly")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: billingPeriod === "monthly" ? "#fff" : colors.textPrimary }
                  ]}
                >
                  Aylık
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: billingPeriod === "yearly" ? colors.accent : colors.surface,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setBillingPeriod("yearly")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: billingPeriod === "yearly" ? "#fff" : colors.textPrimary }
                  ]}
                >
                  Yıllık
                </Text>
                <View style={[styles.saveBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.saveText}>%17</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Tiers */}
            <ScrollView style={styles.tiersContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.tiers}>
                {tiers.map((tier) => (
                  <TouchableOpacity key={tier.id} onPress={() => setSelectedTier(tier.id)}>
                    <TierCard {...tier} isSubscribed={selectedTier === tier.id} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Subscribe Button */}
            {selectedTier && (
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <View style={styles.priceInfo}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Toplam</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.coinIcon}>🪙</Text>
                    <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                      {price.toLocaleString()}
                    </Text>
                    <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                      /{billingPeriod === "yearly" ? "yıl" : "ay"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    {
                      backgroundColor: hasEnoughBalance(price)
                        ? colors.accent
                        : colors.backgroundRaised
                    }
                  ]}
                  onPress={handleSubscribe}
                  disabled={isLoading || !hasEnoughBalance(price)}
                >
                  <Text style={styles.subscribeText}>
                    {isLoading
                      ? "İşleniyor..."
                      : hasEnoughBalance(price)
                        ? "Abone Ol"
                        : "Yetersiz Bakiye"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  closeButton: {
    padding: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  placeholder: {
    width: 32
  },
  alreadySubscribed: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  alreadyText: {
    fontSize: 18,
    fontWeight: "600"
  },
  balanceSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700"
  },
  coinIcon: {
    fontSize: 24
  },
  periodToggle: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  periodText: {
    fontSize: 16,
    fontWeight: "600"
  },
  saveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  saveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600"
  },
  tiersContainer: {
    flex: 1
  },
  tiers: {
    padding: 16,
    gap: 16
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  priceInfo: {
    flex: 1
  },
  priceLabel: {
    fontSize: 12
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "700"
  },
  pricePeriod: {
    fontSize: 14
  },
  subscribeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12
  },
  subscribeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});
