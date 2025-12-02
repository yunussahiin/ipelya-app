/**
 * ConversationDetails
 *
 * Amaç: Instagram tarzı sohbet detay/profil sayfası
 * Tarih: 2025-12-02
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "@/theme/ThemeProvider";
import { useConversationStore } from "@/store/messaging";
import {
  useUserOnlineStatus,
  useConversationMedia,
  useUpdateConversationTheme
} from "@/hooks/messaging";
import { useToast } from "@/components/ui/Toast";
import { Palette, AtSign, Clock, Lock, Users, AlertCircle } from "lucide-react-native";
import { ImageViewer } from "@/components/messaging/ChatScreen/components/ImageViewer";
import {
  ThemePickerSheet,
  type ThemePickerSheetRef
} from "@/components/messaging/ChatScreen/components/ThemePickerSheet";
import { getChatTheme, type ChatThemeId } from "@/theme/chatThemes";
import type { IMessage } from "react-native-gifted-chat";

import {
  DetailsHeader,
  ProfileSection,
  ActionButtons,
  SettingsRow,
  MediaTabs,
  MediaGrid,
  AudioPlayerModal,
  MediaTabType,
  MediaItem
} from "./components";

export function ConversationDetailsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [mediaTab, setMediaTab] = useState<MediaTabType>("images");

  // Conversation from store
  const conversation = useConversationStore((s) =>
    s.conversations.find((c) => c.id === conversationId)
  );

  // Other user info
  const otherUser = conversation?.other_participant;
  const { isOnline } = useUserOnlineStatus(otherUser?.user_id || "");

  // Debug log
  useEffect(() => {
    console.log("[ConversationDetails] conversationId:", conversationId);
    console.log("[ConversationDetails] conversation:", conversation);
    console.log("[ConversationDetails] otherUser:", otherUser);
  }, [conversationId, conversation, otherUser]);

  // ImageViewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentMediaMessage, setCurrentMediaMessage] = useState<IMessage | null>(null);

  // AudioPlayer state
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<{ url: string; duration?: number } | null>(null);

  // Theme picker ref
  const themePickerRef = useRef<ThemePickerSheetRef>(null);
  const { mutateAsync: updateTheme } = useUpdateConversationTheme();

  // Current theme
  const currentTheme = getChatTheme(conversation?.theme, isDark, {
    background: colors.background,
    surface: colors.surface,
    accent: colors.accent,
    textPrimary: colors.textPrimary,
    textMuted: colors.textMuted
  });

  // Media type mapping - tab'dan API type'a
  // Links tab'ı için henüz destek yok, boş gösterilecek
  const mediaTypeMap: Record<MediaTabType, "all" | "image" | "video" | "audio" | "none"> = {
    images: "image",
    videos: "video",
    audio: "audio",
    links: "none" // Link desteği henüz yok
  };

  // Fetch shared media
  const {
    data: mediaData,
    isLoading: mediaLoading,
    isFetching,
    fetchNextPage,
    hasNextPage
  } = useConversationMedia(conversationId || "", mediaTypeMap[mediaTab]);

  // Debug media
  useEffect(() => {
    console.log("[ConversationDetails] mediaTab:", mediaTab);
    console.log("[ConversationDetails] mediaLoading:", mediaLoading);
    console.log(
      "[ConversationDetails] mediaData:",
      mediaData?.pages?.[0]?.data?.length || 0,
      "items"
    );
  }, [mediaTab, mediaLoading, mediaData]);

  // Flatten media pages
  const sharedMedia: MediaItem[] = useMemo(() => {
    if (!mediaData?.pages) return [];
    return mediaData.pages.flatMap((page) =>
      page.data.map((item) => ({
        id: item.id,
        type: item.type as "image" | "video" | "audio" | "link",
        url: item.url,
        thumbnail_url: item.thumbnail_url || undefined,
        duration: item.duration || undefined
      }))
    );
  }, [mediaData]);

  // Convert to IMessage format for ImageViewer
  const mediaMessages: IMessage[] = useMemo(() => {
    return sharedMedia
      .filter((item) => item.type === "image" || item.type === "video")
      .map((item) => ({
        _id: item.id,
        text: "",
        createdAt: new Date(),
        user: {
          _id: otherUser?.user_id || "",
          name: otherUser?.display_name || "Kullanıcı"
        },
        image: item.type === "image" ? item.url : undefined,
        video: item.type === "video" ? item.url : undefined
      }));
  }, [sharedMedia, otherUser]);

  // Handlers
  const handleProfilePress = () => {
    if (otherUser?.user_id) {
      router.push(`/profile/${otherUser.user_id}`);
    }
  };

  const handleSearchPress = () => {
    // TODO: Search in conversation
    showToast({ type: "info", message: "Yakında" });
  };

  const handleMutePress = () => {
    // TODO: Toggle mute
    showToast({
      type: "success",
      message: conversation?.is_muted ? "Bildirimler açıldı" : "Bildirimler kapatıldı"
    });
  };

  const handleMorePress = () => {
    // TODO: Show more options
  };

  const handleThemePress = () => {
    themePickerRef.current?.open();
  };

  const handleThemeSelect = async (themeId: ChatThemeId) => {
    if (!conversationId) return;

    await updateTheme({ conversationId, theme: themeId });
    showToast({
      type: "success",
      message: `Tema ${getChatTheme(themeId).name} olarak değiştirildi`
    });
  };

  const handleMediaPress = useCallback(
    (item: MediaItem, index: number) => {
      console.log("[ConversationDetails] Media pressed:", item.id, item.type);

      if (item.type === "image" || item.type === "video") {
        // Find the corresponding IMessage
        const message = mediaMessages.find((m) => m._id === item.id);
        if (message) {
          setCurrentMediaMessage(message);
          setViewerVisible(true);
        }
      } else if (item.type === "audio") {
        // Open audio player
        setCurrentAudio({ url: item.url, duration: item.duration });
        setAudioPlayerVisible(true);
      }
    },
    [mediaMessages]
  );

  const displayName = otherUser?.display_name || conversation?.name || "Bilinmeyen";
  const avatarUrl = otherUser?.avatar_url || conversation?.avatar_url;

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <DetailsHeader />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile */}
          <ProfileSection avatarUrl={avatarUrl} displayName={displayName} isOnline={isOnline} />

          {/* Action Buttons */}
          <ActionButtons
            isMuted={conversation?.is_muted}
            onProfilePress={handleProfilePress}
            onSearchPress={handleSearchPress}
            onMutePress={handleMutePress}
            onMorePress={handleMorePress}
          />

          {/* Settings Rows */}
          <View style={styles.settingsSection}>
            <SettingsRow
              icon={Palette}
              iconColor={currentTheme.colors.accent}
              title="Tema"
              subtitle={`${currentTheme.emoji} ${currentTheme.name}`}
              onPress={handleThemePress}
            />
            <SettingsRow icon={AtSign} title="Takma adlar" onPress={() => {}} />
            <SettingsRow
              icon={Clock}
              title="Süreli mesajlar"
              subtitle="Kapalı"
              onPress={() => {}}
            />
            <SettingsRow icon={Lock} title="Gizlilik ve emniyet" onPress={() => {}} />
            <SettingsRow icon={Users} title="Grup sohbeti oluştur" onPress={() => {}} />
            <SettingsRow icon={AlertCircle} title="Bir şey çalışmıyor" onPress={() => {}} />
          </View>

          {/* Media Tabs */}
          <MediaTabs activeTab={mediaTab} onTabChange={setMediaTab} />

          {/* Media Grid */}
          <MediaGrid
            items={sharedMedia}
            onItemPress={handleMediaPress}
            activeTab={mediaTab}
            isLoading={mediaLoading || isFetching}
          />

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Image/Video Viewer */}
        <ImageViewer
          visible={viewerVisible}
          currentMessage={currentMediaMessage}
          allMediaMessages={mediaMessages}
          onClose={() => setViewerVisible(false)}
          onMediaChange={setCurrentMediaMessage}
        />

        {/* Audio Player Modal */}
        <AudioPlayerModal
          visible={audioPlayerVisible}
          audioUrl={currentAudio?.url || null}
          duration={currentAudio?.duration}
          onClose={() => {
            setAudioPlayerVisible(false);
            setCurrentAudio(null);
          }}
        />

        {/* Theme Picker Sheet */}
        <ThemePickerSheet
          ref={themePickerRef}
          currentTheme={currentTheme.id}
          onSelect={handleThemeSelect}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  settingsSection: {
    marginTop: 8
  }
});
