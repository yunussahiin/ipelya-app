/**
 * BroadcastListHeader
 *
 * Amaç: Yayın kanalları listesi header
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

export function BroadcastListHeader() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Yayın Kanalları</Text>

      <Pressable
        style={[styles.createButton, { backgroundColor: colors.accent }]}
        onPress={() => router.push("/broadcast/create")}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  title: {
    fontSize: 28,
    fontWeight: "700"
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  }
});
