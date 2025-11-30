/**
 * StoryCreator Component
 *
 * Hikaye oluşturma - Instagram tarzı
 * - Önce galeri grid gösterilir (üstte önizleme)
 * - İleri butonuna tıklayınca preview ekranı açılır
 * - Kamera butonuna tıklayınca kamera açılır
 * - Preview ekranında düzenleme ve paylaşım seçenekleri
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { VisionCamera, CapturedMedia } from "@/components/camera";
import { StoryMediaPicker } from "./StoryMediaPicker";
import { StoryPreview } from "./StoryPreview";
import type { CreatedContent } from "./index";

interface StoryCreatorProps {
  onComplete: (content: CreatedContent) => void;
  onClose: () => void;
  onPreviewModeChange?: (isPreview: boolean) => void;
}

interface SelectedMedia {
  uri: string;
  type: "photo" | "video";
  width: number;
  height: number;
  duration?: number;
}

type StoryCreatorStep = "picker" | "camera" | "preview";

export function StoryCreator({ onComplete, onClose, onPreviewModeChange }: StoryCreatorProps) {
  const [step, setStep] = useState<StoryCreatorStep>("picker");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);

  // Galeriden medya seçildiğinde - preview ekranına geç
  const handleMediaSelect = useCallback(
    (media: SelectedMedia) => {
      console.log("📸 Media selected:", { type: media.type, uri: media.uri.substring(0, 50) });
      Haptics.selectionAsync();
      setSelectedMedia(media);
      setStep("preview");
      onPreviewModeChange?.(true);
    },
    [onPreviewModeChange]
  );

  // Kamera butonuna tıklandığında
  const handleCameraPress = useCallback(() => {
    Haptics.selectionAsync();
    setStep("camera");
  }, []);

  // Kameradan medya çekildiğinde - preview ekranına geç
  const handleCapture = useCallback(
    (media: CapturedMedia) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedMedia({
        uri: media.path,
        type: media.type,
        width: media.width,
        height: media.height,
        duration: media.duration
      });
      setStep("preview");
      onPreviewModeChange?.(true);
    },
    [onPreviewModeChange]
  );

  // Kameradan geri dönüş
  const handleCameraClose = useCallback(() => {
    setStep("picker");
  }, []);

  // Preview'dan geri dönüş
  const handlePreviewBack = useCallback(() => {
    setStep("picker");
    setSelectedMedia(null);
    onPreviewModeChange?.(false);
  }, [onPreviewModeChange]);

  // Hikaye paylaşıldığında
  const handleShare = useCallback(
    (caption?: string) => {
      if (!selectedMedia) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete({
        type: "story",
        caption,
        media: [
          {
            type: selectedMedia.type,
            path: selectedMedia.uri,
            width: selectedMedia.width,
            height: selectedMedia.height,
            duration: selectedMedia.duration
          }
        ]
      });
    },
    [selectedMedia, onComplete]
  );

  return (
    <View style={styles.container}>
      {step === "picker" && (
        <StoryMediaPicker
          onClose={onClose}
          onCameraPress={handleCameraPress}
          onMediaSelect={handleMediaSelect}
        />
      )}

      {step === "camera" && (
        <VisionCamera
          mode="photo"
          enableAudio={true}
          showControls={true}
          onCapture={handleCapture}
          onClose={handleCameraClose}
          maxVideoDuration={15}
          bottomInset={70}
          previewBottomInset={65}
        />
      )}

      {step === "preview" && selectedMedia && (
        <StoryPreview media={selectedMedia} onBack={handlePreviewBack} onShare={handleShare} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  }
});
