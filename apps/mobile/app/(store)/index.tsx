/**
 * Store Index Screen
 * Ana mağaza ekranı
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { BalanceDisplay } from "@/components/store";

export default function StoreScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const menuItems = [
    {
      id: "coins",
      title: "Coin Satın Al",
      description: "Hediye göndermek ve creator'lara abone olmak için coin al",
      icon: "wallet-outline" as const,
      color: "#FFD700",
      route: "/(store)/coins"
    },
    {
      id: "subscription",
      title: "Premium Abonelik",
      description: "Reklamsız deneyim ve özel özellikler",
      icon: "diamond-outline" as const,
      color: "#9B59B6",
      route: "/(store)/subscription"
    },
    {
      id: "history",
      title: "Satın Alma Geçmişi",
      description: "Geçmiş işlemlerini görüntüle",
      icon: "receipt-outline" as const,
      color: colors.textSecondary,
      route: "/(store)/history"
    }
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceSection}>
          <BalanceDisplay
            showAddButton
            onAddPress={() => router.push("/(store)/coins")}
            size="large"
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Tüm satın almalar Apple/Google hesabınız üzerinden işlenir. Abonelikler otomatik
            yenilenir.
          </Text>
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity style={styles.restoreButton}>
          <Text style={[styles.restoreText, { color: colors.accent }]}>
            Satın Almaları Geri Yükle
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  balanceSection: {
    padding: 16
  },
  menuSection: {
    padding: 16,
    gap: 12
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  menuContent: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4
  },
  menuDescription: {
    fontSize: 13
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 16,
    padding: 14,
    borderRadius: 12
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  restoreButton: {
    alignItems: "center",
    padding: 16
  },
  restoreText: {
    fontSize: 15,
    fontWeight: "500"
  }
});
