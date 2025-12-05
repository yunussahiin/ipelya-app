/**
 * Live List Screen
 * Aktif canlı yayınlar ve yayın başlatma
 * Tab yapısı: Video Yayınlar / Sesli Odalar
 */

import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { LiveSessionList } from "@/components/live";
import { type LiveSessionItem } from "@/hooks/live";
import { useAuth } from "@/hooks/useAuth";

type TabType = "video" | "audio";

export default function LiveListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("video");

  const handleSessionPress = useCallback(
    (session: LiveSessionItem) => {
      const isOwner = session.creator?.userId === user?.id;

      if (session.sessionType === "audio_room") {
        if (isOwner) {
          // Kendi audio room'u - host ekranına git (session bilgisiyle)
          router.push({
            pathname: "/(live)/audio-room",
            params: { resumeSessionId: session.id }
          });
        } else {
          // Başkasının audio room'u - dinleyici olarak katıl
          router.push(`/(live)/audio-room/${session.id}`);
        }
      } else {
        // Video yayın
        if (isOwner) {
          // Kendi video yayını - broadcast ekranına git (session bilgisiyle)
          router.push({
            pathname: "/(live)/broadcast",
            params: { resumeSessionId: session.id }
          });
        } else {
          // Başkasının video yayını - izleyici olarak katıl
          router.push(`/(live)/watch/${session.id}`);
        }
      }
    },
    [router, user]
  );

  const handleStartBroadcast = useCallback(() => {
    if (activeTab === "audio") {
      router.push("/(live)/audio-room");
    } else {
      router.push("/(live)/broadcast");
    }
  }, [router, activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Canlı</Text>

        <Pressable
          style={[styles.startButton, { backgroundColor: colors.accent }]}
          onPress={handleStartBroadcast}
        >
          <Ionicons name={activeTab === "audio" ? "mic" : "videocam"} size={18} color="#fff" />
          <Text style={styles.startButtonText}>
            {activeTab === "audio" ? "Oda Aç" : "Yayın Başlat"}
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "video" && [styles.activeTab, { borderBottomColor: colors.accent }]
          ]}
          onPress={() => setActiveTab("video")}
        >
          <Ionicons
            name="videocam"
            size={18}
            color={activeTab === "video" ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "video" ? colors.accent : colors.textMuted }
            ]}
          >
            Video Yayınlar
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            activeTab === "audio" && [styles.activeTab, { borderBottomColor: colors.accent }]
          ]}
          onPress={() => setActiveTab("audio")}
        >
          <Ionicons
            name="mic"
            size={18}
            color={activeTab === "audio" ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "audio" ? colors.accent : colors.textMuted }
            ]}
          >
            Sesli Odalar
          </Text>
        </Pressable>
      </View>

      {/* Live Sessions List - Filtered by tab */}
      <LiveSessionList
        onSessionPress={handleSessionPress}
        sessionType={activeTab === "audio" ? "audio_room" : "video_live"}
      />
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
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  activeTab: {
    borderBottomWidth: 2
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600"
  }
});
