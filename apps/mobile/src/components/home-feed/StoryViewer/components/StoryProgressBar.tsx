/**
 * StoryProgressBar Component
 * Hikaye progress bar'ları
 */

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

interface StoryProgressBarProps {
  totalStories: number;
  currentIndex: number;
  progress: SharedValue<number>;
  paddingTop: number;
}

function StoryProgressBarComponent({
  totalStories,
  currentIndex,
  progress,
  paddingTop
}: StoryProgressBarProps) {
  return (
    <View style={[styles.container, { paddingTop }]}>
      {Array.from({ length: totalStories }).map((_, index) => (
        <ProgressSegment
          key={index}
          index={index}
          currentIndex={currentIndex}
          progress={progress}
        />
      ))}
    </View>
  );
}

interface ProgressSegmentProps {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}

function ProgressSegment({ index, currentIndex, progress }: ProgressSegmentProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width:
      index === currentIndex ? `${progress.value * 100}%` : index < currentIndex ? "100%" : "0%"
  }));

  return (
    <View style={styles.segmentBg}>
      <Animated.View style={[styles.segmentFill, animatedStyle]} />
    </View>
  );
}

export const StoryProgressBar = memo(StoryProgressBarComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 8,
    gap: 4,
    zIndex: 10
  },
  segmentBg: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    overflow: "hidden"
  },
  segmentFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 1
  }
});
