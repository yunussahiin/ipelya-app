/**
 * FeedScreen Component
 *
 * Amaç: Ana feed ekranı - Kullanıcıların içerikleri görüntülediği ana sayfa
 *
 * Özellikler:
 * - Tab navigation (Feed, Trending, Following)
 * - Pull to refresh
 * - Infinite scroll
 * - Vibe & Intent filtering
 * - Real-time updates
 *
 * Kullanım:
 * <FeedScreen initialTab="feed" />
 *
 * State Management:
 * - useFeed hook (feed data)
 * - useFeedRealtime hook (realtime updates)
 * - feed.store.ts (Zustand)
 */

import React, { useState } from "react";
import { StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/theme/ThemeProvider";
import { FeedList } from "../FeedList";
import { FeedHeader } from "../FeedHeader";
import { TabBar } from "../TabBar";
import { ContentCreator, CreatedContent } from "../ContentCreator";
import { useCreatePost } from "../../../hooks/home-feed/useCreatePost";

type FeedTab = "feed" | "trending" | "following";

interface FeedScreenProps {
  initialTab?: FeedTab;
}

export default function FeedScreen({ initialTab = "feed" }: FeedScreenProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { mutateAsync: createPost } = useCreatePost();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header: Logo, notifications, messages */}
      <FeedHeader />

      {/* Tab bar: Feed, Trending, Following */}
      <TabBar
        tabs={[
          { id: "feed", label: "Feed" },
          { id: "trending", label: "Trend" },
          { id: "following", label: "Takip" }
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as FeedTab)}
      />

      {/* Feed list: Infinite scroll, pull to refresh */}
      <FeedList tab={activeTab} />

      {/* FAB: Create post */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={24} color={colors.buttonPrimaryText} />
      </Pressable>

      {/* Content Creator */}
      <ContentCreator
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialTab="story"
        onContentCreated={async (content: CreatedContent) => {
          try {
            // Mini post ve text post (MiniPostCreator'dan gelen) zaten kendi API'sini çağırıyor
            // Tekrar createPost çağırma
            if (content.type === "mini" || content.type === "post") {
              // Feed zaten MiniPostCreator'da yenileniyor
              return;
            }

            const mediaUris = content.media?.map((m) => m.path) || [];
            await createPost({
              caption: content.caption,
              visibility: "public",
              post_type: "standard",
              profile_type: "real",
              mediaUris: content.poll ? [] : mediaUris,
              poll_options: content.poll?.options,
              poll_question: content.poll?.question
            });
            // Feed'i yenile
            await queryClient.invalidateQueries({ queryKey: ["feed"] });
            Alert.alert("✅ Başarılı", "İçerik oluşturuldu!");
          } catch (error) {
            Alert.alert("❌ Hata", "İçerik oluşturulurken hata oluştu.");
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  }
});
