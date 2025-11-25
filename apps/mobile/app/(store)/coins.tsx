/**
 * Coins Purchase Screen
 * Coin satın alma ekranı
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { BalanceDisplay, CoinPackageCard } from "@/components/store";
import { usePurchase } from "@/hooks/usePurchase";
import { COIN_PACKAGES } from "@/services/iap/products";

export default function CoinsScreen() {
  const { colors } = useTheme();
  const { purchaseCoin, isProcessing, processingProductId } = usePurchase();

  const handlePurchase = async (productId: string) => {
    await purchaseCoin(productId);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={styles.balanceSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Mevcut Bakiye</Text>
          <BalanceDisplay size="medium" />
        </View>

        {/* Coin Packages */}
        <View style={styles.packagesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Coin Paketleri</Text>
          <View style={styles.packages}>
            {COIN_PACKAGES.map((pkg) => (
              <CoinPackageCard
                key={pkg.id}
                id={pkg.id}
                coins={pkg.coins}
                bonus={pkg.bonus}
                price={pkg.price}
                isPopular={pkg.isPopular}
                onPurchase={handlePurchase}
                isProcessing={isProcessing && processingProductId === pkg.id}
              />
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
            Coin'ler Ne İşe Yarar?
          </Text>
          <View style={styles.infoList}>
            <InfoItem icon="🎁" text="Creator'lara hediye gönder" colors={colors} />
            <InfoItem icon="⭐" text="Creator'lara abone ol" colors={colors} />
            <InfoItem icon="💬" text="Özel içeriklere eriş" colors={colors} />
            <InfoItem icon="🏆" text="Canlı yayınlarda öne çık" colors={colors} />
          </View>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, { color: colors.textMuted }]}>
          Satın alma işlemi Apple/Google hesabınız üzerinden gerçekleştirilir. Coin'ler iade
          edilemez ve başka hesaplara transfer edilemez.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ icon, text, colors }: { icon: string; text: string; colors: any }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={[styles.infoText, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  balanceSection: {
    padding: 16,
    alignItems: "center"
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12
  },
  packagesSection: {
    padding: 16
  },
  packages: {
    gap: 12
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 16
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  infoList: {
    gap: 10
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  infoIcon: {
    fontSize: 18
  },
  infoText: {
    fontSize: 14
  },
  terms: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    lineHeight: 18
  }
});
