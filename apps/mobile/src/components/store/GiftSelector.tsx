/**
 * GiftSelector Component
 * Hediye seçim grid'i
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { GIFT_TYPES, GiftType } from "@/services/iap/products";
import { useGiftSend } from "@/hooks/useGiftSend";

interface GiftSelectorProps {
  onGiftSelect: (giftType: GiftType) => void;
  selectedGift?: GiftType;
  compact?: boolean;
}

export function GiftSelector({ onGiftSelect, selectedGift, compact = false }: GiftSelectorProps) {
  const { colors } = useTheme();
  const { canAffordGift } = useGiftSend();

  const gifts = Object.values(GIFT_TYPES);

  return (
    <ScrollView
      horizontal={compact}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={compact ? styles.horizontalContainer : styles.gridContainer}
    >
      {gifts.map((gift) => {
        const isSelected = selectedGift === gift.id;
        const canAfford = canAffordGift(gift.id as GiftType);

        return (
          <TouchableOpacity
            key={gift.id}
            style={[
              compact ? styles.compactItem : styles.gridItem,
              {
                backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                borderColor: isSelected ? colors.accent : colors.border,
                opacity: canAfford ? 1 : 0.5
              }
            ]}
            onPress={() => onGiftSelect(gift.id as GiftType)}
            disabled={!canAfford}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{gift.emoji}</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{gift.name}</Text>
            <View style={styles.costContainer}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={[styles.cost, { color: colors.textSecondary }]}>{gift.cost}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

interface GiftGridProps {
  onGiftSelect: (giftType: GiftType) => void;
  selectedGift?: GiftType;
}

export function GiftGrid({ onGiftSelect, selectedGift }: GiftGridProps) {
  const { colors } = useTheme();
  const { canAffordGift } = useGiftSend();

  const gifts = Object.values(GIFT_TYPES);

  return (
    <View style={styles.gridContainer}>
      {gifts.map((gift) => {
        const isSelected = selectedGift === gift.id;
        const canAfford = canAffordGift(gift.id as GiftType);

        return (
          <TouchableOpacity
            key={gift.id}
            style={[
              styles.gridItem,
              {
                backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                borderColor: isSelected ? colors.accent : colors.border,
                opacity: canAfford ? 1 : 0.5
              }
            ]}
            onPress={() => onGiftSelect(gift.id as GiftType)}
            disabled={!canAfford}
            activeOpacity={0.7}
          >
            <Text style={styles.gridEmoji}>{gift.emoji}</Text>
            <Text style={[styles.gridName, { color: colors.textPrimary }]}>{gift.name}</Text>
            <View style={styles.costContainer}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={[styles.cost, { color: colors.textSecondary }]}>{gift.cost}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center"
  },
  compactItem: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80
  },
  gridItem: {
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    width: "30%",
    minWidth: 100
  },
  emoji: {
    fontSize: 28,
    marginBottom: 4
  },
  gridEmoji: {
    fontSize: 36,
    marginBottom: 8
  },
  name: {
    fontSize: 12,
    fontWeight: "500"
  },
  gridName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
  costContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  coinIcon: {
    fontSize: 12
  },
  cost: {
    fontSize: 12,
    fontWeight: "500"
  }
});
