/**
 * Live List Screen
 * Aktif canlı yayınlar ve yayın başlatma
 */

import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { LiveSessionList } from "@/components/live";
import { type LiveSessionItem } from "@/hooks/live";
import { useAuth } from "@/hooks/useAuth";

export default function LiveListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const handleSessionPress = useCallback(
    (session: LiveSessionItem) => {
      // Kendi yayınıysa broadcast'a yönlendir
      if (session.creator?.id === user?.id) {
        router.push("/broadcast");
      } else {
        router.push(`/watch/${session.id}`);
      }
    },
    [router, user]
  );

  const handleStartBroadcast = useCallback(() => {
    router.push("/broadcast");
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Canlı Yayınlar</Text>

        <Pressable
          style={[styles.startButton, { backgroundColor: colors.accent }]}
          onPress={handleStartBroadcast}
        >
          <Ionicons name="radio" size={18} color="#fff" />
          <Text style={styles.startButtonText}>Yayın Başlat</Text>
        </Pressable>
      </View>

      {/* Live Sessions List */}
      <LiveSessionList onSessionPress={handleSessionPress} />
    </View>
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
    paddingBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  }
});
