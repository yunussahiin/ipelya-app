/**
 * StoryViewer Component
 * Instagram tarzı tam ekran hikaye görüntüleme
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Modal, Dimensions, StatusBar, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { useSharedValue, withTiming, runOnJS, Easing } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import type { StoryUser } from "../StoriesRow/types";
import { StoryProgressBar, StoryHeader, StoryActions } from "./components";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
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
  const insets = useSafeAreaInsets();

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);

  const currentUser = users[currentUserIndex];
  const currentStory = currentUser?.stories?.[currentStoryIndex];
  const totalStories = currentUser?.stories?.length || 0;
  const isVideo = currentStory?.media_type === "video";

  // Video player (expo-video) - sadece video için
  const player = useVideoPlayer(
    isVideo && currentStory?.media_url ? currentStory.media_url : null,
    (p) => {
      p.loop = false;
      p.muted = false;
      if (!isPaused) {
        p.play();
      }
    }
  );

  // Video bittiğinde sonraki hikayeye geç
  useEventListener(player, "playToEnd", () => {
    goToNextStory();
  });

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
    if (isVideo && player) {
      player.pause();
    }
  }, [isVideo, player]);

  const handleLongPressEnd = useCallback(() => {
    setIsPaused(false);
    if (isVideo && player) {
      player.play();
    }
  }, [isVideo, player]);

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
              <VideoView
                player={player}
                style={styles.media}
                contentFit="cover"
                nativeControls={false}
                // Android: overlapping video issue workaround
                surfaceType={Platform.OS === "android" ? "textureView" : undefined}
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
        <StoryProgressBar
          totalStories={totalStories}
          currentIndex={currentStoryIndex}
          progress={progress}
          paddingTop={insets.top + 8}
        />

        {/* Header */}
        <StoryHeader
          avatarUrl={currentUser.avatar_url}
          username={currentUser.username}
          timeAgo={formatTime(currentStory.created_at)}
          paddingTop={insets.top + 20}
          onClose={onClose}
        />

        {/* Caption */}
        {currentStory.caption && (
          <View style={[styles.captionContainer, { paddingBottom: insets.bottom + 80 }]}>
            <Text style={styles.caption}>{currentStory.caption}</Text>
          </View>
        )}

        {/* Bottom actions */}
        <StoryActions paddingBottom={insets.bottom + 16} />

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
