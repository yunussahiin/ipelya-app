/**
 * ContentCreator Component
 *
 * Instagram tarzı içerik oluşturma deneyimi
 *
 * Özellikler:
 * - Tab navigation (Gönderi, Hikaye, Reels Video)
 * - Swipe gesture ile tab geçişi
 * - Varsayılan: Hikaye (kamera açık)
 * - Sol swipe: Gönderi
 * - Sağ swipe: Reels Video
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, Modal, Dimensions, StatusBar } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

import { CreatorTabBar } from "./CreatorTabBar";
import { StoryCreator } from "./StoryCreator";
import { PostCreator } from "./PostCreator/index";
import { ReelsCreator } from "./ReelsCreator";
import { MiniPostCreator } from "./MiniPostCreator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type CreatorTab = "post" | "mini" | "story" | "reels";

interface ContentCreatorProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: CreatorTab;
  onContentCreated?: (content: CreatedContent) => void;
}

export interface CreatedContent {
  type: "post" | "mini" | "story" | "reels";
  media?: {
    type: "photo" | "video";
    path: string;
    width: number;
    height: number;
    duration?: number;
  }[];
  caption?: string;
  poll?: {
    question: string;
    options: string[];
    duration: "1h" | "6h" | "24h" | "3d" | "7d";
  };
}

const TABS: CreatorTab[] = ["post", "mini", "story", "reels"];
const TAB_LABELS: Record<CreatorTab, string> = {
  post: "GÖNDERİ",
  mini: "YAZI",
  story: "HİKAYE",
  reels: "VİDEO"
};

export function ContentCreator({
  visible,
  onClose,
  initialTab = "story",
  onContentCreated
}: ContentCreatorProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<CreatorTab>(initialTab);

  // Swipe animation
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(TABS.indexOf(initialTab));

  // Handle tab change
  const handleTabChange = useCallback((tab: CreatorTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    currentIndex.value = TABS.indexOf(tab);
  }, []);

  // Swipe gesture for tab navigation
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      "worklet";
      const threshold = SCREEN_WIDTH / 4;
      const idx = currentIndex.value;

      if (event.translationX < -threshold && idx < TABS.length - 1) {
        // Swipe left - next tab
        const newIndex = idx + 1;
        currentIndex.value = newIndex;
        runOnJS(handleTabChange)(TABS[newIndex]);
      } else if (event.translationX > threshold && idx > 0) {
        // Swipe right - previous tab
        const newIndex = idx - 1;
        currentIndex.value = newIndex;
        runOnJS(handleTabChange)(TABS[newIndex]);
      }

      translateX.value = withSpring(0);
    });

  // Animated style for content
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }]
  }));

  // Handle content creation
  const handleContentCreated = useCallback(
    (content: CreatedContent) => {
      onContentCreated?.(content);
      onClose();
    },
    [onContentCreated, onClose]
  );

  // Render active creator
  const renderCreator = () => {
    switch (activeTab) {
      case "post":
        return <PostCreator onComplete={handleContentCreated} onClose={onClose} />;
      case "mini":
        return <MiniPostCreator onComplete={handleContentCreated} onClose={onClose} />;
      case "story":
        return <StoryCreator onComplete={handleContentCreated} onClose={onClose} />;
      case "reels":
        return <ReelsCreator onComplete={handleContentCreated} onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <BottomSheetModalProvider>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Main Content with Gesture */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.content, animatedStyle]}>{renderCreator()}</Animated.View>
          </GestureDetector>

          {/* Tab Bar */}
          <CreatorTabBar
            tabs={TABS}
            labels={TAB_LABELS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </View>
      </BottomSheetModalProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  content: {
    flex: 1
  }
});

export default ContentCreator;
