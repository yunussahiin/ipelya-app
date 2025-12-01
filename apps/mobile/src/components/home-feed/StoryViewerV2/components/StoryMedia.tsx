/**
 * StoryMedia Component
 * Story medya içeriği - Image veya Video
 */

import React, { memo, useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { WIDTH, HEIGHT } from "../constants";

interface StoryMediaProps {
  mediaUrl: string;
  mediaType: "image" | "video";
  isPaused: boolean;
  onVideoEnd?: () => void;
  onLoad?: () => void;
}

function StoryMediaComponent({
  mediaUrl,
  mediaType,
  isPaused,
  onVideoEnd,
  onLoad
}: StoryMediaProps) {
  const isVideo = mediaType === "video";

  // Video player (sadece video için)
  const player = useVideoPlayer(isVideo ? mediaUrl : null, (p) => {
    p.loop = false;
    p.muted = false;
    if (!isPaused) {
      p.play();
    }
  });

  // Video bittiğinde callback
  useEventListener(player, "playToEnd", () => {
    onVideoEnd?.();
  });

  // Pause/resume kontrolü
  useEffect(() => {
    if (isVideo && player) {
      if (isPaused) {
        player.pause();
      } else {
        player.play();
      }
    }
  }, [isPaused, isVideo, player]);

  if (isVideo) {
    return (
      <VideoView
        player={player}
        style={styles.media}
        contentFit="cover"
        nativeControls={false}
        // Android: overlapping video issue workaround
        surfaceType={Platform.OS === "android" ? "textureView" : undefined}
      />
    );
  }

  return (
    <Image
      source={{ uri: mediaUrl }}
      style={styles.media}
      contentFit="cover"
      transition={200}
      onLoad={onLoad}
    />
  );
}

const styles = StyleSheet.create({
  media: {
    width: WIDTH,
    height: HEIGHT
  }
});

export const StoryMedia = memo(StoryMediaComponent);
