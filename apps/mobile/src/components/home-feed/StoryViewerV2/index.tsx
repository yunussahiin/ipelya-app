/**
 * StoryViewerV2 Component
 * Instagram tarzı tam ekran hikaye görüntüleme
 *
 * Animasyonlar: @birdwingo/react-native-instagram-stories'den alındı
 * - 3D Cube efekti
 * - Smooth gesture handling
 * - Modal animasyonları
 */

import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text, Modal, StyleSheet, StatusBar, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  runOnJS,
  interpolate
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { Platform } from "react-native";

import { StoryAnimation } from "./components/StoryAnimation";
import { StoryProgressBar } from "./components/StoryProgressBar";
import { StoryHeader } from "./components/StoryHeader";
import { StoryReactionPicker } from "./components/StoryReactionPicker";
import { StoryInsightsSheet } from "./components/StoryInsightsSheet";
import { StoryActions } from "./components/StoryActions";
import {
  WIDTH,
  HEIGHT,
  STORY_DURATION,
  STORY_ANIMATION_DURATION,
  LONG_PRESS_DURATION
} from "./constants";
import type { StoryUser } from "../StoriesRow/types";
import { useProfileStore } from "@/store/profile.store";
import { useReactToStory, type StoryReactionType } from "@/hooks/stories/useReactToStory";

// Gesture context type
type GestureContext = {
  x: number;
  userId?: string;
  vertical?: boolean;
  moving?: boolean;
};

interface StoryViewerV2Props {
  visible: boolean;
  users: StoryUser[];
  initialUserIndex: number;
  initialStoryIndex?: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

function StoryViewerV2Component({
  visible,
  users,
  initialUserIndex,
  initialStoryIndex = 0,
  onClose,
  onStoryViewed
}: StoryViewerV2Props) {
  const insets = useSafeAreaInsets();
  const currentUserId = useProfileStore((s) => s.profile?.id);

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<StoryReactionType | null>(null);
  const [showReactionEmoji, setShowReactionEmoji] = useState<string | null>(null);

  // Tepki hook
  const { mutate: reactToStory, isPending: isReacting } = useReactToStory();

  // Tepki animasyonu
  const reactionScale = useSharedValue(0);
  const reactionOpacity = useSharedValue(0);

  const reactionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reactionScale.value }],
    opacity: reactionOpacity.value
  }));

  // Shared values - Instagram tarzı
  const x = useSharedValue(initialUserIndex * WIDTH);
  const y = useSharedValue(HEIGHT);
  const progress = useSharedValue(0);
  const paused = useSharedValue(false);

  // Derived values - state'te tut (render sırasında x.value okumamak için)
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const currentUser = users[userIndex] || users[initialUserIndex];
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const currentStory = currentUser?.stories?.[storyIndex];
  const totalStories = currentUser?.stories?.length || 0;
  const isVideo = currentStory?.media_type === "video";
  const isOwnStory = currentUser?.user_id === currentUserId;

  // x.value değiştiğinde userIndex'i güncelle (animasyonlu)
  useAnimatedReaction(
    () => Math.round(x.value / WIDTH),
    (newIndex) => {
      runOnJS(setUserIndex)(newIndex);
    }
  );

  // Video player
  const player = useVideoPlayer(
    isVideo && currentStory?.media_url ? currentStory.media_url : null,
    (p) => {
      p.loop = false;
      p.muted = false;
      if (!isPaused) p.play();
    }
  );

  useEventListener(player, "playToEnd", () => {
    goToNextStory();
  });

  // Modal animasyonları
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    top: y.value
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, HEIGHT], [1, 0]),
    backgroundColor: "#000"
  }));

  // Modal aç (hızlı animasyon)
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      x.value = initialUserIndex * WIDTH;
      setStoryIndex(initialStoryIndex);
      // Açılış animasyonu (250ms)
      y.value = withTiming(0, { duration: 250 });
    }
  }, [visible, initialUserIndex, initialStoryIndex]);

  // Progress animasyonu
  const startProgress = useCallback(() => {
    if (!currentStory) return;

    const duration = isVideo ? (currentStory.duration || 15) * 1000 : STORY_DURATION;

    progress.value = 0;
    progress.value = withTiming(1, { duration }, (finished) => {
      if (finished) {
        runOnJS(goToNextStory)();
      }
    });
  }, [currentStory, isVideo]);

  // Story değiştiğinde progress başlat
  useEffect(() => {
    if (modalVisible && currentStory && !isPaused) {
      startProgress();
      if (onStoryViewed && !currentStory.is_viewed) {
        onStoryViewed(currentStory.id);
      }
    }
  }, [modalVisible, userIndex, storyIndex, isPaused]);

  // Sonraki story'e geç
  const goToNextStory = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      setStoryIndex((prev) => prev + 1);
    } else {
      // Sonraki kullanıcı
      const nextUserIndex = userIndex + 1;
      if (nextUserIndex < users.length) {
        scrollTo(users[nextUserIndex].user_id);
      } else {
        handleClose();
      }
    }
  }, [storyIndex, totalStories, userIndex, users]);

  // Önceki story'e geç
  const goToPrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else {
      // Önceki kullanıcı
      const prevUserIndex = userIndex - 1;
      if (prevUserIndex >= 0) {
        scrollTo(users[prevUserIndex].user_id);
      }
    }
  }, [storyIndex, userIndex, users]);

  // Kullanıcıya scroll
  const scrollTo = useCallback(
    (userId: string, animated = true) => {
      const newUserIndex = users.findIndex((u) => u.user_id === userId);
      if (newUserIndex === -1) return;

      const newX = newUserIndex * WIDTH;
      x.value = animated ? withTiming(newX, { duration: STORY_ANIMATION_DURATION }) : newX;
      setStoryIndex(0);
    },
    [users]
  );

  // Modal kapat (hızlı animasyon)
  const handleClose = useCallback(() => {
    y.value = withTiming(HEIGHT, { duration: 250 }, () => {
      runOnJS(setModalVisible)(false);
      runOnJS(onClose)();
    });
  }, [onClose]);

  // Context for gesture
  const gestureContext = useSharedValue<GestureContext>({
    x: 0,
    vertical: false,
    moving: false
  });

  // Gesture handler - Instagram tarzı (yeni Gesture API)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      gestureContext.value = {
        x: x.value,
        vertical: false,
        moving: false
      };
      paused.value = true;
      runOnJS(setIsPaused)(true);
    })
    .onUpdate((event) => {
      "worklet";
      const ctx = gestureContext.value;

      // Dikey mi yatay mı?
      if (
        ctx.x === x.value &&
        (ctx.vertical || Math.abs(event.velocityX) < Math.abs(event.velocityY))
      ) {
        gestureContext.value = { ...ctx, vertical: true };
        // Aşağı çekme - yarı hızda takip
        y.value = Math.max(0, event.translationY / 2);
      } else {
        gestureContext.value = { ...ctx, moving: true };
        // Yatay swipe - kullanıcılar arası
        x.value = Math.max(0, Math.min(ctx.x + -event.translationX, WIDTH * (users.length - 1)));
      }
    })
    .onEnd((event) => {
      "worklet";
      const ctx = gestureContext.value;

      if (ctx.vertical) {
        // Aşağı swipe - kapat
        if (event.translationY > 100) {
          runOnJS(handleClose)();
        } else {
          // Geri dön
          y.value = withTiming(0);
          paused.value = false;
          runOnJS(setIsPaused)(false);
          runOnJS(startProgress)();
        }
      } else if (ctx.moving) {
        // Yatay swipe - snap to user
        const diff = x.value - ctx.x;
        let newX: number;

        // Threshold: WIDTH / 4
        if (Math.abs(diff) < WIDTH / 4) {
          newX = ctx.x; // Geri dön
        } else {
          newX =
            diff > 0 ? Math.ceil(x.value / WIDTH) * WIDTH : Math.floor(x.value / WIDTH) * WIDTH;
        }

        // Sınırları kontrol et
        newX = Math.max(0, Math.min(newX, WIDTH * (users.length - 1)));

        x.value = withTiming(newX, { duration: STORY_ANIMATION_DURATION });
        runOnJS(setStoryIndex)(0);
      }

      paused.value = false;
      runOnJS(setIsPaused)(false);
    });

  // Tap handler
  const handlePress = useCallback(
    (locationX: number) => {
      if (isLongPress) {
        setIsLongPress(false);
        setIsPaused(false);
        startProgress();
        return;
      }

      if (locationX < WIDTH / 2) {
        goToPrevStory();
      } else {
        goToNextStory();
      }
    },
    [isLongPress, goToPrevStory, goToNextStory, startProgress]
  );

  // Long press handler
  const handleLongPress = useCallback(() => {
    setIsLongPress(true);
    setIsPaused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Emoji mapping
  const REACTION_EMOJIS: Record<string, string> = {
    heart: "❤️",
    fire: "🔥",
    laugh: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😡"
  };

  // Tepki animasyonunu göster
  const showReactionAnimation = useCallback((emoji: string) => {
    setShowReactionEmoji(emoji);
    reactionScale.value = 0;
    reactionOpacity.value = 1;
    reactionScale.value = withSpring(1.5, { damping: 8, stiffness: 200 }, () => {
      reactionScale.value = withTiming(0.8, { duration: 150 }, () => {
        reactionOpacity.value = withTiming(0, { duration: 300 });
      });
    });
  }, []);

  // Tepki verme
  const handleReaction = useCallback(
    (reactionType: StoryReactionType) => {
      if (!currentStory || isOwnStory) return;

      // Animasyonu göster
      const emoji = REACTION_EMOJIS[reactionType] || "❤️";
      showReactionAnimation(emoji);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      reactToStory(
        { storyId: currentStory.id, reactionType },
        {
          onSuccess: (data) => {
            setCurrentReaction(data.reaction_type);
          }
        }
      );
    },
    [currentStory, isOwnStory, reactToStory, showReactionAnimation]
  );

  // Story değiştiğinde tepkiyi sıfırla
  useEffect(() => {
    setCurrentReaction(currentStory?.user_reaction || null);
    setShowReactionEmoji(null);
  }, [currentStory?.id]);

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

  if (!currentUser || !currentStory) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.container}>
          <Pressable
            style={styles.pressable}
            onPress={(e) => handlePress(e.nativeEvent.locationX)}
            onLongPress={handleLongPress}
            delayLongPress={LONG_PRESS_DURATION}
            hitSlop={0}
          >
            {/* Background */}
            <Animated.View style={[styles.background, backgroundAnimatedStyle]} />

            {/* Stories container */}
            <Animated.View style={[styles.storiesContainer, modalAnimatedStyle]}>
              {users.map((user, index) => (
                <StoryAnimation key={user.user_id} x={x} index={index}>
                  <View style={styles.storyContainer}>
                    {/* Media */}
                    {user.stories[0]?.media_type === "video" ? (
                      index === userIndex && (
                        <VideoView
                          player={player}
                          style={styles.media}
                          contentFit="cover"
                          nativeControls={false}
                          surfaceType={Platform.OS === "android" ? "textureView" : undefined}
                        />
                      )
                    ) : (
                      <Image
                        source={{
                          uri: user.stories[storyIndex]?.media_url || user.stories[0]?.media_url
                        }}
                        style={styles.media}
                        contentFit="cover"
                        transition={200}
                      />
                    )}

                    {/* Gradients */}
                    <LinearGradient
                      colors={["rgba(0,0,0,0.6)", "transparent"]}
                      style={styles.topGradient}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.4)"]}
                      style={styles.bottomGradient}
                    />

                    {/* Progress bar */}
                    {index === userIndex && (
                      <StoryProgressBar
                        totalStories={user.stories.length}
                        currentIndex={storyIndex}
                        progress={progress}
                        paddingTop={insets.top + 8}
                      />
                    )}

                    {/* Header */}
                    <StoryHeader
                      avatarUrl={user.avatar_url}
                      username={user.username}
                      timeAgo={formatTime(user.stories[0]?.created_at || "")}
                      paddingTop={insets.top + 20}
                      onClose={handleClose}
                    />
                  </View>
                </StoryAnimation>
              ))}
            </Animated.View>

            {/* ═══════════════════════════════════════════════════════════════
              BAŞKASININ STORY'Sİ - Tepki picker + Mesaj gönder
              ═══════════════════════════════════════════════════════════════ */}
            {!isOwnStory && (
              <>
                {/* Emoji tepki seçici */}
                <View style={[styles.reactionContainer, { bottom: insets.bottom + 80 }]}>
                  <StoryReactionPicker
                    currentReaction={currentReaction}
                    onReact={handleReaction}
                    disabled={isReacting}
                  />
                </View>
                {/* Mesaj gönder input + action butonları */}
                <StoryActions paddingBottom={insets.bottom + 16} />
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════
              KENDİ STORY'MİZ - İstatistik butonu
              ═══════════════════════════════════════════════════════════════ */}
            {isOwnStory && (
              <Pressable
                style={[styles.insightsButton, { bottom: insets.bottom + 20 }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowInsights(true);
                }}
              >
                <View style={styles.insightsButtonContent}>
                  <Text style={styles.insightsButtonText}>
                    {currentStory?.views_count || 0} görüntülenme
                  </Text>
                  <Text style={styles.insightsButtonHint}>Detayları görmek için dokun</Text>
                </View>
              </Pressable>
            )}

            {/* Tepki animasyonu - ortada büyük emoji */}
            {showReactionEmoji && (
              <Animated.View style={[styles.reactionOverlay, reactionAnimatedStyle]}>
                <Text style={styles.reactionEmojiLarge}>{showReactionEmoji}</Text>
              </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Insights Sheet (kendi story'miz için) */}
      <StoryInsightsSheet
        visible={showInsights}
        onClose={() => setShowInsights(false)}
        viewsCount={currentStory?.views_count || 0}
        reactionsCount={currentStory?.reactions_count || 0}
        viewers={[]}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  pressable: {
    flex: 1
  },
  background: {
    ...StyleSheet.absoluteFillObject
  },
  storiesContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: HEIGHT
  },
  storyContainer: {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: "#000"
  },
  media: {
    width: WIDTH,
    height: HEIGHT
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
    height: 150
  },
  reactionContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center"
  },
  insightsButton: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center"
  },
  insightsButtonContent: {
    alignItems: "center"
  },
  insightsButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600"
  },
  insightsButtonHint: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4
  },
  reactionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
  },
  reactionEmojiLarge: {
    fontSize: 120
  }
});

export const StoryViewerV2 = memo(StoryViewerV2Component);
export default StoryViewerV2;
