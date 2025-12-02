/**
 * BenefitSelectionSheet Component
 * Avantaj seçimi için modal bottom sheet
 *
 * Kategorilere göre gruplandırılmış avantaj listesi gösterir.
 * @see useTierTemplates hook'u ile veritabanından avantajlar çekilir.
 */

import React from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TierBenefit } from "@/hooks/useTierTemplates";
import { TierBenefitId } from "@/services/iap/products";
import { ThemeColors } from "@/theme/ThemeProvider";
import { BenefitItem } from "./BenefitItem";

interface GroupedBenefits {
  content: TierBenefit[];
  communication: TierBenefit[];
  perks: TierBenefit[];
}

interface BenefitSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  groupedBenefits: GroupedBenefits;
  selectedBenefitIds: TierBenefitId[];
  onToggleBenefit: (benefitId: TierBenefitId) => void;
  colors: ThemeColors;
}

export function BenefitSelectionSheet({
  visible,
  onClose,
  groupedBenefits,
  selectedBenefitIds,
  onToggleBenefit,
  colors
}: BenefitSelectionSheetProps) {
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
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Avantaj Seç</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.doneText, { color: colors.accent }]}>Tamam</Text>
          </TouchableOpacity>
        </View>

        {/* Benefit List */}
        <ScrollView style={styles.list}>
          {/* İçerik Kategorisi */}
          <Text style={[styles.category, { color: colors.textSecondary }]}>📺 İçerik</Text>
          {groupedBenefits.content.map((benefit) => (
            <BenefitItem
              key={benefit.id}
              benefit={benefit}
              isSelected={selectedBenefitIds.includes(benefit.id as TierBenefitId)}
              onToggle={() => onToggleBenefit(benefit.id as TierBenefitId)}
              colors={colors}
            />
          ))}

          {/* İletişim Kategorisi */}
          <Text style={[styles.category, { color: colors.textSecondary }]}>💬 İletişim</Text>
          {groupedBenefits.communication.map((benefit) => (
            <BenefitItem
              key={benefit.id}
              benefit={benefit}
              isSelected={selectedBenefitIds.includes(benefit.id as TierBenefitId)}
              onToggle={() => onToggleBenefit(benefit.id as TierBenefitId)}
              colors={colors}
            />
          ))}

          {/* Ekstra Kategorisi */}
          <Text style={[styles.category, { color: colors.textSecondary }]}>🎁 Ekstra</Text>
          {groupedBenefits.perks.map((benefit) => (
            <BenefitItem
              key={benefit.id}
              benefit={benefit}
              isSelected={selectedBenefitIds.includes(benefit.id as TierBenefitId)}
              onToggle={() => onToggleBenefit(benefit.id as TierBenefitId)}
              colors={colors}
            />
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
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
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  title: {
    fontSize: 17,
    fontWeight: "600"
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600"
  },
  list: {
    flex: 1,
    padding: 16
  },
  category: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
});
