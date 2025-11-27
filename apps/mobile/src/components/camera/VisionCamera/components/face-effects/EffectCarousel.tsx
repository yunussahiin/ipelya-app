/**
 * EffectCarousel Component
 *
 * Instagram tarzı efekt seçici carousel
 * - Üstte mode selector ve flip button
 * - Altta efekt carousel ve çekim butonu
 *
 * @module face-effects/EffectCarousel
 */

import React, { memo, useRef, useCallback, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  Text
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Camera, Video, RefreshCw } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { FaceEffectConfig } from "./types";

const LOG_PREFIX = "[EffectCarousel]";

// =============================================
// CONSTANTS
// =============================================

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const EFFECT_BUTTON_SIZE = 56;
const CAPTURE_BUTTON_SIZE = 72;
const BUTTON_MARGIN = 10;
const SNAP_INTERVAL = EFFECT_BUTTON_SIZE + BUTTON_MARGIN * 2;

// =============================================
// TYPES
// =============================================

export interface EffectItem {
  id: string;
  name: string;
  type: "none" | "effect";
  icon?: string;
  thumbnail?: string;
  config?: FaceEffectConfig;
}

export interface EffectCarouselProps {
  effects: EffectItem[];
  selectedEffectId: string;
  onSelectEffect: (effect: EffectItem) => void;
  onCapture: () => void;
  isRecording?: boolean;
  isCapturing?: boolean;
  currentMode?: "photo" | "video";
  onModeChange?: (mode: "photo" | "video") => void;
  onFlipCamera?: () => void;
}

// =============================================
// EFFECT BUTTON COMPONENT
// =============================================

interface EffectButtonProps {
  effect: EffectItem;
  isSelected: boolean;
  isCenter: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isCapturing: boolean;
}

const EffectButton = memo(function EffectButton({
  effect,
  isSelected,
  isCenter,
  onPress,
  onLongPress,
  isCapturing
}: EffectButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.15 : 1, { damping: 15, stiffness: 150 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  // Ortadaki çekim butonu
  if (isCenter && effect.type === "none") {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.captureButtonContainer}
        disabled={isCapturing}
      >
        <View style={[styles.captureButtonOuter, { borderColor: "#FFF" }]}>
          <Animated.View
            style={[
              styles.captureButtonInner,
              { backgroundColor: "#FFF" },
              isCapturing && { opacity: 0.5 }
            ]}
          />
        </View>
      </Pressable>
    );
  }

  // Efekt butonu
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.effectButtonContainer}>
      <Animated.View
        style={[
          styles.effectButton,
          {
            backgroundColor: isSelected ? colors.accent : "rgba(0,0,0,0.5)",
            borderColor: isSelected ? colors.accent : "rgba(255,255,255,0.3)"
          },
          animatedStyle
        ]}
      >
        {effect.thumbnail ? (
          <Image
            source={{ uri: effect.thumbnail }}
            style={styles.effectThumbnail}
            resizeMode="cover"
          />
        ) : (
          <Animated.Text style={styles.effectIcon}>{effect.icon || "✨"}</Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
});

// =============================================
// MAIN COMPONENT
// =============================================

export const EffectCarousel = memo(function EffectCarousel({
  effects,
  selectedEffectId,
  onSelectEffect,
  onCapture,
  isRecording = false,
  isCapturing = false,
  currentMode = "photo",
  onModeChange,
  onFlipCamera
}: EffectCarouselProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Debug log
  useEffect(() => {
    console.log(LOG_PREFIX, "Mounted:", {
      effectsCount: effects.length,
      selectedEffectId,
      currentMode
    });
  }, [effects.length, selectedEffectId, currentMode]);

  // Efekt listesi oluştur (ortada çekim butonu)
  const effectsWithCenter: EffectItem[] = [
    ...effects.slice(0, Math.floor(effects.length / 2)),
    { id: "none", name: "Normal", type: "none", icon: "" },
    ...effects.slice(Math.floor(effects.length / 2))
  ];

  // Başlangıçta ortaya scroll
  useEffect(() => {
    const centerIndex = Math.floor(effectsWithCenter.length / 2);
    const scrollX = centerIndex * SNAP_INTERVAL;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: scrollX, animated: false });
    }, 100);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_INTERVAL);

      if (index !== currentIndex && index >= 0 && index < effectsWithCenter.length) {
        setCurrentIndex(index);
        Haptics.selectionAsync();
        const effect = effectsWithCenter[index];
        console.log(LOG_PREFIX, "Effect selected:", effect.id, effect.name);
        onSelectEffect(effect);
      }
    },
    [currentIndex, effectsWithCenter, onSelectEffect]
  );

  const handleEffectPress = useCallback(
    (effect: EffectItem, index: number) => {
      const scrollX = index * SNAP_INTERVAL;
      scrollViewRef.current?.scrollTo({ x: scrollX, animated: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log(LOG_PREFIX, "Effect pressed:", effect.id);
      onSelectEffect(effect);
    },
    [onSelectEffect]
  );

  const handleCapture = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log(LOG_PREFIX, "Capture triggered");
    onCapture();
  }, [onCapture]);

  const sidePadding = (SCREEN_WIDTH - CAPTURE_BUTTON_SIZE) / 2 - BUTTON_MARGIN;

  return (
    <View style={styles.container}>
      {/* Üst: Mode Selector + Flip */}
      <View style={styles.topControls}>
        <View style={styles.modeSelector}>
          <Pressable
            style={[
              styles.modeButton,
              currentMode === "photo" && { backgroundColor: colors.accent }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onModeChange?.("photo");
            }}
          >
            <Camera size={16} color={currentMode === "photo" ? "#FFF" : "#AAA"} />
            <Text style={[styles.modeText, { color: currentMode === "photo" ? "#FFF" : "#AAA" }]}>
              Fotoğraf
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              currentMode === "video" && { backgroundColor: colors.accent }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onModeChange?.("video");
            }}
          >
            <Video size={16} color={currentMode === "video" ? "#FFF" : "#AAA"} />
            <Text style={[styles.modeText, { color: currentMode === "video" ? "#FFF" : "#AAA" }]}>
              Video
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.flipButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFlipCamera?.();
          }}
        >
          <RefreshCw size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Alt: Effect Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sidePadding }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {effectsWithCenter.map((effect, index) => {
          const isCenter = effect.type === "none";
          const isSelected = effect.id === selectedEffectId;

          return (
            <EffectButton
              key={effect.id}
              effect={effect}
              isSelected={isSelected}
              isCenter={isCenter}
              onPress={() => (isCenter ? handleCapture() : handleEffectPress(effect, index))}
              onLongPress={handleCapture}
              isCapturing={isCapturing}
            />
          );
        })}
      </ScrollView>

      {isRecording && <View style={[styles.recordingDot, { backgroundColor: colors.accent }]} />}
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 16
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 3
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  modeText: {
    fontSize: 12,
    fontWeight: "600"
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center"
  },
  scrollContent: {
    alignItems: "center"
  },
  effectButtonContainer: {
    marginHorizontal: BUTTON_MARGIN
  },
  effectButton: {
    width: EFFECT_BUTTON_SIZE,
    height: EFFECT_BUTTON_SIZE,
    borderRadius: EFFECT_BUTTON_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  effectThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: EFFECT_BUTTON_SIZE / 2
  },
  effectIcon: {
    fontSize: 24
  },
  captureButtonContainer: {
    marginHorizontal: BUTTON_MARGIN
  },
  captureButtonOuter: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    padding: 3
  },
  captureButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: (CAPTURE_BUTTON_SIZE - 14) / 2
  },
  recordingDot: {
    position: "absolute",
    top: -10,
    width: 12,
    height: 12,
    borderRadius: 6
  }
});

export default EffectCarousel;
