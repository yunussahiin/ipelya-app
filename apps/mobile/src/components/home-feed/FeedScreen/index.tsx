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
import { FeedList } from "../FeedList";
import { FeedHeader } from "../FeedHeader";
import { TabBar } from "../TabBar";
import { CreatePostModal } from "../CreatePostModal";
import { useCreatePost } from "../../../hooks/home-feed/useCreatePost";

type FeedTab = "feed" | "trending" | "following";

interface FeedScreenProps {
  initialTab?: FeedTab;
}

export default function FeedScreen({ initialTab = "feed" }: FeedScreenProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { mutateAsync: createPost, isPending } = useCreatePost();

  return (
    <SafeAreaView style={styles.container}>
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
      <Pressable style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Plus size={24} color="#FFFFFF" />
      </Pressable>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async ({ caption, media }) => {
          try {
            const mediaUris = media.map((m) => m.uri);
            await createPost({
              caption,
              visibility: "public",
              post_type: "standard",
              profile_type: "real",
              mediaUris
            });
            Alert.alert("✅ Başarılı", "Post oluşturuldu!");
          } catch (error) {
            Alert.alert("❌ Hata", "Post oluşturulurken hata oluştu.");
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F472B6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  }
});
