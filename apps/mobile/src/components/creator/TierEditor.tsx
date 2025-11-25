/**
 * TierEditor Component
 * Creator tier oluşturma ve düzenleme formu
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { CreatorTier, CreateTierParams } from "@/hooks/useCreatorTiers";
import { SUGGESTED_TIER_TEMPLATES } from "@/services/iap/products";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [benefits, setBenefits] = useState<string[]>([""]);

  const isEditing = !!existingTier;

  useEffect(() => {
    if (existingTier) {
      setName(existingTier.name);
      setDescription(existingTier.description || "");
      setPriceMonthly(existingTier.coinPriceMonthly.toString());
      setPriceYearly(existingTier.coinPriceYearly?.toString() || "");
      setBenefits(existingTier.benefits.length > 0 ? existingTier.benefits : [""]);
    } else {
      resetForm();
    }
  }, [existingTier, visible]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriceMonthly("");
    setPriceYearly("");
    setBenefits([""]);
  };

  const handleSave = async () => {
    const monthlyPrice = parseInt(priceMonthly, 10);
    if (!name.trim() || isNaN(monthlyPrice) || monthlyPrice < 10) {
      return;
    }

    const yearlyPrice = priceYearly ? parseInt(priceYearly, 10) : undefined;

    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      coinPriceMonthly: monthlyPrice,
      coinPriceYearly: yearlyPrice,
      benefits: benefits.filter((b) => b.trim())
    });
  };

  const addBenefit = () => {
    setBenefits([...benefits, ""]);
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
  };

  const removeBenefit = (index: number) => {
    if (benefits.length > 1) {
      setBenefits(benefits.filter((_, i) => i !== index));
    }
  };

  const applyTemplate = (template: (typeof SUGGESTED_TIER_TEMPLATES)[number]) => {
    setName(template.name);
    setPriceMonthly(template.coinPrice.toString());
    setBenefits([...template.benefits]);
  };

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isEditing ? "Tier Düzenle" : "Yeni Tier Oluştur"}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !name.trim() || !priceMonthly}
            style={styles.saveButton}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color: name.trim() && priceMonthly ? colors.accent : colors.textMuted
                }
              ]}
            >
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Templates (only for new tiers) */}
          {!isEditing && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Hızlı Şablonlar
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.templates}>
                  {SUGGESTED_TIER_TEMPLATES.map((template, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.templateCard,
                        { backgroundColor: colors.surface, borderColor: colors.border }
                      ]}
                      onPress={() => applyTemplate(template)}
                    >
                      <Text style={[styles.templateName, { color: colors.textPrimary }]}>
                        {template.name}
                      </Text>
                      <Text style={[styles.templatePrice, { color: colors.textSecondary }]}>
                        🪙 {template.coinPrice}/ay
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Tier Adı *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Gold, Premium, VIP"
              placeholderTextColor={colors.textMuted}
              maxLength={30}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Açıklama</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tier açıklaması..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
            />
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Aylık Fiyat (Coin) *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.coinIcon}>🪙</Text>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }
                ]}
                value={priceMonthly}
                onChangeText={setPriceMonthly}
                placeholder="50"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>/ay</Text>
            </View>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Minimum: 10 coin, Maksimum: 10.000 coin
            </Text>
          </View>

          {/* Yearly Price */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Yıllık Fiyat (Opsiyonel)
            </Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.coinIcon}>🪙</Text>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }
                ]}
                value={priceYearly}
                onChangeText={setPriceYearly}
                placeholder={priceMonthly ? `${parseInt(priceMonthly, 10) * 10} (önerilen)` : ""}
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>/yıl</Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Avantajlar</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <TextInput
                  style={[
                    styles.benefitInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.textPrimary
                    }
                  ]}
                  value={benefit}
                  onChangeText={(value) => updateBenefit(index, value)}
                  placeholder="Avantaj ekle..."
                  placeholderTextColor={colors.textMuted}
                  maxLength={50}
                />
                {benefits.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeBenefit(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.warning} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              onPress={addBenefit}
              style={[styles.addButton, { borderColor: colors.accent }]}
            >
              <Ionicons name="add" size={20} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>Avantaj Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
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
  closeButton: {
    padding: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  saveButton: {
    padding: 4
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
    marginBottom: 12
  },
  templates: {
    flexDirection: "row",
    gap: 12
  },
  templateCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center"
  },
  templateName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
  templatePrice: {
    fontSize: 12
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  coinIcon: {
    fontSize: 24
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: "600"
  },
  priceLabel: {
    fontSize: 16
  },
  hint: {
    fontSize: 12,
    marginTop: 6
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  benefitInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15
  },
  removeButton: {
    padding: 4
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
  },
  bottomPadding: {
    height: 40
  }
});
