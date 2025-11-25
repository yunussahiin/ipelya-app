/**
 * StoryCreator Component
 *
 * Hikaye oluşturma - Kamera ile fotoğraf/video çekimi
 * Instagram hikaye tarzı
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Text, Alert } from "react-native";
import { X, Type, Sparkles, Layout, ChevronDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { VisionCamera, CapturedMedia } from "@/components/camera";
import type { CreatedContent } from "./index";

interface StoryCreatorProps {
  onComplete: (content: CreatedContent) => void;
  onClose: () => void;
}

type StoryMode = "normal" | "create" | "boomerang" | "layout";

export function StoryCreator({ onComplete, onClose }: StoryCreatorProps) {
  const { colors } = useTheme();
  const [storyMode, setStoryMode] = useState<StoryMode>("normal");
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);

  // Handle media capture from camera
  const handleCapture = useCallback(
    (media: CapturedMedia) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCapturedMedia(media);

      // Auto-complete for now (later: add editing screen)
      onComplete({
        type: "story",
        media: [
          {
            type: media.type,
            path: media.path,
            width: media.width,
            height: media.height,
            duration: media.duration
          }
        ]
      });
    },
    [onComplete]
  );

  // Story mode options
  const storyModes: { mode: StoryMode; label: string; icon: React.ReactNode }[] = [
    { mode: "create", label: "Oluştur", icon: <Type size={20} color="#FFF" /> },
    { mode: "boomerang", label: "Boomerang", icon: <Sparkles size={20} color="#FFF" /> },
    { mode: "layout", label: "Yerleşim", icon: <Layout size={20} color="#FFF" /> }
  ];

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <VisionCamera
        mode="photo"
        initialPosition="back"
        enableAudio={true}
        showControls={true}
        onCapture={handleCapture}
        onClose={onClose}
        maxVideoDuration={15} // Hikaye için 15 saniye
      />

      {/* Story Mode Options - Right Side */}
      <View style={styles.modeOptions}>
        {storyModes.map(({ mode, label, icon }) => (
          <Pressable
            key={mode}
            style={styles.modeOption}
            onPress={() => {
              Haptics.selectionAsync();
              setStoryMode(mode);
            }}
          >
            <Text style={styles.modeLabel}>{label}</Text>
            {icon}
          </Pressable>
        ))}
        <Pressable style={styles.modeOption}>
          <ChevronDown size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Close Button - Top Left */}
      <Pressable style={styles.closeButton} onPress={onClose}>
        <X size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  closeButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100
  },
  modeOptions: {
    position: "absolute",
    right: 16,
    top: "35%",
    gap: 24,
    alignItems: "flex-end"
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  modeLabel: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  }
});
