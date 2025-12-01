/**
 * StoryViewer Component
 * Instagram tarzı tam ekran hikaye görüntüleme
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  Pressable
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  cancelAnimation
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import type { StoryUser } from "../StoriesRow/types";
import {
  StoryProgressBar,
  StoryHeader,
  StoryActions,
  StoryReactionPicker,
  StoryInsightsSheet
} from "./components";
import { useProfileStore } from "@/store/profile.store";
import { useReactToStory, type StoryReactionType } from "@/hooks/stories/useReactToStory";

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
  const insets = useSafeAreaInsets();
  const currentUserId = useProfileStore((s) => s.profile?.id);
  const { mutate: reactToStory, isPending: isReacting } = useReactToStory();

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<StoryReactionType | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  // initialUserIndex değiştiğinde state'i güncelle (yeni story açıldığında)
  // Key: Her tıklamada mutlaka güncellenmeli
  useEffect(() => {
    console.log("📖 [StoryViewer] Props changed:", {
      visible,
      initialUserIndex,
      initialStoryIndex,
      currentUserIndex,
      targetUser: users[initialUserIndex]?.username
    });

    if (visible) {
      // Her zaman initialUserIndex'e git
      if (currentUserIndex !== initialUserIndex || currentStoryIndex !== initialStoryIndex) {
        console.log("📖 [StoryViewer] Updating to:", {
          from: { userIndex: currentUserIndex, storyIndex: currentStoryIndex },
          to: { userIndex: initialUserIndex, storyIndex: initialStoryIndex }
        });
        setCurrentUserIndex(initialUserIndex);
        setCurrentStoryIndex(initialStoryIndex);
      }
    }
  }, [visible, initialUserIndex, initialStoryIndex]);

  const currentUser = users[currentUserIndex];
  const currentStory = currentUser?.stories?.[currentStoryIndex];

  // Debug log
  useEffect(() => {
    if (visible && currentUser) {
      console.log("📖 [StoryViewer] Current state:", {
        currentUserIndex,
        currentStoryIndex,
        currentUser: currentUser?.username,
        currentUserId: currentUser?.user_id,
        isOwnStory: currentUser?.user_id === currentUserId,
        myUserId: currentUserId
      });
    }
  }, [visible, currentUserIndex, currentUser]);
  const totalStories = currentUser?.stories?.length || 0;
  const isVideo = currentStory?.media_type === "video";
  const isOwnStory = currentUser?.user_id === currentUserId;

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

  // Swipe animasyonları
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Tepki animasyonu
  const reactionScale = useSharedValue(0);
  const reactionOpacity = useSharedValue(0);
  const [showReactionEmoji, setShowReactionEmoji] = useState<string | null>(null);

  // Container animasyonu (aşağı çekme)
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
    borderRadius: translateY.value > 0 ? 20 : 0
  }));

  // Tepki emoji animasyonu
  const reactionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reactionScale.value }],
    opacity: reactionOpacity.value
  }));

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
    if (visible && currentStory && !isPaused && !showInsights) {
      startProgress();

      // Story görüntülendi olarak işaretle
      if (onStoryViewed && !currentStory.is_viewed) {
        onStoryViewed(currentStory.id);
      }
    }
  }, [visible, currentUserIndex, currentStoryIndex, isPaused, showInsights]);

  // Insights sheet açıldığında progress ve video'yu durdur
  useEffect(() => {
    if (showInsights) {
      // Progress animasyonunu durdur
      cancelAnimation(progress);
      // Video'yu durdur
      if (isVideo && player) {
        player.pause();
      }
    } else if (!isPaused) {
      // Sheet kapandığında devam et
      if (isVideo && player) {
        player.play();
      }
      startProgress();
    }
  }, [showInsights]);

  // Story değiştiğinde reaction'ı sıfırla
  useEffect(() => {
    setCurrentReaction(currentStory?.user_reaction || null);
    setShowReactionEmoji(null);
  }, [currentStory?.id]);

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

  // Sonraki hikayeye geç
  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < totalStories - 1) {
      // Aynı kullanıcının sonraki hikayesi
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      // Kendi story'miz bitince kapat, başkasına geçme
      const isViewingOwnStory = currentUser?.user_id === currentUserId;
      if (isViewingOwnStory) {
        onClose();
        return;
      }

      // Sonraki kullanıcıyı bul (başkasının story'sindeysek)
      let nextUserIndex = currentUserIndex + 1;

      // Kendi story'mizi atla
      while (nextUserIndex < users.length && users[nextUserIndex]?.user_id === currentUserId) {
        nextUserIndex++;
      }

      if (nextUserIndex < users.length) {
        // Sonraki kullanıcı
        setCurrentUserIndex(nextUserIndex);
        setCurrentStoryIndex(0);
      } else {
        // Son hikaye, kapat
        onClose();
      }
    }
  }, [
    currentStoryIndex,
    totalStories,
    currentUserIndex,
    users,
    currentUserId,
    currentUser,
    onClose
  ]);

  // Önceki hikayeye geç
  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Aynı kullanıcının önceki hikayesi
      setCurrentStoryIndex((prev) => prev - 1);
    } else {
      // Önceki kullanıcıyı bul
      let prevUserIndex = currentUserIndex - 1;

      // Eğer şu an başkasının story'sindeysem, kendi story'mi atla
      const isViewingOwnStory = currentUser?.user_id === currentUserId;
      if (!isViewingOwnStory) {
        while (prevUserIndex >= 0 && users[prevUserIndex]?.user_id === currentUserId) {
          prevUserIndex--;
        }
      }

      if (prevUserIndex >= 0) {
        // Önceki kullanıcı
        const prevUser = users[prevUserIndex];
        setCurrentUserIndex(prevUserIndex);
        setCurrentStoryIndex((prevUser?.stories?.length || 1) - 1);
      }
    }
  }, [currentStoryIndex, currentUserIndex, users, currentUserId, currentUser]);

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
    // Animasyonu durdur - cancelAnimation kullanmak daha doğru olurdu ama
    // şimdilik progress değerini koruyoruz
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

  // Sonraki kullanıcıya geç (swipe left)
  const goToNextUser = useCallback(() => {
    let nextUserIndex = currentUserIndex + 1;

    // Kendi story'mizi atla (başkasının story'sindeysek)
    const isViewingOwnStory = currentUser?.user_id === currentUserId;
    if (!isViewingOwnStory) {
      while (nextUserIndex < users.length && users[nextUserIndex]?.user_id === currentUserId) {
        nextUserIndex++;
      }
    }

    if (nextUserIndex < users.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentUserIndex(nextUserIndex);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  }, [currentUserIndex, users, currentUserId, currentUser, onClose]);

  // Önceki kullanıcıya geç (swipe right)
  const goToPrevUser = useCallback(() => {
    let prevUserIndex = currentUserIndex - 1;

    // Kendi story'mizi atla (başkasının story'sindeysek)
    const isViewingOwnStory = currentUser?.user_id === currentUserId;
    if (!isViewingOwnStory) {
      while (prevUserIndex >= 0 && users[prevUserIndex]?.user_id === currentUserId) {
        prevUserIndex--;
      }
    }

    if (prevUserIndex >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(0);
    }
  }, [currentUserIndex, users, currentUserId, currentUser]);

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

  // Swipe gesture - basit versiyon
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      "worklet";
      // Aşağı çekme
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        scale.value = 1 - event.translationY / 1000;
      }
    })
    .onEnd((event) => {
      "worklet";
      // Aşağı swipe = kapat
      if (event.translationY > 150 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        runOnJS(onClose)();
        return;
      }
      // Sola swipe = sonraki
      if (event.translationX < -100) {
        runOnJS(goToNextUser)();
      }
      // Sağa swipe = önceki
      else if (event.translationX > 100) {
        runOnJS(goToPrevUser)();
      }
      // Reset
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    });

  const composedGesture = Gesture.Race(longPressGesture, swipeGesture, tapGesture);

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
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.modalBackground}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
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

          {/* Tepki animasyonu - ortada büyük emoji */}
          {showReactionEmoji && (
            <Animated.View style={[styles.reactionOverlay, reactionAnimatedStyle]}>
              <Text style={styles.reactionEmojiLarge}>{showReactionEmoji}</Text>
            </Animated.View>
          )}

          {/* ═══════════════════════════════════════════════════════════════
            KENDİ STORY'MİZ - İstatistik butonu (mesaj gönder YOK)
            ═══════════════════════════════════════════════════════════════ */}
          {isOwnStory && (
            <Pressable
              style={[styles.insightsButton, { bottom: insets.bottom + 20 }]}
              onPress={() => {
                Haptics.selectionAsync();
                setShowInsights(true);
              }}
            >
              <Text style={styles.insightsButtonText}>
                👁 {currentStory.views_count} görüntülenme • ❤️ {currentStory.reactions_count} tepki
              </Text>
              <Text style={styles.insightsButtonHint}>Detayları görmek için dokun</Text>
            </Pressable>
          )}

          {/* Insights Sheet - kendi story'miz için */}
          <StoryInsightsSheet
            visible={showInsights}
            onClose={() => setShowInsights(false)}
            viewsCount={currentStory?.views_count || 0}
            reactionsCount={currentStory?.reactions_count || 0}
            viewers={[]} // TODO: API'den çekilecek
          />

          {/* Paused indicator */}
          {isPaused && (
            <View style={styles.pausedOverlay}>
              <Text style={styles.pausedText}>Duraklatıldı</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "#000"
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden"
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

export default StoryViewer;
