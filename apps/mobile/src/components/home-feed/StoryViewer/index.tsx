/**
 * StoryViewer Component
 *
 * Instagram tarzı tam ekran hikaye görüntüleme
 * - Progress bar (üstte)
 * - Kullanıcı bilgisi (avatar, username, zaman)
 * - Tam ekran medya (image/video)
 * - Swipe left/right: Sonraki/önceki hikaye
 * - Tap left/right: Sonraki/önceki hikaye
 * - Long press: Duraklat
 * - Reactions (altta)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Text, Modal, Dimensions, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { X, Send, Heart, MoreHorizontal } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import type { Story, StoryUser } from "../StoriesRow/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STORY_DURATION = 5000; // 5 saniye (image için)

interface StoryViewerProps {
  visible: boolean;
  users: StoryUser[];
  initialUserIndex: number;
  initialStoryIndex?: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export function StoryViewer({
  visible,
  users,
  initialUserIndex,
  initialStoryIndex = 0,
  onClose,
  onStoryViewed
}: StoryViewerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);

  const currentUser = users[currentUserIndex];
  const currentStory = currentUser?.stories?.[currentStoryIndex];
  const totalStories = currentUser?.stories?.length || 0;

  // Progress animation
  const progress = useSharedValue(0);

  // Progress bar animasyonu
  const startProgress = useCallback(() => {
    if (!currentStory) return;

    const duration =
      currentStory.media_type === "video" ? (currentStory.duration || 15) * 1000 : STORY_DURATION;

    progress.value = 0;
    progress.value = withTiming(
      1,
      {
        duration,
        easing: Easing.linear
      },
      (finished) => {
        if (finished) {
          runOnJS(goToNextStory)();
        }
      }
    );
  }, [currentStory]);

  // Story değiştiğinde progress'i başlat
  useEffect(() => {
    if (visible && currentStory && !isPaused) {
      startProgress();

      // Story görüntülendi olarak işaretle
      if (onStoryViewed && !currentStory.is_viewed) {
        onStoryViewed(currentStory.id);
      }
    }
  }, [visible, currentUserIndex, currentStoryIndex, isPaused]);

  // Sonraki hikayeye geç
  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < totalStories - 1) {
      // Aynı kullanıcının sonraki hikayesi
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentUserIndex < users.length - 1) {
      // Sonraki kullanıcı
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      // Son hikaye, kapat
      onClose();
    }
  }, [currentStoryIndex, totalStories, currentUserIndex, users.length, onClose]);

  // Önceki hikayeye geç
  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Aynı kullanıcının önceki hikayesi
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      // Önceki kullanıcı
      const prevUser = users[currentUserIndex - 1];
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentStoryIndex((prevUser?.stories?.length || 1) - 1);
    }
  }, [currentStoryIndex, currentUserIndex, users]);

  // Tap gesture - sol/sağ tıklama
  const handleTap = useCallback(
    (x: number) => {
      Haptics.selectionAsync();
      if (x < SCREEN_WIDTH / 3) {
        goToPrevStory();
      } else {
        goToNextStory();
      }
    },
    [goToPrevStory, goToNextStory]
  );

  // Long press - duraklat
  const handleLongPressStart = useCallback(() => {
    setIsPaused(true);
    progress.value = progress.value; // Animasyonu durdur
  }, []);

  const handleLongPressEnd = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Gesture handlers
  const tapGesture = Gesture.Tap().onEnd((event) => {
    runOnJS(handleTap)(event.x);
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      runOnJS(handleLongPressStart)();
    })
    .onEnd(() => {
      runOnJS(handleLongPressEnd)();
    });

  const composedGesture = Gesture.Race(longPressGesture, tapGesture);

  // Progress bar animated style
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  // Zaman formatla
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Şimdi";
    if (diffMins < 60) return `${diffMins}d`;
    if (diffHours < 24) return `${diffHours}s`;
    return `${Math.floor(diffHours / 24)}g`;
  };

  if (!currentUser || !currentStory) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <GestureDetector gesture={composedGesture}>
          <View style={styles.mediaContainer}>
            {/* Media */}
            {currentStory.media_type === "image" ? (
              <Image
                source={{ uri: currentStory.media_url }}
                style={styles.media}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: currentStory.media_url }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay={!isPaused}
                isLooping={false}
                isMuted={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (status.isLoaded && status.didJustFinish) {
                    goToNextStory();
                  }
                }}
              />
            )}

            {/* Gradient overlay - top */}
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent"]}
              style={styles.topGradient}
            />

            {/* Gradient overlay - bottom */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)"]}
              style={styles.bottomGradient}
            />
          </View>
        </GestureDetector>

        {/* Progress bars */}
        <View style={[styles.progressContainer, { paddingTop: insets.top + 8 }]}>
          {currentUser.stories.map((_, index) => (
            <View key={index} style={styles.progressBarBg}>
              {index < currentStoryIndex ? (
                // Tamamlanmış
                <View style={[styles.progressBarFill, { width: "100%" }]} />
              ) : index === currentStoryIndex ? (
                // Aktif
                <Animated.View style={[styles.progressBarFill, progressStyle]} />
              ) : null}
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Pressable style={styles.userInfo} onPress={() => {}}>
            {currentUser.avatar_url ? (
              <Image
                source={{ uri: currentUser.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.surface }]} />
            )}
            <View style={styles.userTextContainer}>
              <Text style={styles.username}>{currentUser.username}</Text>
              <Text style={styles.time}>{formatTime(currentStory.created_at)}</Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton}>
              <MoreHorizontal size={24} color="#FFF" />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={onClose}>
              <X size={28} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Caption */}
        {currentStory.caption && (
          <View style={[styles.captionContainer, { paddingBottom: insets.bottom + 80 }]}>
            <Text style={styles.caption}>{currentStory.caption}</Text>
          </View>
        )}

        {/* Bottom actions */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.replyButton}>
            <Text style={styles.replyText}>Mesaj gönder...</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Heart size={28} color="#FFF" />
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Send size={26} color="#FFF" />
          </Pressable>
        </View>

        {/* Paused indicator */}
        {isPaused && (
          <View style={styles.pausedOverlay}>
            <Text style={styles.pausedText}>Duraklatıldı</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject
  },
  media: {
    width: "100%",
    height: "100%"
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200
  },
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 8,
    gap: 4,
    zIndex: 10
  },
  progressBarBg: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 1
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 10
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  userTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  username: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  time: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  captionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16
  },
  caption: {
    color: "#FFF",
    fontSize: 15,
    lineHeight: 20
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
    zIndex: 10
  },
  replyButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  replyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  pausedText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600"
  }
});

export default StoryViewer;
