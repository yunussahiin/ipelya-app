/**
 * PostCreator Component
 * Gönderi oluşturma - 2 adımlı akış
 *
 * Adım 1: Medya seçimi (MediaPicker)
 * Adım 2: Detaylar (PostDetails)
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { CreatedContent } from "../index";
import type { MediaAsset, PostStep, PollData, PostSettings } from "./types";
import { MediaPicker } from "./MediaPicker";
import { PostDetails } from "./PostDetails";

interface PostCreatorProps {
  onComplete: (content: CreatedContent) => void;
  onClose: () => void;
}

export function PostCreator({ onComplete, onClose }: PostCreatorProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<PostStep>("media");
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);

  // Handle media selection complete
  const handleMediaNext = useCallback((assets: MediaAsset[]) => {
    setSelectedAssets(assets);
    setStep("details");
  }, []);

  // Handle back to media selection
  const handleBackToMedia = useCallback(() => {
    setStep("media");
  }, []);

  // Handle publish
  const handlePublish = useCallback(
    (data: { caption: string; poll?: PollData; settings: PostSettings }) => {
      onComplete({
        type: "post",
        media: selectedAssets.map((a) => ({
          type: a.mediaType,
          path: a.uri,
          width: a.width,
          height: a.height,
          duration: a.duration
        })),
        caption: data.caption,
        poll: data.poll
          ? {
              question: data.poll.question,
              options: data.poll.options,
              duration: data.poll.duration
            }
          : undefined
      });
    },
    [selectedAssets, onComplete]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {step === "media" && (
        <MediaPicker onClose={onClose} onNext={handleMediaNext} maxSelection={10} />
      )}

      {step === "details" && (
        <PostDetails
          selectedAssets={selectedAssets}
          onBack={handleBackToMedia}
          onPublish={handlePublish}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

// Re-export types
export type { MediaAsset, PollData, PostSettings, PostStep } from "./types";
