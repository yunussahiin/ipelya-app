/**
 * PostMedia Component
 *
 * Amaç: Post media carousel - Görselleri/videoları gösterir
 *
 * Özellikler:
 * - Image carousel (swipeable)
 * - Video playback
 * - Pagination dots
 * - Zoom on press
 *
 * Props:
 * - media: PostMedia[] array
 * - onPress: Media press callback
 */

import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions
} from "react-native";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useTheme } from "@/theme/ThemeProvider";
import { LikeAnimation } from "../LikeAnimation";
import type { PostMedia as PostMediaType } from "@ipelya/types";

interface PostMediaProps {
  media: PostMediaType[];
  onPress?: (index: number) => void;
  onDoubleTap?: () => void;
}

export function PostMedia({ media, onPress, onDoubleTap }: PostMediaProps) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const lastTap = useRef<number>(0);

  // Early return BEFORE hooks is not allowed - check after all hooks
  const hasMedia = media && media.length > 0;

  // Get first video URL for single video player (hooks must be called unconditionally)
  const firstVideoUrl = hasMedia
    ? media.find((item) => item.media_type === "video")?.media_url
    : null;

  // Single video player for the first video (hooks can't be in loops)
  const videoPlayer = useVideoPlayer(firstVideoUrl || "", (player) => {
    player.loop = true;
    player.muted = false;
  });

  if (!hasMedia) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);

    // Play/pause video based on active index
    const currentMedia = media[index];
    if (currentMedia?.media_type === "video" && videoPlayer) {
      videoPlayer.play();
    } else if (videoPlayer) {
      videoPlayer.pause();
    }
  };

  const handleMediaPress = (index: number) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setShowLikeAnimation(true);
      onDoubleTap?.();
      lastTap.current = 0;
    } else {
      // Single tap
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          onPress?.(index);
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  return (
    <View style={styles.container}>
      {/* Like Animation */}
      <LikeAnimation
        visible={showLikeAnimation}
        onAnimationEnd={() => setShowLikeAnimation(false)}
      />

      {/* Media carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {media.map((item, index) => {
          // Use single video player for first video only
          const isFirstVideo = item.media_type === "video" && item.media_url === firstVideoUrl;

          return (
            <Pressable
              key={item.id}
              onPress={() => handleMediaPress(index)}
              style={[styles.mediaItem, { width: screenWidth }]}
            >
              {item.media_type === "video" && isFirstVideo && videoPlayer ? (
                <VideoView
                  player={videoPlayer}
                  style={styles.image}
                  contentFit="cover"
                  nativeControls
                />
              ) : (
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pagination dots */}
      {media.length > 1 && (
        <View style={styles.pagination}>
          {media.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: colors.border },
                index === activeIndex && { backgroundColor: colors.accent }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden"
  },
  carousel: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#000"
  },
  mediaItem: {
    aspectRatio: 4 / 5
  },
  image: {
    width: "100%",
    height: "100%"
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  }
});
