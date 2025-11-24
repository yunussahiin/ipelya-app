/**
 * FeedHeader Component
 *
 * Amaç: Feed ekranının üst header'ı - Logo, bildirimler, mesajlar
 *
 * Özellikler:
 * - Logo (sol)
 * - Notifications icon (sağ)
 * - Messages icon (sağ)
 * - Badge count gösterimi
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Bell, MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

export function FeedHeader() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border }
      ]}
    >
      {/* Logo */}
      <Text style={[styles.logo, { color: colors.textPrimary }]}>İpelya</Text>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Notifications */}
        <Pressable style={styles.iconButton} onPress={() => router.push("/(notifications)")}>
          <Bell size={24} color={colors.textPrimary} />
          {/* Badge - notification count */}
          <View style={[styles.badge, { backgroundColor: colors.warning }]}>
            <Text style={[styles.badgeText, { color: colors.buttonPrimaryText }]}>3</Text>
          </View>
        </Pressable>

        {/* Messages */}
        <Pressable style={styles.iconButton} onPress={() => router.push("/(chat)")}>
          <MessageCircle size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold"
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  iconButton: {
    position: "relative"
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold"
  }
});
