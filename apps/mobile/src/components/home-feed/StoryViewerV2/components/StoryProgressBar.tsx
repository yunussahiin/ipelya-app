/**
 * StoryProgressBar Component
 * Instagram tarzı segment'li progress bar
 *
 * Kaynak: @birdwingo/react-native-instagram-stories
 */

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, SharedValue } from "react-native-reanimated";
import { WIDTH, PROGRESS_COLOR, PROGRESS_ACTIVE_COLOR } from "../constants";

interface StoryProgressBarProps {
  totalStories: number;
  currentIndex: number;
  progress: SharedValue<number>;
  paddingTop?: number;
}

interface ProgressItemProps {
  index: number;
  width: number;
  currentIndex: number;
  progress: SharedValue<number>;
}

// Tek bir progress segment'i
const ProgressItem = memo(function ProgressItem({
  index,
  width,
  currentIndex,
  progress
}: ProgressItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Gelecek story
    if (currentIndex < index) {
      return { width: 0 };
    }
    // Tamamlanmış story
    if (currentIndex > index) {
      return { width };
    }
    // Aktif story (animasyonlu)
    return { width: width * progress.value };
  });

  return (
    <View style={[styles.item, { width, backgroundColor: PROGRESS_COLOR }]}>
      <Animated.View
        style={[styles.item, { backgroundColor: PROGRESS_ACTIVE_COLOR }, animatedStyle]}
      />
    </View>
  );
});

function StoryProgressBarComponent({
  totalStories,
  currentIndex,
  progress,
  paddingTop = 0
}: StoryProgressBarProps) {
  // Her segment'in genişliği
  const gap = 4;
  const padding = 12;
  const itemWidth = (WIDTH - padding * 2 - (totalStories - 1) * gap) / totalStories;

  return (
    <View style={[styles.container, { paddingTop }]}>
      {Array.from({ length: totalStories }).map((_, index) => (
        <ProgressItem
          key={index}
          index={index}
          width={itemWidth}
          currentIndex={currentIndex}
          progress={progress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 4,
    zIndex: 100
  },
  item: {
    height: 2,
    borderRadius: 1,
    overflow: "hidden"
  }
});

export const StoryProgressBar = memo(StoryProgressBarComponent);
