/**
 * TierTemplateCard Component
 * Tier şablon seçim kartı (Bronze, Silver, Gold, Diamond, VIP)
 *
 * Gradient arka plan ve seçili durumu gösterir.
 * @see useTierTemplates hook'u ile veritabanından şablonlar çekilir.
 */

import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { TierTemplate } from "@/hooks/useTierTemplates";

interface TierTemplateCardProps {
  template: TierTemplate;
  isSelected: boolean;
  onSelect: (template: TierTemplate) => void;
}

export function TierTemplateCard({ template, isSelected, onSelect }: TierTemplateCardProps) {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={() => onSelect(template)} activeOpacity={0.8}>
      <LinearGradient
        colors={template.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isSelected && styles.cardSelected]}
      >
        {/* Seçili göstergesi */}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}

        {/* Emoji */}
        <Text style={styles.emoji}>{template.emoji}</Text>

        {/* İsim */}
        <Text style={styles.name}>{template.name}</Text>

        {/* Önerilen Fiyat */}
        <View style={styles.priceRow}>
          <Text style={styles.coin}>🪙</Text>
          <Text style={styles.price}>{template.suggested_coin_price_monthly}</Text>
          <Text style={styles.period}>/ay</Text>
        </View>

        {/* Avantaj sayısı */}
        <Text style={styles.benefitCount}>{template.default_benefit_ids.length} avantaj</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: "hidden"
  },
  card: {
    width: 110,
    height: 140,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: "#fff"
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  emoji: {
    fontSize: 32,
    marginBottom: 6
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4
  },
  coin: {
    fontSize: 12
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 2
  },
  period: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)"
  },
  benefitCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4
  }
});
