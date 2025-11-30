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
import { useCreateStory } from "../../../hooks/stories/useCreateStory";
import { StoryViewer } from "../StoryViewer";
import { useStories } from "../../../hooks/home-feed/useStories";
import type { StoryUser } from "../StoriesRow/types";

type FeedTab = "feed" | "trending" | "following";

interface FeedScreenProps {
  initialTab?: FeedTab;
}

export default function FeedScreen({ initialTab = "feed" }: FeedScreenProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatorInitialTab, setCreatorInitialTab] = useState<"post" | "mini" | "story" | "reels">(
    "story"
  );
  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: createStory } = useCreateStory();

  // Stories data
  const { data: storiesData } = useStories({ includeOwn: true, profileType: "real" });
  const storyUsers: StoryUser[] = storiesData?.users || [];

  // Story viewer state
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerUserIndex, setStoryViewerUserIndex] = useState(0);
  const [storyViewerStoryIndex, setStoryViewerStoryIndex] = useState(0);

  // Hikaye ekle butonuna tıklandığında
  const handleAddStoryPress = () => {
    setCreatorInitialTab("story");
    setShowCreateModal(true);
  };

  // Hikayeye tıklandığında
  const handleStoryPress = (user: { user_id: string; username: string }, storyIndex?: number) => {
    // Kullanıcının index'ini bul
    const userIndex = storyUsers.findIndex((u) => u.user_id === user.user_id);
    if (userIndex === -1) return;

    setStoryViewerUserIndex(userIndex);
    setStoryViewerStoryIndex(storyIndex || 0);
    setShowStoryViewer(true);
  };

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
      <FeedList
        tab={activeTab}
        onAddStoryPress={handleAddStoryPress}
        onStoryPress={handleStoryPress}
      />

      {/* FAB: Create post */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={24} color={colors.buttonPrimaryText} />
      </Pressable>

      {/* Story Viewer */}
      <StoryViewer
        visible={showStoryViewer}
        users={storyUsers}
        initialUserIndex={storyViewerUserIndex}
        initialStoryIndex={storyViewerStoryIndex}
        onClose={() => setShowStoryViewer(false)}
        onStoryViewed={(storyId) => {
          console.log("📖 Story viewed:", storyId);
          // TODO: view-story API çağrısı
        }}
      />

      {/* Content Creator */}
      <ContentCreator
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialTab={creatorInitialTab}
        onContentCreated={async (content: CreatedContent) => {
          try {
            // Mini post (MiniPostCreator) zaten kendi API'sini çağırıyor
            if (content.type === "mini") {
              // Feed zaten MiniPostCreator'da yenileniyor
              return;
            }

            // Story için ayrı akış
            if (content.type === "story") {
              const media = content.media?.[0];
              if (!media) {
                Alert.alert("❌ Hata", "Medya seçilmedi");
                return;
              }

              console.log("📤 Creating story:", {
                mediaType: media.type,
                caption: content.caption?.substring(0, 50)
              });

              await createStory({
                mediaUri: media.path,
                mediaType: media.type,
                caption: content.caption,
                duration: media.duration
              });

              Alert.alert("✅ Başarılı", "Hikaye paylaşıldı!");
              return;
            }

            // Post, Reels için API çağır
            const mediaUris = content.media?.map((m) => m.path) || [];
            console.log("📤 Creating post:", {
              type: content.type,
              mediaCount: mediaUris.length,
              caption: content.caption?.substring(0, 50)
            });

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
            Alert.alert("✅ Başarılı", "Gönderi paylaşıldı!");
          } catch (error) {
            console.error("❌ Post creation error:", error);
            Alert.alert("❌ Hata", "Gönderi paylaşılırken hata oluştu.");
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
