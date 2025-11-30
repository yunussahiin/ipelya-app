/**
 * MediaPreview Component
 *
 * Fotoğraf ve video önizleme ekranı
 * - Fotoğraf: Skia Canvas + Filtreler + Ayarlar
 * - Video: expo-av ile playback
 * - Onay/Tekrar çek butonları
 *
 * v2 - Component bazlı mimari
 */

import React, { useRef, useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import type { CapturedMedia } from "../types";
import { PhotoPreview, PhotoPreviewRef } from "./preview/PhotoPreview";
import { VideoPreview, VideoPreviewRef } from "./preview/VideoPreview";
import { PreviewControls } from "./preview/PreviewControls";

const LOG_PREFIX = "[MediaPreview]";

interface MediaPreviewProps {
  /** Yakalanan medya bilgisi */
  media: CapturedMedia;
  /** Onay butonuna basıldığında - filtrelenmiş URI ile */
  onConfirm: (media: CapturedMedia) => void;
  /** Tekrar çek butonuna basıldığında */
  onRetake: () => void;
  /** Alt boşluk (TabBar için) */
  bottomInset?: number;
}

/**
 * Ana MediaPreview Component
 */
export function MediaPreview({ media, onConfirm, onRetake, bottomInset = 0 }: MediaPreviewProps) {
  const photoPreviewRef = useRef<PhotoPreviewRef>(null);
  const videoPreviewRef = useRef<VideoPreviewRef>(null);
  const [isExporting, setIsExporting] = useState(false);

  console.log(`${LOG_PREFIX} Rendering preview for:`, media.type, media.path);

  const uri = media.path.startsWith("file://") ? media.path : `file://${media.path}`;

  // Handle confirm - export filtered image if photo
  const handleConfirm = useCallback(async () => {
    console.log(`${LOG_PREFIX} Confirm pressed`);

    if (media.type === "photo" && photoPreviewRef.current) {
      setIsExporting(true);
      try {
        // Export filtered image
        const filteredUri = await photoPreviewRef.current.exportImage();
        const settings = photoPreviewRef.current.getCurrentSettings();

        console.log(`${LOG_PREFIX} Exported with settings:`, settings);

        if (filteredUri) {
          // Return media with filtered URI
          onConfirm({
            ...media,
            path: filteredUri
          });
        } else {
          // Fallback to original
          onConfirm(media);
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Export error:`, error);
        onConfirm(media);
      } finally {
        setIsExporting(false);
      }
    } else {
      // Video - no filters, return original
      onConfirm(media);
    }
  }, [media, onConfirm]);

  // Handle retake
  const handleRetake = useCallback(() => {
    console.log(`${LOG_PREFIX} Retake pressed`);
    onRetake();
  }, [onRetake]);

  // Media info string
  const mediaInfo = `${media.width} × ${media.height}${media.duration ? ` • ${Math.round(media.duration)}s` : ""}`;

  return (
    <View style={styles.container}>
      {/* Media Preview */}
      {media.type === "photo" ? (
        <PhotoPreview ref={photoPreviewRef} uri={uri} bottomInset={bottomInset} />
      ) : (
        <VideoPreview
          ref={videoPreviewRef}
          uri={uri}
          duration={media.duration}
          bottomInset={bottomInset}
        />
      )}

      {/* Controls */}
      <PreviewControls
        onConfirm={handleConfirm}
        onRetake={handleRetake}
        isConfirming={isExporting}
        mediaInfo={mediaInfo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  }
});

export default MediaPreview;
