/**
 * StoryItem Component
 * Tek bir kullanıcının story'leri - Animation wrapper ile
 */

import React, { memo, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StoryAnimation } from "./StoryAnimation";
import { StoryProgressBar } from "./StoryProgressBar";
import { StoryHeader } from "./StoryHeader";
import { StoryMedia } from "./StoryMedia";
import { WIDTH, HEIGHT } from "../constants";
import type { StoryUser, Story } from "../../StoriesRow/types";

interface StoryItemProps {
  user: StoryUser;
  index: number;
  x: SharedValue<number>;
  activeUserIndex: SharedValue<number>;
  activeStoryIndex: SharedValue<number>;
  progress: SharedValue<number>;
  isPaused: boolean;
  onClose: () => void;
  onVideoEnd: () => void;
}

function StoryItemComponent({
  user,
  index,
  x,
  activeUserIndex,
  activeStoryIndex,
  progress,
  isPaused,
  onClose,
  onVideoEnd
}: StoryItemProps) {
  const insets = useSafeAreaInsets();

  // Bu kullanıcı aktif mi?
  const isActive = useDerivedValue(() => activeUserIndex.value === index);

  // Aktif story
  const currentStoryIndex = useDerivedValue(() => (isActive.value ? activeStoryIndex.value : 0));

  const currentStory = user.stories[0]; // İlk story'yi göster (aktif değilse)

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

  if (!currentStory) return null;

  return (
    <StoryAnimation x={x} index={index}>
      <View style={styles.container}>
        {/* Media */}
        <StoryMedia
          mediaUrl={currentStory.media_url}
          mediaType={currentStory.media_type}
          isPaused={isPaused}
          onVideoEnd={onVideoEnd}
        />

        {/* Gradient overlay - top */}
        <LinearGradient colors={["rgba(0,0,0,0.6)", "transparent"]} style={styles.topGradient} />

        {/* Gradient overlay - bottom */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.4)"]} style={styles.bottomGradient} />

        {/* Progress bar */}
        <StoryProgressBar
          totalStories={user.stories.length}
          currentIndex={0} // TODO: currentStoryIndex.value
          progress={progress}
          paddingTop={insets.top + 8}
        />

        {/* Header */}
        <StoryHeader
          avatarUrl={user.avatar_url}
          username={user.username}
          timeAgo={formatTime(currentStory.created_at)}
          paddingTop={insets.top + 20}
          onClose={onClose}
        />
      </View>
    </StoryAnimation>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: "#000"
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
  }
});

export const StoryItem = memo(StoryItemComponent);
