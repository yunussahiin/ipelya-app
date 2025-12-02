/**
 * TierEditor Component
 * Creator tier oluşturma ve düzenleme formu
 *
 * Akış:
 * 1. Tier şablonu seç (Bronze/Silver/Gold/Diamond/VIP)
 * 2. Fiyatları belirle (önerilen fiyatlar gösterilir)
 * 3. Avantajları düzenle (varsayılan avantajlar seçili gelir)
 *
 * @see useTierTemplates - Şablon ve avantaj verileri için
 * @see tier-editor/ - Alt bileşenler için
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { CreatorTier, CreateTierParams } from "@/hooks/useCreatorTiers";
import { useTierTemplates, TierTemplate } from "@/hooks/useTierTemplates";
import { TierBenefitId } from "@/services/iap/products";
import {
  TierTemplateCard,
  BenefitChip,
  BenefitSelectionSheet,
  SelectedTierInfo,
  PriceInput,
  TierEditorSkeleton
} from "./tier-editor";

interface TierEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: CreateTierParams) => Promise<void>;
  existingTier?: CreatorTier;
  isLoading?: boolean;
}

export function TierEditor({
  visible,
  onClose,
  onSave,
  existingTier,
  isLoading = false
}: TierEditorProps) {
  const { colors } = useTheme();
  const { templates, benefits, groupedBenefits, isLoading: templatesLoading } = useTierTemplates();

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [priceMonthly, setPriceMonthly] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [selectedBenefitIds, setSelectedBenefitIds] = useState<TierBenefitId[]>([]);
  const [benefitSheetVisible, setBenefitSheetVisible] = useState(false);

  const isEditing = !!existingTier;
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Form reset/populate
  useEffect(() => {
    if (existingTier && templates.length > 0) {
      const matchingTemplate = templates.find((t) => t.name === existingTier.name);
      if (matchingTemplate) {
        setSelectedTemplateId(matchingTemplate.id);
      }
      setPriceMonthly(existingTier.coinPriceMonthly.toString());
      setPriceYearly(existingTier.coinPriceYearly?.toString() || "");
      const benefitIds = existingTier.benefits
        .map((b) => benefits.find((tb) => tb.name === b || tb.id === b)?.id)
        .filter((id): id is TierBenefitId => !!id);
      setSelectedBenefitIds(benefitIds);
    } else if (!existingTier) {
      resetForm();
    }
  }, [existingTier, visible, templates, benefits]);

  const resetForm = () => {
    setSelectedTemplateId(null);
    setPriceMonthly("");
    setPriceYearly("");
    setSelectedBenefitIds([]);
  };

  // Template seçildiğinde
  const handleSelectTemplate = (template: TierTemplate) => {
    setSelectedTemplateId(template.id);
    setPriceMonthly(template.suggested_coin_price_monthly.toString());
    setPriceYearly(template.suggested_coin_price_yearly?.toString() || "");
    setSelectedBenefitIds(template.default_benefit_ids as TierBenefitId[]);
  };

  // Avantaj toggle
  const toggleBenefit = (benefitId: TierBenefitId) => {
    setSelectedBenefitIds((prev) =>
      prev.includes(benefitId) ? prev.filter((id) => id !== benefitId) : [...prev, benefitId]
    );
  };

  // Kaydet
  const handleSave = async () => {
    if (!selectedTemplate) return;

    const monthlyPrice = parseInt(priceMonthly, 10);
    if (isNaN(monthlyPrice) || monthlyPrice < 10) return;

    const yearlyPrice = priceYearly ? parseInt(priceYearly, 10) : undefined;
    const benefitNames = selectedBenefitIds
      .map((id) => benefits.find((b) => b.id === id)?.name)
      .filter(Boolean) as string[];

    await onSave({
      name: selectedTemplate.name,
      description: selectedTemplate.description || undefined,
      coinPriceMonthly: monthlyPrice,
      coinPriceYearly: yearlyPrice,
      benefits: benefitNames
    });
  };

  const canSave = selectedTemplateId && priceMonthly && !isLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isEditing ? "Tier Düzenle" : "Yeni Tier Oluştur"}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!canSave} style={styles.headerButton}>
            <Text style={[styles.saveText, { color: canSave ? colors.accent : colors.textMuted }]}>
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {templatesLoading ? (
          <TierEditorSkeleton colors={colors} />
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Tier Seçimi */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {isEditing ? "Tier Türü" : "Tier Seç"}
              </Text>
              <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                Abonelik seviyesini seçin, fiyatları kendiniz belirleyebilirsiniz
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesRow}
              >
                {templates.map((template) => (
                  <TierTemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onSelect={handleSelectTemplate}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Seçili Tier Bilgisi */}
            {selectedTemplate && <SelectedTierInfo template={selectedTemplate} colors={colors} />}

            {/* Fiyatlandırma */}
            {selectedTemplate && (
              <>
                <PriceInput
                  label="Aylık Fiyat (Coin) *"
                  value={priceMonthly}
                  onChangeText={setPriceMonthly}
                  placeholder={selectedTemplate.suggested_coin_price_monthly.toString()}
                  hint={`Önerilen: ${selectedTemplate.suggested_coin_price_monthly} coin • Min: 10, Max: 10.000`}
                  period="/ay"
                  colors={colors}
                />

                <PriceInput
                  label="Yıllık Fiyat (Opsiyonel)"
                  value={priceYearly}
                  onChangeText={setPriceYearly}
                  placeholder={
                    selectedTemplate.suggested_coin_price_yearly?.toString() ||
                    `${parseInt(priceMonthly || "0", 10) * 10}`
                  }
                  hint={`Önerilen: ${selectedTemplate.suggested_coin_price_yearly || parseInt(priceMonthly || "0", 10) * 10} coin (yıllık indirim)`}
                  period="/yıl"
                  colors={colors}
                />
              </>
            )}

            {/* Avantajlar */}
            {selectedTemplate && (
              <View style={styles.section}>
                <View style={styles.benefitsHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Avantajlar
                  </Text>
                  <Text style={[styles.benefitCount, { color: colors.textSecondary }]}>
                    {selectedBenefitIds.length} seçili
                  </Text>
                </View>

                {/* Seçili avantajlar */}
                {selectedBenefitIds.length > 0 && (
                  <View style={styles.selectedBenefits}>
                    {selectedBenefitIds.map((benefitId) => {
                      const benefit = benefits.find((b) => b.id === benefitId);
                      if (!benefit) return null;
                      return (
                        <BenefitChip
                          key={benefitId}
                          benefit={benefit}
                          onRemove={() => toggleBenefit(benefitId)}
                          colors={colors}
                        />
                      );
                    })}
                  </View>
                )}

                {/* Avantaj seçme butonu */}
                <TouchableOpacity
                  onPress={() => setBenefitSheetVisible(true)}
                  style={[styles.addButton, { borderColor: colors.accent }]}
                >
                  <Ionicons name="add" size={20} color={colors.accent} />
                  <Text style={[styles.addButtonText, { color: colors.accent }]}>Avantaj Seç</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Benefit Selection Sheet */}
        <BenefitSelectionSheet
          visible={benefitSheetVisible}
          onClose={() => setBenefitSheetVisible(false)}
          groupedBenefits={groupedBenefits}
          selectedBenefitIds={selectedBenefitIds}
          onToggleBenefit={toggleBenefit}
          colors={colors}
        />
      </KeyboardAvoidingView>
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
  headerButton: {
    padding: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600"
  },
  content: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 12
  },
  templatesRow: {
    gap: 12,
    paddingRight: 16
  },
  benefitsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  benefitCount: {
    fontSize: 13
  },
  selectedBenefits: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed"
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600"
  }
});
