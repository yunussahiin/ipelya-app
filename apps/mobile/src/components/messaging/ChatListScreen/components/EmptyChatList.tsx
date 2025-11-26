/**
 * EmptyChatList
 *
 * Amaç: Sohbet listesi boş state
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export function EmptyChatList() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💬</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Henüz sohbet yok</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Yeni bir sohbet başlatmak için sağ üstteki butona tıkla
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 100
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20
  }
});
