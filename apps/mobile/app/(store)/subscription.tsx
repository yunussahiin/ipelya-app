/**
 * Subscription Screen
 * Platform abonelik ekranı
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { SubscriptionCard } from "@/components/store";
import { usePurchase } from "@/hooks/usePurchase";
import { PLATFORM_SUBSCRIPTIONS } from "@/services/iap/products";

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const { purchaseSubscription, isProcessing, processingProductId, activeSubscription } =
    usePurchase();

  const handleSubscribe = async (productId: string) => {
    await purchaseSubscription(productId);
  };

  const features = [
    { icon: "checkmark-circle", text: "Reklamsız deneyim" },
    { icon: "checkmark-circle", text: "Özel rozetler ve profil çerçeveleri" },
    { icon: "checkmark-circle", text: "Öncelikli destek" },
    { icon: "checkmark-circle", text: "Erken erişim özellikleri" },
    { icon: "checkmark-circle", text: "Aylık bonus coin'ler" }
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: colors.accent + "20" }]}>
            <Ionicons name="diamond" size={40} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>İpelya Premium</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            En iyi deneyim için premium'a geç
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.featuresSection, { backgroundColor: colors.surface }]}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name={feature.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={colors.success}
              />
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Subscription Options */}
        <View style={styles.subscriptionsSection}>
          {PLATFORM_SUBSCRIPTIONS.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              id={sub.id}
              title={sub.title}
              period={sub.period}
              price={sub.price}
              features={[...sub.features]}
              isActive={activeSubscription?.productId === sub.id}
              isBestValue={sub.period === "yearly"}
              onSubscribe={handleSubscribe}
              isProcessing={isProcessing && processingProductId === sub.id}
            />
          ))}
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsTitle, { color: colors.textSecondary }]}>
            Abonelik Koşulları
          </Text>
          <Text style={[styles.termsText, { color: colors.textMuted }]}>
            • Abonelik otomatik olarak yenilenir{"\n"}• İstediğiniz zaman iptal edebilirsiniz{"\n"}•
            İptal, mevcut dönem sonunda geçerli olur{"\n"}• Ödeme Apple/Google hesabınızdan alınır
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    alignItems: "center",
    padding: 24
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center"
  },
  featuresSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    gap: 14
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  featureText: {
    fontSize: 15
  },
  subscriptionsSection: {
    padding: 16,
    gap: 16
  },
  termsSection: {
    padding: 16
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20
  }
});
