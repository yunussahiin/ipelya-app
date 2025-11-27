/**
 * FontSizeSlider
 *
 * Dikey font boyutu slider'ı
 */

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReAnimated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated";

import { FONT_SIZE_MIN, FONT_SIZE_MAX } from "./constants";

interface FontSizeSliderProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  visible: boolean;
}

/**
 * FontSizeSlider Component
 */
export const FontSizeSlider = memo(function FontSizeSlider({
  fontSize,
  onFontSizeChange,
  visible
}: FontSizeSliderProps) {
  const sliderProgress = useSharedValue(
    (fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)
  );

  const updateFontSize = (progress: number) => {
    const newSize = Math.round(FONT_SIZE_MIN + progress * (FONT_SIZE_MAX - FONT_SIZE_MIN));
    onFontSizeChange(newSize);
  };

  const sliderGesture = Gesture.Pan().onUpdate((e) => {
    // Dikey slider - yukarı büyütür, aşağı küçültür
    const newProgress = Math.max(0, Math.min(1, sliderProgress.value - e.translationY / 200));
    sliderProgress.value = newProgress;
    runOnJS(updateFontSize)(newProgress);
  });

  const sliderAnimatedStyle = useAnimatedStyle(() => ({
    height: `${sliderProgress.value * 100}%`
  }));

  if (!visible) return null;

  return (
    <GestureDetector gesture={sliderGesture}>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <ReAnimated.View style={[styles.sliderFill, sliderAnimatedStyle]} />
        </View>
        <Text style={styles.sliderLabel}>Aa</Text>
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  sliderContainer: {
    position: "absolute",
    right: 16,
    top: "30%",
    height: 150,
    width: 30,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  sliderTrack: {
    width: 4,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  sliderFill: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 2
  },
  sliderLabel: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "600"
  }
});
